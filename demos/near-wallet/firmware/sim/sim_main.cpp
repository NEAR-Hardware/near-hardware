// Host simulator: runs the wallet crypto tests and renders every screen of the
// firmware UI to PNG (../screens/), using the exact firmware drawing code.
//
//   make -C firmware/sim            # build + test + render
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <zlib.h>
#include <sodium.h>

#include "../src/app.h"
#include "../src/crypto_port.h"
#include "../src/gfx.h"
#include "../src/platform.h"
#include "../src/wallet_core.h"

// ------------------------------------------------------------------ fake platform
static uint32_t fakeMillis = 100000;
static bool fakeWallet = false, fakeLinked = false;
static const char *fakeBalance = "", *fakePrice = "";
uint32_t plat_millis() { return fakeMillis; }
bool plat_clock(int *h, int *m) { *h = 0; *m = 30; return true; }  // 12:30AM like the designs
void plat_vibrate(int) {}
void plat_flush() {}
bool plat_host_linked() { return fakeLinked; }
const char *plat_balance() { return fakeBalance; }
const char *plat_price() { return fakePrice; }

static uint8_t testSecret[32], testPub[32];
bool ks_has_wallet() { return fakeWallet; }
bool ks_public_key(uint8_t pub[32]) { memcpy(pub, testPub, 32); return fakeWallet; }
bool ks_create(const uint8_t *, const uint8_t *, const uint8_t *, const char *) { return true; }
KsResult ks_unlock(const char *, uint8_t *, uint8_t *) { return KS_OK; }
int ks_attempts_left() { return 9; }
void ks_wipe() {}
void host_sign_done(const uint8_t *) {}
void host_sign_failed(const char *e) { printf("  host_sign_failed(%s)\n", e); }

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

static Review sampleTx, sampleMsg;

// samples.txt is written by make_samples.mjs with near-api-js, using the
// public test phrase: "tx <b64> <expected sig b64>" / "msg <message> ..."
static void runSamples() {
  FILE *f = fopen("samples.txt", "r");
  if (!f) { printf("  (no samples.txt, run: node make_samples.mjs)\n"); return; }
  static char line[16384];
  int n = 0;
  while (fgets(line, sizeof line, f)) {
    line[strcspn(line, "\n")] = 0;
    char *kind = strtok(line, "\t");
    if (!kind) continue;
    if (!strcmp(kind, "tx")) {
      char *name = strtok(nullptr, "\t"), *b64 = strtok(nullptr, "\t"), *want = strtok(nullptr, "\t");
      static uint8_t tx[8192];
      int len = b64_decode(b64, strlen(b64), tx, sizeof tx);
      Review r;
      bool ok = near_review_tx(tx, len, testPub, &r);
      uint8_t sig[64];
      cp_ed25519_sign(testSecret, r.digest, 32, sig);
      char got[100];
      b64_encode(sig, 64, got, sizeof got);
      char what[160];
      snprintf(what, sizeof what, "tx %-14s decoded=%d keyMine=%d signature matches near-api-js", name, ok, !r.keyMismatch);
      CHECK(ok && !r.keyMismatch && !strcmp(got, want), what);
      for (int i = 0; i < r.nlines; i++) printf("         %s%s\n", r.style[i] == L_LABEL ? "  " : "", r.lines[i]);
      if (n++ == 0) sampleTx = r;
    } else if (!strcmp(kind, "msg")) {
      char *message = strtok(nullptr, "\t"), *recipient = strtok(nullptr, "\t"), *nonceB64 = strtok(nullptr, "\t"),
           *want = strtok(nullptr, "\t");
      uint8_t nonce[32];
      b64_decode(nonceB64, strlen(nonceB64), nonce, 32);
      Review r;
      near_review_message(message, recipient, nonce, nullptr, &r);
      uint8_t sig[64];
      cp_ed25519_sign(testSecret, r.digest, 32, sig);
      char got[100];
      b64_encode(sig, 64, got, sizeof got);
      CHECK(!strcmp(got, want), "NEP-413 signature matches near-api-js");
      sampleMsg = r;
    }
  }
  fclose(f);
}

int main(int argc, char **argv) {
  if (argc > 1) outDir = argv[1];
  if (sodium_init() < 0) return 1;
  static uint16_t fbmem[SCR_W * SCR_H];
  gfx::fb = fbmem;

  printf("wallet core tests\n");
  char got[64];
  CHECK(wallet_selftest(got), "test vector: phrase -> " SELFTEST_PUBKEY);
  near_key_from_mnemonic(SELFTEST_PHRASE, testSecret, testPub);
  char acc[65];
  near_implicit_account(testPub, acc);
  CHECK(!strcmp(acc, "0c91f6106ff835c0195d5388565a2d69e25038a7e23d26198f85caf6594117ec"), "implicit account id");
  uint8_t e7f[16];
  memset(e7f, 0x7f, 16);
  char m[120];
  bip39_mnemonic(e7f, m, sizeof m);
  CHECK(!strcmp(m, "legal winner thank year wave sausage worth useful legal winner thank yellow"), "BIP39 vector 7f7f..");
  uint8_t e80[16];
  memset(e80, 0x80, 16);
  bip39_mnemonic(e80, m, sizeof m);
  CHECK(!strcmp(m, "letter advice cage absurd amount doctor acoustic avoid letter advice cage above"), "BIP39 vector 8080..");
  uint8_t zero2[3] = {0, 0, 1};
  char b58[16];
  b58_encode(zero2, 3, b58, sizeof b58);
  CHECK(!strcmp(b58, "112"), "base58 leading zeros");
  uint8_t one[16] = {0};
  one[0] = 1;
  char amt[48];
  near_format_amount(one, amt, sizeof amt);
  CHECK(!strcmp(amt, "0.000000000000000000000001"), "1 yocto formats exactly");
  near_format_amount_str("1500000000000000000000000", amt, sizeof amt);
  CHECK(!strcmp(amt, "1.5"), "1.5 NEAR formats");
  runSamples();

  printf("rendering screens to %s\n", outDir);
  fakeWallet = false;
  app_init();
  app_debug_show(Scr::Home, 1); shot("01-home");
  app_debug_show(Scr::Home, 0); shot("01b-home-how");
  app_debug_show(Scr::Home, 2); shot("01c-home-about");
  app_debug_show(Scr::Gen, 0); shot("02-generating");
  app_debug_show(Scr::Gen, 1); shot("02b-generating");
  app_debug_show(Scr::NoteSeed, 0); shot("03-note-seed");
  app_debug_show(Scr::Word, 0); shot("04-word-01");
  app_debug_show(Scr::Word, 11); shot("04b-word-12");
  app_debug_show(Scr::NotePin, 0); shot("05-note-pin");
  app_debug_show(Scr::Pin, 0); shot("06-pin-create");
  app_debug_show(Scr::Working, 0); shot("06b-encrypting");
  app_debug_show(Scr::Settings, 0); shot("09b-settings-no-wallet");
  app_debug_show(Scr::SelfTest, 0); shot("09c-self-test");

  fakeWallet = true;
  fakeBalance = "1.0000";
  fakePrice = "5.20";
  fakeLinked = true;
  app_debug_show(Scr::Done, 0); shot("07-vault-ready");
  app_debug_show(Scr::Vault, 0); shot("08-vault");
  app_debug_show(Scr::Vault, 1); shot("08b-vault-account");
  app_debug_show(Scr::Vault, 2); shot("08c-vault-menu");
  app_debug_show(Scr::Settings, 0); shot("09-settings");
  app_debug_show(Scr::WipeConfirm, 0); shot("09d-wipe");
  app_debug_show(Scr::Locked, 0); shot("10-locked");
  app_debug_show(Scr::Pin, 2); shot("10b-pin-unlock");
  if (sampleTx.nlines) {
    snprintf(sampleTx.network, sizeof sampleTx.network, NEAR_NETWORK);
    app_present(sampleTx, 60000);
    shot("11-sign-tx");
  }
  app_debug_show(Scr::Pin, 3); shot("11b-pin-approve");
  if (sampleMsg.nlines) {
    host_sign_failed("(preview reset)");
    snprintf(sampleMsg.network, sizeof sampleMsg.network, NEAR_NETWORK);
    app_cancel("preview");
    app_present(sampleMsg, 60000);
    shot("12-sign-message");
  }
  app_debug_show(Scr::Result, 0); shot("13-signed");
  app_debug_show(Scr::Result, 1); shot("13b-rejected");

  printf(failures ? "%d FAILED\n" : "all tests passed\n", failures);
  return failures ? 1 : 0;
}
