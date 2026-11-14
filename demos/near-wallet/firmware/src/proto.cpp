#ifdef ARDUINO
#include "proto.h"

#include <Arduino.h>
#include <ArduinoJson.h>
#include <string.h>

#include "hal/usb_serial_jtag_ll.h"

#include "app.h"
#include "platform.h"
#include "wallet_core.h"

#define LINE_MAX (48 * 1024)       // longest request line we accept
#define TX_MAX (24 * 1024)         // longest decoded transaction
#define DEFAULT_TIMEOUT_S 120

extern char g_balance[24];
extern char g_price[16];
uint32_t ks_bench_ms();

static char *line = nullptr;
static size_t lineLen = 0;
static bool overflow = false;
static uint32_t lastRx = 0;

static JsonDocument pendingId;
static bool pending = false;
static bool pendingIsTx = false;
static char pendingHash[60];

uint32_t proto_last_rx_ms() { return lastRx; }

// USB I/O talks to the USB-Serial-JTAG FIFOs directly, polled from loop().
// Both the Arduino core's HWCDC and the IDF usb_serial_jtag driver left
// replies longer than one 64-byte packet stuck until the host sent another
// byte (see RECIPE.md). Writing short packets (<64 bytes, so every packet
// ends a USB transfer) and waiting for the host to take each one is simple
// and reliable.
static void ioBegin() {
  usb_serial_jtag_ll_disable_intr_mask(USB_SERIAL_JTAG_LL_INTR_MASK);
}
static int ioRead(uint8_t *buf, size_t n) {
  size_t got = 0;
  uint32_t t0 = micros();
  // drain packets that arrive back to back, so long requests come in quickly
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
  static char buf[1024];
  size_t n = serializeJson(out, buf, sizeof buf - 1);
  buf[n++] = '\n';
  ioWrite((const uint8_t *)buf, n);
}

static void sendError(JsonVariantConst id, const char *error, const char *detail = nullptr) {
  JsonDocument out;
  if (!id.isNull()) out["id"] = id;
  out["ok"] = false;
  out["error"] = error;
  if (detail) out["detail"] = detail;
  send(out);
}

static const char *stateName() {
  switch (app_wallet_state()) {
    case WalletState::NoWallet: return "no_wallet";
    case WalletState::Locked: return "locked";
    default: return "ready";
  }
}

static void addIdentity(JsonDocument &out) {
  uint8_t pub[32];
  if (app_public_key(pub)) {
    char pk[64], acc[65];
    near_pubkey_str(pub, pk);
    near_implicit_account(pub, acc);
    out["publicKey"] = pk;
    out["accountId"] = acc;
  }
}

// ------------------------------------------------------------------ answers from the UI
void host_sign_done(const uint8_t sig[64]) {
  if (!pending) return;
  JsonDocument out;
  out["id"] = pendingId;
  out["ok"] = true;
  char b64[100];
  b64_encode(sig, 64, b64, sizeof b64);
  out["signature"] = b64;
  if (pendingIsTx) out["hash"] = pendingHash;
  addIdentity(out);
  send(out);
  pending = false;
}

void host_sign_failed(const char *error) {
  if (!pending) return;
  sendError(pendingId, error);
  pending = false;
}

// ------------------------------------------------------------------ commands
static bool checkCanSign(JsonVariantConst id, JsonDocument &doc) {
  if (app_wallet_state() == WalletState::NoWallet) {
    sendError(id, app_in_setup() ? "setup_in_progress" : "no_wallet");
    return false;
  }
  if (app_busy() || pending) {
    sendError(id, "busy");
    return false;
  }
  if (app_in_setup()) {
    sendError(id, "setup_in_progress");
    return false;
  }
  // no "network" has always meant testnet, so a mainnet build only signs
  // when the host asks for mainnet by name
  const char *net = doc["network"] | "testnet";
  if (strcmp(net, NEAR_NETWORK) != 0) {
    sendError(id, "network_not_allowed", "this firmware signs for " NEAR_NETWORK " only");
    return false;
  }
  return true;
}

static uint32_t timeoutMs(JsonDocument &doc) {
  int t = doc["timeout"] | DEFAULT_TIMEOUT_S;
  if (t < 10) t = 10;
  if (t > 600) t = 600;
  return (uint32_t)t * 1000;
}

static void present(JsonVariantConst id, Review &r, uint32_t timeout, bool isTx) {
  pendingId.clear();
  pendingId.set(id);
  pending = true;
  pendingIsTx = isTx;
  app_present(r, timeout);
  JsonDocument ev;
  if (!id.isNull()) ev["id"] = id;
  ev["event"] = "review";
  ev["timeout"] = timeout / 1000;
  send(ev);
}

static void cmdSignTx(JsonVariantConst id, JsonDocument &doc) {
  if (!checkCanSign(id, doc)) return;
  const char *b64 = doc["tx"] | "";
  size_t n = strlen(b64);
  if (!n) return sendError(id, "bad_request", "tx missing");
  if (n / 4 * 3 > TX_MAX) return sendError(id, "too_large");
  static uint8_t *tx = nullptr;
  if (!tx) tx = (uint8_t *)ps_malloc(TX_MAX);
  int len = b64_decode(b64, n, tx, TX_MAX);
  if (len <= 0) return sendError(id, "bad_request", "tx is not base64");
  static Review r;
  uint8_t pub[32];
  app_public_key(pub);
  near_review_tx(tx, (size_t)len, pub, &r);
  if (!r.headerOk) return sendError(id, "bad_tx", "not a Borsh NEAR transaction");
  if (r.keyMismatch) return sendError(id, "wrong_key", "the tx public key is not this watch's key");
  snprintf(r.network, sizeof r.network, "%s", NEAR_NETWORK);
  b58_encode(r.digest, 32, pendingHash, sizeof pendingHash);
  present(id, r, timeoutMs(doc), true);
}

static void cmdSignMessage(JsonVariantConst id, JsonDocument &doc) {
  if (!checkCanSign(id, doc)) return;
  const char *message = doc["message"];
  const char *recipient = doc["recipient"];
  const char *nonceB64 = doc["nonce"];
  const char *callback = doc["callbackUrl"];
  if (!message || !recipient || !nonceB64) return sendError(id, "bad_request", "message, recipient and nonce are required");
  if (strlen(message) > 4000) return sendError(id, "too_large");
  uint8_t nonce[32];
  if (b64_decode(nonceB64, strlen(nonceB64), nonce, sizeof nonce) != 32)
    return sendError(id, "bad_request", "nonce must be 32 bytes, base64");
  static Review r;
  if (!near_review_message(message, recipient, nonce, callback, &r)) return sendError(id, "too_large");
  snprintf(r.network, sizeof r.network, "%s", NEAR_NETWORK);
  present(id, r, timeoutMs(doc), false);
}

static void cmdInfo(JsonVariantConst id) {
  JsonDocument out;
  if (!id.isNull()) out["id"] = id;
  out["ok"] = true;
  out["device"] = "NEAR watch wallet";
  out["fw"] = FW_VERSION;
  out["state"] = stateName();
  out["busy"] = app_busy() || pending;
  out["setup"] = app_in_setup();
  out["network"] = NEAR_NETWORK;
  addIdentity(out);
  send(out);
}

static void cmdSetStatus(JsonVariantConst id, JsonDocument &doc) {
  if (doc["utcOffset"].is<int>()) clock_set_offset(doc["utcOffset"].as<int>());
  if (doc["time"].is<uint32_t>()) clock_set_utc(doc["time"].as<uint32_t>());
  if (doc["balance"].is<const char *>()) {
    char full[48];
    if (near_format_amount_str(doc["balance"].as<const char *>(), full, sizeof full)) {
      // 4 decimals, truncated
      char *dot = strchr(full, '.');
      char frac[5] = "0000";
      if (dot) {
        *dot = 0;
        for (int i = 0; i < 4 && dot[1 + i]; i++) frac[i] = dot[1 + i];
      }
      snprintf(g_balance, sizeof g_balance, "%s.%s", full, frac);
    }
  }
  if (doc["price"].is<float>()) snprintf(g_price, sizeof g_price, "%.2f", doc["price"].as<float>());
  else if (doc["price"].is<const char *>()) snprintf(g_price, sizeof g_price, "%s", doc["price"].as<const char *>());
  JsonDocument out;
  if (!id.isNull()) out["id"] = id;
  out["ok"] = true;
  send(out);
}

static void cmdSelfTest(JsonVariantConst id) {
  char got[64];
  uint32_t t0 = millis();
  bool pass = wallet_selftest(got);
  uint32_t ms = millis() - t0;
  JsonDocument out;
  if (!id.isNull()) out["id"] = id;
  out["ok"] = true;
  out["pass"] = pass;
  out["phrase"] = "test vector (fixed, public)";
  out["path"] = "m/44'/397'/0'";
  out["expected"] = SELFTEST_PUBKEY;
  out["publicKey"] = got;
  out["deriveMs"] = ms;
  out["pinKdfMs"] = ks_bench_ms();
  send(out);
}

static void handleLine(char *s, size_t len) {
  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, s, len);
  if (err || !doc.is<JsonObject>()) return sendError(JsonVariantConst(), "bad_json", err ? err.c_str() : "not an object");
  JsonVariantConst id = doc["id"];
  const char *cmd = doc["cmd"] | "";
  app_wake();
  if (!strcmp(cmd, "ping")) {
    JsonDocument out;
    if (!id.isNull()) out["id"] = id;
    out["ok"] = true;
    out["pong"] = true;
    send(out);
  } else if (!strcmp(cmd, "info")) {
    cmdInfo(id);
  } else if (!strcmp(cmd, "sign_tx")) {
    cmdSignTx(id, doc);
  } else if (!strcmp(cmd, "sign_message")) {
    cmdSignMessage(id, doc);
  } else if (!strcmp(cmd, "cancel")) {
    bool had = pending;
    app_cancel("cancelled");
    JsonDocument out;
    if (!id.isNull()) out["id"] = id;
    out["ok"] = true;
    out["cancelled"] = had;
    send(out);
  } else if (!strcmp(cmd, "set_status")) {
    cmdSetStatus(id, doc);
  } else if (!strcmp(cmd, "selftest")) {
    cmdSelfTest(id);
  } else {
    sendError(id, "unknown_command");
  }
}

void proto_init() {
  ioBegin();
  line = (char *)ps_malloc(LINE_MAX + 1);
  JsonDocument ev;
  ev["event"] = "boot";
  ev["fw"] = FW_VERSION;
  ev["network"] = NEAR_NETWORK;
  ev["state"] = stateName();
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
        if (overflow) sendError(JsonVariantConst(), "too_large");
        else if (lineLen) {
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
