// What the portable UI (app.cpp) needs from the outside world. main.cpp,
// net_wifi.cpp and proto.cpp implement it on the board, sim/sim_main.cpp on the Mac.
#pragma once
#include <stddef.h>
#include <stdint.h>

#define FW_VERSION "1.0.0"

// ---- device
uint32_t plat_millis();
int64_t plat_unix();                        // UTC seconds, -1 if the clock is unknown
bool plat_clock(int *hour24, int *minute);  // local time; false if unknown

// ---- how the till reaches 1Click
enum class Link : uint8_t { None, Usb, Wifi };
Link plat_link();               // Wi-Fi first, then the USB companion
bool plat_usb_linked();         // the companion talked to us in the last few seconds
int plat_wifi_state();          // 0 = not configured, 1 = connecting, 2 = connected
const char *plat_wifi_ssid();   // "" if not configured

// ---- settings kept across reboots (NVS on the board)
void plat_save_settings(bool live, const char *merchant);
void plat_load_settings(bool *live, char *merchant, size_t cap);

// ---- 1Click over HTTPS. Starts a request and returns its id (0 = no link).
// The answer comes back through app_http_done(), on Wi-Fi from net_wifi.cpp,
// tethered from the companion through proto.cpp.
uint32_t net_request(bool post, const char *path, const char *body);

// ---- tell the host what the till shows (the demo controller follows along)
void host_notify();
