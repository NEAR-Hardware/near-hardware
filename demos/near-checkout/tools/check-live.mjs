#!/usr/bin/env node
// Checks the mainnet 1Click path the till uses, from the Mac. Moves no funds.
//
//   node tools/check-live.mjs [merchant.near]
//
// 1. GET /v0/tokens lists every payment asset the till offers
// 2. a dry EXACT_OUTPUT quote for $12.50 from each asset (refunds to INTENTS)
// 3. one real quote (dry: false) for USDC on Base: a real, unfunded deposit address
// 4. GET /v0/status for that address (expect PENDING_DEPOSIT)
// 5. 1Click's signature on both quotes checked by the official SDK and by the
//    till's own verifier (firmware/sim/sim --verify, the same C++ as the board)
//
// Writes tools/fixtures/quote-dry.json and tools/fixtures/quote-live.json
// (the latter is git-ignored: it holds a real deposit address).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { verifyQuoteSignature } from "@defuse-protocol/one-click-sdk-typescript";
import { ASSETS, HERE, oneclick, quoteBody } from "./oneclick.mjs";

const merchant = process.argv[2] ?? "rythmn.near";
const CENTS = 1250;
const FIX = path.join(HERE, "fixtures");
fs.mkdirSync(FIX, { recursive: true });
let failures = 0;
const ok = (cond, what) => {
  console.log(`  ${cond ? "ok  " : "FAIL"} ${what}`);
  if (!cond) failures++;
};

console.log(`1Click mainnet check, merchant ${merchant}, $${(CENTS / 100).toFixed(2)} as USDC on NEAR\n`);

const t = await oneclick("GET", "/v0/tokens");
const tokens = JSON.parse(t.text);
console.log(`GET /v0/tokens: ${tokens.length} tokens`);
for (const a of ASSETS) ok(tokens.some((x) => x.assetId === a.assetId), `listed: ${a.symbol} on ${a.chain} (${a.assetId})`);

console.log("\ndry quotes (EXACT_OUTPUT, refundType INTENTS)");
for (const a of ASSETS) {
  const r = await oneclick("POST", "/v0/quote", quoteBody({ asset: a, cents: CENTS, merchant, dry: true }));
  if (r.status !== 201 && r.status !== 200) {
    ok(false, `${a.symbol} on ${a.chain}: HTTP ${r.status} ${r.text.slice(0, 120)}`);
    continue;
  }
  const q = JSON.parse(r.text);
  const fee = (q.quoteRequest.appFees ?? []).reduce((s, f) => s + f.fee, 0);
  const sigOk = verifyQuoteSignature(q);
  const outOk = BigInt(q.quote.amountOut) >= BigInt(CENTS) * 10000n;
  ok(
    outOk && sigOk,
    `${a.symbol.padEnd(5)} on ${a.chain.padEnd(8)} pay ${q.quote.amountInFormatted} (~$${Number(q.quote.amountInUsd).toFixed(2)}), ` +
      `fee ${fee} bps + ${Number(q.quote.withdrawFee) / 1e6} USDC, ~${q.quote.timeEstimate}s, ` +
      `merchant gets ${q.quote.amountOutFormatted}, signature ${sigOk ? "ok" : "INVALID"} (${r.ms} ms)`,
  );
  if (a.key === "eth") fs.writeFileSync(path.join(FIX, "quote-dry.json"), JSON.stringify(q, null, 2));
}

console.log("\none real quote (dry: false) for USDC on Base: creates an address, sends nothing");
const base = ASSETS.find((a) => a.key === "usdc_base");
const r = await oneclick("POST", "/v0/quote", quoteBody({ asset: base, cents: CENTS, merchant, dry: false }));
ok(r.status === 201 || r.status === 200, `POST /v0/quote -> HTTP ${r.status} in ${r.ms} ms`);
const live = JSON.parse(r.text);
const dep = live.quote?.depositAddress;
ok(/^0x[0-9a-fA-F]{40}$/.test(dep ?? ""), `deposit address ${dep}`);
ok(verifyQuoteSignature(live), "SDK verifyQuoteSignature: true");
console.log(`       amountIn ${live.quote.amountIn} (${live.quote.amountInFormatted} USDC), min ${live.quote.minAmountIn}`);
console.log(`       request deadline ${live.quoteRequest.deadline} (the till's countdown), address inactive ${live.quote.deadline}`);
console.log(`       QR the till shows: ethereum:${base.assetId.split("-")[1].split(".")[0]}@8453/transfer?address=${dep}&uint256=${live.quote.amountIn}`);
fs.writeFileSync(path.join(FIX, "quote-live.json"), JSON.stringify(live, null, 2));

const s = await oneclick("GET", `/v0/status?depositAddress=${dep}`);
const st = JSON.parse(s.text);
ok(s.status === 200 && st.status === "PENDING_DEPOSIT", `GET /v0/status -> ${s.status} ${st.status}`);
console.log(`       explorer: https://explorer.near-intents.org/transactions/${dep}`);

console.log("\nthe till's own verifier on the same answers (firmware/sim/sim --verify)");
const sim = path.join(HERE, "../firmware/sim/sim");
try {
  const out = execFileSync(sim, ["--verify", path.join(FIX, "quote-dry.json"), path.join(FIX, "quote-live.json")], { encoding: "utf8" });
  for (const l of out.trim().split("\n")) ok(l.startsWith("true"), `till verifier: ${l.replace(HERE + "/", "")}`);
} catch (e) {
  ok(false, `till verifier: ${e.stdout ?? e.message}`);
}

console.log(failures ? `\n${failures} FAILED` : "\nlive path OK (no funds moved)");
process.exit(failures ? 1 : 0);
