// Host simulator: tests the 1Click logic (amounts, quote bodies, payment URIs,
// quote signatures) and renders every screen of the till to PNG (../screens/)
// with the exact firmware drawing code.
//
//   make -C firmware/sim                     # build + test + render
//   firmware/sim/sim --verify a.json b.json  # quote signature check, as on the board
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <zlib.h>
#include <sodium.h>

#include "../src/app.h"
#include "../src/checkout.h"
#include "../src/gfx.h"
#include "../src/platform.h"

// ------------------------------------------------------------------ fake platform
static uint32_t fakeMillis = 100000;
static Link fakeLink = Link::Usb;
uint32_t plat_millis() { return fakeMillis; }
int64_t plat_unix() { return 1794700000; }
bool plat_clock(int *h, int *m) { *h = 0; *m = 30; return true; }  // 12:30AM like the designs
Link plat_link() { return fakeLink; }
bool plat_usb_linked() { return fakeLink == Link::Usb; }
int plat_wifi_state() { return 0; }
const char *plat_wifi_ssid() { return ""; }
void plat_save_settings(bool, const char *) {}
void plat_load_settings(bool *live, char *m, size_t cap) { *live = false; snprintf(m, cap, "rythmn.near"); }
static uint32_t nextRid = 1;
static char lastBody[1024];
uint32_t net_request(bool, const char *, const char *body) {
  snprintf(lastBody, sizeof lastBody, "%s", body ? body : "");
  return nextRid++;
}
void host_notify() {}

// ------------------------------------------------------------------ PNG
static void put32(FILE *f, uint32_t v) {
  uint8_t b[4] = {(uint8_t)(v >> 24), (uint8_t)(v >> 16), (uint8_t)(v >> 8), (uint8_t)v};
  fwrite(b, 1, 4, f);
}
static void chunk(FILE *f, const char *type, const uint8_t *data, uint32_t len) {
  put32(f, len);
  fwrite(type, 1, 4, f);
  if (len) fwrite(data, 1, len, f);
  uint32_t crc = crc32(0, (const Bytef *)type, 4);
  if (len) crc = crc32(crc, data, len);
  put32(f, crc);
}
static void writePng(const char *path) {
  size_t rawLen = (size_t)SCR_H * (1 + SCR_W * 3);
  uint8_t *raw = (uint8_t *)malloc(rawLen);
  for (int y = 0; y < SCR_H; y++) {
    uint8_t *row = raw + y * (1 + SCR_W * 3);
    row[0] = 0;
    for (int x = 0; x < SCR_W; x++) {
      uint16_t c = gfx::fb[y * SCR_W + x];
      uint8_t r = (c >> 11) & 31, g = (c >> 5) & 63, b = c & 31;
      row[1 + x * 3] = (uint8_t)((r << 3) | (r >> 2));
      row[2 + x * 3] = (uint8_t)((g << 2) | (g >> 4));
      row[3 + x * 3] = (uint8_t)((b << 3) | (b >> 2));
    }
  }
  uLongf zlen = compressBound(rawLen);
  uint8_t *z = (uint8_t *)malloc(zlen);
  compress2(z, &zlen, raw, rawLen, 9);
  FILE *f = fopen(path, "wb");
  if (!f) { perror(path); exit(1); }
  static const uint8_t sig[8] = {0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n'};
  fwrite(sig, 1, 8, f);
  uint8_t ihdr[13] = {0, 0, (uint8_t)(SCR_W >> 8), (uint8_t)SCR_W, 0, 0, (uint8_t)(SCR_H >> 8), (uint8_t)SCR_H, 8, 2, 0, 0, 0};
  chunk(f, "IHDR", ihdr, 13);
  chunk(f, "IDAT", z, (uint32_t)zlen);
  chunk(f, "IEND", nullptr, 0);
  fclose(f);
  free(raw);
  free(z);
}

static const char *outDir = "../../screens";
static void shot(const char *name) {
  app_render();
  char path[512];
  snprintf(path, sizeof path, "%s/%s.png", outDir, name);
  writePng(path);
}

// ------------------------------------------------------------------ tests
static int failures = 0;
#define CHECK(cond, what)                                        \
  do {                                                           \
    if (cond) printf("  ok   %s\n", what);                       \
    else { printf("  FAIL %s\n", what); failures++; }            \
  } while (0)

static char *readFile(const char *path, size_t *len) {
  FILE *f = fopen(path, "rb");
  if (!f) return nullptr;
  fseek(f, 0, SEEK_END);
  long n = ftell(f);
  fseek(f, 0, SEEK_SET);
  char *b = (char *)malloc(n + 1);
  *len = fread(b, 1, n, f);
  b[*len] = 0;
  fclose(f);
  return b;
}

static void tests() {
  printf("checkout core tests\n");
  char out[256];
  co_units_to_decimal("2774229443590013", 18, out, sizeof out);
  CHECK(!strcmp(out, "0.002774229443590013"), "units 2774229443590013 / 1e18 = 0.002774229443590013");
  co_units_to_decimal("5055431", 6, out, sizeof out);
  CHECK(!strcmp(out, "5.055431"), "units 5055431 / 1e6 = 5.055431");
  co_units_to_decimal("5000000", 6, out, sizeof out);
  CHECK(!strcmp(out, "5"), "units 5000000 / 1e6 = 5");
  co_units_to_decimal("7753", 8, out, sizeof out);
  CHECK(!strcmp(out, "0.00007753"), "units 7753 / 1e8 = 0.00007753");
  co_units_to_decimal("1626716820563058924938514", 24, out, sizeof out);
  CHECK(!strcmp(out, "1.626716820563058924938514"), "units wNEAR 24 decimals");
  co_cents_str(1250, out, sizeof out);
  CHECK(!strcmp(out, "12.50"), "cents 1250 = 12.50");
  co_iso8601(1794700000, out, sizeof out);
  CHECK(!strcmp(out, "2026-11-14T23:46:40.000Z"), "iso8601 1794700000");
  CHECK(co_parse_iso8601("2026-11-14T23:46:40.123Z") == 1794700000, "parse iso8601 with millis");
  CHECK(co_valid_account("rythmn.near") && co_valid_account("a-b_c.near") &&
            co_valid_account("17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1"),
        "valid NEAR accounts");
  CHECK(!co_valid_account("Rythmn.near") && !co_valid_account(".near") && !co_valid_account("a..near") &&
            !co_valid_account("a") && !co_valid_account("near."),
        "invalid NEAR accounts rejected");

  // base58 round trip with 1Click's signer key
  uint8_t pub[32];
  int pl = co_b58_decode(&ONECLICK_SIGNER[8], pub, sizeof pub);
  char back[64];
  co_b58_encode(pub, 32, back, sizeof back);
  CHECK(pl == 32 && !strcmp(back, &ONECLICK_SIGNER[8]), "base58 round trip of the 1Click signer key");
  uint8_t z[3] = {0, 0, 1};
  co_b58_encode(z, 3, back, sizeof back);
  CHECK(!strcmp(back, "112"), "base58 keeps leading zero bytes");

  // quote request body
  char body[768];
  co_quote_body(body, sizeof body, PAY_ASSETS[0], 1250, "rythmn.near", true, "2026-11-14T22:41:40.000Z");
  printf("         %s\n", body);
  CHECK(strstr(body, "\"amount\":\"12500000\"") && strstr(body, "\"swapType\":\"EXACT_OUTPUT\"") &&
            strstr(body, "\"refundType\":\"INTENTS\"") && strstr(body, "\"refundTo\":\"rythmn.near\"") &&
            strstr(body, "\"destinationAsset\":\"" USDC_NEAR_ASSET "\"") && strstr(body, "\"dry\":true"),
        "quote body: EXACT_OUTPUT $12.50 USDC to rythmn.near, refunds to INTENTS");

  // payment URIs
  Quote q;
  memset(&q, 0, sizeof q);
  snprintf(q.depositAddress, sizeof q.depositAddress, "0x76b4c56085ED136a8744D52bE956396624a730E8");
  snprintf(q.amountIn, sizeof q.amountIn, "5055431");
  co_payment_uri(out, sizeof out, PAY_ASSETS[co_asset_index("usdc_base")], q);
  printf("         %s\n", out);
  CHECK(!strcmp(out, "ethereum:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913@8453/transfer?address="
                     "0x76b4c56085ED136a8744D52bE956396624a730E8&uint256=5055431"),
        "EIP-681 USDC on Base");
  snprintf(q.amountIn, sizeof q.amountIn, "2774229443590013");
  co_payment_uri(out, sizeof out, PAY_ASSETS[co_asset_index("eth")], q);
  printf("         %s\n", out);
  CHECK(!strcmp(out, "ethereum:0x76b4c56085ED136a8744D52bE956396624a730E8@1?value=2774229443590013"),
        "EIP-681 ETH on Ethereum");
  snprintf(q.depositAddress, sizeof q.depositAddress, "bc1qexampleexampleexampleexample0000000");
  snprintf(q.amountIn, sizeof q.amountIn, "7753");
  co_payment_uri(out, sizeof out, PAY_ASSETS[co_asset_index("btc")], q);
  printf("         %s\n", out);
  CHECK(!strcmp(out, "bitcoin:bc1qexampleexampleexampleexample0000000?amount=0.00007753"), "BIP-21 BTC");
  snprintf(q.depositAddress, sizeof q.depositAddress, "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin");
  snprintf(q.amountIn, sizeof q.amountIn, "69691865");
  co_payment_uri(out, sizeof out, PAY_ASSETS[co_asset_index("sol")], q);
  printf("         %s\n", out);
  CHECK(!strcmp(out, "solana:9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin?amount=0.069691865&label=NEAR%20Checkout"),
        "Solana Pay SOL");

  // recorded 1Click answers (written by tools/check-live.mjs), if present
  const char *samples[] = {"../../tools/fixtures/quote-dry.json", "../../tools/fixtures/quote-live.json"};
  for (const char *path : samples) {
    size_t len;
    char *b = readFile(path, &len);
    if (!b) { printf("  (no %s yet, run tools/check-live.mjs)\n", path); continue; }
    Quote pq;
    bool ok = co_parse_quote(201, b, len, pq);
    char what[200];
    snprintf(what, sizeof what, "%s parses and its 1Click signature verifies (amountIn %s, deposit %s)", path,
             pq.amountInFmt, pq.depositAddress[0] ? pq.depositAddress : "-");
    CHECK(ok && pq.verified, what);
    // the countdown is the request's deadline (15 min), not quote.deadline (days later)
    if (pq.inactiveIso[0]) CHECK(pq.deadline > 0 && pq.deadline < co_parse_iso8601(pq.inactiveIso), "countdown uses the request deadline, not the address-inactive time");
    // flip one character of the deposit address / amount: must fail
    char *hit = strstr(b, pq.depositAddress[0] ? pq.depositAddress : pq.amountIn);
    if (hit) {
      hit[3] = hit[3] == '1' ? '2' : '1';
      CHECK(!co_verify_quote_json(b, len), "the same answer with one character changed fails the check");
    }
    free(b);
  }
  StatusInfo st;
  const char *sb = "{\"status\":\"SUCCESS\",\"swapDetails\":{\"amountOutFormatted\":\"12.5\",\"destinationChainTxHashes\":[{\"hash\":\"abc\",\"explorerUrl\":\"x\"}]}}";
  co_parse_status(200, sb, strlen(sb), st);
  CHECK(st.st == PayStatus::Success && !strcmp(st.amountOutFmt, "12.5") && !strcmp(st.destTx, "abc"),
        "status SUCCESS parses");
  co_parse_status(404, "{\"message\":\"not found\"}", 22, st);
  CHECK(st.st == PayStatus::NotFound, "status 404 = not found");
}

// ------------------------------------------------------------------ screens
static void screens() {
  printf("rendering screens to %s\n", outDir);
  app_init();
  struct { Scr s; int v; const char *name; } list[] = {
      {Scr::Home, 0, "01-home"},
      {Scr::Amount, 1, "02-price"},
      {Scr::Pay, 0, "03-choose-token"},
      {Scr::Quoting, 0, "04-quoting"},
      {Scr::Quote, 0, "05-quote-eth"},
      {Scr::Quote, 1, "05b-quote-usdc-base"},
      {Scr::Quote, 2, "05c-quote-expiring"},
      {Scr::Waiting, 0, "06-payment-seen"},
      {Scr::Waiting, 1, "06b-swapping"},
      {Scr::Paid, 0, "07-paid"},
      {Scr::Ended, 0, "08-expired"},
      {Scr::Ended, 1, "08b-refunded"},
      {Scr::Error, 0, "09-no-quote"},
      {Scr::Settings, 0, "10-settings-demo"},
      {Scr::LiveConfirm, 0, "11-live-confirm"},
      {Scr::Settings, 1, "12-settings-live"},
      {Scr::Merchant, 0, "13-merchant"},
  };
  for (auto &e : list) {
    app_debug_show(e.s, e.v);
    shot(e.name);
    printf("  %s\n", e.name);
  }
}

int main(int argc, char **argv) {
  if (sodium_init() < 0) return 1;
  static uint16_t fbmem[SCR_W * SCR_H];
  gfx::fb = fbmem;
  if (argc > 1 && !strcmp(argv[1], "--verify")) {
    int bad = 0;
    for (int i = 2; i < argc; i++) {
      size_t len;
      char *b = readFile(argv[i], &len);
      bool v = b && co_verify_quote_json(b, len);
      printf("%s %s\n", v ? "true " : "false", argv[i]);
      bad += !v;
      free(b);
    }
    return bad ? 1 : 0;
  }
  if (argc > 1) outDir = argv[1];
  tests();
  screens();
  printf(failures ? "\n%d FAILED\n" : "\nall tests passed\n", failures);
  return failures ? 1 : 0;
}
