// NEAR Checkout for the Waveshare ESP32-S3-Touch-LCD-3.5 (see BOARD.md).
// Hardware glue: ST7796 over SPI (reset through the TCA9554), FT6336 touch,
// PCF85063 RTC, backlight, settings in NVS, and the link to 1Click
// (Wi-Fi first, else the USB companion).
#include <Arduino.h>
#include <Preferences.h>
#include <Wire.h>
#include <sodium.h>

// our headers first: Arduino_GFX #defines WHITE and friends
#include "app.h"
#include "checkout.h"
#include "gfx.h"
#include "net_wifi.h"
#include "platform.h"
#include "proto.h"
//
#include "Arduino_GFX_Library.h"

#define I2C_SDA 8
#define I2C_SCL 7
#define LCD_DC 3
#define LCD_SCK 5
#define LCD_MOSI 1
#define LCD_MISO 2
#define LCD_BL 6
#define TCA_ADDR 0x20   // IO expander: EXIO1 = LCD reset
#define TOUCH_ADDR 0x38 // FT6336
#define RTC_ADDR 0x51   // PCF85063
#define PMU_ADDR 0x34   // AXP2101

// ------------------------------------------------------------------ display
static Arduino_DataBus *bus = new Arduino_ESP32SPI(LCD_DC, -1 /*CS tied low*/, LCD_SCK, LCD_MOSI, LCD_MISO);
static Arduino_GFX *panel = new Arduino_ST7796(bus, -1 /*reset via EXIO1*/, 0, true /*IPS*/, SCR_W, SCR_H);
static uint16_t *rectBuf = nullptr;

static void tcaWrite(uint8_t reg, uint8_t v) {
  Wire.beginTransmission(TCA_ADDR);
  Wire.write(reg);
  Wire.write(v);
  Wire.endTransmission();
}

static void lcdReset() {
  // EXIO1 = LCD reset and EXIO7 high (as Waveshare's BSP), the rest inputs
  tcaWrite(0x01, 0x82);
  tcaWrite(0x03, (uint8_t)~0x82);
  tcaWrite(0x01, 0x80);
  delay(20);
  tcaWrite(0x01, 0x82);
  delay(150);
}

static void flush(int x, int y, int w, int h) {
  if (x == 0 && w == SCR_W) {  // whole rows are contiguous in the framebuffer
    panel->draw16bitRGBBitmap(0, y, gfx::fb + y * SCR_W, SCR_W, h);
    return;
  }
  for (int j = 0; j < h; j++) memcpy(rectBuf + j * w, gfx::fb + (y + j) * SCR_W + x, w * 2);
  panel->draw16bitRGBBitmap(x, y, rectBuf, w, h);
}

// ------------------------------------------------------------------ clock (PCF85063 keeps UTC)
static Preferences prefs;
static int64_t utcAtBoot = -1;  // unix seconds at millis() == 0, -1 = unknown
static int utcOffsetMin = 0;

static uint8_t bcd(uint8_t v) { return (uint8_t)(((v / 10) << 4) | (v % 10)); }
static uint8_t unbcd(uint8_t v) { return (uint8_t)((v >> 4) * 10 + (v & 15)); }

static bool rtcRead(int64_t &unix) {
  Wire.beginTransmission(RTC_ADDR);
  Wire.write(0x04);
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom(RTC_ADDR, 7) != 7) return false;
  uint8_t r[7];
  for (int i = 0; i < 7; i++) r[i] = Wire.read();
  if (r[0] & 0x80) return false;  // oscillator stopped: time not valid
  char iso[32];
  snprintf(iso, sizeof iso, "%04d-%02d-%02dT%02d:%02d:%02d", 2000 + unbcd(r[6]), unbcd(r[5] & 0x1F),
           unbcd(r[3] & 0x3F), unbcd(r[2] & 0x3F), unbcd(r[1] & 0x7F), unbcd(r[0] & 0x7F));
  unix = co_parse_iso8601(iso);
  return unix > 1700000000;
}

static void rtcWrite(int64_t unix) {
  char iso[32];
  co_iso8601(unix, iso, sizeof iso);
  int y, mo, d, h, mi, s;
  sscanf(iso, "%4d-%2d-%2dT%2d:%2d:%2d", &y, &mo, &d, &h, &mi, &s);
  int wd = (int)((unix / 86400 + 4) % 7);  // 1970-01-01 was a Thursday
  Wire.beginTransmission(RTC_ADDR);
  Wire.write(0x04);
  Wire.write(bcd(s));
  Wire.write(bcd(mi));
  Wire.write(bcd(h));
  Wire.write(bcd(d));
  Wire.write(bcd(wd));
  Wire.write(bcd(mo));
  Wire.write(bcd(y - 2000));
  Wire.endTransmission();
}

void clock_set_utc(uint32_t unixSeconds) {
  int64_t was = plat_unix();
  utcAtBoot = (int64_t)unixSeconds - millis() / 1000;
  // the companion says hello every 2 s: only touch the RTC when it drifted
  if (was < 0 || llabs(was - (int64_t)unixSeconds) > 2) rtcWrite(unixSeconds);
}

void clock_set_offset(int minutesEast) {
  if (minutesEast < -14 * 60 || minutesEast > 14 * 60) return;
  if (minutesEast != utcOffsetMin) prefs.putShort("utcoff", (int16_t)minutesEast);
  utcOffsetMin = minutesEast;
}

int64_t plat_unix() {
  if (utcAtBoot < 0) return -1;
  return utcAtBoot + millis() / 1000;
}

bool plat_clock(int *h, int *m) {
  if (utcAtBoot < 0) return false;
  int64_t local = plat_unix() + utcOffsetMin * 60;
  int secs = (int)(((local % 86400) + 86400) % 86400);
  *h = secs / 3600;
  *m = (secs / 60) % 60;
  return true;
}

// ------------------------------------------------------------------ the rest of platform.h
uint32_t plat_millis() { return millis(); }

bool plat_usb_linked() {
  uint32_t t = proto_last_rx_ms();
  return t && millis() - t < 6000;
}

int plat_wifi_state() { return wifi_state(); }

const char *plat_wifi_ssid() { return wifi_ssid(); }

Link plat_link() {
  if (wifi_state() == 2) return Link::Wifi;
  if (plat_usb_linked()) return Link::Usb;
  return Link::None;
}

void plat_save_settings(bool live, const char *merchant) {
  prefs.putBool("live", live);
  prefs.putString("merchant", merchant);
}

void plat_load_settings(bool *live, char *merchant, size_t cap) {
  *live = prefs.getBool("live", false);
  String m = prefs.getString("merchant", DEFAULT_MERCHANT);
  snprintf(merchant, cap, "%s", m.c_str());
}

uint32_t net_request(bool post, const char *path, const char *body) {
  static uint32_t nextRid = 1;
  uint32_t rid = nextRid++;
  if (wifi_state() == 2) return wifi_request(rid, post, path, body) ? rid : 0;
  if (plat_usb_linked()) {
    proto_http_request(rid, post, path, body);
    return rid;
  }
  return 0;
}

void host_notify() { proto_send_state(); }

// ------------------------------------------------------------------ boot diagnostics
static uint8_t pmuRegs[6];  // AXP2101 0x00, 0x01, 0x18, 0x19, 0x20 (power-on source), 0x21 (power-off source)
static bool pmuOk = false;

static void readPmu() {
  static const uint8_t regs[6] = {0x00, 0x01, 0x18, 0x19, 0x20, 0x21};
  pmuOk = true;
  for (int i = 0; i < 6; i++) {
    Wire.beginTransmission(PMU_ADDR);
    Wire.write(regs[i]);
    if (Wire.endTransmission(false) != 0 || Wire.requestFrom(PMU_ADDR, 1) != 1) {
      pmuOk = false;
      return;
    }
    pmuRegs[i] = Wire.read();
  }
}

void plat_boot_info(JsonObject o) {
  o["reset"] = (int)esp_reset_reason();  // esp_reset_reason_t: 1 power-on, 3 software, 4 panic, 6/7 watchdog, 9 brownout
  o["uptime"] = millis() / 1000;
  if (pmuOk) {
    char hex[40];
    snprintf(hex, sizeof hex, "%02x %02x %02x %02x %02x %02x", pmuRegs[0], pmuRegs[1], pmuRegs[2], pmuRegs[3],
             pmuRegs[4], pmuRegs[5]);
    o["pmu"] = hex;  // AXP2101 regs 00 01 18 19 20 21
  }
}

// ------------------------------------------------------------------ touch (FT6336, polled)
static void pollTouch() {
  static uint32_t last = 0;
  static bool wasDown = false;
  if (millis() - last < 15) return;
  last = millis();
  Wire.beginTransmission(TOUCH_ADDR);
  Wire.write(0x02);
  if (Wire.endTransmission(false) != 0 || Wire.requestFrom(TOUCH_ADDR, 5) != 5) return;
  uint8_t r[5];
  for (int i = 0; i < 5; i++) r[i] = Wire.read();
  int fingers = r[0] & 0x0F;
  bool down = fingers > 0 && fingers < 3;
  if (down) {
    int x = ((r[1] & 0x0F) << 8) | r[2];
    int y = ((r[3] & 0x0F) << 8) | r[4];
    if (x < 0 || y < 0 || x >= SCR_W || y >= SCR_H) return;
    wasDown = true;
    app_touch(true, x, y);
  } else if (wasDown) {
    wasDown = false;
    app_touch(false, 0, 0);
  }
}

void setup() {
  Wire.begin(I2C_SDA, I2C_SCL, 400000);
  readPmu();
  lcdReset();
  gfx::fb = (uint16_t *)ps_malloc(SCR_W * SCR_H * 2);
  rectBuf = (uint16_t *)ps_malloc(SCR_W * SCR_H * 2);
  panel->begin(40000000);
  // backlight on GPIO6, PWM
  ledcAttach(LCD_BL, 5000, 8);
  ledcWrite(LCD_BL, 230);

  prefs.begin("checkout", false);
  utcOffsetMin = prefs.getShort("utcoff", 0);
  int64_t now;
  if (rtcRead(now)) utcAtBoot = now - millis() / 1000;
  sodium_init();
  proto_init();
  app_init();
  app_render();
  flush(0, 0, SCR_W, SCR_H);
  wifi_begin();
}

void loop() {
  proto_poll();
  wifi_poll();
  pollTouch();
  app_tick();
  int x, y, w, h;
  if (app_dirty(&x, &y, &w, &h)) {
    app_render();
    flush(x, y, w, h);
  }
  delay(2);
}
