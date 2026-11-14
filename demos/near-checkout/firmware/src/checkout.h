// The sale model: which tokens a customer can pay with, 1Click quote and
// status messages, quote signature checks and wallet payment URIs.
// Portable (ESP32 and the host simulator); uses ArduinoJson and libsodium.
#pragma once
#include <stddef.h>
#include <stdint.h>

#define ONECLICK_HOST "1click.chaindefuser.com"
// What the merchant receives: USDC on NEAR (assetId from GET /v0/tokens)
#define USDC_NEAR_ASSET "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1"
// 1Click's quote signing key (one-click-sdk-typescript 0.1.26, src/quote-signature.ts)
#define ONECLICK_SIGNER "ed25519:reYaWhvwu8Jzo3WUM3zhn6VrhuMEF4eADL17qtRVifc"
#define SLIPPAGE_BPS 100
#define DEFAULT_MERCHANT "rythmn.near"
#define MAX_CENTS 9999999u  // $99,999.99

enum class UriKind : uint8_t { Erc20, EvmNative, Bitcoin, Solana, Near };

struct PayAsset {
  const char *key;       // id on the serial protocol, e.g. "usdc_base"
  const char *assetId;   // 1Click assetId, as listed by GET /v0/tokens
  const char *symbol;    // what the customer sends
  const char *chain;     // where they send it from
  uint8_t decimals;
  UriKind uri;
  uint32_t chainId;      // EVM chain id (EIP-155)
  const char *contract;  // ERC-20 contract for Erc20
  uint16_t deadlineMin;  // quote deadline, minutes from now
};

extern const PayAsset PAY_ASSETS[];
extern const int PAY_ASSET_COUNT;
int co_asset_index(const char *key);

struct Quote {
  bool ok;
  bool dry;
  bool verified;        // signed by 1Click (checked on this device)
  char amountIn[48];    // what the customer sends, smallest unit
  char amountInFmt[48]; // the same, decimal
  char minAmountIn[48];
  char amountInUsd[24];
  char amountOutFmt[24];
  char depositAddress[100];
  char depositMemo[48];
  char correlationId[48];
  char deadlineIso[32]; // the requested deadline: refunds instead of a swap after it
  int64_t deadline;     // the same as unix seconds, 0 if unknown
  char inactiveIso[32]; // quote.deadline: the address goes inactive (live quotes, days later)
  uint32_t timeEstimate;
  uint32_t withdrawFee; // USDC smallest unit, already taken from amountOut
  uint16_t appFeeBps;
  char error[120];
};

enum class PayStatus : uint8_t {
  Unknown, PendingDeposit, KnownDepositTx, Processing, Success, IncompleteDeposit, Refunded, Failed, NotFound
};

struct StatusInfo {
  PayStatus st;
  char amountOutFmt[24];
  char refundedFmt[48];
  char refundReason[40];
  char destTx[100];
  char error[80];
};

// POST /v0/quote body: EXACT_OUTPUT so the merchant gets exactly `cents` in
// USDC on NEAR; refunds go to the merchant's NEAR Intents account.
int co_quote_body(char *out, size_t cap, const PayAsset &a, uint32_t cents, const char *merchant, bool dry,
                  const char *deadlineIso);
// Parse a /v0/quote answer (any HTTP status) and check its signature.
bool co_parse_quote(int httpStatus, const char *body, size_t len, Quote &q);
// The signature check on its own: true if a /v0/quote answer is signed by 1Click
bool co_verify_quote_json(const char *body, size_t len);
// Parse a GET /v0/status answer
bool co_parse_status(int httpStatus, const char *body, size_t len, StatusInfo &s);
const char *co_status_name(PayStatus st);
PayStatus co_status_from(const char *s);

// Wallet-friendly QR payload for a live quote: EIP-681 (EVM), BIP-21 (BTC),
// Solana Pay (SOL), the bare account for NEAR. Returns length or -1.
int co_payment_uri(char *out, size_t cap, const PayAsset &a, const Quote &q);

// "2774229443590013", 18 -> "0.002774229443590013" (trailing zeros trimmed)
void co_units_to_decimal(const char *units, int decimals, char *out, size_t cap);
void co_cents_str(uint32_t cents, char *out, size_t cap);   // 1250 -> "12.50"
void co_iso8601(int64_t unix, char *out, size_t cap);       // "2026-11-14T22:15:00.000Z"
int64_t co_parse_iso8601(const char *s);                    // -1 on error
bool co_valid_account(const char *s);                       // NEAR account id rules
// Base58 (bitcoin alphabet)
int co_b58_encode(const uint8_t *in, size_t n, char *out, size_t cap);
int co_b58_decode(const char *in, uint8_t *out, size_t cap);
