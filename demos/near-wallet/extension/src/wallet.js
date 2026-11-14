// The wallet window. Holds the Web Serial connection to the watch, works
// through the queue of page requests, and answers each page.
import { WatchConnection } from "./watch-webserial.js";
import { accountBalance, describe, explorer, signAndSend, watchError, watchNetwork, yoctoToNear } from "./near.js";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const short = (a) => (a && a.length > 20 ? `${a.slice(0, 6)}…${a.slice(-6)}` : a ?? "");
const mode = new URLSearchParams(location.search).get("mode") ?? "requests";

let watch = null;
let info = null;
let busy = false;
let price = null;
let connectResolve = null;
// the watch's network once it answered "info", else the last one we saw
let network = "testnet";

function setNetwork(n) {
  network = n;
  $("foot").textContent = price ? `$${price.toFixed(2)}  ${network}` : network;
}

// ------------------------------------------------------------------ views
function view(html) { $("view").innerHTML = html; }

function showConnect(reason = "") {
  view(`
    <h1>connect<br>your watch</h1>
    <img class="px mascot" src="img/usb.png" width="56" height="48" alt="">
    <p>plug the watch into this computer with USB, then pick it in the list.</p>
    ${reason ? `<p class="alert">${esc(reason)}</p>` : ""}
    <button class="btn" id="connect">connect watch</button>
    <img class="peek" src="img/mascot-peek.png" width="80" alt="">`);
  $("connect").onclick = async () => {
    try {
      const port = await WatchConnection.choose();
      await openPort(port);
      connectResolve?.();
    } catch (e) {
      if (e?.name !== "NotFoundError") showConnect(e.message);
    }
  };
}

function showWaiting(title, req, lines, note = "check the watch: tap approve, then enter your PIN") {
  view(`
    <h1>${title}</h1>
    <div class="site">${esc(req.origin)}</div>
    <img class="px mascot" src="img/mascot-solder.png" width="171" height="148" alt="">
    <div class="card">${lines}</div>
    <p class="blink">${esc(note)}</p>`);
}

function showDone(title, html) {
  view(`
    <img class="px mascot" src="img/check.png" width="60" height="48" alt="" style="margin-top:30px">
    <h1 class="big">${title}</h1>
    ${html}
    <img class="peek" src="img/mascot-peek.png" width="80" alt="">`);
}

function showError(msg) {
  view(`
    <h1 class="big alert" style="margin-top:40px">oops</h1>
    <p class="alert">${esc(msg)}</p>
    <button class="btn" id="close">close</button>
    <img class="peek" src="img/mascot-peek.png" width="80" alt="">`);
  $("close").onclick = () => window.close();
}

async function showStatus() {
  const { account } = await chrome.storage.local.get("account");
  const acc = info?.accountId ?? account?.accountId;
  if (!acc) {
    view(`<h1>NEAR<br>hardware wallet</h1>
      <img class="px mascot" src="img/mascot-solder.png" width="171" height="148" alt="">
      <p>${watch ? "the watch has no wallet yet. tap gen wallet on it." : "connect the watch to see its account."}</p>
      ${watch ? "" : `<button class="btn" id="connect2">connect watch</button>`}`);
    $("connect2")?.addEventListener("click", () => showConnect());
    return;
  }
  const bal = await accountBalance(acc, network);
  view(`
    <img class="px mascot" src="img/portrait.png" width="120" height="117" alt="">
    <h1>your vault</h1>
    <p class="dim">${esc(short(acc))}</p>
    <h1 style="font-size:16px">${bal ? (+yoctoToNear(bal)).toFixed(4) : "0"} NEAR</h1>
    <div class="card"><span class="k">account</span><br>${esc(acc)}</div>
    <div class="row">
      <button class="btn" id="copy">copy id</button>
      <a class="btn" href="${explorer(network)}/address/${acc}" target="_blank">explorer</a>
    </div>`);
  $("copy").onclick = () => navigator.clipboard.writeText(acc);
}

// ------------------------------------------------------------------ the watch
async function openPort(port) {
  const w = new WatchConnection(port);
  await w.open();
  w.onClose = () => {
    if (watch === w) watch = null;
    $("link").src = "img/wifi-off.png";
  };
  watch = w;
  info = await w.request({ cmd: "info" });
  setNetwork(watchNetwork(info));
  $("link").src = "img/wifi.png";
  pushStatus();
}

async function pushStatus() {
  if (!watch) return;
  const status = { cmd: "set_status", time: Math.floor(Date.now() / 1000), utcOffset: -new Date().getTimezoneOffset() };
  if (info?.accountId) {
    const bal = await accountBalance(info.accountId, network);
    if (bal) status.balance = bal;
  }
  if (price) status.price = price;
  await watch.request(status).catch(() => {});
}

async function ensureWatch() {
  if (watch && !watch.closed) return watch;
  const granted = await WatchConnection.granted();
  if (granted) {
    try {
      await openPort(granted);
      return watch;
    } catch (e) {
      showConnect(e.message);
    }
  } else {
    showConnect();
  }
  await new Promise((r) => (connectResolve = r));
  connectResolve = null;
  return watch;
}

// wanted: the network the page asked for (NEAR Connect always sends one)
async function ensureAccount(wanted) {
  await ensureWatch();
  info = await watch.request({ cmd: "info" });
  setNetwork(watchNetwork(info));
  if (info.state === "no_wallet") throw watchError(info.setup ? "setup_in_progress" : "no_wallet");
  await chrome.storage.local.set({ account: { accountId: info.accountId, publicKey: info.publicKey, network } });
  if (wanted && wanted !== network)
    throw new Error(`This watch signs for ${network} only, but the site asked for ${wanted}`);
  return info;
}

// ------------------------------------------------------------------ requests
async function handle(req) {
  const p = req.params ?? {};
  switch (req.method) {
    case "signIn": {
      view(`<h1>connecting<span class="dots"></span></h1>`);
      const acc = await ensureAccount(p.network);
      const { origins = {} } = await chrome.storage.local.get("origins");
      origins[req.origin] = true;
      await chrome.storage.local.set({ origins });
      await pushStatus();
      showDone("hello!", `<p>${esc(req.origin)}<br>can now see</p><p class="dim">${esc(short(acc.accountId))}</p>`);
      return [{ accountId: acc.accountId, publicKey: acc.publicKey }];
    }

    case "signMessage": {
      const acc = await ensureAccount(p.network);
      if (p.signerId && p.signerId !== acc.accountId) throw new Error(`The watch holds ${acc.accountId}, not ${p.signerId}`);
      const nonce = p.nonce?.$bytes;
      if (!nonce) throw new Error("signMessage needs a 32 byte nonce");
      showWaiting("sign message?", req,
        `<span class="k">for</span> ${esc(p.recipient)}<br><span class="k">message</span><br>${esc(p.message)}`);
      const res = await watch.request(
        { cmd: "sign_message", message: p.message, recipient: p.recipient, nonce, callbackUrl: p.callbackUrl, network, timeout: 120 },
        { timeoutMs: 130_000 });
      if (!res.ok) throw watchError(res.error, network);
      showDone("signed!", `<p>message signed<br>by your watch</p>`);
      return { accountId: acc.accountId, publicKey: acc.publicKey, signature: res.signature };
    }

    case "signAndSendTransaction":
    case "signAndSendTransactions": {
      const acc = await ensureAccount(p.network);
      if (p.signerId && p.signerId !== acc.accountId) throw new Error(`The watch holds ${acc.accountId}, not ${p.signerId}`);
      const txs = req.method === "signAndSendTransaction" ? [{ receiverId: p.receiverId, actions: p.actions }] : p.transactions;
      const links = [];
      const outcomes = await signAndSend({
        watch, network, accountId: acc.accountId, publicKey: acc.publicKey, transactions: txs,
        onStep: ({ phase, index, total, tx, hash }) => {
          const n = total > 1 ? ` ${index + 1}/${total}` : "";
          const lines = `<span class="k">to</span> ${esc(tx.receiverId)}<br>` +
            tx.actions.map((a) => esc(describe(a))).join("<br>");
          if (phase === "watch") showWaiting(`approve on<br>your watch${n}`, req, lines);
          if (phase === "send") showWaiting(`sending${n}<span class="dots"></span>`, req, lines, "signed on the watch, broadcasting");
          if (phase === "sent") links.push(hash);
        },
      });
      for (const o of outcomes) {
        const st = o.status;
        if (st && typeof st === "object" && "Failure" in st) throw new Error(`Transaction failed: ${JSON.stringify(st.Failure).slice(0, 300)}`);
      }
      await pushStatus();
      showDone("sent!", links.map((h) =>
        `<p class="link"><a href="${explorer(network)}/txns/${h}" target="_blank">${short(h)}</a></p>`).join("") +
        `<p class="dim">on ${network}</p>`);
      return req.method === "signAndSendTransaction" ? outcomes[0] : outcomes;
    }

    default:
      throw new Error(`${req.method} is not supported`);
  }
}

async function answer(req, ok, payload) {
  const { queue = [] } = await chrome.storage.session.get("queue");
  await chrome.storage.session.set({ queue: queue.filter((r) => r.id !== req.id) });
  if (req.tabId == null) return;
  await chrome.tabs.sendMessage(req.tabId,
    { type: "nhw:result", id: req.id, ok, ...(ok ? { result: payload } : { error: payload }) },
    { frameId: req.frameId }).catch(() => {});
}

async function work() {
  if (busy) return;
  busy = true;
  let lastOk = true, handled = 0;
  try {
    for (;;) {
      const { queue = [] } = await chrome.storage.session.get("queue");
      if (!queue.length) break;
      const req = queue[0];
      handled++;
      try {
        const result = await handle(req);
        await answer(req, true, result);
        lastOk = true;
      } catch (e) {
        await answer(req, false, String(e?.message ?? e));
        showError(String(e?.message ?? e));
        lastOk = false;
      }
    }
  } finally {
    busy = false;
  }
  if (handled && lastOk && mode === "requests") setTimeout(async () => {
    const { queue = [] } = await chrome.storage.session.get("queue");
    if (!queue.length && !busy) window.close();
  }, 2600);
}

// ------------------------------------------------------------------ boot
function tick() {
  const d = new Date();
  const h = d.getHours() % 12 || 12;
  $("clock").textContent = `${String(h).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}${d.getHours() < 12 ? "AM" : "PM"}`;
}

async function loadPrice() {
  try {
    const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=near&vs_currencies=usd");
    price = (await r.json())?.near?.usd ?? null;
    if (price) setNetwork(network);
  } catch {}
}

tick();
setInterval(tick, 10_000);
loadPrice().then(pushStatus);
// keep the watch's link icon lit while this window is open
setInterval(() => watch?.request({ cmd: "ping" }).catch(() => {}), 4000);
chrome.runtime.onMessage.addListener((m) => { if (m?.type === "nhw:queue-changed") work(); });
chrome.storage.session.onChanged.addListener((c) => { if (c.queue) work(); });
window.addEventListener("beforeunload", () => { watch?.request({ cmd: "cancel" }).catch(() => {}); });

(async () => {
  const { account } = await chrome.storage.local.get("account");
  setNetwork(account?.network ?? network);
  if (mode === "status") {
    const granted = await WatchConnection.granted();
    if (granted) await openPort(granted).catch(() => {});
    await showStatus();
  } else {
    view(`<h1>waking<br>the watch<span class="dots"></span></h1>`);
  }
  work();
})();
