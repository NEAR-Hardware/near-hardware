#include "wallet_core.h"

#include <stdio.h>
#include <string.h>

#include "crypto_port.h"
#include "wordlist_gen.h"

// ------------------------------------------------------------------ encodings
static const char B58[] = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

int b58_encode(const uint8_t *in, size_t len, char *out, size_t outsz) {
  uint8_t buf[128];
  if (len > 64) return -1;
  size_t zeros = 0;
  while (zeros < len && in[zeros] == 0) zeros++;
  size_t size = (len - zeros) * 138 / 100 + 1;
  memset(buf, 0, sizeof buf);
  size_t high = size - 1;
  for (size_t i = zeros; i < len; i++) {
    int carry = in[i];
    size_t j = size - 1;
    for (;; j--) {
      carry += 256 * buf[j];
      buf[j] = carry % 58;
      carry /= 58;
      if (j <= high && carry == 0) break;
      if (j == 0) break;
    }
    high = j;
  }
  size_t k = 0;
  while (k < size && buf[k] == 0) k++;
  size_t n = zeros + (size - k);
  if (n + 1 > outsz) return -1;
  size_t o = 0;
  for (size_t i = 0; i < zeros; i++) out[o++] = '1';
  for (; k < size; k++) out[o++] = B58[buf[k]];
  out[o] = 0;
  return (int)o;
}

static const char B64[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

int b64_encode(const uint8_t *in, size_t len, char *out, size_t outsz) {
  size_t need = (len + 2) / 3 * 4 + 1;
  if (need > outsz) return -1;
  size_t o = 0;
  for (size_t i = 0; i < len; i += 3) {
    uint32_t v = in[i] << 16;
    if (i + 1 < len) v |= in[i + 1] << 8;
    if (i + 2 < len) v |= in[i + 2];
    out[o++] = B64[(v >> 18) & 63];
    out[o++] = B64[(v >> 12) & 63];
    out[o++] = i + 1 < len ? B64[(v >> 6) & 63] : '=';
    out[o++] = i + 2 < len ? B64[v & 63] : '=';
  }
  out[o] = 0;
  return (int)o;
}

static int b64val(char c) {
  if (c >= 'A' && c <= 'Z') return c - 'A';
  if (c >= 'a' && c <= 'z') return c - 'a' + 26;
  if (c >= '0' && c <= '9') return c - '0' + 52;
  if (c == '+' || c == '-') return 62;
  if (c == '/' || c == '_') return 63;
  return -1;
}

int b64_decode(const char *in, size_t len, uint8_t *out, size_t outsz) {
  uint32_t acc = 0;
  int bits = 0;
  size_t o = 0;
  for (size_t i = 0; i < len; i++) {
    char c = in[i];
    if (c == '=' || c == '\r' || c == '\n' || c == ' ') continue;
    int v = b64val(c);
    if (v < 0) return -1;
    acc = (acc << 6) | (uint32_t)v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      if (o >= outsz) return -1;
      out[o++] = (uint8_t)(acc >> bits);
    }
  }
  return (int)o;
}

void hex_encode(const uint8_t *in, size_t len, char *out) {
  static const char H[] = "0123456789abcdef";
  for (size_t i = 0; i < len; i++) {
    out[2 * i] = H[in[i] >> 4];
    out[2 * i + 1] = H[in[i] & 15];
  }
  out[2 * len] = 0;
}

// ------------------------------------------------------------------ BIP39
void bip39_indices(const uint8_t entropy[16], uint16_t idx[12]) {
  uint8_t h[32];
  cp_sha256(entropy, 16, h);
  uint8_t bits[17];
  memcpy(bits, entropy, 16);
  bits[16] = h[0];  // first 4 bits are the checksum
  for (int w = 0; w < 12; w++) {
    uint16_t v = 0;
    for (int b = 0; b < 11; b++) {
      int pos = w * 11 + b;
      v = (uint16_t)((v << 1) | ((bits[pos / 8] >> (7 - pos % 8)) & 1));
    }
    idx[w] = v;
  }
  cp_zero(bits, sizeof bits);
}

const char *bip39_word(uint16_t idx) { return BIP39_WORDS[idx & 2047]; }

void bip39_mnemonic(const uint8_t entropy[16], char *out, size_t outsz) {
  uint16_t idx[12];
  bip39_indices(entropy, idx);
  size_t o = 0;
  out[0] = 0;
  for (int i = 0; i < 12; i++) {
    const char *w = bip39_word(idx[i]);
    size_t l = strlen(w);
    if (o + l + 2 > outsz) break;
    if (i) out[o++] = ' ';
    memcpy(out + o, w, l);
    o += l;
    out[o] = 0;
  }
  cp_zero(idx, sizeof idx);
}

void bip39_seed(const char *mnemonic, uint8_t seed[64]) {
  // English words are plain ASCII, so NFKD normalisation is a no-op
  static const char salt[] = "mnemonic";  // + empty passphrase
  cp_pbkdf2_sha512((const uint8_t *)mnemonic, strlen(mnemonic), (const uint8_t *)salt, 8, 2048, seed, 64);
}

void slip10_near_key(const uint8_t seed[64], uint8_t key[32]) {
  static const char curve[] = "ed25519 seed";
  uint8_t I[64];
  cp_hmac_sha512((const uint8_t *)curve, 12, seed, 64, I);
  static const uint32_t path[3] = {44, 397, 0};  // m/44'/397'/0'
  uint8_t data[37];
  for (int i = 0; i < 3; i++) {
    uint32_t idx = path[i] | 0x80000000u;  // hardened
    data[0] = 0;
    memcpy(data + 1, I, 32);  // k
    data[33] = (uint8_t)(idx >> 24);
    data[34] = (uint8_t)(idx >> 16);
    data[35] = (uint8_t)(idx >> 8);
    data[36] = (uint8_t)idx;
    uint8_t chain[32];
    memcpy(chain, I + 32, 32);  // c
    cp_hmac_sha512(chain, 32, data, sizeof data, I);
    cp_zero(chain, sizeof chain);
  }
  memcpy(key, I, 32);
  cp_zero(I, sizeof I);
  cp_zero(data, sizeof data);
}

void near_key_from_mnemonic(const char *mnemonic, uint8_t secret[32], uint8_t pub[32]) {
  uint8_t seed[64];
  bip39_seed(mnemonic, seed);
  slip10_near_key(seed, secret);
  cp_ed25519_public(secret, pub);
  cp_zero(seed, sizeof seed);
}

void near_key_from_entropy(const uint8_t entropy[16], uint8_t secret[32], uint8_t pub[32]) {
  char m[12 * 9 + 1];
  bip39_mnemonic(entropy, m, sizeof m);
  near_key_from_mnemonic(m, secret, pub);
  cp_zero(m, sizeof m);
}

void near_pubkey_str(const uint8_t pub[32], char *out) {
  strcpy(out, "ed25519:");
  b58_encode(pub, 32, out + 8, 52);
}

void near_implicit_account(const uint8_t pub[32], char *out) { hex_encode(pub, 32, out); }

void near_short_account(const char *a, char *out, size_t outsz) {
  size_t n = strlen(a);
  if (n <= 16) {
    snprintf(out, outsz, "%s", a);
    return;
  }
  // 6 + ellipsis glyph + 6
  snprintf(out, outsz, "%.6s\x82%s", a, a + n - 6);
}

bool wallet_selftest(char *got) {
  uint8_t secret[32], pub[32];
  near_key_from_mnemonic(SELFTEST_PHRASE, secret, pub);
  // also check that signing round-trips with the derived key
  uint8_t msg[32], sig[64];
  cp_sha256((const uint8_t *)"near hardware wallet", 20, msg);
  cp_ed25519_sign(secret, msg, 32, sig);
  bool sigOk = cp_ed25519_verify(pub, msg, 32, sig);
  cp_zero(secret, sizeof secret);
  near_pubkey_str(pub, got);
  return sigOk && strcmp(got, SELFTEST_PUBKEY) == 0;
}

// ------------------------------------------------------------------ amounts
// u128 little endian -> decimal digits
static int u128_to_dec(const uint8_t le[16], char *out) {
  uint32_t w[4];
  for (int i = 0; i < 4; i++)
    w[i] = (uint32_t)le[4 * i] | ((uint32_t)le[4 * i + 1] << 8) | ((uint32_t)le[4 * i + 2] << 16) |
           ((uint32_t)le[4 * i + 3] << 24);
  char tmp[48];
  int n = 0;
  for (;;) {
    bool zero = !w[0] && !w[1] && !w[2] && !w[3];
    if (zero) break;
    uint64_t rem = 0;
    for (int i = 3; i >= 0; i--) {
      uint64_t cur = (rem << 32) | w[i];
      w[i] = (uint32_t)(cur / 10);
      rem = cur % 10;
    }
    tmp[n++] = (char)('0' + rem);
  }
  if (!n) tmp[n++] = '0';
  for (int i = 0; i < n; i++) out[i] = tmp[n - 1 - i];
  out[n] = 0;
  return n;
}

static void format_dec_near(const char *dec, char *out, size_t outsz) {
  // dec: integer yocto as digits. NEAR = 10^24 yocto. Exact, trailing zeros trimmed.
  size_t n = strlen(dec);
  char whole[40], frac[25];
  if (n > 24) {
    memcpy(whole, dec, n - 24);
    whole[n - 24] = 0;
    memcpy(frac, dec + n - 24, 24);
  } else {
    strcpy(whole, "0");
    memset(frac, '0', 24 - n);
    memcpy(frac + 24 - n, dec, n);
  }
  frac[24] = 0;
  int f = 23;
  while (f >= 0 && frac[f] == '0') frac[f--] = 0;
  if (frac[0]) snprintf(out, outsz, "%s.%s", whole, frac);
  else snprintf(out, outsz, "%s", whole);
}

void near_format_amount(const uint8_t yocto_le[16], char *out, size_t outsz) {
  char dec[48];
  u128_to_dec(yocto_le, dec);
  format_dec_near(dec, out, outsz);
}

bool near_format_amount_str(const char *yocto, char *out, size_t outsz) {
  for (const char *p = yocto; *p; p++)
    if (*p < '0' || *p > '9') return false;
  while (yocto[0] == '0' && yocto[1]) yocto++;
  if (strlen(yocto) > 40) return false;
  format_dec_near(yocto, out, outsz);
  return true;
}

// ------------------------------------------------------------------ review builder
static void rv_add(Review *r, const char *s, uint8_t style) {
  if (r->nlines >= REVIEW_MAX_LINES) return;
  snprintf(r->lines[r->nlines], 40, "%s", s);
  r->style[r->nlines] = style;
  r->nlines++;
}

// wraps text into value lines; maxLines caps it (adds an ellipsis line)
static void rv_wrap(Review *r, const char *s, uint8_t style, int maxLines) {
  static char tmp[64][40];
  int n = 0;
  // gfx::wrap equivalent without the gfx dependency
  const char *p = s;
  while (*p && n < 64) {
    if (*p == '\n') { p++; continue; }
    const char *nl = strchr(p, '\n');
    int lim = nl ? (int)(nl - p) : (int)strlen(p);
    int take = lim <= REVIEW_COLS ? lim : REVIEW_COLS;
    if (lim > REVIEW_COLS) {
      // prefer breaking at a space, else after . - _ , : so account ids
      // like hello.near-examples.testnet split at their dots
      int brk = 0;
      for (int i = REVIEW_COLS; i > REVIEW_COLS / 2 && !brk; i--)
        if (p[i] == ' ') brk = i;
      for (int i = REVIEW_COLS; i > REVIEW_COLS / 2 && !brk; i--)
        if (strchr(".-_,:/", p[i - 1])) brk = i;
      if (brk) take = brk;
    }
    memcpy(tmp[n], p, take);
    tmp[n][take] = 0;
    n++;
    p += take;
    while (*p == ' ') p++;
  }
  bool cut = *p != 0 || n > maxLines;
  if (n > maxLines) n = maxLines;
  for (int i = 0; i < n; i++) rv_add(r, tmp[i], style);
  if (cut) rv_add(r, "\x82", style);
}

// Make arbitrary bytes safe for the 8x8 ASCII font
static void sanitize(const uint8_t *in, size_t len, char *out, size_t outsz) {
  size_t o = 0;
  for (size_t i = 0; i < len && o + 1 < outsz; i++) {
    uint8_t c = in[i];
    if (c == '\n') out[o++] = '\n';
    else if (c == '\t') out[o++] = ' ';
    else if (c >= 0x20 && c < 0x7F) out[o++] = (char)c;
    else if ((c & 0xC0) == 0x80) continue;  // UTF-8 continuation byte
    else out[o++] = '?';
  }
  out[o] = 0;
}

static void rv_kv(Review *r, const char *label, const char *value, int maxLines = 6) {
  rv_add(r, label, L_LABEL);
  rv_wrap(r, value, L_VALUE, maxLines);
}

// ------------------------------------------------------------------ Borsh reader
struct Rd {
  const uint8_t *p;
  size_t len, pos;
  bool ok;
  bool need(size_t n) {
    if (!ok || pos + n > len) { ok = false; return false; }
    return true;
  }
  uint8_t u8() { return need(1) ? p[pos++] : 0; }
  uint32_t u32() {
    if (!need(4)) return 0;
    uint32_t v = p[pos] | (p[pos + 1] << 8) | (p[pos + 2] << 16) | ((uint32_t)p[pos + 3] << 24);
    pos += 4;
    return v;
  }
  uint64_t u64() {
    uint64_t lo = u32(), hi = u32();
    return lo | (hi << 32);
  }
  const uint8_t *bytes(size_t n) {
    if (!need(n)) return nullptr;
    const uint8_t *b = p + pos;
    pos += n;
    return b;
  }
  // borsh String into a NUL-terminated, sanitized buffer
  bool str(char *out, size_t outsz, size_t maxLen = 4096) {
    uint32_t n = u32();
    if (!ok || n > maxLen) { ok = false; return false; }
    const uint8_t *b = bytes(n);
    if (!b) return false;
    sanitize(b, n, out, outsz);
    return true;
  }
  bool pubkey(char *out /* >= 100 */) {
    uint8_t t = u8();
    if (t == 0) {
      const uint8_t *k = bytes(32);
      if (!k) return false;
      near_pubkey_str(k, out);
      return true;
    }
    if (t == 1) {
      const uint8_t *k = bytes(64);
      if (!k) return false;
      strcpy(out, "secp256k1:");
      b58_encode(k, 64, out + 10, 90);
      return true;
    }
    ok = false;
    return false;
  }
};

static void fmt_gas(uint64_t gas, char *out, size_t outsz) {
  uint64_t tg = gas / 1000000000000ULL;
  uint64_t rem = gas % 1000000000000ULL;
  if (rem == 0) snprintf(out, outsz, "%llu Tgas", (unsigned long long)tg);
  else snprintf(out, outsz, "%llu.%02llu Tgas", (unsigned long long)tg,
                (unsigned long long)(rem / 10000000000ULL));
}

static void fmt_near(const uint8_t *le, char *out, size_t outsz) {
  char amt[48];
  near_format_amount(le, amt, sizeof amt);
  snprintf(out, outsz, "%s NEAR", amt);
}

static bool is_zero16(const uint8_t *b) {
  for (int i = 0; i < 16; i++)
    if (b[i]) return false;
  return true;
}

static bool decode_actions(Rd &rd, Review *r, int depth);

static bool decode_action(Rd &rd, Review *r, int i, int n, int depth) {
  char head[48], buf[256];
  uint8_t tag = rd.u8();
  if (!rd.ok) return false;
  const char *num = "";
  char numbuf[12];
  if (n > 1) {
    snprintf(numbuf, sizeof numbuf, "%d/%d ", i + 1, n);
    num = numbuf;
  }
  switch (tag) {
    case 0:  // CreateAccount
      snprintf(head, sizeof head, "%screate account", num);
      rv_add(r, head, L_HEAD);
      return true;
    case 1: {  // DeployContract
      uint32_t len = rd.u32();
      const uint8_t *code = rd.bytes(len);
      if (!code) return false;
      uint8_t h[32];
      cp_sha256(code, len, h);
      char hb[60];
      b58_encode(h, 32, hb, sizeof hb);
      snprintf(head, sizeof head, "%sdeploy contract", num);
      rv_add(r, head, L_WARN);
      snprintf(buf, sizeof buf, "%u bytes", (unsigned)len);
      rv_kv(r, "code", buf);
      rv_kv(r, "code hash", hb);
      return true;
    }
    case 2: {  // FunctionCall
      char method[129];
      if (!rd.str(method, sizeof method, 256)) return false;
      uint32_t alen = rd.u32();
      const uint8_t *args = rd.bytes(alen);
      uint64_t gas = rd.u64();
      const uint8_t *dep = rd.bytes(16);
      if (!rd.ok) return false;
      snprintf(head, sizeof head, "%scall", num);
      rv_add(r, head, L_HEAD);
      rv_wrap(r, method, L_VALUE, 3);
      bool printable = true;
      for (uint32_t k = 0; k < alen; k++)
        if (args[k] < 0x20 || args[k] > 0x7E) { printable = alen == 0; break; }
      if (alen == 0) {
        rv_kv(r, "args", "(none)");
      } else if (printable) {
        static char abuf[1024];
        sanitize(args, alen < sizeof abuf - 1 ? alen : sizeof abuf - 1, abuf, sizeof abuf);
        rv_kv(r, "args", abuf, 10);
      } else {
        snprintf(buf, sizeof buf, "%u bytes (binary)", (unsigned)alen);
        rv_kv(r, "args", buf);
      }
      fmt_near(dep, buf, sizeof buf);
      rv_kv(r, "deposit", buf);
      fmt_gas(gas, buf, sizeof buf);
      rv_kv(r, "gas", buf);
      return true;
    }
    case 3: {  // Transfer
      const uint8_t *dep = rd.bytes(16);
      if (!dep) return false;
      snprintf(head, sizeof head, "%ssend", num);
      rv_add(r, head, L_HEAD);
      fmt_near(dep, buf, sizeof buf);
      rv_wrap(r, buf, L_VALUE, 3);
      return true;
    }
    case 4: {  // Stake
      const uint8_t *amt = rd.bytes(16);
      char pk[100];
      if (!amt || !rd.pubkey(pk)) return false;
      snprintf(head, sizeof head, "%sstake", num);
      rv_add(r, head, L_WARN);
      fmt_near(amt, buf, sizeof buf);
      rv_wrap(r, buf, L_VALUE, 3);
      rv_kv(r, "validator key", pk);
      return true;
    }
    case 5: {  // AddKey
      char pk[100];
      if (!rd.pubkey(pk)) return false;
      rd.u64();  // access key nonce
      uint8_t perm = rd.u8();
      if (!rd.ok) return false;
      if (perm == 1) {
        snprintf(head, sizeof head, "%sadd FULL ACCESS key", num);
        rv_add(r, head, L_WARN);
        rv_wrap(r, pk, L_VALUE, 4);
        rv_add(r, "it can do anything", L_WARN);
        rv_add(r, "with this account", L_WARN);
        return true;
      }
      if (perm != 0) return false;  // gas keys etc: show the hash instead
      uint8_t hasAllowance = rd.u8();
      uint8_t allowance[16] = {0};
      if (hasAllowance == 1) {
        const uint8_t *a = rd.bytes(16);
        if (!a) return false;
        memcpy(allowance, a, 16);
      } else if (hasAllowance != 0) {
        return false;
      }
      char recv[129];
      if (!rd.str(recv, sizeof recv, 128)) return false;
      uint32_t nm = rd.u32();
      if (!rd.ok || nm > 64) return false;
      snprintf(head, sizeof head, "%sadd limited key", num);
      rv_add(r, head, L_HEAD);
      rv_wrap(r, pk, L_VALUE, 4);
      rv_kv(r, "can call", recv, 3);
      buf[0] = 0;
      for (uint32_t k = 0; k < nm; k++) {
        char m[129];
        if (!rd.str(m, sizeof m, 256)) return false;
        if (strlen(buf) + strlen(m) + 3 < sizeof buf) {
          if (k) strcat(buf, ", ");
          strcat(buf, m);
        }
      }
      rv_kv(r, "methods", nm ? buf : "any", 4);
      if (hasAllowance) {
        fmt_near(allowance, buf, sizeof buf);
        rv_kv(r, "fee allowance", buf);
      } else {
        rv_kv(r, "fee allowance", "unlimited");
      }
      return true;
    }
    case 6: {  // DeleteKey
      char pk[100];
      if (!rd.pubkey(pk)) return false;
      snprintf(head, sizeof head, "%sdelete key", num);
      rv_add(r, head, L_WARN);
      rv_wrap(r, pk, L_VALUE, 4);
      return true;
    }
    case 7: {  // DeleteAccount
      char ben[129];
      if (!rd.str(ben, sizeof ben, 128)) return false;
      snprintf(head, sizeof head, "%sDELETE ACCOUNT", num);
      rv_add(r, head, L_WARN);
      rv_kv(r, "send rest to", ben, 3);
      return true;
    }
    case 8: {  // Delegate (meta transaction)
      if (depth > 0) return false;
      char sender[129], recv[129], pk[100];
      if (!rd.str(sender, sizeof sender, 128) || !rd.str(recv, sizeof recv, 128)) return false;
      snprintf(head, sizeof head, "%sdelegate (meta tx)", num);
      rv_add(r, head, L_WARN);
      rv_kv(r, "for", sender, 3);
      rv_kv(r, "to", recv, 3);
      if (!decode_actions(rd, r, depth + 1)) return false;
      rd.u64();  // nonce
      rd.u64();  // max block height
      if (!rd.pubkey(pk)) return false;
      uint8_t st = rd.u8();
      if (!rd.bytes(st == 0 ? 64 : 65)) return false;
      return true;
    }
    case 9: {  // DeployGlobalContract
      uint32_t len = rd.u32();
      const uint8_t *code = rd.bytes(len);
      uint8_t mode = rd.u8();
      if (!rd.ok || !code) return false;
      snprintf(head, sizeof head, "%sdeploy global code", num);
      rv_add(r, head, L_WARN);
      snprintf(buf, sizeof buf, "%u bytes, by %s", (unsigned)len, mode ? "account" : "hash");
      rv_wrap(r, buf, L_VALUE, 2);
      return true;
    }
    case 10: {  // UseGlobalContract
      uint8_t kind = rd.u8();
      snprintf(head, sizeof head, "%suse global code", num);
      rv_add(r, head, L_WARN);
      if (kind == 0) {
        const uint8_t *h = rd.bytes(32);
        if (!h) return false;
        b58_encode(h, 32, buf, sizeof buf);
        rv_kv(r, "code hash", buf);
      } else if (kind == 1) {
        char acc[129];
        if (!rd.str(acc, sizeof acc, 128)) return false;
        rv_kv(r, "from", acc, 3);
      } else {
        return false;
      }
      return true;
    }
    default:
      return false;  // newer actions: fall back to the hash
  }
}

static bool decode_actions(Rd &rd, Review *r, int depth) {
  uint32_t n = rd.u32();
  if (!rd.ok || n > 100) return false;
  for (uint32_t i = 0; i < n; i++)
    if (!decode_action(rd, r, (int)i, (int)n, depth)) return false;
  return true;
}

static void hash_only(Review *r, const char *why) {
  r->nlines = 0;
  rv_add(r, "can't decode this", L_WARN);
  rv_add(r, "transaction", L_WARN);
  rv_add(r, why, L_LABEL);
  char hb[60];
  b58_encode(r->digest, 32, hb, sizeof hb);
  rv_kv(r, "sha256 to sign", hb);
  rv_add(r, "only approve if your", L_LABEL);
  rv_add(r, "computer shows the", L_LABEL);
  rv_add(r, "same hash", L_LABEL);
}

bool near_review_tx(const uint8_t *tx, size_t len, const uint8_t mypub[32], Review *r) {
  memset(r, 0, sizeof *r);
  cp_sha256(tx, len, r->digest);
  Rd rd{tx, len, 0, true};
  bool v1 = len > 0 && tx[0] == 1;  // TransactionV1 carries a leading 1u8
  if (v1) rd.u8();
  char signer[129], recv[129], pk[100];
  rd.str(signer, sizeof signer, 64);
  // public key, compared byte-for-byte with ours
  size_t pkpos = rd.pos;
  rd.pubkey(pk);
  if (rd.ok) {
    bool mine = tx[pkpos] == 0 && memcmp(tx + pkpos + 1, mypub, 32) == 0;
    r->keyMismatch = !mine;
  }
  rd.u64();  // nonce
  rd.str(recv, sizeof recv, 64);
  rd.bytes(32);  // block hash
  if (!rd.ok) {
    hash_only(r, "(bad header)");
    return false;
  }
  r->headerOk = true;
  snprintf(r->signer, sizeof r->signer, "%s", signer);
  char mine[65], shortacc[24];
  near_implicit_account(mypub, mine);
  rv_add(r, "from", L_LABEL);
  if (strcmp(signer, mine) == 0) {
    near_short_account(signer, shortacc, sizeof shortacc);
    rv_add(r, shortacc, L_VALUE);
  } else {
    rv_wrap(r, signer, L_VALUE, 3);
  }
  rv_add(r, "to", L_LABEL);
  if (strcmp(recv, mine) == 0) {
    near_short_account(recv, shortacc, sizeof shortacc);
    char you[40];
    snprintf(you, sizeof you, "%s (you)", shortacc);
    rv_add(r, you, L_VALUE);
  } else {
    rv_wrap(r, recv, L_VALUE, 3);
  }
  if (!decode_actions(rd, r, 0) || (v1 && (rd.u64(), !rd.ok))) {
    char s[65];
    snprintf(s, sizeof s, "%s", signer);
    hash_only(r, "(unknown action)");
    snprintf(r->signer, sizeof r->signer, "%s", s);
    return false;
  }
  if (rd.pos != rd.len) {
    hash_only(r, "(trailing bytes)");
    return false;
  }
  return true;
}

bool near_review_message(const char *message, const char *recipient, const uint8_t nonce[32],
                         const char *callbackUrl, Review *r) {
  memset(r, 0, sizeof *r);
  r->isMessage = true;
  // borsh: u32 tag, String message, [u8;32] nonce, String recipient, Option<String> callbackUrl
  size_t ml = strlen(message), rl = strlen(recipient), cl = callbackUrl ? strlen(callbackUrl) : 0;
  size_t total = 4 + 4 + ml + 32 + 4 + rl + 1 + (callbackUrl ? 4 + cl : 0);
  static uint8_t buf[8192];
  if (total > sizeof buf) return false;
  size_t o = 0;
  auto put32 = [&](uint32_t v) {
    buf[o++] = (uint8_t)v; buf[o++] = (uint8_t)(v >> 8); buf[o++] = (uint8_t)(v >> 16); buf[o++] = (uint8_t)(v >> 24);
  };
  put32(2147484061u);  // 2^31 + 413
  put32((uint32_t)ml);
  memcpy(buf + o, message, ml); o += ml;
  memcpy(buf + o, nonce, 32); o += 32;
  put32((uint32_t)rl);
  memcpy(buf + o, recipient, rl); o += rl;
  if (callbackUrl) {
    buf[o++] = 1;
    put32((uint32_t)cl);
    memcpy(buf + o, callbackUrl, cl); o += cl;
  } else {
    buf[o++] = 0;
  }
  cp_sha256(buf, o, r->digest);

  static char tmp[2048];
  rv_add(r, "for", L_LABEL);
  sanitize((const uint8_t *)recipient, rl, tmp, sizeof tmp);
  rv_wrap(r, tmp, L_VALUE, 3);
  rv_add(r, "message", L_LABEL);
  sanitize((const uint8_t *)message, ml, tmp, sizeof tmp);
  rv_wrap(r, tmp, L_VALUE, 40);
  char nh[65];
  hex_encode(nonce, 8, nh);
  strcat(nh, "\x82");
  rv_kv(r, "nonce", nh);
  if (callbackUrl) {
    sanitize((const uint8_t *)callbackUrl, cl, tmp, sizeof tmp);
    rv_kv(r, "callback", tmp, 3);
  }
  return true;
}
