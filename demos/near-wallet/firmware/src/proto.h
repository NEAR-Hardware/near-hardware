// USB serial protocol: one JSON object per line, 115200 baud. See README.md.
#pragma once
#include <stdint.h>

void proto_init();
void proto_poll();
uint32_t proto_last_rx_ms();
// set by proto from "set_status"
void clock_set_utc(uint32_t unixSeconds);
void clock_set_offset(int minutesEast);
