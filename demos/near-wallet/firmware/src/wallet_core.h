// Portable wallet logic: BIP39, SLIP-10 ed25519, NEAR encodings, Borsh
// transaction decoding and NEP-413. No hardware access, no storage.
#pragma once
#include <stddef.h>
#include <stdint.h>

// ---- encodings
// Base58 (Bitcoin alphabet). Returns length written (without NUL) or -1.
int b58_encode(const uint8_t *in, size_t len, char *out, size_t outsz);
// Base64 (standard alphabet, padded). Returns bytes written or -1.
int b64_encode(const uint8_t *in, size_t len, char *out, size_t outsz);
int b64_decode(const char *in, size_t len, uint8_t *out, size_t outsz);
void hex_encode(const uint8_t *in, size_t len, char *out);

// ---- BIP39 / SLIP-10
// 128-bit entropy -> 12 word indices (11 bits each, last 4 bits = checksum)
void bip39_indices(const uint8_t entropy[16], uint16_t idx[12]);
const char *bip39_word(uint16_t idx);
// Space separated mnemonic for the entropy. out needs >= 12*9 bytes.
void bip39_mnemonic(const uint8_t entropy[16], char *out, size_t outsz);
// Mnemonic -> 64-byte seed (PBKDF2-HMAC-SHA512, 2048 rounds, salt "mnemonic")
void bip39_seed(const char *mnemonic, uint8_t seed[64]);
// SLIP-10 ed25519 private key for m/44'/397'/0' (all hardened), as NEAR wallets do
void slip10_near_key(const uint8_t seed[64], uint8_t key[32]);
// The whole chain: entropy -> ed25519 secret seed + public key
void near_key_from_entropy(const uint8_t entropy[16], uint8_t secret[32], uint8_t pub[32]);
void near_key_from_mnemonic(const char *mnemonic, uint8_t secret[32], uint8_t pub[32]);

// "ed25519:<base58>" (out >= 60 bytes) and the 64-hex implicit account (out >= 65)
void near_pubkey_str(const uint8_t pub[32], char *out);
void near_implicit_account(const uint8_t pub[32], char *out);
// "0c91f6…4117ec" style short form (out >= 16)
void near_short_account(const char *account, char *out, size_t outsz);

// yoctoNEAR (u128, little endian 16 bytes) -> exact NEAR amount, trailing zeros trimmed
void near_format_amount(const uint8_t yocto_le[16], char *out, size_t outsz);
// decimal string of yocto -> same format
bool near_format_amount_str(const char *yocto, char *out, size_t outsz);

// ---- what the watch shows before signing
#define REVIEW_MAX_LINES 96
#define REVIEW_COLS 21
enum LineStyle : uint8_t { L_VALUE = 0, L_LABEL = 1, L_HEAD = 2, L_WARN = 3 };
struct Review {
  bool isMessage;
  bool keyMismatch;        // tx public key is not this watch's key
  bool headerOk;           // signer, key, nonce, receiver and block hash parsed
  char network[12];
  char signer[65];
  int nlines;
  char lines[REVIEW_MAX_LINES][40];
  uint8_t style[REVIEW_MAX_LINES];
  uint8_t digest[32];      // the 32 bytes that get signed
};

// Decode a Borsh NEAR transaction for review. Always fills r->digest with
// sha256(tx). Returns false if the bytes could not be decoded; the review then
// shows the hash only.
bool near_review_tx(const uint8_t *tx, size_t len, const uint8_t mypub[32], Review *r);
// NEP-413: digest = sha256(borsh(2^31+413) || borsh(payload))
bool near_review_message(const char *message, const char *recipient, const uint8_t nonce[32],
                         const char *callbackUrl, Review *r);

// Self-test: derive from the fixed phrase in the task and compare with the
// known public key. Nothing is stored.
#define SELFTEST_PHRASE "shoot island position soft burden budget tooth cruel issue economy destroy above"
#define SELFTEST_PUBKEY "ed25519:r4yuiZE45mzeZAENDEF2pWeFBJkW8mQYGx3rU46zCqh"
bool wallet_selftest(char *gotPubkey /* >= 60 */);
