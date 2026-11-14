// The watch UI: screens, touch handling and the wallet flows. Portable.
#pragma once
#include <stdint.h>

#include "wallet_core.h"

enum class Scr : uint8_t {
  Home,         // no wallet: carousel with "gen wallet" and "settings"
  Gen,          // generating wallet...
  NoteSeed,     // NOTE before the 12 words
  Word,         // one seed word per screen
  NotePin,      // NOTE before creating the PIN
  Pin,          // number pad (create / confirm / unlock / approve / wipe)
  Working,      // encrypting / signing...
  Done,         // vault ready
  Vault,        // wallet home carousel: vault / account / menu
  Settings,
  WipeConfirm,
  Locked,
  Review,       // sign tx / sign message
  Result,       // signed! / rejected / wiped
  SelfTest,
};

enum class WalletState : uint8_t { NoWallet, Locked, Ready };

void app_init();
void app_tick();                       // timers and animations
void app_touch(bool down, int x, int y);
bool app_dirty();
void app_render();                     // draws into gfx::fb
uint32_t app_idle_ms();

WalletState app_wallet_state();
bool app_busy();                       // a sign request is on screen
bool app_in_setup();                   // onboarding in progress
bool app_public_key(uint8_t pub[32]);
// Show a sign request. The app answers with host_sign_done / host_sign_failed.
void app_present(const Review &r, uint32_t timeoutMs);
void app_cancel(const char *error);    // computer cancelled / went away
void app_wake();                       // something happened, light up

// Simulator only: jump to a screen with demo data for the previews
void app_debug_show(Scr s, int variant);
