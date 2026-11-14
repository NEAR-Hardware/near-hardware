#!/usr/bin/env node
// NEAR Checkout companion: runs the till tethered over USB and serves the demo
// controller.
//
//   node tools/companion.mjs            then open http://localhost:8787
//
// - Relays the till's 1Click requests (POST /v0/quote, GET /v0/status) to
//   https://1click.chaindefuser.com and sends the answers back verbatim, the
//   same bytes the till would get over Wi-Fi. The till checks 1Click's quote
//   signature itself; the companion checks it too and logs it.
// - Keeps the till's clock set and checks that 1Click still lists every
//   payment asset (GET /v0/tokens).
// - Serves the demo controller: in DEMO mode "Simulate payment received" /
//   "Simulate expired" decide how a sale ends (the till still shows a real
//   1Click quote and QR, and still polls /v0/status), plus a live mirror of
//   the till's screen. In LIVE mode the till refuses both.
//
// It never signs or sends anything on any chain. Env: BOARD_PORT (default
// /dev/cu.usbmodem101), PORT (default 8787), ONECLICK_API_KEY (optional).
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { verifyQuoteSignature } from "@defuse-protocol/one-click-sdk-typescript";
import { Board, BOARD_PORT } from "./board-serial.mjs";
import { ASSETS, HERE, allowed, oneclick, shotToPng } from "./oneclick.mjs";

const HTTP_PORT = Number(process.env.PORT ?? 8787);
const ROOT = path.dirname(HERE);
const RECEIPTS = path.join(HERE, "receipts");

let board = null;
let connected = false;
let lastState = null;
let listed = 0;
const clients = new Set();
const logLines = [];

function log(msg, kind = "info") {
  const line = { t: new Date().toISOString().slice(11, 19), msg, kind };
  console.log(`${line.t} ${msg}`);
  logLines.push(line);
  if (logLines.length > 200) logLines.shift();
  broadcast("log", line);
}

function broadcast(type, data) {
  const s = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const c of clients) c.write(s);
}

// ------------------------------------------------------------------ 1Click
async function checkTokens() {
  try {
    const r = await oneclick("GET", "/v0/tokens");
    const tokens = JSON.parse(r.text);
    listed = 0;
    for (const a of ASSETS) {
      if (tokens.some((x) => x.assetId === a.assetId)) listed++;
      else log(`WARNING: 1Click no longer lists ${a.assetId} (${a.symbol} on ${a.chain})`, "error");
    }
    return true;
  } catch (e) {
    log(`could not load /v0/tokens: ${e.message}`, "error");
    return false;
  }
}

async function relay(ev) {
  const { rid, method, path: p, body } = ev;
  if (!allowed(method, p)) {
    log(`refused ${method} ${p}`, "error");
    board.send({ cmd: "http_result", rid, status: 0, body: "" });
    return;
  }
  let what = `${method} ${p.split("?")[0]}`;
  let req = null;
  if (body) {
    try {
      req = JSON.parse(body);
      const a = ASSETS.find((x) => x.assetId === req.originAsset);
      what += ` ${req.dry ? "dry " : ""}$${(Number(req.amount) / 1e6).toFixed(2)} in ${a ? `${a.symbol} on ${a.chain}` : req.originAsset}`;
    } catch {}
  }
  try {
    const r = await oneclick(method, p, body ?? undefined);
    board.send({ cmd: "http_result", rid, status: r.status, body: r.text });
    let note = "";
    if (p === "/v0/quote" && r.status >= 200 && r.status < 300) {
      const q = JSON.parse(r.text);
      note = ` ${q.quote.amountInFormatted} in, signature ${verifyQuoteSignature(q) ? "verified" : "NOT VERIFIED"}`;
      if (!q.quoteRequest.dry) {
        // 1Click: save the whole quote to resolve any dispute later
        fs.mkdirSync(RECEIPTS, { recursive: true });
        fs.writeFileSync(path.join(RECEIPTS, `${q.quote.depositAddress}.json`), JSON.stringify(q, null, 2));
        note += `, deposit ${q.quote.depositAddress} (saved to tools/receipts/)`;
      }
    } else if (p.startsWith("/v0/status") && r.status === 200) {
      note = ` ${JSON.parse(r.text).status}`;
    } else if (r.status >= 400) {
      try {
        note = ` ${JSON.parse(r.text).message}`;
      } catch {}
    }
    log(`${what} -> ${r.status} in ${r.ms} ms${note}`, r.status < 400 ? "ok" : "error");
  } catch (e) {
    board.send({ cmd: "http_result", rid, status: 0, body: "" });
    log(`${what} failed: ${e.message}`, "error");
  }
}

// ------------------------------------------------------------------ board
function hello() {
  return board.request({ cmd: "hello", time: Math.floor(Date.now() / 1000), utcOffset: -new Date().getTimezoneOffset() });
}

function setConnected(v) {
  if (v === connected) return;
  connected = v;
  broadcast("connection", { connected, port: BOARD_PORT });
  log(v ? `till connected on ${BOARD_PORT}` : "till disconnected", v ? "ok" : "error");
}

async function connect() {
  if (board?.isOpen) return;
  try {
    board = new Board(BOARD_PORT);
    board.onEvent = (ev) => {
      if (ev.event === "http") relay(ev);
      else if (ev.event === "state") {
        lastState = ev;
        broadcast("state", ev);
      } else if (ev.event === "boot") {
        log(`till booted, firmware ${ev.fw}`);
        if (ev.boot) log(`boot info: ${JSON.stringify(ev.boot)}`);
        hello().then((r) => (lastState = { event: "state", ...r.state })).catch(() => {});
      }
    };
    board.onClose = (e) => {
      setConnected(false);
      log(`serial closed: ${e.message}`, "error");
    };
    board.open();
    const r = await hello();
    lastState = { event: "state", ...r.state };
    broadcast("state", lastState);
    setConnected(true);
    log(`till firmware ${r.fw}, boot ${JSON.stringify(r.boot)}`);
  } catch (e) {
    board?.close();
    setConnected(false);
    if (!connect.warned) log(`can't open ${BOARD_PORT}: ${e.message} (is another serial monitor open?)`, "error");
    connect.warned = true;
  }
}

setInterval(async () => {
  if (!board?.isOpen) return connect();
  try {
    await hello();
    setConnected(true);
  } catch {
    setConnected(false);
  }
}, 2000);
setInterval(checkTokens, 10 * 60000);

// ------------------------------------------------------------------ demo controller
function json(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(obj));
}

async function readBody(req) {
  let s = "";
  for await (const c of req) s += c;
  try {
    return JSON.parse(s || "{}");
  } catch {
    return {};
  }
}

async function boardCmd(res, cmd, timeoutMs) {
  if (!board?.isOpen || !connected) return json(res, 503, { ok: false, error: "till_not_connected" });
  try {
    const r = await board.request(cmd, { timeoutMs });
    delete r.parts;
    json(res, r.ok ? 200 : 409, r);
  } catch (e) {
    json(res, 504, { ok: false, error: e.message });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(fs.readFileSync(path.join(HERE, "demo-controller.html")));
  }
  if (req.method === "GET" && url.pathname === "/font.ttf") {
    res.writeHead(200, { "Content-Type": "font/ttf" });
    return res.end(fs.readFileSync(path.join(ROOT, "firmware/assets/fonts/PressStart2P-Regular.ttf")));
  }
  if (req.method === "GET" && url.pathname === "/api/events") {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-store", Connection: "keep-alive" });
    clients.add(res);
    res.write(`event: connection\ndata: ${JSON.stringify({ connected, port: BOARD_PORT })}\n\n`);
    if (lastState) res.write(`event: state\ndata: ${JSON.stringify(lastState)}\n\n`);
    for (const l of logLines.slice(-30)) res.write(`event: log\ndata: ${JSON.stringify(l)}\n\n`);
    req.on("close", () => clients.delete(res));
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/state") return json(res, 200, { connected, state: lastState });
  if (req.method === "POST" && url.pathname === "/api/simulate") {
    const { action } = await readBody(req);
    if (action !== "paid" && action !== "expire") return json(res, 400, { ok: false, error: "action must be paid or expire" });
    log(`demo controller: simulate ${action === "paid" ? "payment received" : "expired"}`);
    return boardCmd(res, { cmd: "demo", action });
  }
  if (req.method === "POST" && url.pathname === "/api/tap") {
    const { x, y } = await readBody(req);
    return boardCmd(res, { cmd: "tap", x: Number(x), y: Number(y) });
  }
  if (req.method === "POST" && url.pathname === "/api/merchant") {
    const { account } = await readBody(req);
    return boardCmd(res, { cmd: "set_merchant", account: String(account ?? "") });
  }
  if (req.method === "POST" && url.pathname === "/api/demo-mode") return boardCmd(res, { cmd: "set_mode", mode: "demo" });
  if (req.method === "GET" && url.pathname === "/api/shot.png") {
    if (!board?.isOpen || !connected) return json(res, 503, { ok: false, error: "till_not_connected" });
    try {
      const r = await board.request({ cmd: "shot" }, { timeoutMs: 8000 });
      res.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "no-store" });
      return res.end(shotToPng(r.parts));
    } catch (e) {
      return json(res, 504, { ok: false, error: e.message });
    }
  }
  json(res, 404, { ok: false, error: "not_found" });
});

await checkTokens();
log(`1Click lists ${listed}/${ASSETS.length} payment assets`, listed === ASSETS.length ? "ok" : "error");
await connect();
server.listen(HTTP_PORT, "127.0.0.1", () => log(`demo controller on http://localhost:${HTTP_PORT}`, "ok"));
