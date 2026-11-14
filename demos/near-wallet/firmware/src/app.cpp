#include "app.h"

#include <stdio.h>
#include <string.h>

#include "crypto_port.h"
#include "gfx.h"
#include "platform.h"
#include "qrcodegen.h"

using namespace gfx;

// ------------------------------------------------------------------ state
enum Act : uint8_t {
  A_NONE, A_GEN, A_SETTINGS, A_PREV, A_NEXT, A_LETSGO, A_BACK, A_FWD,
  A_K0, A_K1, A_K2, A_K3, A_K4, A_K5, A_K6, A_K7, A_K8, A_K9, A_DEL, A_OK,
  A_CONTINUE, A_LOCK, A_UNLOCK, A_WIPE, A_WIPE_YES, A_SELFTEST, A_ACCOUNT,
  A_APPROVE, A_REJECT, A_DISMISS,
};

enum class PinMode : uint8_t { Create, Confirm, Unlock, Approve, Wipe };

struct Hit { int16_t x, y, w, h; uint8_t act; };

static Scr scr = Scr::Home;
static bool dirty = true;
static int page = 1;            // carousel page (home starts on the menu)
static Hit hits[24];
static int nhits = 0;
static int pressed = A_NONE;
static int touchX0, touchY0, touchX, touchY;
static bool touching = false;
static uint32_t lastInput = 0;
static uint32_t scrSince = 0;
static int lastMinute = -1;
static bool lastLinked = false;

// wallet
static bool hasWallet = false;
static bool unlocked = false;
static uint8_t pub[32];
static char account[65], pubStr[64], shortAcc[24];

// onboarding (secrets live only in RAM until encrypted, then are zeroed)
static uint8_t entropy[16], secretKey[32], newPub[32];
static uint16_t words[12];
static int wordIdx = 0;

// PIN pad
static PinMode pinMode;
static char pinEntry[7], pinFirst[7];
static char toast[40];

// sign request
static Review review;
static bool reviewActive = false;
static int reviewPage = 0;
static uint32_t reviewDeadline = 0;
static Scr reviewReturn = Scr::Vault;
static const int REVIEW_LINES_PER_PAGE = 11;

// result / working screens
static char resTitle[24], resSub1[40], resSub2[40];
static bool resGood = true;
static Scr resNext = Scr::Vault;
static uint32_t resUntil = 0;
static char workTitle[32], workSub[40];

// self test
static bool stPass = false;
static char stGot[64];

static void go(Scr s) {
  scr = s;
  scrSince = plat_millis();
  dirty = true;
  pressed = A_NONE;
}

static void loadWallet() {
  hasWallet = ks_has_wallet() && ks_public_key(pub);
  if (hasWallet) {
    near_implicit_account(pub, account);
    near_pubkey_str(pub, pubStr);
    near_short_account(account, shortAcc, sizeof shortAcc);
  } else {
    account[0] = pubStr[0] = shortAcc[0] = 0;
    unlocked = false;
  }
}

static void wipeSetupSecrets() {
  cp_zero(entropy, sizeof entropy);
  cp_zero(secretKey, sizeof secretKey);
  cp_zero(words, sizeof words);
  cp_zero(pinEntry, sizeof pinEntry);
  cp_zero(pinFirst, sizeof pinFirst);
}

static Scr homeScreen() {
  if (!hasWallet) return Scr::Home;
  return unlocked ? Scr::Vault : Scr::Locked;
}

static void showResult(bool good, const char *title, const char *s1, const char *s2, Scr next, uint32_t ms) {
  resGood = good;
  snprintf(resTitle, sizeof resTitle, "%s", title);
  snprintf(resSub1, sizeof resSub1, "%s", s1);
  snprintf(resSub2, sizeof resSub2, "%s", s2);
  resNext = next;
  resUntil = plat_millis() + ms;
  go(Scr::Result);
}

static void working(const char *title, const char *sub) {
  snprintf(workTitle, sizeof workTitle, "%s", title);
  snprintf(workSub, sizeof workSub, "%s", sub);
  go(Scr::Working);
}

static void openPin(PinMode m) {
  pinMode = m;
  memset(pinEntry, 0, sizeof pinEntry);
  toast[0] = 0;
  go(Scr::Pin);
}

// ------------------------------------------------------------------ API
void app_init() {
  loadWallet();
  page = hasWallet ? 0 : 1;
  go(homeScreen());
  lastInput = plat_millis();
}

WalletState app_wallet_state() {
  if (!hasWallet) return WalletState::NoWallet;
  return unlocked ? WalletState::Ready : WalletState::Locked;
}
bool app_busy() { return reviewActive; }
bool app_in_setup() {
  return scr == Scr::Gen || scr == Scr::NoteSeed || scr == Scr::Word || scr == Scr::NotePin ||
         (scr == Scr::Pin && (pinMode == PinMode::Create || pinMode == PinMode::Confirm)) ||
         (scr == Scr::Working && !hasWallet);
}
bool app_public_key(uint8_t out[32]) {
  if (!hasWallet) return false;
  memcpy(out, pub, 32);
  return true;
}
bool app_dirty() { return dirty; }
uint32_t app_idle_ms() { return plat_millis() - lastInput; }
void app_wake() { lastInput = plat_millis(); }

void app_present(const Review &r, uint32_t timeoutMs) {
  review = r;
  reviewActive = true;
  reviewPage = 0;
  reviewDeadline = plat_millis() + timeoutMs;
  reviewReturn = homeScreen();
  lastInput = plat_millis();
  plat_vibrate(60);
  go(Scr::Review);
}

static void finishReview() {
  reviewActive = false;
  cp_zero(review.digest, sizeof review.digest);
}

void app_cancel(const char *error) {
  if (!reviewActive) return;
  host_sign_failed(error);
  finishReview();
  cp_zero(pinEntry, sizeof pinEntry);
  showResult(false, "cancelled", "the computer", "cancelled it", homeScreen(), 1800);
}

// ------------------------------------------------------------------ actions
static void startGen() { go(Scr::Gen); }

static void doGenerate() {
  // 128 bits from the hardware RNG -> BIP39 -> SLIP-10 m/44'/397'/0'
  cp_random(entropy, sizeof entropy);
  bip39_indices(entropy, words);
  near_key_from_entropy(entropy, secretKey, newPub);
}

static void pinDigit(int d) {
  size_t n = strlen(pinEntry);
  if (n >= 6) return;
  pinEntry[n] = (char)('0' + d);
  pinEntry[n + 1] = 0;
  toast[0] = 0;
}

static void signApproved() {
  uint8_t ent[16], sk[32], sig[64];
  working("signing...", "");
  app_render();  // show it before the PIN key derivation blocks
  plat_flush();
  KsResult kr = ks_unlock(pinEntry, ent, sk);
  cp_zero(pinEntry, sizeof pinEntry);
  if (kr == KS_OK) {
    cp_ed25519_sign(sk, review.digest, 32, sig);
    cp_zero(sk, sizeof sk);
    cp_zero(ent, sizeof ent);
    unlocked = true;
    host_sign_done(sig);
    cp_zero(sig, sizeof sig);
    bool msg = review.isMessage;
    finishReview();
    plat_vibrate(40);
    showResult(true, "signed!", msg ? "message signed" : "sent to your", msg ? "by your watch" : "computer", Scr::Vault, 2200);
    return;
  }
  cp_zero(sk, sizeof sk);
  cp_zero(ent, sizeof ent);
  if (kr == KS_WRONG_PIN) {
    go(Scr::Pin);
    snprintf(toast, sizeof toast, "wrong PIN, %d left", ks_attempts_left());
    plat_vibrate(150);
    return;
  }
  host_sign_failed(kr == KS_WIPED ? "wiped" : "storage_error");
  finishReview();
  loadWallet();
  showResult(false, kr == KS_WIPED ? "wallet wiped" : "error", kr == KS_WIPED ? "too many wrong" : "could not read",
             kr == KS_WIPED ? "PINs" : "the key", Scr::Home, 3000);
}

static void pinSubmit() {
  if (strlen(pinEntry) != 6) {
    snprintf(toast, sizeof toast, "6 digits please");
    return;
  }
  switch (pinMode) {
    case PinMode::Create:
      memcpy(pinFirst, pinEntry, sizeof pinFirst);
      openPin(PinMode::Confirm);
      break;
    case PinMode::Confirm:
      if (strcmp(pinFirst, pinEntry) != 0) {
        openPin(PinMode::Create);
        snprintf(toast, sizeof toast, "PINs didn't match");
        plat_vibrate(150);
        break;
      }
      working("encrypting...", "sealing your key");
      app_render();
      plat_flush();
      if (ks_create(entropy, secretKey, newPub, pinEntry)) {
        wipeSetupSecrets();
        loadWallet();
        unlocked = true;
        page = 0;
        go(Scr::Done);
      } else {
        wipeSetupSecrets();
        showResult(false, "error", "could not save", "the wallet", Scr::Home, 3000);
      }
      break;
    case PinMode::Unlock: {
      uint8_t ent[16], sk[32];
      working("unlocking...", "");
      app_render();
      plat_flush();
      KsResult kr = ks_unlock(pinEntry, ent, sk);
      cp_zero(ent, sizeof ent);
      cp_zero(sk, sizeof sk);
      cp_zero(pinEntry, sizeof pinEntry);
      if (kr == KS_OK) {
        unlocked = true;
        page = 0;
        go(Scr::Vault);
      } else if (kr == KS_WRONG_PIN) {
        openPin(PinMode::Unlock);
        snprintf(toast, sizeof toast, "wrong PIN, %d left", ks_attempts_left());
        plat_vibrate(150);
      } else {
        loadWallet();
        page = 1;
        showResult(false, "wallet wiped", "too many wrong", "PINs", Scr::Home, 3000);
      }
      break;
    }
    case PinMode::Approve:
      signApproved();
      break;
    case PinMode::Wipe: {
      uint8_t ent[16], sk[32];
      working("wiping...", "");
      app_render();
      plat_flush();
      KsResult kr = ks_unlock(pinEntry, ent, sk);
      cp_zero(ent, sizeof ent);
      cp_zero(sk, sizeof sk);
      cp_zero(pinEntry, sizeof pinEntry);
      if (kr == KS_WRONG_PIN) {
        openPin(PinMode::Wipe);
        snprintf(toast, sizeof toast, "wrong PIN, %d left", ks_attempts_left());
        plat_vibrate(150);
        break;
      }
      ks_wipe();
      loadWallet();
      page = 1;
      showResult(true, "wiped", "this watch has", "no keys now", Scr::Home, 2500);
      break;
    }
  }
}

static void pinBack() {
  size_t n = strlen(pinEntry);
  if (n) {
    pinEntry[n - 1] = 0;
    return;
  }
  switch (pinMode) {
    case PinMode::Create: go(Scr::NotePin); break;
    case PinMode::Confirm: openPin(PinMode::Create); break;
    case PinMode::Unlock: go(Scr::Locked); break;
    case PinMode::Approve: go(Scr::Review); break;
    case PinMode::Wipe: go(Scr::Settings); break;
  }
}

static int carouselPages() {
  if (scr == Scr::Home || scr == Scr::Vault) return 3;
  if (scr == Scr::Review) {
    int n = (review.nlines + REVIEW_LINES_PER_PAGE - 1) / REVIEW_LINES_PER_PAGE;
    return n < 1 ? 1 : n;
  }
  return 1;
}

static void act(int a) {
  plat_vibrate(15);
  switch (a) {
    case A_GEN: startGen(); break;
    case A_SETTINGS: go(Scr::Settings); break;
    case A_PREV:
      if (scr == Scr::Review) { if (reviewPage > 0) reviewPage--; }
      else if (page > 0) page--;
      break;
    case A_NEXT:
      if (scr == Scr::Review) { if (reviewPage < carouselPages() - 1) reviewPage++; }
      else if (page < carouselPages() - 1) page++;
      break;
    case A_LETSGO:
      if (scr == Scr::NoteSeed) { wordIdx = 0; go(Scr::Word); }
      else if (scr == Scr::NotePin) openPin(PinMode::Create);
      break;
    case A_BACK:
      if (scr == Scr::Word) { if (wordIdx == 0) go(Scr::NoteSeed); else wordIdx--; }
      else if (scr == Scr::Settings || scr == Scr::SelfTest) go(scr == Scr::SelfTest ? Scr::Settings : homeScreen());
      else if (scr == Scr::WipeConfirm) go(Scr::Settings);
      break;
    case A_FWD:
      if (scr == Scr::Word) { if (wordIdx == 11) go(Scr::NotePin); else wordIdx++; }
      break;
    case A_K0: case A_K1: case A_K2: case A_K3: case A_K4:
    case A_K5: case A_K6: case A_K7: case A_K8: case A_K9:
      pinDigit(a - A_K0);
      break;
    case A_DEL: pinBack(); break;
    case A_OK: pinSubmit(); break;
    case A_CONTINUE: page = 0; go(Scr::Vault); break;
    case A_LOCK: unlocked = false; go(Scr::Locked); break;
    case A_UNLOCK: openPin(PinMode::Unlock); break;
    case A_WIPE: go(Scr::WipeConfirm); break;
    case A_WIPE_YES: openPin(PinMode::Wipe); break;
    case A_SELFTEST:
      stPass = wallet_selftest(stGot);
      go(Scr::SelfTest);
      break;
    case A_ACCOUNT: page = 1; break;
    case A_APPROVE: openPin(PinMode::Approve); break;
    case A_REJECT:
      host_sign_failed("rejected");
      finishReview();
      showResult(false, "rejected", "nothing was", "signed", reviewReturn, 1500);
      break;
    case A_DISMISS:
      go(resNext);
      break;
  }
  dirty = true;
}

void app_touch(bool down, int x, int y) {
  lastInput = plat_millis();
  if (down) {
    if (!touching) {
      touching = true;
      touchX0 = touchX = x;
      touchY0 = touchY = y;
      pressed = A_NONE;
      for (int i = nhits - 1; i >= 0; i--) {
        const Hit &h = hits[i];
        if (x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h) { pressed = h.act; break; }
      }
      dirty = true;
    } else {
      touchX = x;
      touchY = y;
      int dx = touchX - touchX0, dy = touchY - touchY0;
      if (pressed != A_NONE && dx * dx + dy * dy > 30 * 30) { pressed = A_NONE; dirty = true; }
    }
    return;
  }
  if (!touching) return;
  touching = false;
  int dx = touchX - touchX0, dy = touchY - touchY0;
  int p = pressed;
  pressed = A_NONE;
  dirty = true;
  bool swipe = (dx > 70 || dx < -70) && (dx > 0 ? dx : -dx) > 2 * (dy > 0 ? dy : -dy);
  if (swipe && carouselPages() > 1) {
    act(dx < 0 ? A_NEXT : A_PREV);
    return;
  }
  if (p != A_NONE) act(p);
}

void app_tick() {
  uint32_t now = plat_millis();
  // clock and link indicator
  int h, m;
  int minute = plat_clock(&h, &m) ? m : -1;
  if (minute != lastMinute) { lastMinute = minute; dirty = true; }
  bool linked = plat_host_linked();
  if (linked != lastLinked) { lastLinked = linked; dirty = true; }

  if (scr == Scr::Gen) {
    uint32_t t = now - scrSince;
    static bool generated = false;
    if (t < 50) generated = false;
    if (!generated && t > 400) { doGenerate(); generated = true; }
    if ((t / 400) != ((t - 50) / 400)) dirty = true;  // animate dots
    if (generated && t > 6000) go(Scr::NoteSeed);
  }
  if (scr == Scr::Result && now > resUntil) go(resNext);
  if (reviewActive) {
    static uint32_t lastSec = 0;
    uint32_t sec = (reviewDeadline - now) / 1000;
    if ((int32_t)(reviewDeadline - now) <= 0) {
      host_sign_failed("timeout");
      finishReview();
      cp_zero(pinEntry, sizeof pinEntry);
      showResult(false, "timed out", "nothing was", "signed", reviewReturn, 1800);
    } else if (sec != lastSec && scr == Scr::Review) {
      lastSec = sec;
      dirty = true;
    }
  }
  // lock again after 5 minutes without input
  if (unlocked && !reviewActive && now - lastInput > 5 * 60 * 1000UL && scr == Scr::Vault) {
    unlocked = false;
    go(Scr::Locked);
  }
}

// ------------------------------------------------------------------ drawing helpers
static void addHit(int x, int y, int w, int h, uint8_t a) {
  if (nhits < (int)(sizeof hits / sizeof hits[0])) hits[nhits++] = {(int16_t)x, (int16_t)y, (int16_t)w, (int16_t)h, a};
}

// pixel button with a centered label; registers the touch target
static void btn(int x, int y, int w, int h, const char *label, uint8_t a, int scale = 2, uint16_t c = WHITE) {
  bool p = pressed == a;
  button(x, y, w, h, p, c);
  int ty = y + (h - 3 * 3) / 2 - 4 * scale + 2;
  textC(x + w / 2, ty, label, scale, p ? BG : c);
  addHit(x - 6, y - 6, w + 12, h + 12, a);
}

static void topBar() {
  int h, m;
  char t[12];
  if (plat_clock(&h, &m)) {
    int h12 = h % 12;
    if (h12 == 0) h12 = 12;
    snprintf(t, sizeof t, "%02d:%02d%s", h12, m, h < 12 ? "AM" : "PM");
  } else {
    snprintf(t, sizeof t, "--:--");
  }
  textC(205, 34, t, 3, WHITE);
  spriteMono(334, 36, plat_host_linked() ? SPR_WIFI : SPR_WIFI_OFF, 2, WHITE);
}

static void arrows(int y, bool left, bool right) {
  if (left) {
    spriteMono(12, y, SPR_CHEV_L, 4, WHITE);
    addHit(0, y - 40, 70, 28 + 80, A_PREV);
  }
  if (right) {
    spriteMono(378, y, SPR_CHEV_R, 4, WHITE);
    addHit(340, y - 40, 70, 28 + 80, A_NEXT);
  }
}

// centred paragraph text at scale 2; returns the y after it
static int para(int y, const char *s, int cols = 21, uint16_t c = WHITE, int lh = 24) {
  char lines[16][40];
  int n = wrap(s, cols, lines, 16);
  for (int i = 0; i < n; i++) textC(205, y + i * lh, lines[i], 2, c);
  return y + n * lh;
}

static void priceLine(int y) {
  const char *price = plat_price();
  char t[32];
  if (price[0]) snprintf(t, sizeof t, "$%s", price);
  else snprintf(t, sizeof t, NEAR_NETWORK);
  int w = 20 + 10 + textW(t, 2) + 10 + 14;
  int x = 205 - w / 2;
  spriteMono(x, y - 2, SPR_NEAR_LOGO, 2, WHITE);
  text(x + 30, y, t, 2, WHITE);
  spriteMono(x + 30 + textW(t, 2) + 10, y + 3, SPR_CHEV_D, 2, WHITE);
}

// ------------------------------------------------------------------ screens
static void drawHome() {
  topBar();
  if (page == 0) {
    textC(205, 92, "hello!", 3, WHITE);
    int y = 140;
    y = para(y, "I keep your NEAR key", 21);
    y = para(y, "on this watch.", 21) + 14;
    spriteMono(184, y, SPR_USB, 3, WHITE);
    y += 50;
    y = para(y, "plug me into your", 21);
    y = para(y, "computer, open a NEAR", 21);
    y = para(y, "app in Chrome and", 21);
    para(y, "approve here.", 21);
  } else if (page == 1) {
    int x = 92, w = 232;
    bool p1 = pressed == A_GEN, p2 = pressed == A_SETTINGS;
    button(x, 120, w, 108, p1);
    text(x + 22, 146, "gen", 2, p1 ? BG : WHITE);
    text(x + 22, 172, "wallet", 2, p1 ? BG : WHITE);
    spriteMono(x + w - 76, 146, SPR_WALLET, 3, p1 ? BG : rgb(255, 240, 240));
    addHit(x, 120, w, 108, A_GEN);
    button(x, 250, w, 108, p2);
    text(x + 22, 290, "settings", 2, p2 ? BG : WHITE);
    spriteMono(x + w - 72, 268, SPR_GEAR, 3, p2 ? BG : WHITE);
    addHit(x, 250, w, 108, A_SETTINGS);
    sprite(-14, SCR_H - SPR_MASCOT_PEEK.h + 6, SPR_MASCOT_PEEK, 1);
  } else {
    textC(205, 96, "NEAR", 5, WHITE);
    textC(205, 150, "hardware wallet", 2, WHITE);
    int y = 196;
    y = para(y, "keys are made and kept", 22, DIM);
    y = para(y, "on this watch. they", 22, DIM);
    y = para(y, "never leave it.", 22, DIM) + 16;
#ifdef NEAR_MAINNET
    // the README's warning, said on the watch before a mainnet wallet exists
    textC(205, y, "mainnet, demo grade", 2, ALERT);
    y = para(y + 28, "flash encryption and secure boot are off", 22, WHITE);
    textC(205, y + 4, "firmware " FW_VERSION, 2, DIM);
#else
    textC(205, y, NEAR_NETWORK " only", 2, WHITE);
    textC(205, y + 28, "firmware " FW_VERSION, 2, DIM);
#endif
  }
  arrows(229, page > 0, page < 2);
  dots(205, 404, 3, page);
  priceLine(452);
}

static void drawGen() {
  topBar();
  uint32_t t = plat_millis() - scrSince;
  bool second = (t / 3000) % 2 == 1;
  int ndots = (t / 400) % 4;
  char l1[32];
  if (!second) {
    snprintf(l1, sizeof l1, "generating wallet%.*s", ndots, "...");
    text(205 - textW("generating wallet...", 2) / 2, 92, l1, 2, WHITE);
    textC(205, 120, "do not press anything", 2, WHITE);
  } else {
    textC(205, 92, "wallet is materializing", 2, WHITE);
    textC(205, 120, "from pure randomness", 2, WHITE);
  }
  sprite(205 - SPR_MASCOT_SOLDER.w / 2, 160, SPR_MASCOT_SOLDER, 1);
  if (!second) {
    textC(205, 372, "hardware RNG at work", 2, WHITE);
    textC(205, 400, "listen to music", 2, WHITE);
  } else {
    textC(205, 372, "ETA : one riff", 2, WHITE);
    textC(205, 400, "(a few secs)", 2, WHITE);
  }
}

static void drawNote(const char *const *bullets, int n) {
  topBar();
  textC(205, 84, "NOTE", 5, WHITE);
  int y = 146;
  for (int i = 0; i < n; i++) y = para(y, bullets[i], 21) + 12;
  btn(105, 410, 200, 52, "let's go " G_ARROW_R, A_LETSGO);
}

static void drawNoteSeed() {
  static const char *const b[] = {
      "> On the next screen you will see 12 secret words.",
      "> Make sure to write them down somewhere safe.",
      "> If you lose them there is no way to recover your wallet.",
  };
  drawNote(b, 3);
}

static void drawNotePin() {
  static const char *const b[] = {
      "> On the next screen you will create a 6 digit PIN.",
      "> Write it down or remember it: it decrypts the key for signing tx.",
  };
  drawNote(b, 2);
}

static void drawWord() {
  topBar();
  char n[8];
  snprintf(n, sizeof n, "12/%02d", wordIdx + 1);
  textC(205, 150, n, 3, WHITE);
  const char *w = bip39_word(words[wordIdx]);
  int ww = textW(w, 5);
  textC(205, 200, w, 5, WHITE);
  int uw = ww + 40 < 264 ? 264 : ww + 40;
  rect(205 - uw / 2, 254, uw, 3, WHITE);
  btn(54, 336, 142, 62, G_ARROW_L " back", A_BACK);
  btn(214, 336, 142, 62, wordIdx == 11 ? "Finish" : "Next " G_ARROW_R, A_FWD);
}

static void drawPin() {
  topBar();
  const char *title = "enter PIN";
  switch (pinMode) {
    case PinMode::Create: title = "create PIN"; break;
    case PinMode::Confirm: title = "repeat PIN"; break;
    case PinMode::Unlock: title = "enter PIN"; break;
    case PinMode::Approve: title = "PIN to sign"; break;
    case PinMode::Wipe: title = "PIN to wipe"; break;
  }
  textC(205, 74, title, 3, pinMode == PinMode::Wipe ? ALERT : WHITE);
  // six boxes
  int n = (int)strlen(pinEntry);
  for (int i = 0; i < 6; i++) {
    int x = 77 + i * 44, y = 110;
    frame(x, y, 36, 36, 3, WHITE);
    if (i < n) rect(x + 9, y + 9, 18, 18, WHITE);
  }
  if (toast[0]) textC(205, 158, toast, 2, ALERT);
  static const char *keys[12] = {"1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", ""};
  for (int i = 0; i < 12; i++) {
    int col = i % 3, row = i / 3;
    int x = 51 + col * 106, y = 182 + row * 68;
    uint8_t a;
    const char *label = keys[i];
    if (i == 9) { a = A_DEL; label = n ? "del" : "back"; }
    else if (i == 11) { a = A_OK; label = "ok"; }
    else a = (uint8_t)(A_K0 + (keys[i][0] - '0'));
    bool isDigit = i != 9 && i != 11;
    btn(x, y, 96, 58, label, a, isDigit ? 3 : 2, (i == 11 && n < 6) ? DIM : WHITE);
  }
}

static void drawWorking(bool withMascot) {
  topBar();
  textC(205, 100, workTitle, 3, WHITE);
  if (workSub[0]) textC(205, 136, workSub, 2, DIM);
  if (withMascot) sprite(205 - SPR_MASCOT_SOLDER.w / 2, 170, SPR_MASCOT_SOLDER, 1);
}

static void drawPortraitBlock(int y, int scale) {
  sprite(205 - SPR_PORTRAIT.w * scale / 2, y, SPR_PORTRAIT, scale);
}

static void drawDone() {
  topBar();
  textC(205, 80, "vault ready!", 3, WHITE);
  drawPortraitBlock(122, 4);
  textC(205, 292, "your account", 2, DIM);
  textC(205, 318, shortAcc, 2, WHITE);
  textC(205, 344, "fund it on " NEAR_NETWORK, 2, DIM);
  btn(95, 384, 220, 60, "open vault", A_CONTINUE);
}

static void drawQr(int cx, int y, const char *s, int mod) {
  static uint8_t qr[qrcodegen_BUFFER_LEN_FOR_VERSION(6)];
  static uint8_t tmp[qrcodegen_BUFFER_LEN_FOR_VERSION(6)];
  if (!qrcodegen_encodeText(s, tmp, qr, qrcodegen_Ecc_LOW, 1, 6, qrcodegen_Mask_AUTO, true)) return;
  int size = qrcodegen_getSize(qr);
  int total = (size + 4) * mod;
  int x0 = cx - total / 2;
  rect(x0, y, total, total, LIGHT);
  for (int j = 0; j < size; j++)
    for (int i = 0; i < size; i++)
      if (qrcodegen_getModule(qr, i, j)) rect(x0 + (i + 2) * mod, y + (j + 2) * mod, mod, mod, DARK);
}

static void drawVault() {
  topBar();
  if (page == 0) {
    drawPortraitBlock(78, 5);
    textC(205, 290, "illia's", 3, WHITE);
    textC(205, 318, "vault", 3, WHITE);
    textC(205, 356, shortAcc, 2, DIM);
    addHit(60, 280, 290, 100, A_ACCOUNT);
  } else if (page == 1) {
    textC(205, 80, "account", 3, WHITE);
    for (int i = 0; i < 4; i++) {
      char l[17];
      memcpy(l, account + i * 16, 16);
      l[16] = 0;
      textC(205, 118 + i * 22, l, 2, WHITE);
    }
    drawQr(205, 214, account, 4);
  } else {
    int x = 92, w = 232;
    bool p1 = pressed == A_SETTINGS, p2 = pressed == A_LOCK;
    button(x, 100, w, 108, p1);
    text(x + 22, 146, "settings", 2, p1 ? BG : WHITE);
    spriteMono(x + w - 72, 118, SPR_GEAR, 3, p1 ? BG : WHITE);
    addHit(x, 100, w, 108, A_SETTINGS);
    button(x, 232, w, 108, p2);
    text(x + 22, 266, "lock", 2, p2 ? BG : WHITE);
    text(x + 22, 292, "watch", 2, p2 ? BG : WHITE);
    spriteMono(x + w - 70, 258, SPR_LOCK, 4, p2 ? BG : WHITE);
    addHit(x, 232, w, 108, A_LOCK);
  }
  arrows(229, page > 0, page < 2);
  dots(205, 398, 3, page);
  // balance at the bottom, like the design's price line
  const char *bal = plat_balance();
  char t[40];
  if (bal[0]) snprintf(t, sizeof t, "%s NEAR", bal);
  else snprintf(t, sizeof t, NEAR_NETWORK);
  int w = 30 + textW(t, 2);
  spriteMono(205 - w / 2, 428, SPR_NEAR_LOGO, 2, WHITE);
  text(205 - w / 2 + 30, 430, t, 2, WHITE);
  const char *price = plat_price();
  if (price[0] && bal[0]) {
    snprintf(t, sizeof t, "$%s / NEAR", price);
    textC(205, 458, t, 2, DIM);
  }
}

static void drawLocked() {
  topBar();
  drawPortraitBlock(84, 4);
  spriteMono(191, 254, SPR_LOCK, 2, WHITE);
  textC(205, 292, "locked", 3, WHITE);
  textC(205, 326, shortAcc, 2, DIM);
  btn(95, 372, 220, 62, "unlock", A_UNLOCK);
}

static void drawSettings() {
  topBar();
  textC(205, 78, "settings", 3, WHITE);
  if (hasWallet) {
    text(28, 120, "public key", 2, DIM);
    char l[3][40];
    int n = wrap(pubStr, 22, l, 3);
    for (int i = 0; i < n; i++) text(28, 144 + i * 22, l[i], 2, WHITE);
    text(28, 218, "account", 2, DIM);
    text(28, 242, shortAcc, 2, WHITE);
    text(28, 272, "network", 2, DIM);
    text(28 + textW("network ", 2), 272, NEAR_NETWORK, 2, WHITE);
#ifdef NEAR_MAINNET
    // one row of buttons leaves room to say plainly what this build lacks
    btn(16, 312, 116, 58, "lock", A_LOCK);
    btn(147, 312, 116, 58, "wipe", A_WIPE, 2, ALERT);
    btn(278, 312, 116, 58, G_ARROW_L " back", A_BACK);
    para(392, "demo grade: flash encryption and secure boot are off", 22, ALERT);
#else
    btn(34, 312, 162, 58, "lock", A_LOCK);
    btn(214, 312, 162, 58, "wipe", A_WIPE, 2, ALERT);
    btn(125, 392, 160, 52, G_ARROW_L " back", A_BACK);
#endif
  } else {
    int y = 130;
    y = para(y, "no wallet yet", 22, WHITE) + 8;
    y = para(y, "network: " NEAR_NETWORK, 22, DIM);
#ifdef NEAR_MAINNET
    y = para(y, "demo grade build", 22, ALERT);
#endif
    y = para(y, "firmware " FW_VERSION, 22, DIM) + 6;
    para(y, "self test derives a known phrase and checks the key", 22, DIM);
    btn(85, 318, 240, 58, "self test", A_SELFTEST);
    btn(125, 396, 160, 52, G_ARROW_L " back", A_BACK);
  }
}

static void drawSelfTest() {
  topBar();
  textC(205, 78, "self test", 3, WHITE);
  textC(205, 116, "BIP39 + SLIP-10", 2, DIM);
  textC(205, 140, "m/44'/397'/0'", 2, DIM);
  text(28, 176, "expected", 2, DIM);
  char l[3][40];
  int n = wrap(SELFTEST_PUBKEY, 22, l, 3);
  for (int i = 0; i < n; i++) text(28, 200 + i * 20, l[i], 2, WHITE);
  text(28, 262, "derived", 2, DIM);
  n = wrap(stGot, 22, l, 3);
  for (int i = 0; i < n; i++) text(28, 286 + i * 20, l[i], 2, stPass ? WHITE : ALERT);
  textC(205, 346, stPass ? G_CHECK " PASS" : "FAIL", 4, stPass ? WHITE : ALERT);
  btn(125, 398, 160, 52, G_ARROW_L " back", A_BACK);
}

static void drawWipeConfirm() {
  topBar();
  spriteMono(184, 84, SPR_TRASH, 3, ALERT);
  textC(205, 136, "wipe wallet?", 3, ALERT);
  int y = 180;
  y = para(y, "this erases the key from this watch.", 22);
  para(y + 8, "only your 12 words can bring it back.", 22, DIM);
  btn(34, 360, 162, 60, "cancel", A_BACK);
  btn(214, 360, 162, 60, "wipe", A_WIPE_YES, 2, ALERT);
}

static void drawReview() {
  topBar();
  textC(205, 70, review.isMessage ? "sign message?" : "sign tx?", 3, WHITE);
  int32_t left = (int32_t)(reviewDeadline - plat_millis()) / 1000;
  if (left < 0) left = 0;
  char sub[40];
  int pages = carouselPages();
  if (pages > 1) snprintf(sub, sizeof sub, "%s %ds  %d/%d", review.network, (int)left, reviewPage + 1, pages);
  else snprintf(sub, sizeof sub, "%s  %ds", review.network, (int)left);
  textC(205, 100, sub, 2, DIM);
  int first = reviewPage * REVIEW_LINES_PER_PAGE;
  for (int i = 0; i < REVIEW_LINES_PER_PAGE && first + i < review.nlines; i++) {
    int k = first + i;
    uint16_t c = WHITE;
    int x = 28;
    switch (review.style[k]) {
      case L_LABEL: c = LABEL; break;
      case L_HEAD: c = WHITE; break;
      case L_WARN: c = ALERT; break;
      default: x = 28; break;
    }
    if (review.style[k] == L_HEAD || review.style[k] == L_WARN) {
      glyph(x - 4, 130 + i * 22, 0x85 /* bullet */, 2, c);
      text(x + 14, 130 + i * 22, review.lines[k], 2, c);
    } else {
      text(x, 130 + i * 22, review.lines[k], 2, c);
    }
  }
  if (pages > 1) {
    if (reviewPage > 0) { spriteMono(4, 230, SPR_CHEV_L, 3, WHITE); addHit(0, 180, 50, 120, A_PREV); }
    if (reviewPage < pages - 1) { spriteMono(392, 230, SPR_CHEV_R, 3, WHITE); addHit(360, 180, 50, 120, A_NEXT); }
  }
  btn(30, 384, 166, 64, "reject", A_REJECT, 2, ALERT);
  btn(214, 384, 166, 64, "approve", A_APPROVE);
}

static void drawResult() {
  topBar();
  if (resGood) {
    // big pixel check
    spriteMono(205 - 50, 100, SPR_CHECK_BIG, 10, WHITE);
  } else {
    textC(205, 110, "x", 10, ALERT);
  }
  textC(205, 210, resTitle, 3, resGood ? WHITE : ALERT);
  textC(205, 252, resSub1, 2, WHITE);
  textC(205, 278, resSub2, 2, WHITE);
  addHit(0, 0, SCR_W, SCR_H, A_DISMISS);
  sprite(-14, SCR_H - SPR_MASCOT_PEEK.h + 6, SPR_MASCOT_PEEK, 1);
}

void app_render() {
  nhits = 0;
  clear(BG);
  switch (scr) {
    case Scr::Home: drawHome(); break;
    case Scr::Gen: drawGen(); break;
    case Scr::NoteSeed: drawNoteSeed(); break;
    case Scr::Word: drawWord(); break;
    case Scr::NotePin: drawNotePin(); break;
    case Scr::Pin: drawPin(); break;
    case Scr::Working: drawWorking(true); break;
    case Scr::Done: drawDone(); break;
    case Scr::Vault: drawVault(); break;
    case Scr::Settings: drawSettings(); break;
    case Scr::WipeConfirm: drawWipeConfirm(); break;
    case Scr::Locked: drawLocked(); break;
    case Scr::Review: drawReview(); break;
    case Scr::Result: drawResult(); break;
    case Scr::SelfTest: drawSelfTest(); break;
  }
  dirty = false;
}

// ------------------------------------------------------------------ previews
void app_debug_show(Scr s, int variant) {
  loadWallet();
  pressed = A_NONE;
  toast[0] = 0;
  switch (s) {
    case Scr::Home: page = variant; break;
    case Scr::Vault: unlocked = true; page = variant; break;
    case Scr::Word: {
      // preview words come from the public test phrase, never a real wallet
      static const uint8_t demo[16] = {0xc6, 0x8e, 0xce, 0xa1, 0xe7, 0x21, 0xe8, 0x3b,
                                       0x39, 0x31, 0xa4, 0x76, 0xa8, 0xc4, 0xf0, 0x80};
      memcpy(entropy, demo, 16);
      bip39_indices(entropy, words);
      wordIdx = variant;
      break;
    }
    case Scr::Pin:
      pinMode = (PinMode)variant;
      strcpy(pinEntry, variant == 0 ? "12" : "1234");
      if (variant == 2) snprintf(toast, sizeof toast, "wrong PIN, 9 left");
      break;
    case Scr::Working: snprintf(workTitle, sizeof workTitle, "encrypting..."); snprintf(workSub, sizeof workSub, "sealing your key"); break;
    case Scr::Result:
      if (variant == 0) { resGood = true; strcpy(resTitle, "signed!"); strcpy(resSub1, "sent to your"); strcpy(resSub2, "computer"); }
      else { resGood = false; strcpy(resTitle, "rejected"); strcpy(resSub1, "nothing was"); strcpy(resSub2, "signed"); }
      break;
    case Scr::SelfTest: stPass = wallet_selftest(stGot); break;
    default: break;
  }
  scr = s;
  scrSince = plat_millis() - (s == Scr::Gen ? (variant ? 3200 : 1300) : 0);
  dirty = true;
}
