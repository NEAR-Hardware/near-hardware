// USB serial protocol: one JSON object per line, 115200 baud. See README.md.
#pragma once
#include <stddef.h>
#include <stdint.h>

void proto_init();
void proto_poll();
uint32_t proto_last_rx_ms();
// relay a 1Click request through the companion (tethered mode)
void proto_http_request(uint32_t rid, bool post, const char *path, const char *body);
void proto_send_state();
// reset reason and AXP2101 power-on/off source (main.cpp)
#include <ArduinoJson.h>
void plat_boot_info(JsonObject o);
// set by "hello" from the companion
void clock_set_utc(uint32_t unixSeconds);
void clock_set_offset(int minutesEast);
