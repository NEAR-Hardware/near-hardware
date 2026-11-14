// What the portable UI (app.cpp) needs from the outside world. main.cpp
// implements it on the watch, sim/sim_main.cpp on the Mac.
#pragma once
#include <stddef.h>
#include <stdint.h>

#define FW_VERSION "1.0.0"

// One network per build, picked in platformio.ini (env:testnet / env:mainnet).
// The watch only signs for this network and says so on screen.
#ifdef NEAR_MAINNET
#define NEAR_NETWORK "mainnet"
#else
#define NEAR_NETWORK "testnet"
#endif

// ---- device
uint32_t plat_millis();
bool plat_clock(int *hour24, int *minute);  // local time; false if unknown
void plat_vibrate(int ms);
void plat_flush();          // push gfx::fb to the panel now (before slow work)
bool plat_host_linked();    // the computer talked to us in the last few seconds
const char *plat_balance(); // NEAR balance pushed by the computer ("" if unknown)
const char *plat_price();   // USD price of NEAR pushed by the computer ("" if unknown)

// ---- encrypted key storage (keystore_esp.cpp / sim)
enum KsResult { KS_OK = 0, KS_WRONG_PIN, KS_WIPED, KS_ERROR };
bool ks_has_wallet();
bool ks_public_key(uint8_t pub[32]);
// Encrypt entropy + ed25519 secret with a key derived from the PIN and store it
bool ks_create(const uint8_t entropy[16], const uint8_t secret[32], const uint8_t pub[32], const char *pin);
// Decrypt with the PIN. Wrong PINs count down; at zero the wallet is wiped.
KsResult ks_unlock(const char *pin, uint8_t entropy[16], uint8_t secret[32]);
int ks_attempts_left();
void ks_wipe();

// ---- answers to the computer for the pending sign request (proto.cpp)
void host_sign_done(const uint8_t sig[64]);
void host_sign_failed(const char *error);
