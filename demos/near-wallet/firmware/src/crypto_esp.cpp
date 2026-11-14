// crypto_port.h on the ESP32-S3: mbedTLS (hardware SHA) for hashes and
// PBKDF2, libsodium (bundled with ESP-IDF) for ed25519, hardware RNG.
#ifdef ARDUINO
#include <Arduino.h>
#include <sodium.h>
#include <string.h>

#include "bootloader_random.h"
#include "crypto_port.h"
#include "esp_random.h"
#include "esp_timer.h"
#include "mbedtls/md.h"
#include "mbedtls/pkcs5.h"
#include "mbedtls/sha256.h"

void cp_sha256(const uint8_t *data, size_t len, uint8_t out[32]) { mbedtls_sha256(data, len, out, 0); }

void cp_hmac_sha512(const uint8_t *key, size_t klen, const uint8_t *msg, size_t mlen, uint8_t out[64]) {
  mbedtls_md_hmac(mbedtls_md_info_from_type(MBEDTLS_MD_SHA512), key, klen, msg, mlen, out);
}

void cp_pbkdf2_sha512(const uint8_t *pw, size_t pwlen, const uint8_t *salt, size_t saltlen, uint32_t iters,
                      uint8_t *out, size_t outlen) {
  mbedtls_pkcs5_pbkdf2_hmac_ext(MBEDTLS_MD_SHA512, pw, pwlen, salt, saltlen, iters, (uint32_t)outlen, out);
}

void cp_ed25519_public(const uint8_t seed[32], uint8_t pub[32]) {
  uint8_t sk[64];
  crypto_sign_seed_keypair(pub, sk, seed);
  sodium_memzero(sk, sizeof sk);
}

void cp_ed25519_sign(const uint8_t seed[32], const uint8_t *msg, size_t len, uint8_t sig[64]) {
  uint8_t pk[32], sk[64];
  crypto_sign_seed_keypair(pk, sk, seed);
  crypto_sign_detached(sig, nullptr, msg, len, sk);
  sodium_memzero(sk, sizeof sk);
}

bool cp_ed25519_verify(const uint8_t pub[32], const uint8_t *msg, size_t len, const uint8_t sig[64]) {
  return crypto_sign_verify_detached(sig, msg, len, pub) == 0;
}

// The S3's RNG is only a true RNG while an entropy source runs: Wi-Fi/BT, or
// the SAR ADC noise source that bootloader_random_enable() switches on. Wi-Fi
// and BT are off in this firmware, so turn the ADC source on while sampling,
// pool 64 bytes plus timer jitter, and hash the pool.
void cp_random(uint8_t *out, size_t len) {
  uint8_t pool[64 + 8 + 4];
  bootloader_random_enable();
  for (int i = 0; i < 64; i += 4) {
    uint32_t r = esp_random();
    memcpy(pool + i, &r, 4);
    delayMicroseconds(50 + (r & 63));
  }
  bootloader_random_disable();
  int64_t t = esp_timer_get_time();
  memcpy(pool + 64, &t, 8);
  for (uint32_t ctr = 0; len; ctr++) {
    memcpy(pool + 72, &ctr, 4);
    uint8_t h[32];
    mbedtls_sha256(pool, sizeof pool, h, 0);
    size_t n = len < 32 ? len : 32;
    memcpy(out, h, n);
    sodium_memzero(h, sizeof h);
    out += n;
    len -= n;
  }
  sodium_memzero(pool, sizeof pool);
}

void cp_zero(void *p, size_t len) { sodium_memzero(p, len); }
#endif
