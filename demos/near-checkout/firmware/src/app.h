// The till UI: screens, touch handling and the sale flow. Portable.
#pragma once
#include <stddef.h>
#include <stdint.h>

#include <ArduinoJson.h>

enum class Scr : uint8_t {
  Home,         // NEAR checkout, merchant, new sale, settings
  Amount,       // price keypad
  Pay,          // choose how to pay
  Quoting,      // asking 1Click
  Quote,        // QR, exact amount, chain, fee, countdown
  Waiting,      // payment seen, swap settling (mascot animation)
  Paid,         // paid! amount in USDC, receipt QR
  Ended,        // expired / refunded / incomplete / failed
  Error,        // no quote
  Settings,
  LiveConfirm,  // "real money" confirmation before LIVE
  Merchant,     // keyboard to edit the merchant account
};

void app_init();
void app_tick();
void app_touch(bool down, int x, int y);
// true if the screen needs drawing; the rect is what to push to the panel
bool app_dirty(int *x, int *y, int *w, int *h);
void app_render();  // draws into gfx::fb
uint32_t app_idle_ms();

// a 1Click answer (status <= 0: transport error, body may be empty)
void app_http_done(uint32_t rid, int status, const char *body, size_t len);

// host commands (proto.cpp). They return nullptr on success or an error code.
const char *app_demo(const char *action);  // "paid" | "expire"
const char *app_set_merchant(const char *account);
const char *app_set_demo_mode();           // LIVE can only be switched on at the till
void app_tap(int x, int y);                // a synthetic tap (tests, demo scripts)
void app_state(JsonObject out);            // what the till shows, for the host

// Simulator only: jump to a screen with demo data for the previews
void app_debug_show(Scr s, int variant);
