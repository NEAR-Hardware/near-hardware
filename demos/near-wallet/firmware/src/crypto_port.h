// Crypto primitives the wallet needs. crypto_esp.cpp implements them with
// mbedTLS (hardware SHA/AES) + libsodium on the watch; sim/crypto_host.cpp
// implements them with libsodium on the Mac so the same wallet code can be
// tested on the host.
#pragma once
#include <stddef.h>
#include <stdint.h>

void cp_sha256(const uint8_t *data, size_t len, uint8_t out[32]);
void cp_hmac_sha512(const uint8_t *key, size_t klen, const uint8_t *msg, size_t mlen, uint8_t out[64]);
void cp_pbkdf2_sha512(const uint8_t *pw, size_t pwlen, const uint8_t *salt, size_t saltlen,
                      uint32_t iters, uint8_t *out, size_t outlen);
void cp_ed25519_public(const uint8_t seed[32], uint8_t pub[32]);
void cp_ed25519_sign(const uint8_t seed[32], const uint8_t *msg, size_t len, uint8_t sig[64]);
bool cp_ed25519_verify(const uint8_t pub[32], const uint8_t *msg, size_t len, const uint8_t sig[64]);
// True random bytes (hardware RNG on the watch)
void cp_random(uint8_t *out, size_t len);
void cp_zero(void *p, size_t len);
