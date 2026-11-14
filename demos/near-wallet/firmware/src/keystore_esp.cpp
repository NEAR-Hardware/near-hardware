// Encrypted key storage in NVS.
//
//   key  = PBKDF2-HMAC-SHA256(PIN, salt, KS_ITERATIONS)        (32 bytes)
//   blob = AES-256-GCM(key, iv, aad = "nhw1" || pubkey,
//                      plaintext = BIP39 entropy (16) || ed25519 seed (32))
//
// NVS namespace "nhw": "pub" (32 bytes, public), "blob" (iters|salt|iv|tag|ct),
// "fails" (wrong PIN counter). The counter is bumped *before* each attempt and
// reset after a correct PIN, so pulling the power does not reset it. After
// KS_MAX_ATTEMPTS wrong PINs in a row the wallet is wiped.
#ifdef ARDUINO
#include <Arduino.h>
#include <Preferences.h>
#include <string.h>

#include "crypto_port.h"
#include "mbedtls/gcm.h"
#include "mbedtls/pkcs5.h"
#include "platform.h"

#define KS_ITERATIONS 20000
#define KS_MAX_ATTEMPTS 10

static Preferences prefs;
static bool opened = false;

struct Blob {
  uint32_t iters;
  uint8_t salt[16];
  uint8_t iv[12];
  uint8_t tag[16];
  uint8_t ct[48];
};

static void open() {
  if (!opened) opened = prefs.begin("nhw", false);
}

static bool deriveKey(const char *pin, const Blob &b, uint8_t key[32]) {
  return mbedtls_pkcs5_pbkdf2_hmac_ext(MBEDTLS_MD_SHA256, (const uint8_t *)pin, strlen(pin), b.salt, sizeof b.salt,
                                       b.iters, 32, key) == 0;
}

static void aad(const uint8_t pub[32], uint8_t out[36]) {
  memcpy(out, "nhw1", 4);
  memcpy(out + 4, pub, 32);
}

bool ks_has_wallet() {
  open();
  return prefs.getBytesLength("blob") == sizeof(Blob) && prefs.getBytesLength("pub") == 32;
}

bool ks_public_key(uint8_t pub[32]) {
  open();
  return prefs.getBytes("pub", pub, 32) == 32;
}

int ks_attempts_left() {
  open();
  int used = prefs.getUChar("fails", 0);
  return used >= KS_MAX_ATTEMPTS ? 0 : KS_MAX_ATTEMPTS - used;
}

bool ks_create(const uint8_t entropy[16], const uint8_t secret[32], const uint8_t pub[32], const char *pin) {
  open();
  Blob b;
  b.iters = KS_ITERATIONS;
  cp_random(b.salt, sizeof b.salt);
  cp_random(b.iv, sizeof b.iv);
  uint8_t key[32], pt[48], ad[36];
  bool ok = deriveKey(pin, b, key);
  memcpy(pt, entropy, 16);
  memcpy(pt + 16, secret, 32);
  aad(pub, ad);
  mbedtls_gcm_context g;
  mbedtls_gcm_init(&g);
  ok = ok && mbedtls_gcm_setkey(&g, MBEDTLS_CIPHER_ID_AES, key, 256) == 0 &&
       mbedtls_gcm_crypt_and_tag(&g, MBEDTLS_GCM_ENCRYPT, sizeof pt, b.iv, sizeof b.iv, ad, sizeof ad, pt, b.ct,
                                 sizeof b.tag, b.tag) == 0;
  mbedtls_gcm_free(&g);
  cp_zero(key, sizeof key);
  cp_zero(pt, sizeof pt);
  if (!ok) return false;
  prefs.putUChar("fails", 0);
  ok = prefs.putBytes("pub", pub, 32) == 32 && prefs.putBytes("blob", &b, sizeof b) == sizeof b;
  // read back to be sure the flash write stuck
  Blob check;
  ok = ok && prefs.getBytes("blob", &check, sizeof check) == sizeof check && memcmp(&check, &b, sizeof b) == 0;
  return ok;
}

void ks_wipe() {
  open();
  Blob zero;
  memset(&zero, 0, sizeof zero);
  prefs.putBytes("blob", &zero, sizeof zero);  // overwrite before erasing
  prefs.clear();
}

KsResult ks_unlock(const char *pin, uint8_t entropy[16], uint8_t secret[32]) {
  open();
  Blob b;
  uint8_t pub[32];
  if (prefs.getBytes("blob", &b, sizeof b) != sizeof b || !ks_public_key(pub)) return KS_ERROR;
  uint8_t used = prefs.getUChar("fails", 0);
  if (used >= KS_MAX_ATTEMPTS) {
    ks_wipe();
    return KS_WIPED;
  }
  prefs.putUChar("fails", used + 1);  // count first, then try

  uint8_t key[32], pt[48], ad[36];
  bool ok = deriveKey(pin, b, key);
  aad(pub, ad);
  mbedtls_gcm_context g;
  mbedtls_gcm_init(&g);
  ok = ok && mbedtls_gcm_setkey(&g, MBEDTLS_CIPHER_ID_AES, key, 256) == 0 &&
       mbedtls_gcm_auth_decrypt(&g, sizeof b.ct, b.iv, sizeof b.iv, ad, sizeof ad, b.tag, sizeof b.tag, b.ct, pt) == 0;
  mbedtls_gcm_free(&g);
  cp_zero(key, sizeof key);
  if (!ok) {
    cp_zero(pt, sizeof pt);
    if (used + 1 >= KS_MAX_ATTEMPTS) {
      ks_wipe();
      return KS_WIPED;
    }
    return KS_WRONG_PIN;
  }
  prefs.putUChar("fails", 0);
  memcpy(entropy, pt, 16);
  memcpy(secret, pt + 16, 32);
  cp_zero(pt, sizeof pt);
  return KS_OK;
}
#endif

#ifdef ARDUINO
// How long one PIN key derivation takes on this chip (for tuning KS_ITERATIONS)
uint32_t ks_bench_ms() {
  Blob b;
  memset(&b, 0, sizeof b);
  b.iters = KS_ITERATIONS;
  uint8_t key[32];
  uint32_t t0 = millis();
  deriveKey("000000", b, key);
  cp_zero(key, sizeof key);
  return millis() - t0;
}
#endif
