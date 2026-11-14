#ifdef ARDUINO
#include "proto.h"

#include <Arduino.h>
#include <ArduinoJson.h>
#include <string.h>

#include "hal/usb_serial_jtag_ll.h"

#include "app.h"
#include "gfx.h"
#include "platform.h"

#define LINE_MAX (64 * 1024)  // longest line we accept (1Click status answers are a few KB)

static char *line = nullptr;
static size_t lineLen = 0;
static bool overflow = false;
static uint32_t lastRx = 0;

uint32_t proto_last_rx_ms() { return lastRx; }

// USB I/O talks to the USB-Serial-JTAG FIFOs directly, polled from loop(),
// exactly like the NEAR Wallet firmware: the Arduino core's HWCDC and the IDF
// driver left replies stuck until the host wrote again (see RECIPE.md).
// Packets of at most 63 bytes, each flushed, waiting for the host to take them.
static void ioBegin() { usb_serial_jtag_ll_disable_intr_mask(USB_SERIAL_JTAG_LL_INTR_MASK); }

static int ioRead(uint8_t *buf, size_t n) {
  size_t got = 0;
  uint32_t t0 = micros();
  while (got + 64 <= n) {
    if (usb_serial_jtag_ll_rxfifo_data_available()) {
      got += usb_serial_jtag_ll_read_rxfifo(buf + got, 64);
      t0 = micros();
    } else if (micros() - t0 > 1500) {
      break;
    }
  }
  return (int)got;
}

static void ioWrite(const uint8_t *buf, size_t n) {
  while (n) {
    uint32_t t0 = millis();
    while (!usb_serial_jtag_ll_txfifo_writable()) {
      if (millis() - t0 > 60) return;  // nobody is reading: drop the rest
      delay(1);
    }
    size_t k = n > 63 ? 63 : n;
    usb_serial_jtag_ll_write_txfifo(buf, k);
    usb_serial_jtag_ll_txfifo_flush();
    buf += k;
    n -= k;
  }
}

static void send(JsonDocument &out) {
  static char *buf = nullptr;
  const size_t cap = 4096;
  if (!buf) buf = (char *)ps_malloc(cap);
  size_t n = serializeJson(out, buf, cap - 1);
  buf[n++] = '\n';
  ioWrite((const uint8_t *)buf, n);
}

static void reply(JsonVariantConst id, bool ok, const char *error = nullptr) {
  JsonDocument out;
  if (!id.isNull()) out["id"] = id;
  out["ok"] = ok;
  if (error) out["error"] = error;
  send(out);
}

// ------------------------------------------------------------------ to the host
void proto_http_request(uint32_t rid, bool post, const char *path, const char *body) {
  JsonDocument ev;
  ev["event"] = "http";
  ev["rid"] = rid;
  ev["method"] = post ? "POST" : "GET";
  ev["path"] = path;
  if (body) ev["body"] = body;
  send(ev);
}

void proto_send_state() {
  if (!plat_usb_linked()) return;  // don't stall the UI when no host reads
  JsonDocument ev;
  ev["event"] = "state";
  app_state(ev.to<JsonObject>());
  ev["event"] = "state";
  send(ev);
}

// framebuffer as RLE (count, RGB565 little-endian) in base64, 8 rows per line
static void sendShot(JsonVariantConst id) {
  static const char B64[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  static uint8_t *rle = nullptr;
  static char *b64 = nullptr;
  if (!rle) rle = (uint8_t *)ps_malloc(SCR_W * 8 * 3);
  if (!b64) b64 = (char *)ps_malloc(SCR_W * 8 * 4 + 8);
  char head[96];
  int hn = snprintf(head, sizeof head, "{\"id\":%ld,\"shot\":\"start\",\"w\":%d,\"h\":%d}\n", (long)(id | 0), SCR_W, SCR_H);
  ioWrite((const uint8_t *)head, hn);
  for (int y0 = 0; y0 < SCR_H; y0 += 8) {
    size_t n = 0;
    for (int y = y0; y < y0 + 8; y++) {
      const uint16_t *row = gfx::fb + y * SCR_W;
      for (int x = 0; x < SCR_W;) {
        uint16_t c = row[x];
        int run = 1;
        while (x + run < SCR_W && row[x + run] == c && run < 255) run++;
        rle[n++] = (uint8_t)run;
        rle[n++] = (uint8_t)(c & 0xFF);
        rle[n++] = (uint8_t)(c >> 8);
        x += run;
      }
    }
    size_t k = 0;
    for (size_t i = 0; i < n; i += 3) {
      uint32_t v = (uint32_t)rle[i] << 16 | (uint32_t)(i + 1 < n ? rle[i + 1] : 0) << 8 | (i + 2 < n ? rle[i + 2] : 0);
      b64[k++] = B64[(v >> 18) & 63];
      b64[k++] = B64[(v >> 12) & 63];
      b64[k++] = B64[(v >> 6) & 63];
      b64[k++] = B64[v & 63];
    }
    b64[k] = 0;
    int ln = snprintf(head, sizeof head, "{\"id\":%ld,\"y\":%d,\"rows\":8,\"d\":\"", (long)(id | 0), y0);
    ioWrite((const uint8_t *)head, ln);
    ioWrite((const uint8_t *)b64, k);
    ioWrite((const uint8_t *)"\"}\n", 3);
  }
  reply(id, true);
}

// ------------------------------------------------------------------ commands
static void handleLine(char *s, size_t len) {
  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, s, len);
  if (err || !doc.is<JsonObject>()) {
    JsonDocument out;
    out["ok"] = false;
    out["error"] = "bad_json";
    send(out);
    return;
  }
  JsonVariantConst id = doc["id"];
  const char *cmd = doc["cmd"] | "";
  if (!strcmp(cmd, "ping")) {
    JsonDocument out;
    if (!id.isNull()) out["id"] = id;
    out["ok"] = true;
    out["pong"] = true;
    send(out);
  } else if (!strcmp(cmd, "hello") || !strcmp(cmd, "info")) {
    if (doc["utcOffset"].is<int>()) clock_set_offset(doc["utcOffset"].as<int>());
    if (doc["time"].is<uint32_t>()) clock_set_utc(doc["time"].as<uint32_t>());
    JsonDocument out;
    if (!id.isNull()) out["id"] = id;
    out["ok"] = true;
    out["device"] = "NEAR Checkout";
    out["fw"] = FW_VERSION;
    out["board"] = "Waveshare ESP32-S3-Touch-LCD-3.5";
    out["wifi"] = plat_wifi_state() == 2 ? "connected" : plat_wifi_state() == 1 ? "connecting" : "off";
    plat_boot_info(out["boot"].to<JsonObject>());
    app_state(out["state"].to<JsonObject>());
    send(out);
  } else if (!strcmp(cmd, "state")) {
    JsonDocument out;
    if (!id.isNull()) out["id"] = id;
    out["ok"] = true;
    app_state(out["state"].to<JsonObject>());
    send(out);
  } else if (!strcmp(cmd, "http_result")) {
    uint32_t rid = doc["rid"] | 0u;
    int status = doc["status"] | 0;
    const char *body = doc["body"] | "";
    app_http_done(rid, status, body, strlen(body));
  } else if (!strcmp(cmd, "demo")) {
    const char *e = app_demo(doc["action"] | "");
    reply(id, !e, e);
  } else if (!strcmp(cmd, "tap")) {
    app_tap(doc["x"] | -1, doc["y"] | -1);
    reply(id, true);
  } else if (!strcmp(cmd, "set_merchant")) {
    const char *e = app_set_merchant(doc["account"] | "");
    reply(id, !e, e);
  } else if (!strcmp(cmd, "set_mode")) {
    // LIVE can only be switched on at the till, behind the real-money screen
    const char *mode = doc["mode"] | "";
    if (!strcmp(mode, "demo")) reply(id, !app_set_demo_mode());
    else reply(id, false, "confirm_live_on_the_till");
  } else if (!strcmp(cmd, "shot")) {
    app_render();
    sendShot(id);
  } else {
    reply(id, false, "unknown_command");
  }
}

void proto_init() {
  ioBegin();
  line = (char *)ps_malloc(LINE_MAX + 1);
  JsonDocument ev;
  ev["event"] = "boot";
  ev["device"] = "NEAR Checkout";
  ev["fw"] = FW_VERSION;
  plat_boot_info(ev["boot"].to<JsonObject>());
  send(ev);
}

void proto_poll() {
  static uint8_t buf[512];
  int got;
  while ((got = ioRead(buf, sizeof buf)) > 0) {
    size_t n = (size_t)got;
    lastRx = millis();
    for (size_t i = 0; i < n; i++) {
      char c = (char)buf[i];
      if (c == '\r') continue;
      if (c == '\n') {
        if (overflow) {
          JsonDocument out;
          out["ok"] = false;
          out["error"] = "too_large";
          send(out);
        } else if (lineLen) {
          line[lineLen] = 0;
          handleLine(line, lineLen);
        }
        lineLen = 0;
        overflow = false;
        continue;
      }
      if (lineLen < LINE_MAX) line[lineLen++] = c;
      else overflow = true;
    }
  }
}
#endif
