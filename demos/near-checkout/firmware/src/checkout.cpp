#include "checkout.h"

#include <ArduinoJson.h>
#include <math.h>
#include <sodium.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Every assetId below is listed by GET https://1click.chaindefuser.com/v0/tokens
// (checked 2026-11-14 and again by tools/check-live.mjs and the companion).
const PayAsset PAY_ASSETS[] = {
    {"usdc_base", "nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near", "USDC", "Base", 6,
     UriKind::Erc20, 8453, "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", 15},
    {"usdc_arb", "nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near", "USDC", "Arbitrum", 6,
     UriKind::Erc20, 42161, "0xaf88d065e77c8cc2239327c5edb3a432268e5831", 15},
    {"eth", "nep141:eth.omft.near", "ETH", "Ethereum", 18, UriKind::EvmNative, 1, nullptr, 15},
    {"sol", "nep141:sol.omft.near", "SOL", "Solana", 9, UriKind::Solana, 0, nullptr, 15},
    // Bitcoin deposits need confirmations: the docs suggest about an hour.
    // 1cs_v1:btc:native:coin ("BTC(OMNI)" in /v0/tokens), not nep141:btc.omft.near:
    // 1Click signs quotes for the latter as if the former had been asked, so
    // their signatures never verify (not even with the official SDK 0.1.26).
    {"btc", "1cs_v1:btc:native:coin", "BTC", "Bitcoin", 8, UriKind::Bitcoin, 0, nullptr, 60},
    // 1Click lists no native NEAR, only wNEAR: the customer sends wNEAR (ft_transfer)
    {"near", "nep141:wrap.near", "wNEAR", "NEAR", 24, UriKind::Near, 0, nullptr, 15},
};
const int PAY_ASSET_COUNT = sizeof PAY_ASSETS / sizeof PAY_ASSETS[0];

int co_asset_index(const char *key) {
  for (int i = 0; i < PAY_ASSET_COUNT; i++)
    if (!strcmp(PAY_ASSETS[i].key, key)) return i;
  return -1;
}

static void copyStr(char *dst, size_t cap, const char *src) {
  if (!cap) return;
  if (!src) src = "";
  size_t n = strlen(src);
  if (n >= cap) n = cap - 1;
  memcpy(dst, src, n);
  dst[n] = 0;
}

// ------------------------------------------------------------------ formatting
void co_units_to_decimal(const char *units, int decimals, char *out, size_t cap) {
  char digits[80];
  size_t n = 0;
  for (const char *p = units; *p && n < sizeof digits - 1; p++)
    if (*p >= '0' && *p <= '9') digits[n++] = *p;
  digits[n] = 0;
  // strip leading zeros
  const char *d = digits;
  while (*d == '0' && d[1]) d++;
  n = strlen(d);
  char buf[112];
  size_t k = 0;
  if ((int)n <= decimals) {
    buf[k++] = '0';
    buf[k++] = '.';
    for (int i = 0; i < decimals - (int)n; i++) buf[k++] = '0';
    memcpy(buf + k, d, n);
    k += n;
  } else {
    size_t whole = n - decimals;
    memcpy(buf, d, whole);
    k = whole;
    if (decimals > 0) {
      buf[k++] = '.';
      memcpy(buf + k, d + whole, decimals);
      k += decimals;
    }
  }
  buf[k] = 0;
  if (strchr(buf, '.')) {
    while (k > 0 && buf[k - 1] == '0') buf[--k] = 0;
    if (k > 0 && buf[k - 1] == '.') buf[--k] = 0;
  }
  copyStr(out, cap, buf);
}

void co_cents_str(uint32_t cents, char *out, size_t cap) {
  snprintf(out, cap, "%lu.%02lu", (unsigned long)(cents / 100), (unsigned long)(cents % 100));
}

// days since 1970-01-01 for a civil date (Howard Hinnant's algorithm)
static int64_t daysFromCivil(int y, unsigned m, unsigned d) {
  y -= m <= 2;
  const int era = (y >= 0 ? y : y - 399) / 400;
  const unsigned yoe = (unsigned)(y - era * 400);
  const unsigned doy = (153 * (m + (m > 2 ? -3 : 9)) + 2) / 5 + d - 1;
  const unsigned doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
  return (int64_t)era * 146097 + (int64_t)doe - 719468;
}

static void civilFromDays(int64_t z, int &y, unsigned &m, unsigned &d) {
  z += 719468;
  const int64_t era = (z >= 0 ? z : z - 146096) / 146097;
  const unsigned doe = (unsigned)(z - era * 146097);
  const unsigned yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
  y = (int)(yoe + era * 400);
  const unsigned doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
  const unsigned mp = (5 * doy + 2) / 153;
  d = doy - (153 * mp + 2) / 5 + 1;
  m = mp < 10 ? mp + 3 : mp - 9;
  y += m <= 2;
}

void co_iso8601(int64_t unix, char *out, size_t cap) {
  int64_t days = unix / 86400;
  int secs = (int)(unix % 86400);
  int y;
  unsigned m, d;
  civilFromDays(days, y, m, d);
  snprintf(out, cap, "%04d-%02u-%02uT%02d:%02d:%02d.000Z", y, m, d, secs / 3600, (secs / 60) % 60, secs % 60);
}

int64_t co_parse_iso8601(const char *s) {
  int y, mo, d, h, mi, se;
  if (!s || sscanf(s, "%4d-%2d-%2dT%2d:%2d:%2d", &y, &mo, &d, &h, &mi, &se) != 6) return -1;
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return -1;
  return daysFromCivil(y, (unsigned)mo, (unsigned)d) * 86400 + h * 3600 + mi * 60 + se;
}

bool co_valid_account(const char *s) {
  size_t n = strlen(s);
  if (n < 2 || n > 64) return false;
  bool prevSep = true;  // no separator at the start
  for (size_t i = 0; i < n; i++) {
    char c = s[i];
    bool alnum = (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9');
    bool sep = c == '-' || c == '_' || c == '.';
    if (!alnum && !sep) return false;
    if (sep && prevSep) return false;
    prevSep = sep;
  }
  return !prevSep;
}

// ------------------------------------------------------------------ base58
static const char B58[] = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

int co_b58_encode(const uint8_t *in, size_t n, char *out, size_t cap) {
  size_t zeros = 0;
  while (zeros < n && in[zeros] == 0) zeros++;
  uint8_t buf[128];
  size_t size = (n - zeros) * 138 / 100 + 1;
  if (size > sizeof buf) return -1;
  memset(buf, 0, size);
  size_t length = 0;  // Bitcoin Core's EncodeBase58 loop
  for (size_t i = zeros; i < n; i++) {
    int carry = in[i];
    size_t done = 0;
    for (size_t k = size; k-- > 0 && (carry != 0 || done < length); done++) {
      carry += 256 * buf[k];
      buf[k] = (uint8_t)(carry % 58);
      carry /= 58;
    }
    length = done;
  }
  size_t j = size - length;
  while (j < size && buf[j] == 0) j++;
  size_t len = zeros + (size - j);
  if (len + 1 > cap) return -1;
  size_t k = 0;
  for (; k < zeros; k++) out[k] = '1';
  for (; j < size; j++) out[k++] = B58[buf[j]];
  out[k] = 0;
  return (int)k;
}

int co_b58_decode(const char *in, uint8_t *out, size_t cap) {
  uint8_t buf[128];
  size_t n = strlen(in);
  size_t zeros = 0;
  while (zeros < n && in[zeros] == '1') zeros++;
  size_t size = n * 733 / 1000 + 1;
  if (size > sizeof buf) return -1;
  memset(buf, 0, size);
  for (size_t i = zeros; i < n; i++) {
    const char *p = strchr(B58, in[i]);
    if (!p || !*p) return -1;
    int carry = (int)(p - B58);
    for (size_t j = size; j-- > 0;) {
      carry += 58 * buf[j];
      buf[j] = (uint8_t)(carry & 0xFF);
      carry >>= 8;
    }
    if (carry) return -1;
  }
  size_t j = 0;
  while (j < size && buf[j] == 0) j++;
  size_t len = zeros + (size - j);
  if (len > cap) return -1;
  memset(out, 0, zeros);
  memcpy(out + zeros, buf + j, size - j);
  return (int)len;
}

// ------------------------------------------------------------------ quote signature
// 1Click signs base58(sha256(json-stable-stringify({...request, ...quote, timestamp})))
// over a fixed set of fields (one-click-sdk-typescript buildSignedQuoteRequest /
// buildSignedQuote). Rebuilt here field by field, keys sorted, no whitespace.
struct Field {
  const char *key;
  bool defined;
  char val[200];
};

struct Canon {
  Field f[32];
  int n = 0;
  Field *slot(const char *key) {
    for (int i = 0; i < n; i++)
      if (!strcmp(f[i].key, key)) return &f[i];
    if (n >= 32) return nullptr;
    f[n].key = key;
    f[n].defined = false;
    f[n].val[0] = 0;
    return &f[n++];
  }
};

static void jsonEscape(const char *s, char *out, size_t cap) {
  size_t k = 0;
  auto put = [&](char c) {
    if (k + 1 < cap) out[k++] = c;
  };
  put('"');
  for (const unsigned char *p = (const unsigned char *)s; *p; p++) {
    unsigned char c = *p;
    if (c == '"' || c == '\\') {
      put('\\');
      put((char)c);
    } else if (c == '\n') {
      put('\\'); put('n');
    } else if (c == '\r') {
      put('\\'); put('r');
    } else if (c == '\t') {
      put('\\'); put('t');
    } else if (c == '\b') {
      put('\\'); put('b');
    } else if (c == '\f') {
      put('\\'); put('f');
    } else if (c < 0x20) {
      char u[8];
      snprintf(u, sizeof u, "\\u%04x", c);
      for (char *q = u; *q; q++) put(*q);
    } else {
      put((char)c);
    }
  }
  put('"');
  out[k] = 0;
}

// Number.prototype.toString for the values that occur here (integers, short decimals)
static void jsNumber(double v, char *out, size_t cap) {
  if (v == floor(v) && fabs(v) < 1e15) {
    snprintf(out, cap, "%lld", (long long)v);
    return;
  }
  for (int p = 1; p <= 17; p++) {
    snprintf(out, cap, "%.*g", p, v);
    if (strtod(out, nullptr) == v) return;
  }
}

static bool truthy(JsonVariantConst v) {
  if (v.isNull()) return false;
  if (v.is<bool>()) return v.as<bool>();
  if (v.is<const char *>()) return v.as<const char *>()[0] != 0;
  if (v.is<double>()) return v.as<double>() != 0;
  return true;
}

// value -> JSON text; false when the value is undefined (missing / null)
static bool encodeValue(JsonVariantConst v, char *out, size_t cap) {
  if (v.isNull()) return false;
  if (v.is<bool>()) {
    copyStr(out, cap, v.as<bool>() ? "true" : "false");
  } else if (v.is<long long>()) {
    snprintf(out, cap, "%lld", v.as<long long>());
  } else if (v.is<double>()) {
    jsNumber(v.as<double>(), out, cap);
  } else if (v.is<const char *>()) {
    jsonEscape(v.as<const char *>(), out, cap);
  } else {
    return false;  // objects/arrays are not part of the signed set
  }
  return true;
}

static void setField(Canon &c, const char *key, JsonVariantConst v) {
  Field *f = c.slot(key);
  if (!f) return;
  f->defined = encodeValue(v, f->val, sizeof f->val);
}

static void setIfTruthy(Canon &c, const char *key, JsonVariantConst v) {
  // `x || undefined`: falsy values still override earlier keys with undefined
  Field *f = c.slot(key);
  if (!f) return;
  f->defined = truthy(v) && encodeValue(v, f->val, sizeof f->val);
}

static bool verifyDoc(JsonDocument &doc) {
  JsonObjectConst req = doc["quoteRequest"];
  JsonObjectConst quote = doc["quote"];
  const char *sigStr = doc["signature"] | "";
  if (req.isNull() || quote.isNull() || !sigStr[0]) return false;

  static Canon c;
  c.n = 0;
  // buildSignedQuoteRequest
  static const char *const reqKeys[] = {"dry",      "swapType",  "slippageTolerance", "originAsset",
                                        "depositType", "destinationAsset", "amount", "refundTo",
                                        "refundType", "recipient", "recipientType", "deadline"};
  for (const char *k : reqKeys) setField(c, k, req[k]);
  static const char *const reqOpt[] = {"quoteWaitingTimeMs", "referral", "virtualChainRecipient",
                                       "virtualChainRefundRecipient", "customRecipientMsg"};
  for (const char *k : reqOpt) setIfTruthy(c, k, req[k]);
  // buildSignedQuote
  static const char *const qKeys[] = {"amountIn",  "amountInFormatted",  "amountInUsd",  "minAmountIn",
                                      "amountOut", "amountOutFormatted", "amountOutUsd", "minAmountOut"};
  for (const char *k : qKeys) setField(c, k, quote[k]);
  if (!truthy(req["dry"])) {
    static const char *const qOpt[] = {"depositAddress", "depositMemo",  "deadline",   "timeWhenInactive",
                                       "timeEstimate",   "refundFee",    "withdrawFee"};
    for (const char *k : qOpt) setIfTruthy(c, k, quote[k]);
  }
  setField(c, "timestamp", doc["timestamp"]);

  // stable key order (json-stable-stringify compares keys as strings)
  int order[32];
  for (int i = 0; i < c.n; i++) order[i] = i;
  for (int i = 1; i < c.n; i++)
    for (int j = i; j > 0 && strcmp(c.f[order[j - 1]].key, c.f[order[j]].key) > 0; j--) {
      int t = order[j];
      order[j] = order[j - 1];
      order[j - 1] = t;
    }
  static char msg[4096];
  size_t k = 0;
  msg[k++] = '{';
  bool first = true;
  for (int i = 0; i < c.n; i++) {
    const Field &f = c.f[order[i]];
    if (!f.defined) continue;
    int w = snprintf(msg + k, sizeof msg - k, "%s\"%s\":%s", first ? "" : ",", f.key, f.val);
    if (w < 0 || (size_t)w >= sizeof msg - k) return false;
    k += (size_t)w;
    first = false;
  }
  if (k + 2 > sizeof msg) return false;
  msg[k++] = '}';
  msg[k] = 0;

  uint8_t hash[32];
  crypto_hash_sha256(hash, (const uint8_t *)msg, k);
  char hash58[64];
  int hl = co_b58_encode(hash, 32, hash58, sizeof hash58);
  if (hl <= 0) return false;

  const char *sigB58 = strncmp(sigStr, "ed25519:", 8) ? sigStr : sigStr + 8;
  const char *pubB58 = &ONECLICK_SIGNER[8];
  uint8_t sig[64], pub[32];
  if (co_b58_decode(sigB58, sig, sizeof sig) != 64) return false;
  if (co_b58_decode(pubB58, pub, sizeof pub) != 32) return false;
  return crypto_sign_verify_detached(sig, (const uint8_t *)hash58, (unsigned long long)hl, pub) == 0;
}

bool co_verify_quote_json(const char *body, size_t len) {
  JsonDocument doc;
  if (deserializeJson(doc, body, len)) return false;
  return verifyDoc(doc);
}

// ------------------------------------------------------------------ quote
int co_quote_body(char *out, size_t cap, const PayAsset &a, uint32_t cents, const char *merchant, bool dry,
                  const char *deadlineIso) {
  JsonDocument d;
  char amount[24];
  // USDC has 6 decimals: cents * 10^4
  snprintf(amount, sizeof amount, "%llu", (unsigned long long)cents * 10000ULL);
  d["dry"] = dry;
  d["swapType"] = "EXACT_OUTPUT";
  d["slippageTolerance"] = SLIPPAGE_BPS;
  d["originAsset"] = a.assetId;
  d["depositType"] = "ORIGIN_CHAIN";
  d["destinationAsset"] = USDC_NEAR_ASSET;
  d["amount"] = amount;
  d["recipient"] = merchant;
  d["recipientType"] = "DESTINATION_CHAIN";
  d["refundTo"] = merchant;
  d["refundType"] = "INTENTS";
  d["deadline"] = deadlineIso;
  size_t n = serializeJson(d, out, cap);
  return n && n < cap ? (int)n : -1;
}

bool co_parse_quote(int httpStatus, const char *body, size_t len, Quote &q) {
  memset(&q, 0, sizeof q);
  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, body, len);
  if (httpStatus < 200 || httpStatus >= 300 || err) {
    const char *m = err ? nullptr : (const char *)(doc["message"] | (const char *)nullptr);
    if (m) copyStr(q.error, sizeof q.error, m);
    else if (httpStatus <= 0) copyStr(q.error, sizeof q.error, "no connection to 1Click");
    else snprintf(q.error, sizeof q.error, "1Click answered HTTP %d", httpStatus);
    return false;
  }
  JsonObjectConst req = doc["quoteRequest"];
  JsonObjectConst quote = doc["quote"];
  if (quote.isNull()) {
    copyStr(q.error, sizeof q.error, "no quote in the answer");
    return false;
  }
  q.dry = req["dry"] | false;
  copyStr(q.amountIn, sizeof q.amountIn, quote["amountIn"] | "");
  copyStr(q.amountInFmt, sizeof q.amountInFmt, quote["amountInFormatted"] | "");
  copyStr(q.minAmountIn, sizeof q.minAmountIn, quote["minAmountIn"] | "");
  copyStr(q.amountInUsd, sizeof q.amountInUsd, quote["amountInUsd"] | "");
  copyStr(q.amountOutFmt, sizeof q.amountOutFmt, quote["amountOutFormatted"] | "");
  copyStr(q.depositAddress, sizeof q.depositAddress, quote["depositAddress"] | "");
  copyStr(q.depositMemo, sizeof q.depositMemo, quote["depositMemo"] | "");
  copyStr(q.correlationId, sizeof q.correlationId, doc["correlationId"] | "");
  // The till counts down to the request's deadline: after it 1Click refunds
  // instead of swapping. quote.deadline (live quotes) is days later: when the
  // address goes inactive and late funds may be lost.
  const char *dl = req["deadline"] | "";
  copyStr(q.deadlineIso, sizeof q.deadlineIso, dl);
  copyStr(q.inactiveIso, sizeof q.inactiveIso, quote["deadline"] | "");
  int64_t t = co_parse_iso8601(dl);
  q.deadline = t > 0 ? t : 0;
  q.timeEstimate = quote["timeEstimate"] | 0u;
  q.withdrawFee = (uint32_t)strtoul(quote["withdrawFee"] | "0", nullptr, 10);
  uint32_t bps = 0;
  for (JsonObjectConst f : req["appFees"].as<JsonArrayConst>()) bps += f["fee"] | 0u;
  q.appFeeBps = (uint16_t)bps;
  q.verified = verifyDoc(doc);
  q.ok = q.amountIn[0] && (q.dry || q.depositAddress[0]);
  if (!q.ok) copyStr(q.error, sizeof q.error, "incomplete quote");
  return q.ok;
}

// ------------------------------------------------------------------ status
PayStatus co_status_from(const char *s) {
  if (!s) return PayStatus::Unknown;
  if (!strcmp(s, "PENDING_DEPOSIT")) return PayStatus::PendingDeposit;
  if (!strcmp(s, "KNOWN_DEPOSIT_TX")) return PayStatus::KnownDepositTx;
  if (!strcmp(s, "PROCESSING")) return PayStatus::Processing;
  if (!strcmp(s, "SUCCESS")) return PayStatus::Success;
  if (!strcmp(s, "INCOMPLETE_DEPOSIT")) return PayStatus::IncompleteDeposit;
  if (!strcmp(s, "REFUNDED")) return PayStatus::Refunded;
  if (!strcmp(s, "FAILED")) return PayStatus::Failed;
  return PayStatus::Unknown;
}

const char *co_status_name(PayStatus st) {
  switch (st) {
    case PayStatus::PendingDeposit: return "PENDING_DEPOSIT";
    case PayStatus::KnownDepositTx: return "KNOWN_DEPOSIT_TX";
    case PayStatus::Processing: return "PROCESSING";
    case PayStatus::Success: return "SUCCESS";
    case PayStatus::IncompleteDeposit: return "INCOMPLETE_DEPOSIT";
    case PayStatus::Refunded: return "REFUNDED";
    case PayStatus::Failed: return "FAILED";
    case PayStatus::NotFound: return "NOT_FOUND";
    default: return "UNKNOWN";
  }
}

bool co_parse_status(int httpStatus, const char *body, size_t len, StatusInfo &s) {
  memset(&s, 0, sizeof s);
  if (httpStatus == 404) {
    s.st = PayStatus::NotFound;
    return true;
  }
  JsonDocument filter;
  filter["status"] = true;
  filter["message"] = true;
  filter["swapDetails"]["amountOutFormatted"] = true;
  filter["swapDetails"]["refundedAmountFormatted"] = true;
  filter["swapDetails"]["refundReason"] = true;
  filter["swapDetails"]["destinationChainTxHashes"][0]["hash"] = true;
  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, body, len, DeserializationOption::Filter(filter));
  if (httpStatus < 200 || httpStatus >= 300 || err) {
    s.st = PayStatus::Unknown;
    const char *m = err ? nullptr : (const char *)(doc["message"] | (const char *)nullptr);
    if (m) copyStr(s.error, sizeof s.error, m);
    else snprintf(s.error, sizeof s.error, httpStatus <= 0 ? "no connection" : "HTTP %d", httpStatus);
    return false;
  }
  s.st = co_status_from(doc["status"] | "");
  JsonObjectConst d = doc["swapDetails"];
  copyStr(s.amountOutFmt, sizeof s.amountOutFmt, d["amountOutFormatted"] | "");
  copyStr(s.refundedFmt, sizeof s.refundedFmt, d["refundedAmountFormatted"] | "");
  copyStr(s.refundReason, sizeof s.refundReason, d["refundReason"] | "");
  copyStr(s.destTx, sizeof s.destTx, d["destinationChainTxHashes"][0]["hash"] | "");
  return s.st != PayStatus::Unknown;
}

// ------------------------------------------------------------------ payment URIs
int co_payment_uri(char *out, size_t cap, const PayAsset &a, const Quote &q) {
  if (!q.depositAddress[0] || !q.amountIn[0]) return -1;
  char dec[64];
  co_units_to_decimal(q.amountIn, a.decimals, dec, sizeof dec);
  int n = -1;
  switch (a.uri) {
    case UriKind::Erc20:  // EIP-681 token transfer
      n = snprintf(out, cap, "ethereum:%s@%lu/transfer?address=%s&uint256=%s", a.contract,
                   (unsigned long)a.chainId, q.depositAddress, q.amountIn);
      break;
    case UriKind::EvmNative:  // EIP-681 value transfer, value in wei
      n = snprintf(out, cap, "ethereum:%s@%lu?value=%s", q.depositAddress, (unsigned long)a.chainId, q.amountIn);
      break;
    case UriKind::Bitcoin:  // BIP-21, amount in BTC
      n = snprintf(out, cap, "bitcoin:%s?amount=%s", q.depositAddress, dec);
      break;
    case UriKind::Solana:  // Solana Pay transfer request, amount in SOL
      n = snprintf(out, cap, "solana:%s?amount=%s&label=NEAR%%20Checkout", q.depositAddress, dec);
      break;
    case UriKind::Near:  // no payment URI standard on NEAR: the account to send wNEAR to
      n = snprintf(out, cap, "%s", q.depositAddress);
      break;
  }
  return n > 0 && (size_t)n < cap ? n : -1;
}
