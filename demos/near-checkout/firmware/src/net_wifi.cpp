#ifdef ARDUINO
#include "net_wifi.h"

#include <Arduino.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <time.h>

#include "app.h"
#include "checkout.h"
#include "proto.h"

#if __has_include("secrets.h")
#include "secrets.h"
#else
#include "secrets.example.h"
#endif

// Roots that can anchor 1click.chaindefuser.com (Google Trust Services, chain
// leaf -> WE1 -> GTS Root R4, cross-signed by GlobalSign Root CA on 2026-11-14).
// Exported from macOS's SystemRootCertificates.keychain; see RECIPE.md.
static const char ROOTS[] =
#include "roots_pem.h"
    ;

struct Req {
  uint32_t rid;
  bool post;
  char path[220];
  char body[800];
};
struct Res {
  uint32_t rid;
  int status;
  char *body;  // ps_malloc'd, freed after delivery
  size_t len;
};

static QueueHandle_t reqQ, resQ;
static int state = 0;
static bool ntpStarted = false;

static void worker(void *) {
  static Req r;
  for (;;) {
    if (xQueueReceive(reqQ, &r, portMAX_DELAY) != pdTRUE) continue;
    Res out = {r.rid, -1, nullptr, 0};
    if (WiFi.status() == WL_CONNECTED) {
      WiFiClientSecure tls;
      tls.setCACert(ROOTS);
      tls.setTimeout(15);
      HTTPClient http;
      http.setTimeout(15000);
      String url = String("https://" ONECLICK_HOST) + r.path;
      if (http.begin(tls, url)) {
        http.addHeader("Accept", "application/json");
        if (ONECLICK_API_KEY[0]) http.addHeader("X-API-Key", ONECLICK_API_KEY);
        int code;
        if (r.post) {
          http.addHeader("Content-Type", "application/json");
          code = http.POST((uint8_t *)r.body, strlen(r.body));
        } else {
          code = http.GET();
        }
        out.status = code;
        if (code > 0) {
          String s = http.getString();
          out.len = s.length();
          out.body = (char *)ps_malloc(out.len + 1);
          if (out.body) memcpy(out.body, s.c_str(), out.len + 1);
          else out.len = 0;
        }
        http.end();
      }
    }
    xQueueSend(resQ, &out, portMAX_DELAY);
  }
}

void wifi_begin() {
  if (!WIFI_SSID[0]) return;
  reqQ = xQueueCreate(4, sizeof(Req));
  resQ = xQueueCreate(4, sizeof(Res));
  xTaskCreatePinnedToCore(worker, "oneclick", 12288, nullptr, 1, nullptr, 0);
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  state = 1;
}

const char *wifi_ssid() { return WIFI_SSID; }

int wifi_state() {
  if (!WIFI_SSID[0]) return 0;
  return WiFi.status() == WL_CONNECTED ? 2 : 1;
}

bool wifi_request(uint32_t rid, bool post, const char *path, const char *body) {
  if (wifi_state() != 2) return false;
  static Req r;
  r.rid = rid;
  r.post = post;
  snprintf(r.path, sizeof r.path, "%s", path);
  snprintf(r.body, sizeof r.body, "%s", body ? body : "");
  return xQueueSend(reqQ, &r, 0) == pdTRUE;
}

void wifi_poll() {
  if (!WIFI_SSID[0]) return;
  if (wifi_state() == 2 && !ntpStarted) {
    configTime(0, 0, "pool.ntp.org", "time.google.com");
    ntpStarted = true;
  }
  if (ntpStarted) {
    static uint32_t lastSync = 0;
    time_t now = time(nullptr);
    if (now > 1700000000 && (lastSync == 0 || millis() - lastSync > 3600000UL)) {
      clock_set_utc((uint32_t)now);
      lastSync = millis();
    }
  }
  Res r;
  while (xQueueReceive(resQ, &r, 0) == pdTRUE) {
    app_http_done(r.rid, r.status, r.body ? r.body : "", r.len);
    free(r.body);
  }
}
#endif
