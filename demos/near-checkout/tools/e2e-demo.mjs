#!/usr/bin/env node
// End-to-end DEMO sale on the real till, through the running companion:
//   1. $12.50 in ETH: price -> token -> real 1Click quote + payment QR ->
//      "Simulate payment received" -> payment seen -> swapping -> paid
//   2. $4.20 in SOL -> "Simulate expired" -> expired
// Taps are injected over USB at the same coordinates a finger would press.
// Screenshots of the till's framebuffer land in tools/screenshots/.
//
//   node tools/companion.mjs &   then   node tools/e2e-demo.mjs
import fs from "node:fs";
import path from "node:path";
import { HERE } from "./oneclick.mjs";

const API = process.env.COMPANION ?? "http://localhost:8787";
const SHOTS = path.join(HERE, "screenshots");
fs.mkdirSync(SHOTS, { recursive: true });

// touch targets (centres of the buttons in firmware/src/app.cpp)
const T = {
  newSale: [160, 272], settings: [188, 363],
  keys: { 1: [60, 161], 2: [160, 161], 3: [260, 161], 4: [60, 225], 5: [160, 225], 6: [260, 225], 7: [60, 289], 8: [160, 289], 9: [260, 289], "00": [60, 353], 0: [160, 353], del: [260, 353] },
  amountBack: [76, 430], amountNext: [226, 430],
  asset: { usdc_base: [82, 150], usdc_arb: [238, 150], eth: [82, 242], sol: [238, 242], btc: [82, 334], near: [238, 334] },
  payBack: [84, 430], quoteCancel: [160, 445], quotingCancel: [160, 430],
  paidNewSale: [200, 440], endedHome: [76, 430], endedNewSale: [226, 430], errorBack: [76, 430], settingsBack: [86, 440],
};

let failures = 0;
const ok = (cond, what) => {
  console.log(`  ${cond ? "ok  " : "FAIL"} ${what}`);
  if (!cond) failures++;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(p, body) {
  const r = await fetch(API + p, body === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.json();
}
const state = async () => (await api("/api/state")).state;
const tap = ([x, y]) => api("/api/tap", { x, y });

async function waitFor(pred, what, timeoutMs = 30000) {
  const t0 = Date.now();
  for (;;) {
    const s = await state();
    if (s && pred(s)) return s;
    if (Date.now() - t0 > timeoutMs) throw new Error(`timed out waiting for ${what} (screen: ${s?.screen})`);
    await sleep(150);
  }
}

async function shot(name) {
  await sleep(250);
  const r = await fetch(API + "/api/shot.png");
  fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from(await r.arrayBuffer()));
}

async function goHome() {
  for (let i = 0; i < 6; i++) {
    const s = await state();
    if (s.screen === "home") return;
    const back = { amount: T.amountBack, pay: T.payBack, quote: T.quoteCancel, quoting: T.quotingCancel, paid: T.endedHome,
      ended: T.endedHome, error: T.errorBack, settings: T.settingsBack, live_confirm: [84, 430], merchant: [84, 412] }[s.screen];
    if (!back) throw new Error(`don't know how to leave ${s.screen}`);
    await tap(back);
    await sleep(300);
  }
}

async function sale(price, assetKey) {
  await tap(T.newSale);
  await waitFor((s) => s.screen === "amount", "price keypad");
  for (const k of price.replace(".", "").replace(/^0+/, "")) await tap(T.keys[k]);
  const s1 = await waitFor((s) => s.screen === "amount" && s.price === price, `price ${price}`, 5000);
  ok(s1.price === price, `typed $${price} on the keypad`);
  await shot(`device-02-price`);
  await tap(T.amountNext);
  await waitFor((s) => s.screen === "pay", "choose token");
  await shot(`device-03-choose-token`);
  await tap(T.asset[assetKey]);
  const q = await waitFor((s) => s.screen === "quote" || s.screen === "error", "quote", 30000);
  return q;
}

const s0 = (await api("/api/state"));
if (!s0.connected) throw new Error("the companion has no till connected");
if (s0.state.mode !== "demo") {
  console.log("switching the till to DEMO");
  await api("/api/demo-mode", {});
}
await goHome();
await shot("device-01-home");

console.log("sale 1: $12.50 in ETH, simulated payment");
let q = await sale("12.50", "eth");
ok(q.screen === "quote", `quote on screen (${q.screen === "error" ? q.message : "QR shown"})`);
ok(q.dry === false && /^0x[0-9a-fA-F]{40}$/.test(q.depositAddress ?? ""), `real 1Click quote with a deposit address (${q.depositAddress})`);
ok(q.verified === true, "1Click's signature on the quote verified on the till");
ok((q.qr ?? "").startsWith(`ethereum:${q.depositAddress}@1?value=`), `QR is an EIP-681 payment request: ${q.qr}`);
console.log(`       send ${q.amountIn} ${q.symbol} on ${q.chain} (~$${Number(q.amountInUsd).toFixed(2)}), expires in ${q.expiresIn}s`);
await shot("device-05-quote-demo");
let r = await api("/api/simulate", { action: "paid" });
ok(r.ok, "demo controller: Simulate payment received");
await waitFor((s) => s.screen === "waiting", "waiting screen", 3000);
await shot("device-06-waiting");
await waitFor((s) => s.screen === "waiting" && s.status === "PROCESSING", "swapping", 5000);
await shot("device-06b-swapping");
const p = await waitFor((s) => s.screen === "paid", "paid", 10000);
ok(p.received === "12.50", `paid: +${p.received} USDC to ${p.merchant}`);
await shot("device-07-paid");

console.log("sale 2: $4.20 in SOL, simulated expiry");
await tap(T.paidNewSale);
await waitFor((s) => s.screen === "amount" && s.price === "0.00", "fresh keypad");
await tap(T.keys[4]);
await tap(T.keys[2]);
await tap(T.keys[0]);
await waitFor((s) => s.price === "4.20", "$4.20", 5000);
await tap(T.amountNext);
await waitFor((s) => s.screen === "pay", "choose token");
await tap(T.asset.sol);
q = await waitFor((s) => s.screen === "quote" || s.screen === "error", "quote", 30000);
ok(q.screen === "quote" && q.verified && (q.qr ?? "").startsWith(`solana:${q.depositAddress}?amount=`), `SOL quote: send ${q.amountIn} SOL, Solana Pay QR, signed by 1Click`);
r = await api("/api/simulate", { action: "expire" });
ok(r.ok, "demo controller: Simulate expired");
const e = await waitFor((s) => s.screen === "ended", "expired screen", 3000);
ok(e.ended === "expired", "till shows expired");
await shot("device-08-expired");
r = await api("/api/simulate", { action: "paid" });
ok(!r.ok && r.error === "no_open_quote", "simulate is refused when no quote is open");
await tap(T.endedHome);
await waitFor((s) => s.screen === "home", "home");

console.log(failures ? `\n${failures} FAILED` : "\nend-to-end DEMO passed");
process.exit(failures ? 1 : 0);
