// crypto_port.h on the Mac, with libsodium (brew install libsodium)
#include <sodium.h>
#include <string.h>

#include "../src/crypto_port.h"

void cp_sha256(const uint8_t *data, size_t len, uint8_t out[32]) { crypto_hash_sha256(out, data, len); }

void cp_hmac_sha512(const uint8_t *key, size_t klen, const uint8_t *msg, size_t mlen, uint8_t out[64]) {
  crypto_auth_hmacsha512_state st;
  crypto_auth_hmacsha512_init(&st, key, klen);
  crypto_auth_hmacsha512_update(&st, msg, mlen);
  crypto_auth_hmacsha512_final(&st, out);
}

// RFC 8018 PBKDF2 with HMAC-SHA512, written out because libsodium has none
void cp_pbkdf2_sha512(const uint8_t *pw, size_t pwlen, const uint8_t *salt, size_t saltlen, uint32_t iters,
                      uint8_t *out, size_t outlen) {
  uint8_t U[64], T[64], blk[256];
  for (uint32_t i = 1; outlen; i++) {
    memcpy(blk, salt, saltlen);
    blk[saltlen] = (uint8_t)(i >> 24);
    blk[saltlen + 1] = (uint8_t)(i >> 16);
    blk[saltlen + 2] = (uint8_t)(i >> 8);
    blk[saltlen + 3] = (uint8_t)i;
    cp_hmac_sha512(pw, pwlen, blk, saltlen + 4, U);
    memcpy(T, U, 64);
    for (uint32_t k = 1; k < iters; k++) {
      cp_hmac_sha512(pw, pwlen, U, 64, U);
      for (int j = 0; j < 64; j++) T[j] ^= U[j];
    }
    size_t n = outlen < 64 ? outlen : 64;
    memcpy(out, T, n);
    out += n;
    outlen -= n;
  }
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

void cp_random(uint8_t *out, size_t len) { randombytes_buf(out, len); }
void cp_zero(void *p, size_t len) { sodium_memzero(p, len); }
