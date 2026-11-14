#include "app.h"

#include <stdio.h>
#include <string.h>

#include "checkout.h"
#include "gfx.h"
#include "platform.h"
#include "qrcodegen.h"

using namespace gfx;

// ------------------------------------------------------------------ state
enum Act : uint8_t {
  A_NONE, A_NEWSALE, A_SETTINGS, A_HOME, A_BACK, A_NEXT, A_CANCEL, A_RETRY,
  A_K0, A_K1, A_K2, A_K3, A_K4, A_K5, A_K6, A_K7, A_K8, A_K9, A_K00, A_DEL,
  A_ASSET0, A_ASSET1, A_ASSET2, A_ASSET3, A_ASSET4, A_ASSET5,
  A_MODE_DEMO, A_MODE_LIVE, A_LIVE_YES, A_MERCHANT, A_KB_DEL, A_KB_SAVE,
  A_KEY0,  // + index into KB_CHARS
};
static const char KB_CHARS[] = "1234567890qwertyuiopasdfghjkl.zxcvbnm-_";

enum class EndKind : uint8_t { Expired, Refunded, Incomplete, Failed };

struct Hit { int16_t x, y, w, h; uint8_t act; };

static Scr scr = Scr::Home;
static Hit hits[64];
static int nhits = 0;
static int pressed = A_NONE;
static int touchX0, touchY0, touchX, touchY;
static bool touching = false;
static uint32_t lastInput = 0;
static uint32_t scrSince = 0;
static int lastMinute = -1;
static Link lastLink = Link::None;
static int lastWifi = -1;

// what needs drawing: the whole screen or a rectangle (animations, countdown)
static bool dirty = true, dirtyFull = true;
static int dX, dY, dW, dH;

// settings
static bool live = false;
static char merchant[65] = DEFAULT_MERCHANT;

// the sale
static uint32_t cents = 0;
static int assetIdx = 0;
static Quote q;
static uint32_t quoteRid = 0, statusRid = 0;
static uint32_t quoteAt = 0, statusAt = 0, lastPoll = 0;
static uint32_t deadlineMs = 0;  // millis() when the quote expires
static PayStatus payStatus = PayStatus::Unknown;
static uint32_t paidAt = 0;      // when the payment was seen
static bool demoPaying = false;
static char received[24];
static char receiptUrl[160];
static char qrPayload[240];
static EndKind endKind = EndKind::Expired;
static char errTitle[24], errMsg[160];

// merchant keyboard
static char kb[65];
static char toast[40];

static const uint32_t QUOTE_TIMEOUT_MS = 25000;
static const uint32_t POLL_MS = 5000;

static void markFull() {
  dirty = dirtyFull = true;
}

static void markRect(int x, int y, int w, int h) {
  if (dirty && dirtyFull) return;
  if (!dirty) {
    dX = x; dY = y; dW = w; dH = h;
  } else {  // union
    int x2 = dX + dW > x + w ? dX + dW : x + w, y2 = dY + dH > y + h ? dY + dH : y + h;
    dX = dX < x ? dX : x;
    dY = dY < y ? dY : y;
    dW = x2 - dX;
    dH = y2 - dY;
  }
  dirty = true;
}

static void go(Scr s) {
  scr = s;
  scrSince = plat_millis();
  pressed = A_NONE;
  markFull();
  host_notify();
}

static const PayAsset &asset() { return PAY_ASSETS[assetIdx]; }

static void priceStr(char *out, size_t cap) {
  char c[16];
  co_cents_str(cents, c, sizeof c);
  snprintf(out, cap, "$%s", c);
}

// ------------------------------------------------------------------ API
void app_init() {
  plat_load_settings(&live, merchant, sizeof merchant);
  if (!co_valid_account(merchant)) snprintf(merchant, sizeof merchant, "%s", DEFAULT_MERCHANT);
  go(Scr::Home);
  lastInput = plat_millis();
}

bool app_dirty(int *x, int *y, int *w, int *h) {
  if (!dirty) return false;
  if (dirtyFull) {
    *x = 0; *y = 0; *w = SCR_W; *h = SCR_H;
  } else {
    *x = dX < 0 ? 0 : dX;
    *y = dY < 0 ? 0 : dY;
    *w = *x + dW > SCR_W ? SCR_W - *x : dW;
    *h = *y + dH > SCR_H ? SCR_H - *y : dH;
  }
  dirty = dirtyFull = false;
  return true;
}

uint32_t app_idle_ms() { return plat_millis() - lastInput; }

const char *app_set_merchant(const char *account) {
  if (!account || !co_valid_account(account)) return "bad_account";
  snprintf(merchant, sizeof merchant, "%s", account);
  plat_save_settings(live, merchant);
  markFull();
  host_notify();
  return nullptr;
}

const char *app_set_demo_mode() {
  if (live) {
    live = false;
    plat_save_settings(live, merchant);
    if (scr != Scr::Settings) go(Scr::Home);
    else { markFull(); host_notify(); }
  }
  return nullptr;
}

// ------------------------------------------------------------------ sale flow
static void showError(const char *title, const char *msg) {
  snprintf(errTitle, sizeof errTitle, "%s", title);
  snprintf(errMsg, sizeof errMsg, "%s", msg);
  go(Scr::Error);
}

static void endSale(EndKind k) {
  endKind = k;
  statusRid = 0;
  demoPaying = false;
  go(Scr::Ended);
}

static void paid(const char *amountOut) {
  if (amountOut && amountOut[0]) snprintf(received, sizeof received, "%s", amountOut);
  else co_cents_str(cents, received, sizeof received);
  snprintf(receiptUrl, sizeof receiptUrl, "https://explorer.near-intents.org/transactions/%s", q.depositAddress);
  payStatus = PayStatus::Success;
  statusRid = 0;
  demoPaying = false;
  go(Scr::Paid);
}

static void startQuote() {
  uint32_t now = plat_millis();
  int64_t unixNow = plat_unix();
  uint32_t secs = asset().deadlineMin * 60;
  if (q.deadline > 0 && unixNow > 0 && q.deadline > unixNow) secs = (uint32_t)(q.deadline - unixNow);
  deadlineMs = now + secs * 1000;
  if (co_payment_uri(qrPayload, sizeof qrPayload, asset(), q) < 0) {
    showError("no address", "the quote had no usable deposit address");
    return;
  }
  payStatus = PayStatus::PendingDeposit;
  lastPoll = now;
  statusRid = 0;
  demoPaying = false;
  go(Scr::Quote);
}

static void requestQuote() {
  const PayAsset &a = asset();
  Link link = plat_link();
  int64_t now = plat_unix();
  if (link == Link::None || now < 0) {
    if (link == Link::None) showError("offline", "plug in the USB companion or set up Wi-Fi to get a price from 1Click.");
    else showError("no clock", "waiting for the time from the companion or Wi-Fi. try again in a moment.");
    return;
  }
  char iso[32];
  co_iso8601(now + a.deadlineMin * 60, iso, sizeof iso);
  static char body[768];
  // DEMO and LIVE both take real quotes (dry: false): a real deposit address
  // that pays the merchant. They differ only in what marks a sale paid.
  if (co_quote_body(body, sizeof body, a, cents, merchant, false, iso) < 0) {
    showError("no quote", "could not build the request");
    return;
  }
  quoteRid = net_request(true, "/v0/quote", body);
  if (!quoteRid) {
    showError("offline", "no connection to 1Click right now.");
    return;
  }
  quoteAt = plat_millis();
  go(Scr::Quoting);
}

static void pollStatus() {
  char path[200];
  int n = snprintf(path, sizeof path, "/v0/status?depositAddress=%s", q.depositAddress);
  if (q.depositMemo[0]) snprintf(path + n, sizeof path - n, "&depositMemo=%s", q.depositMemo);
  statusRid = net_request(false, path, nullptr);
  statusAt = plat_millis();
  lastPoll = statusAt;
}

static void onStatus(const StatusInfo &s) {
  if (scr != Scr::Quote && scr != Scr::Waiting) return;
  switch (s.st) {
    case PayStatus::KnownDepositTx:
    case PayStatus::Processing:
      if (payStatus != s.st) markFull();
      payStatus = s.st;
      if (scr == Scr::Quote) {
        paidAt = plat_millis();
        go(Scr::Waiting);
      }
      break;
    case PayStatus::Success: paid(s.amountOutFmt); break;
    case PayStatus::Refunded: endSale(EndKind::Refunded); break;
    case PayStatus::IncompleteDeposit: endSale(EndKind::Incomplete); break;
    case PayStatus::Failed: endSale(EndKind::Failed); break;
    default: break;  // PENDING_DEPOSIT, not found yet, transient errors: keep polling
  }
}

void app_http_done(uint32_t rid, int status, const char *body, size_t len) {
  if (rid && rid == quoteRid) {
    quoteRid = 0;
    if (scr != Scr::Quoting) return;  // cancelled meanwhile
    static Quote nq;
    if (!co_parse_quote(status, body, len, nq)) {
      showError("no quote", nq.error[0] ? nq.error : "1Click did not give a quote");
      return;
    }
    if (nq.dry || !nq.verified) {
      // never show a deposit address 1Click did not sign
      showError("not signed", "1Click's signature on this quote did not verify. not showing it.");
      return;
    }
    q = nq;
    startQuote();
  } else if (rid && rid == statusRid) {
    statusRid = 0;
    StatusInfo s;
    co_parse_status(status, body, len, s);
    onStatus(s);
  }
}

const char *app_demo(const char *action) {
  if (live) return "live_mode";  // the demo controller can't fake a real sale
  if (!strcmp(action, "paid")) {
    if (scr != Scr::Quote) return "no_open_quote";
    demoPaying = true;
    paidAt = plat_millis();
    payStatus = PayStatus::KnownDepositTx;
    go(Scr::Waiting);
    return nullptr;
  }
  if (!strcmp(action, "expire")) {
    if (scr != Scr::Quote) return "no_open_quote";
    endSale(EndKind::Expired);
    return nullptr;
  }
  return "unknown_action";
}

// ------------------------------------------------------------------ actions
static void newSale() {
  cents = 0;
  memset(&q, 0, sizeof q);
  quoteRid = statusRid = 0;
  demoPaying = false;
  go(Scr::Amount);
}

static void keyDigit(int d, int times) {
  for (int i = 0; i < times; i++) {
    uint64_t c = (uint64_t)cents * 10 + d;
    if (c > MAX_CENTS) return;
    cents = (uint32_t)c;
  }
}

static void act(int a) {
  switch (scr) {
    case Scr::Home:
      if (a == A_NEWSALE) newSale();
      else if (a == A_SETTINGS) go(Scr::Settings);
      break;
    case Scr::Amount:
      if (a >= A_K0 && a <= A_K9) keyDigit(a - A_K0, 1);
      else if (a == A_K00) keyDigit(0, 2);
      else if (a == A_DEL) cents /= 10;
      else if (a == A_BACK) go(Scr::Home);
      else if (a == A_NEXT && cents > 0) go(Scr::Pay);
      markFull();
      host_notify();
      break;
    case Scr::Pay:
      if (a >= A_ASSET0 && a < A_ASSET0 + PAY_ASSET_COUNT) {
        assetIdx = a - A_ASSET0;
        requestQuote();
      } else if (a == A_BACK) {
        go(Scr::Amount);
      }
      break;
    case Scr::Quoting:
      if (a == A_CANCEL) {
        quoteRid = 0;
        go(Scr::Pay);
      }
      break;
    case Scr::Quote:
      if (a == A_CANCEL) {
        statusRid = 0;
        go(Scr::Pay);
      }
      break;
    case Scr::Waiting:
      if (a == A_HOME) go(Scr::Home);
      break;
    case Scr::Paid:
      if (a == A_NEWSALE) newSale();
      else if (a == A_HOME) go(Scr::Home);
      break;
    case Scr::Ended:
      if (a == A_NEWSALE) newSale();
      else if (a == A_HOME) go(Scr::Home);
      break;
    case Scr::Error:
      if (a == A_RETRY) requestQuote();
      else if (a == A_BACK) go(Scr::Pay);
      break;
    case Scr::Settings:
      if (a == A_BACK) go(Scr::Home);
      else if (a == A_MODE_DEMO) app_set_demo_mode();
      else if (a == A_MODE_LIVE && !live) go(Scr::LiveConfirm);
      else if (a == A_MERCHANT) {
        snprintf(kb, sizeof kb, "%s", merchant);
        toast[0] = 0;
        go(Scr::Merchant);
      }
      break;
    case Scr::LiveConfirm:
      if (a == A_LIVE_YES) {
        live = true;
        plat_save_settings(live, merchant);
        go(Scr::Settings);
      } else if (a == A_CANCEL) {
        go(Scr::Settings);
      }
      break;
    case Scr::Merchant:
      if (a >= A_KEY0 && a < A_KEY0 + (int)sizeof KB_CHARS - 1) {
        size_t n = strlen(kb);
        if (n < 64) {
          kb[n] = KB_CHARS[a - A_KEY0];
          kb[n + 1] = 0;
        }
        toast[0] = 0;
        markFull();
      } else if (a == A_KB_DEL) {
        size_t n = strlen(kb);
        if (n) kb[n - 1] = 0;
        toast[0] = 0;
        markFull();
      } else if (a == A_KB_SAVE) {
        if (app_set_merchant(kb)) {
          snprintf(toast, sizeof toast, "not a NEAR account");
          markFull();
        } else {
          go(Scr::Settings);
        }
      } else if (a == A_CANCEL) {
        go(Scr::Settings);
      }
      break;
  }
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
      if (pressed != A_NONE) markFull();
    } else {
      touchX = x;
      touchY = y;
      int dx = touchX - touchX0, dy = touchY - touchY0;
      if (pressed != A_NONE && dx * dx + dy * dy > 30 * 30) { pressed = A_NONE; markFull(); }
    }
    return;
  }
  if (!touching) return;
  touching = false;
  int p = pressed;
  pressed = A_NONE;
  markFull();
  if (p != A_NONE) act(p);
}

void app_tap(int x, int y) {
  if (dirty) app_render();  // hit targets must match what is on screen
  bool d = dirty, f = dirtyFull;
  app_touch(true, x, y);
  app_touch(false, 0, 0);
  dirty = dirty || d;
  dirtyFull = dirtyFull || f;
}

void app_tick() {
  uint32_t now = plat_millis();
  int h, m;
  int minute = plat_clock(&h, &m) ? m : -1;
  if (minute != lastMinute) { lastMinute = minute; markRect(0, 0, SCR_W, 46); }
  Link link = plat_link();
  int wifi = plat_wifi_state();
  if (link != lastLink || wifi != lastWifi) {
    lastLink = link;
    lastWifi = wifi;
    markFull();
  }

  switch (scr) {
    case Scr::Quoting:
      if (now - quoteAt > QUOTE_TIMEOUT_MS) {
        quoteRid = 0;
        showError("no quote", "1Click did not answer in time.");
        break;
      }
      if ((now - scrSince) / 150 != (now - scrSince - 30) / 150) markRect(60, 120, 200, 190);
      break;
    case Scr::Quote: {
      static uint32_t lastSec = 0;
      uint32_t sec = now / 1000;
      if (sec != lastSec) {
        lastSec = sec;
        markRect(0, 330, SCR_W, 90);
      }
      if ((int32_t)(now - deadlineMs) >= 0) {
        endSale(EndKind::Expired);
        break;
      }
      // a real payment is picked up in both modes
      if (!statusRid && now - lastPoll > POLL_MS) pollStatus();
      break;
    }
    case Scr::Waiting:
      if ((now - scrSince) / 150 != (now - scrSince - 30) / 150) markRect(60, 86, 200, 210);
      if ((now - scrSince) / 1000 != (now - scrSince - 30) / 1000) markRect(0, 340, SCR_W, 140);
      if (demoPaying) {
        // the DEMO walks through the statuses a real swap reports
        uint32_t t = now - paidAt;
        PayStatus st = t < 1800 ? PayStatus::KnownDepositTx : PayStatus::Processing;
        if (st != payStatus) {
          payStatus = st;
          markFull();
          host_notify();
        }
        if (t > 4500) paid(nullptr);
      } else if (!statusRid && now - lastPoll > 4000) {
        pollStatus();
      }
      break;
    default:
      break;
  }
  // a status request that never came back
  if (statusRid && now - statusAt > 20000) statusRid = 0;
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
  addHit(x - 4, y - 4, w + 8, h + 8, a);
}

// centred paragraph text at scale 2; returns the y after it
static int para(int y, const char *s, int cols = 19, uint16_t c = WHITE, int lh = 22) {
  char lines[16][40];
  int n = wrap(s, cols, lines, 16);
  for (int i = 0; i < n; i++) textC(SCR_W / 2, y + i * lh, lines[i], 2, c);
  return y + n * lh;
}

// shorten to `max` characters with an ellipsis in the middle
static void shorten(const char *s, int max, char *out, size_t cap) {
  int n = (int)strlen(s);
  if (n <= max) {
    snprintf(out, cap, "%s", s);
    return;
  }
  int head = (max - 1) / 2, tail = max - 1 - head;
  snprintf(out, cap, "%.*s" G_ELLIPSIS "%s", head, s, s + n - tail);
}

// clock and link icon, like the wallet. The mode is shown in settings only.
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
  textC(SCR_W / 2, 13, t, 3, WHITE);
  switch (plat_link()) {
    case Link::Usb: spriteMono(285, 13, SPR_USB, 2, WHITE); break;
    case Link::Wifi: spriteMono(289, 17, SPR_WIFI, 2, WHITE); break;
    default: spriteMono(289, 17, SPR_WIFI_OFF, 2, WHITE); break;
  }
}

static const Sprite &coinFor(int i) {
  switch (PAY_ASSETS[i].uri) {
    case UriKind::EvmNative: return SPR_COIN_ETH;
    case UriKind::Solana: return SPR_COIN_SOL;
    case UriKind::Bitcoin: return SPR_COIN_BTC;
    case UriKind::Near: return SPR_COIN_NEAR;
    default: return SPR_COIN_USDC;
  }
}

// QR code, cached per payload (encoding with the automatic mask is slow-ish)
static int drawQr(int cx, int y, const char *s, int maxPx, qrcodegen_Ecc ecc) {
  static uint8_t qr[qrcodegen_BUFFER_LEN_FOR_VERSION(12)];
  static uint8_t tmp[qrcodegen_BUFFER_LEN_FOR_VERSION(12)];
  static char cached[260];
  static int cachedEcc = -1;
  static bool ok = false;
  if (strcmp(cached, s) || cachedEcc != (int)ecc) {
    snprintf(cached, sizeof cached, "%s", s);
    cachedEcc = (int)ecc;
    ok = qrcodegen_encodeText(s, tmp, qr, ecc, 1, 12, qrcodegen_Mask_AUTO, true);
  }
  if (!ok) return 0;
  int size = qrcodegen_getSize(qr);
  int mod = maxPx / (size + 4);
  if (mod < 1) mod = 1;
  int total = (size + 4) * mod;
  int x0 = cx - total / 2;
  rect(x0, y, total, total, LIGHT);
  for (int j = 0; j < size; j++)
    for (int i = 0; i < size; i++)
      if (qrcodegen_getModule(qr, i, j)) rect(x0 + (i + 2) * mod, y + (j + 2) * mod, mod, mod, DARK);
  return total;
}

static void peekMascot() { sprite(-8, SCR_H - SPR_MASCOT_PEEK.h + 6, SPR_MASCOT_PEEK, 1); }

// the soldering mascot, bobbing, with sparks at the iron tip
static void busyMascot(int y) {
  uint32_t t = plat_millis() - scrSince;
  static const int8_t bob[4] = {0, -2, -4, -2};
  int x0 = SCR_W / 2 - SPR_MASCOT_SOLDER.w / 2;
  int y0 = y + 6 + bob[(t / 150) % 4];
  sprite(x0, y0, SPR_MASCOT_SOLDER, 1);
  static const int8_t sp[4][2] = {{-6, -4}, {2, -8}, {-10, 2}, {4, 0}};
  const int8_t *o = sp[(t / 150) % 4];
  sprite(x0 + 64 + o[0], y0 + 108 + o[1], SPR_SPARK, 2);
  // smoke rising from the joint
  for (int i = 0; i < 3; i++) {
    int ph = (int)((t / 120 + i * 5) % 15);
    rect(x0 + 74 + ((ph / 3) % 2) * 3 + i * 4, y0 + 100 - ph * 3, 3, 3, LIGHT);
  }
}

static void dotsAnim(char *out, size_t cap, const char *base) {
  int n = (int)((plat_millis() - scrSince) / 400 % 4);
  snprintf(out, cap, "%s%.*s", base, n, "...");
}

static void feeLine(char *out, size_t cap) {
  // delivery fee in USDC (6 decimals), rounded up to a tenth of a cent
  uint32_t mills = (q.withdrawFee + 999) / 1000;
  if (q.appFeeBps)
    snprintf(out, cap, "fee %u.%02u%%+$%lu.%03lu", q.appFeeBps / 100, q.appFeeBps % 100, (unsigned long)(mills / 1000),
             (unsigned long)(mills % 1000));
  else
    snprintf(out, cap, "fee $%lu.%03lu", (unsigned long)(mills / 1000), (unsigned long)(mills % 1000));
}

// ------------------------------------------------------------------ screens
static void drawHome() {
  topBar();
  textC(SCR_W / 2, 58, "NEAR", 5, WHITE);
  textC(SCR_W / 2, 106, "checkout", 3, WHITE);
  char m[24];
  shorten(merchant, 19, m, sizeof m);
  textC(SCR_W / 2, 156, "pays to", 2, DIM);
  textC(SCR_W / 2, 180, m, 2, WHITE);
  bool p1 = pressed == A_NEWSALE;
  button(40, 226, 240, 92, p1);
  textC(SCR_W / 2 + 18, 252, "new", 3, p1 ? BG : WHITE);
  textC(SCR_W / 2 + 18, 280, "sale", 3, p1 ? BG : WHITE);
  spriteMono(66, 262, SPR_TAG, 3, p1 ? BG : WHITE);
  addHit(36, 222, 248, 100, A_NEWSALE);
  bool p2 = pressed == A_SETTINGS;
  button(96, 334, 184, 58, p2);
  text(114, 354, "settings", 2, p2 ? BG : WHITE);
  addHit(92, 330, 192, 66, A_SETTINGS);
  const char *l = "offline";
  if (plat_link() == Link::Usb) l = "via USB";
  else if (plat_link() == Link::Wifi) l = "via Wi-Fi";
  text(96, 430, l, 2, DIM);
  peekMascot();
}

static void drawAmount() {
  topBar();
  textC(SCR_W / 2, 52, "new sale", 2, DIM);
  char p[20];
  priceStr(p, sizeof p);
  textC(SCR_W / 2, 78, p, 4, WHITE);
  rect(30, 118, 260, 3, WHITE);
  static const char *keys[12] = {"1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "del"};
  for (int i = 0; i < 12; i++) {
    int col = i % 3, row = i / 3;
    int x = 16 + col * 100, y = 134 + row * 64;
    uint8_t a;
    if (i == 9) a = A_K00;
    else if (i == 11) a = A_DEL;
    else a = (uint8_t)(A_K0 + (keys[i][0] - '0'));
    btn(x, y, 88, 54, keys[i], a, i == 11 ? 2 : 3);
  }
  btn(16, 402, 120, 56, G_ARROW_L " back", A_BACK);
  btn(148, 402, 156, 56, "next " G_ARROW_R, A_NEXT, 2, cents ? WHITE : SHADE);
}

static void drawPay() {
  topBar();
  char p[20];
  priceStr(p, sizeof p);
  textC(SCR_W / 2, 50, p, 3, WHITE);
  textC(SCR_W / 2, 82, "customer pays with", 2, DIM);
  for (int i = 0; i < PAY_ASSET_COUNT; i++) {
    int col = i % 2, row = i / 2;
    int x = 8 + col * 156, y = 108 + row * 92;
    uint8_t a = (uint8_t)(A_ASSET0 + i);
    bool pr = pressed == a;
    button(x, y, 148, 84, pr);
    sprite(x + 10, y + 10, coinFor(i), 2);
    text(x + 50, y + 18, PAY_ASSETS[i].symbol, 2, pr ? BG : WHITE);
    text(x + 10, y + 50, PAY_ASSETS[i].chain, 2, pr ? BG : DIM);
    addHit(x - 3, y - 3, 154, 90, a);
  }
  btn(16, 402, 136, 56, G_ARROW_L " back", A_BACK);
  textC(236, 424, "via 1Click", 2, DIM);
}

static void drawQuoting() {
  topBar();
  char l[32];
  dotsAnim(l, sizeof l, "quoting");
  text(SCR_W / 2 - textW("quoting...", 3) / 2, 54, l, 3, WHITE);
  textC(SCR_W / 2, 90, "asking NEAR Intents", 2, DIM);
  busyMascot(120);
  char p[20], t[40];
  priceStr(p, sizeof p);
  snprintf(t, sizeof t, "%s in %s", p, asset().symbol);
  textC(SCR_W / 2, 318, t, 2, WHITE);
  snprintf(t, sizeof t, "on %s", asset().chain);
  textC(SCR_W / 2, 342, t, 2, DIM);
  btn(80, 402, 160, 56, "cancel", A_CANCEL);
}

// exact token amount: one line, condensed if long, two lines if very long
static int amountLines(int y, const char *s) {
  if (textW(s, 2) <= 304) {
    textC(SCR_W / 2, y, s, 2, WHITE);
    return y + 23;
  }
  if (textNW(s, 2) <= 308) {
    textN(SCR_W / 2 - textNW(s, 2) / 2, y, s, 2, WHITE);
    return y + 23;
  }
  char a[24];
  snprintf(a, sizeof a, "%.21s", s);
  textN(SCR_W / 2 - textNW(a, 2) / 2, y, a, 2, WHITE);
  const char *rest = s + strlen(a);
  textN(SCR_W / 2 - textNW(rest, 2) / 2, y + 21, rest, 2, WHITE);
  return y + 44;
}

static void drawQuote() {
  topBar();
  char p[20];
  priceStr(p, sizeof p);
  textC(SCR_W / 2, 48, p, 3, WHITE);
  int qy = 78;
  int total = drawQr(SCR_W / 2, qy, qrPayload, 220, qrcodegen_Ecc_LOW);
  int y = qy + total + 8;
  const char *amt = q.amountInFmt[0] ? q.amountInFmt : "?";
  y = amountLines(y, amt);
  char t[48];
  snprintf(t, sizeof t, "%s on %s", asset().symbol, asset().chain);
  textC(SCR_W / 2, y, t, 2, WHITE);
  y += 23;
  feeLine(t, sizeof t);
  if (q.verified) strncat(t, " " G_CHECK, sizeof t - strlen(t) - 1);
  textC(SCR_W / 2, y, t, 2, DIM);
  y += 23;
  int32_t left = (int32_t)(deadlineMs - plat_millis());
  if (left < 0) left = 0;
  uint32_t s = (uint32_t)(left + 999) / 1000;
  snprintf(t, sizeof t, "expires in %lu:%02lu", (unsigned long)(s / 60), (unsigned long)(s % 60));
  textC(SCR_W / 2, y, t, 2, s < 60 ? ALERT : WHITE);
  btn(80, 420, 160, 50, "cancel", A_CANCEL);
}

static void drawWaiting() {
  topBar();
  textC(SCR_W / 2, 52, "payment seen", 3, WHITE);
  const char *what = payStatus == PayStatus::Processing ? "swapping to USDC" : "deposit seen";
  char l[32], full[32];
  dotsAnim(l, sizeof l, what);
  snprintf(full, sizeof full, "%s...", what);
  text(SCR_W / 2 - textW(full, 2) / 2, 86, l, 2, DIM);
  busyMascot(112);
  char p[20], t[40];
  priceStr(p, sizeof p);
  snprintf(t, sizeof t, "%s USDC to", p + 1);
  textC(SCR_W / 2, 284, t, 2, WHITE);
  char m[24];
  shorten(merchant, 19, m, sizeof m);
  textC(SCR_W / 2, 308, m, 2, WHITE);
  textC(SCR_W / 2, 340, "via NEAR Intents", 2, DIM);
  uint32_t s = (plat_millis() - paidAt) / 1000;
  snprintf(t, sizeof t, "%lu:%02lu", (unsigned long)(s / 60), (unsigned long)(s % 60));
  textC(SCR_W / 2, 364, t, 2, DIM);
  if (!demoPaying && s >= 60) btn(80, 412, 160, 52, "home", A_HOME);
}

static void drawPaid() {
  topBar();
  spriteMono(SCR_W / 2 - 30, 52, SPR_CHECK_BIG, 6, WHITE);
  textC(SCR_W / 2, 108, "paid!", 4, WHITE);
  char t[40];
  snprintf(t, sizeof t, "+%s USDC", received);
  textC(SCR_W / 2, 150, t, t[0] && strlen(t) > 13 ? 2 : 3, WHITE);
  char m[24];
  shorten(merchant, 16, m, sizeof m);
  snprintf(t, sizeof t, "to %s", m);
  textC(SCR_W / 2, 182, t, 2, DIM);
  int total = drawQr(SCR_W / 2, 208, receiptUrl, 150, qrcodegen_Ecc_LOW);
  textC(SCR_W / 2, 214 + total, "receipt", 2, DIM);
  spriteMono(SCR_W / 2 + textW("receipt", 2) / 2 + 8, 212 + total, SPR_RECEIPT, 2, DIM);
  btn(96, 412, 208, 56, "new sale", A_NEWSALE);
  peekMascot();
}

static void drawEnded() {
  topBar();
  textC(SCR_W / 2, 62, "x", 9, ALERT);
  const char *title = "expired";
  char msg[200];
  switch (endKind) {
    case EndKind::Expired:
      snprintf(msg, sizeof msg,
               "no payment before the deadline. a late payment is refunded to %s on NEAR Intents.", merchant);
      break;
    case EndKind::Refunded:
      title = "refunded";
      snprintf(msg, sizeof msg, "the swap did not go through. the funds went to %s on NEAR Intents.", merchant);
      break;
    case EndKind::Incomplete:
      title = "incomplete";
      snprintf(msg, sizeof msg, "less than the quote arrived. it is refunded to %s on NEAR Intents.", merchant);
      break;
    case EndKind::Failed:
      title = "failed";
      snprintf(msg, sizeof msg, "1Click reported an error. ref %.12s", q.correlationId);
      break;
  }
  textC(SCR_W / 2, 150, title, 3, ALERT);
  para(192, msg);
  btn(16, 402, 120, 56, "home", A_HOME);
  btn(148, 402, 156, 56, "new sale", A_NEWSALE);
}

static void drawError() {
  topBar();
  textC(SCR_W / 2, 62, "x", 9, ALERT);
  textC(SCR_W / 2, 150, errTitle, 3, ALERT);
  para(192, errMsg);
  btn(16, 402, 120, 56, G_ARROW_L " back", A_BACK);
  btn(148, 402, 156, 56, "retry", A_RETRY);
}

static void drawSettings() {
  topBar();
  textC(SCR_W / 2, 52, "settings", 3, WHITE);
  text(16, 92, "mode", 2, DIM);
  bool pd = pressed == A_MODE_DEMO, pl = pressed == A_MODE_LIVE;
  button(16, 114, 136, 52, !live || pd);
  textC(84, 132, "DEMO", 2, (!live || pd) ? BG : WHITE);
  addHit(12, 110, 144, 60, A_MODE_DEMO);
  button(168, 114, 136, 52, live || pl, live ? LIVE_RED : WHITE);
  textC(236, 132, "LIVE", 2, live ? WHITE : (pl ? BG : WHITE));
  addHit(164, 110, 144, 60, A_MODE_LIVE);

  text(16, 182, "merchant", 2, DIM);
  bool pm = pressed == A_MERCHANT;
  button(16, 204, 288, 52, pm);
  char m[24];
  shorten(merchant, 15, m, sizeof m);
  text(30, 222, m, 2, pm ? BG : WHITE);
  spriteMono(278, 220, SPR_CHEV_R, 2, pm ? BG : WHITE);
  addHit(12, 200, 296, 60, A_MERCHANT);

  text(16, 272, "wi-fi", 2, DIM);
  char w[40];
  const char *ssid = plat_wifi_ssid();
  switch (plat_wifi_state()) {
    case 0: snprintf(w, sizeof w, "not set up"); break;
    case 1: snprintf(w, sizeof w, "joining %.11s", ssid); break;
    default: snprintf(w, sizeof w, "%.17s " G_CHECK, ssid); break;
  }
  text(16, 294, w, 2, WHITE);
  text(16, 326, "1Click link", 2, DIM);
  const char *l = "none";
  if (plat_link() == Link::Wifi) l = "Wi-Fi";
  else if (plat_link() == Link::Usb) l = "USB companion";
  text(16, 348, l, 2, WHITE);
  text(16, 380, "fw " FW_VERSION, 2, DIM);
  btn(16, 412, 140, 56, G_ARROW_L " back", A_BACK);
}

static void drawLiveConfirm() {
  topBar();
  textC(SCR_W / 2, 54, "real money", 3, ALERT);
  char msg[240];
  snprintf(msg, sizeof msg,
           "in LIVE a sale is paid only when 1Click confirms the money arrived on mainnet. the Mac demo "
           "controller can't mark it paid. USDC goes to %s.",
           merchant);
  para(96, msg);
  btn(16, 402, 136, 56, "cancel", A_CANCEL);
  btn(168, 402, 136, 56, "go live", A_LIVE_YES, 2, ALERT);
}

static void drawMerchant() {
  topBar();
  textC(SCR_W / 2, 50, "merchant account", 2, DIM);
  frame(8, 74, 304, 42, 3, WHITE);
  const char *shown = kb;
  size_t n = strlen(kb);
  if (n > 17) shown = kb + n - 17;
  int x = text(18, 87, shown, 2, WHITE);
  rect(x + 1, 85, 3, 18, WHITE);  // cursor
  if (toast[0]) textC(SCR_W / 2, 124, toast, 2, ALERT);
  for (int i = 0; KB_CHARS[i]; i++) {
    int row = i / 10, col = i % 10;
    int kx = 6 + col * 31, ky = 148 + row * 54;
    char l[2] = {KB_CHARS[i], 0};
    bool pr = pressed == A_KEY0 + i;
    button(kx, ky, 29, 48, pr);
    textC(kx + 15, ky + 13, l, 2, pr ? BG : WHITE);
    addHit(kx - 1, ky - 2, 31, 52, (uint8_t)(A_KEY0 + i));
  }
  // delete sits after "_" in the last row
  int kx = 6 + 9 * 31, ky = 148 + 3 * 54;
  bool pr = pressed == A_KB_DEL;
  button(kx, ky, 29, 48, pr);
  textC(kx + 15, ky + 13, G_ARROW_L, 2, pr ? BG : WHITE);
  addHit(kx - 1, ky - 2, 31, 52, A_KB_DEL);
  btn(16, 384, 136, 56, "cancel", A_CANCEL);
  btn(168, 384, 136, 56, "save", A_KB_SAVE);
}

void app_render() {
  nhits = 0;
  clear(BG);
  switch (scr) {
    case Scr::Home: drawHome(); break;
    case Scr::Amount: drawAmount(); break;
    case Scr::Pay: drawPay(); break;
    case Scr::Quoting: drawQuoting(); break;
    case Scr::Quote: drawQuote(); break;
    case Scr::Waiting: drawWaiting(); break;
    case Scr::Paid: drawPaid(); break;
    case Scr::Ended: drawEnded(); break;
    case Scr::Error: drawError(); break;
    case Scr::Settings: drawSettings(); break;
    case Scr::LiveConfirm: drawLiveConfirm(); break;
    case Scr::Merchant: drawMerchant(); break;
  }
}

// ------------------------------------------------------------------ host view
static const char *scrName(Scr s) {
  switch (s) {
    case Scr::Home: return "home";
    case Scr::Amount: return "amount";
    case Scr::Pay: return "pay";
    case Scr::Quoting: return "quoting";
    case Scr::Quote: return "quote";
    case Scr::Waiting: return "waiting";
    case Scr::Paid: return "paid";
    case Scr::Ended: return "ended";
    case Scr::Error: return "error";
    case Scr::Settings: return "settings";
    case Scr::LiveConfirm: return "live_confirm";
    case Scr::Merchant: return "merchant";
  }
  return "?";
}

void app_state(JsonObject o) {
  o["screen"] = scrName(scr);
  o["mode"] = live ? "live" : "demo";
  o["merchant"] = merchant;
  char p[16];
  co_cents_str(cents, p, sizeof p);
  o["price"] = p;
  const char *link = "none";
  if (plat_link() == Link::Usb) link = "usb";
  else if (plat_link() == Link::Wifi) link = "wifi";
  o["link"] = link;
  if (scr == Scr::Quoting || scr == Scr::Quote || scr == Scr::Waiting || scr == Scr::Paid || scr == Scr::Ended ||
      scr == Scr::Error) {
    o["asset"] = asset().key;
    o["symbol"] = asset().symbol;
    o["chain"] = asset().chain;
  }
  if (scr == Scr::Quote || scr == Scr::Waiting || scr == Scr::Paid || scr == Scr::Ended) {
    o["amountIn"] = q.amountInFmt;
    o["amountInUsd"] = q.amountInUsd;
    o["verified"] = q.verified;
    o["dry"] = q.dry;
    o["depositAddress"] = q.depositAddress;
    if (q.correlationId[0]) o["correlationId"] = q.correlationId;
  }
  if (scr == Scr::Quote) {
    int32_t left = (int32_t)(deadlineMs - plat_millis());
    o["expiresIn"] = left > 0 ? (left + 999) / 1000 : 0;
    o["qr"] = qrPayload;
  }
  if (scr == Scr::Waiting || scr == Scr::Quote) o["status"] = co_status_name(payStatus);
  if (scr == Scr::Paid) {
    o["received"] = received;
    o["receipt"] = receiptUrl;
  }
  if (scr == Scr::Ended) {
    static const char *const k[] = {"expired", "refunded", "incomplete", "failed"};
    o["ended"] = k[(int)endKind];
  }
  if (scr == Scr::Error) {
    o["error"] = errTitle;
    o["message"] = errMsg;
  }
}

// ------------------------------------------------------------------ previews (simulator)
void app_debug_show(Scr s, int variant) {
  pressed = A_NONE;
  toast[0] = 0;
  live = false;
  cents = 1250;
  assetIdx = 2;  // ETH
  memset(&q, 0, sizeof q);
  // a real quote's numbers ($12.50 as ETH, 2026-11-14). The deposit address
  // is not valid hex, so wallets refuse the preview PNGs' QR codes.
  snprintf(q.amountInFmt, sizeof q.amountInFmt, "0.006935573608975032");
  snprintf(q.amountIn, sizeof q.amountIn, "6935573608975032");
  snprintf(q.amountInUsd, sizeof q.amountInUsd, "12.68");
  snprintf(q.depositAddress, sizeof q.depositAddress, "0xPREVIEW0nly0n0tAnAddress0PREVIEW0nly0n0");
  q.withdrawFee = 3902;
  q.appFeeBps = 20;
  q.verified = true;
  q.ok = true;
  switch (s) {
    case Scr::Quote:
      if (variant == 1) {  // USDC on Base
        assetIdx = 0;
        snprintf(q.amountInFmt, sizeof q.amountInFmt, "12.63");
        snprintf(q.amountIn, sizeof q.amountIn, "12630000");
        q.appFeeBps = 1;
      }
      startQuote();
      if (variant == 2) deadlineMs = plat_millis() + 42000;
      break;
    case Scr::Waiting:
      paidAt = plat_millis() - 7000;
      payStatus = variant ? PayStatus::Processing : PayStatus::KnownDepositTx;
      demoPaying = true;
      go(s);
      break;
    case Scr::Paid:
      paid(nullptr);
      break;
    case Scr::Ended:
      endKind = (EndKind)variant;
      go(s);
      break;
    case Scr::Error:
      snprintf(errTitle, sizeof errTitle, "no quote");
      snprintf(errMsg, sizeof errMsg, "Amount is too low for bridge, try at least 0.0001");
      go(s);
      break;
    case Scr::Settings:
      live = variant == 1;
      go(s);
      break;
    case Scr::Merchant:
      snprintf(kb, sizeof kb, "rythmn.near");
      go(s);
      break;
    case Scr::Amount:
      cents = variant ? 1250 : 0;
      go(s);
      break;
    case Scr::Home:
      live = variant == 1;
      go(s);
      break;
    default:
      go(s);
      break;
  }
}
