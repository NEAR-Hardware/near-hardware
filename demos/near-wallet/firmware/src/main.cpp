// NEAR hardware wallet for the Waveshare ESP32-S3 2.06" AMOLED watch.
// Hardware glue: CO5300 display, FT3168 touch, PCF85063 RTC, vibration motor.
#include <Arduino.h>
#include <Preferences.h>
#include <Wire.h>
#include <sodium.h>

// our headers first: Arduino_GFX #defines WHITE and friends
#include "app.h"
#include "gfx.h"
#include "platform.h"
#include "proto.h"
//
#include "Arduino_DriveBus_Library.h"
#include "Arduino_GFX_Library.h"
#include "pin_config.h"

#define MOTOR_PIN 18
#define RTC_ADDR 0x51
#define BRIGHT_ON 220
#define BRIGHT_DIM 25
#define DIM_AFTER_MS 45000

// ------------------------------------------------------------------ display + touch
static Arduino_DataBus *bus = new Arduino_ESP32QSPI(LCD_CS, LCD_SCLK, LCD_SDIO0, LCD_SDIO1, LCD_SDIO2, LCD_SDIO3);
static Arduino_CO5300 *panel = new Arduino_CO5300(bus, LCD_RESET, 0, LCD_WIDTH, LCD_HEIGHT, 22, 0, 0, 0);

static std::shared_ptr<Arduino_IIC_DriveBus> i2c = std::make_shared<Arduino_HWIIC>(IIC_SDA, IIC_SCL, &Wire);
static void touchIrq();
static std::unique_ptr<Arduino_IIC> touch(new Arduino_FT3x68(i2c, FT3168_DEVICE_ADDRESS, TP_RESET, TP_INT, touchIrq));
static void touchIrq() { touch->IIC_Interrupt_Flag = true; }

static bool dimmed = false;
static bool swallowTouch = false;

void plat_flush() { panel->draw16bitRGBBitmap(0, 0, gfx::fb, SCR_W, SCR_H); }

static void setBright(bool on) {
  if (on == !dimmed) return;
  dimmed = !on;
  panel->setBrightness(on ? BRIGHT_ON : BRIGHT_DIM);
}

// ------------------------------------------------------------------ motor
static uint32_t motorOffAt = 0;
void plat_vibrate(int ms) {
  digitalWrite(MOTOR_PIN, HIGH);
  motorOffAt = millis() + ms;
}

// ------------------------------------------------------------------ clock (PCF85063 keeps UTC)
static Preferences settings;
static int64_t utcAtBoot = -1;  // unix seconds at millis() == 0, -1 = unknown
static int utcOffsetMin = 0;

static uint8_t bcd(uint8_t v) { return (uint8_t)(((v / 10) << 4) | (v % 10)); }
static uint8_t unbcd(uint8_t v) { return (uint8_t)((v >> 4) * 10 + (v & 15)); }

// days since 1970-01-01 for a civil date (Howard Hinnant's algorithm)
static int64_t daysFromCivil(int y, unsigned m, unsigned d) {
  y -= m <= 2;
  const int era = (y >= 0 ? y : y - 399) / 400;
  const unsigned yoe = (unsigned)(y - era * 400);
  const unsigned doy = (153 * (m + (m > 2 ? -3 : 9)) + 2) / 5 + d - 1;
  const unsigned doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
  return (int64_t)era * 146097 + (int64_t)doe - 719468;
}

static void civilFromDays(int64_t z, int &y, unsigned &m, unsigned &d) {
  z += 719468;
  const int64_t era = (z >= 0 ? z : z - 146096) / 146097;
  const unsigned doe = (unsigned)(z - era * 146097);
  const unsigned yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
  y = (int)(yoe + era * 400);
  const unsigned doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
  const unsigned mp = (5 * doy + 2) / 153;
  d = doy - (153 * mp + 2) / 5 + 1;
  m = mp < 10 ? mp + 3 : mp - 9;
  y += m <= 2;
}

static bool rtcRead(int64_t &unix) {
  Wire.beginTransmission(RTC_ADDR);
  Wire.write(0x04);
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom(RTC_ADDR, 7) != 7) return false;
  uint8_t r[7];
  for (int i = 0; i < 7; i++) r[i] = Wire.read();
  if (r[0] & 0x80) return false;  // oscillator stopped: time not valid
  int sec = unbcd(r[0] & 0x7F), min = unbcd(r[1] & 0x7F), hour = unbcd(r[2] & 0x3F);
  int day = unbcd(r[3] & 0x3F), mon = unbcd(r[5] & 0x1F), year = 2000 + unbcd(r[6]);
  if (year < 2024 || mon < 1 || mon > 12 || day < 1) return false;
  unix = daysFromCivil(year, mon, day) * 86400 + hour * 3600 + min * 60 + sec;
  return true;
}

static void rtcWrite(int64_t unix) {
  int64_t days = unix / 86400;
  int secs = (int)(unix % 86400);
  int y;
  unsigned m, d;
  civilFromDays(days, y, m, d);
  int wd = (int)((days + 4) % 7);  // 1970-01-01 was a Thursday
  Wire.beginTransmission(RTC_ADDR);
  Wire.write(0x04);
  Wire.write(bcd(secs % 60));
  Wire.write(bcd((secs / 60) % 60));
  Wire.write(bcd(secs / 3600));
  Wire.write(bcd(d));
  Wire.write(bcd(wd));
  Wire.write(bcd(m));
  Wire.write(bcd(y - 2000));
  Wire.endTransmission();
}

void clock_set_utc(uint32_t unixSeconds) {
  utcAtBoot = (int64_t)unixSeconds - millis() / 1000;
  rtcWrite(unixSeconds);
}

void clock_set_offset(int minutesEast) {
  if (minutesEast < -14 * 60 || minutesEast > 14 * 60) return;
  if (minutesEast != utcOffsetMin) settings.putShort("utcoff", (int16_t)minutesEast);
  utcOffsetMin = minutesEast;
}

bool plat_clock(int *h, int *m) {
  if (utcAtBoot < 0) return false;
  int64_t local = utcAtBoot + millis() / 1000 + utcOffsetMin * 60;
  int secs = (int)(((local % 86400) + 86400) % 86400);
  *h = secs / 3600;
  *m = (secs / 60) % 60;
  return true;
}

// ------------------------------------------------------------------ the rest of platform.h
uint32_t plat_millis() { return millis(); }
char g_balance[24] = "";
char g_price[16] = "";
const char *plat_balance() { return g_balance; }
const char *plat_price() { return g_price; }
bool plat_host_linked() {
  uint32_t t = proto_last_rx_ms();
  return t && millis() - t < 12000;
}

// ------------------------------------------------------------------ touch polling
static void pollTouch() {
  static uint32_t last = 0;
  static bool wasDown = false;
  if (millis() - last < 15) return;
  last = millis();
  int fingers = (int)touch->IIC_Read_Device_Value(touch->Arduino_IIC_Touch::Value_Information::TOUCH_FINGER_NUMBER);
  bool down = fingers > 0 && fingers < 3;
  if (down) {
    int x = (int)touch->IIC_Read_Device_Value(touch->Arduino_IIC_Touch::Value_Information::TOUCH_COORDINATE_X);
    int y = (int)touch->IIC_Read_Device_Value(touch->Arduino_IIC_Touch::Value_Information::TOUCH_COORDINATE_Y);
    if (x < 0 || y < 0 || x >= SCR_W || y >= SCR_H) return;
    if (!wasDown && dimmed) {
      swallowTouch = true;  // the first tap only wakes the screen
      setBright(true);
      app_wake();
    }
    wasDown = true;
    if (!swallowTouch) app_touch(true, x, y);
  } else if (wasDown) {
    wasDown = false;
    if (!swallowTouch) app_touch(false, 0, 0);
    swallowTouch = false;
  }
}

void setup() {
  pinMode(MOTOR_PIN, OUTPUT);
  digitalWrite(MOTOR_PIN, LOW);
  Wire.begin(IIC_SDA, IIC_SCL);

  gfx::fb = (uint16_t *)ps_malloc(SCR_W * SCR_H * 2);
  panel->begin();
  panel->setBrightness(BRIGHT_ON);

  for (int i = 0; i < 5 && !touch->begin(); i++) delay(200);
  touch->IIC_Write_Device_State(touch->Arduino_IIC_Touch::Device::TOUCH_POWER_MODE,
                                touch->Arduino_IIC_Touch::Device_Mode::TOUCH_POWER_ACTIVE);

  settings.begin("nhw-set", false);
  utcOffsetMin = settings.getShort("utcoff", 0);
  int64_t now;
  if (rtcRead(now)) utcAtBoot = now - millis() / 1000;
  sodium_init();
  app_init();
  app_render();
  plat_flush();
  proto_init();
}

void loop() {
  proto_poll();
  pollTouch();
  app_tick();
  if (motorOffAt && (int32_t)(millis() - motorOffAt) >= 0) {
    digitalWrite(MOTOR_PIN, LOW);
    motorOffAt = 0;
  }
  if (app_idle_ms() > DIM_AFTER_MS && !app_busy()) setBright(false);
  else if (app_idle_ms() < 1000) setBright(true);
  if (app_dirty()) {
    app_render();
    plat_flush();
  }
  delay(4);
}
