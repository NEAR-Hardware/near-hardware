// Shared 1Click bits for the host tools. The asset table mirrors
// firmware/src/checkout.cpp (PAY_ASSETS); keep the two in sync.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

export const ONECLICK = "https://1click.chaindefuser.com";
export const USDC_NEAR = "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1";
export const HERE = path.dirname(fileURLToPath(import.meta.url));

export const ASSETS = [
  { key: "usdc_base", assetId: "nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near", symbol: "USDC", chain: "Base", decimals: 6, deadlineMin: 15 },
  { key: "usdc_arb", assetId: "nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near", symbol: "USDC", chain: "Arbitrum", decimals: 6, deadlineMin: 15 },
  { key: "eth", assetId: "nep141:eth.omft.near", symbol: "ETH", chain: "Ethereum", decimals: 18, deadlineMin: 15 },
  { key: "sol", assetId: "nep141:sol.omft.near", symbol: "SOL", chain: "Solana", decimals: 9, deadlineMin: 15 },
  { key: "btc", assetId: "1cs_v1:btc:native:coin", symbol: "BTC", chain: "Bitcoin", decimals: 8, deadlineMin: 60 },
  { key: "near", assetId: "nep141:wrap.near", symbol: "wNEAR", chain: "NEAR", decimals: 24, deadlineMin: 15 },
];

// Optional partner key: ONECLICK_API_KEY in the environment or tools/.env (git-ignored)
export function apiKey() {
  if (process.env.ONECLICK_API_KEY) return process.env.ONECLICK_API_KEY;
  try {
    const env = fs.readFileSync(path.join(HERE, ".env"), "utf8");
    const m = env.match(/^ONECLICK_API_KEY=(.+)$/m);
    if (m) return m[1].trim();
  } catch {}
  return "";
}

export async function oneclick(method, p, body, { timeoutMs = 15000 } = {}) {
  const headers = { Accept: "application/json" };
  const key = apiKey();
  if (key) headers["X-API-Key"] = key;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const t0 = Date.now();
  const res = await fetch(ONECLICK + p, {
    method,
    headers,
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  return { status: res.status, text, ms: Date.now() - t0 };
}

// The till's quote request (firmware co_quote_body): merchant gets exactly
// `cents` as USDC on NEAR, refunds go to the merchant's NEAR Intents account.
export function quoteBody({ asset, cents, merchant, dry, deadline }) {
  return {
    dry,
    swapType: "EXACT_OUTPUT",
    slippageTolerance: 100,
    originAsset: asset.assetId,
    depositType: "ORIGIN_CHAIN",
    destinationAsset: USDC_NEAR,
    amount: String(BigInt(cents) * 10000n),
    recipient: merchant,
    recipientType: "DESTINATION_CHAIN",
    refundTo: merchant,
    refundType: "INTENTS",
    deadline: deadline ?? new Date(Date.now() + asset.deadlineMin * 60e3).toISOString(),
  };
}

// Paths the board may ask the companion to fetch
export function allowed(method, p) {
  if (method === "POST" && p === "/v0/quote") return true;
  if (method === "GET" && /^\/v0\/status\?depositAddress=[A-Za-z0-9._:-]{8,120}(&depositMemo=[A-Za-z0-9._-]{1,64})?$/.test(p)) return true;
  if (method === "GET" && p === "/v0/tokens") return true;
  return false;
}

// ---- screenshots: the board sends RLE (count, RGB565 LE) rows in base64
export function shotToPng(parts, w = 320, h = 480) {
  const rgb = Buffer.alloc(w * h * 3);
  for (const p of parts) {
    if (p.y === undefined) continue;
    const rle = Buffer.from(p.d, "base64");
    let x = 0, y = p.y;
    for (let i = 0; i + 2 < rle.length; i += 3) {
      const run = rle[i], c = rle[i + 1] | (rle[i + 2] << 8);
      const r = (c >> 11) & 31, g = (c >> 5) & 63, b = c & 31;
      for (let k = 0; k < run; k++) {
        const o = (y * w + x) * 3;
        rgb[o] = (r << 3) | (r >> 2);
        rgb[o + 1] = (g << 2) | (g >> 4);
        rgb[o + 2] = (b << 3) | (b >> 2);
        if (++x === w) { x = 0; y++; }
      }
    }
  }
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) rgb.copy(raw, y * (1 + w * 3) + 1, y * w * 3, (y + 1) * w * 3);
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
