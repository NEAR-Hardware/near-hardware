// 1Click over Wi-Fi (HTTPS, pinned roots), run in its own FreeRTOS task.
#pragma once
#include <stdint.h>

void wifi_begin();                 // joins WIFI_SSID from secrets.h, if set
int wifi_state();
const char *wifi_ssid();          // "" when not configured                  // 0 = not configured, 1 = connecting, 2 = connected
bool wifi_request(uint32_t rid, bool post, const char *path, const char *body);
void wifi_poll();                  // deliver finished requests to app_http_done()
