import "./style.css";
import {
  balance, CONTRACT_ID, currentAccount, EXPLORER, greeting, NETWORK, onAccountChange, setGreeting, signAndVerifyMessage, signIn, signOut,
  walletName,
} from "./near";

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const short = (a: string) => (a.length > 20 ? `${a.slice(0, 6)}…${a.slice(-6)}` : a);

let account = "";

function status(html: string, kind: "" | "ok" | "err" | "wait" = "") {
  const el = $("status");
  el.className = `status ${kind}`;
  el.innerHTML = html;
}

async function refresh() {
  $("signedOut").hidden = !!account;
  $("signedIn").hidden = !account;
  $("accShort").textContent = account ? short(account) : "not connected";
  $("account").textContent = account;
  if (!account) {
    $("bal").textContent = NETWORK;
    return;
  }
  $("walletName").textContent = (await walletName()) || "?";
  try {
    const b = await balance(account);
    $("balance").textContent = `${b} NEAR`;
    $("bal").textContent = `${b} NEAR`;
  } catch {
    $("balance").textContent = `account not on ${NETWORK} yet`;
  }
}

async function loadGreeting() {
  try {
    $("greeting").textContent = `"${await greeting()}"`;
  } catch {
    $("greeting").textContent = "(could not read)";
  }
}

$("login").onclick = async () => {
  try {
    account = await signIn();
  } catch (e) {
    status(esc(e instanceof Error ? e.message : String(e)), "err");
  }
  refresh();
};

$("logout").onclick = async () => {
  await signOut().catch(() => {});
  account = "";
  status("");
  refresh();
};

$("setGreeting").onclick = async () => {
  const text = $<HTMLInputElement>("greetingInput").value.trim() || "hello from my watch";
  const btn = $<HTMLButtonElement>("setGreeting");
  btn.disabled = true;
  status("approve on your watch<span class='ell'></span>", "wait");
  try {
    const { link, hash } = await setGreeting(text);
    status(`done ✓ <a href="${link}" target="_blank" rel="noreferrer">${short(hash)}</a> on ${new URL(EXPLORER).host}`, "ok");
    await loadGreeting();
    refresh();
  } catch (e) {
    status(esc(e instanceof Error ? e.message : String(e)), "err");
  } finally {
    btn.disabled = false;
  }
};

$("signMessage").onclick = async () => {
  const msg = $<HTMLInputElement>("message").value.trim() || "hello";
  const btn = $<HTMLButtonElement>("signMessage");
  btn.disabled = true;
  status("approve on your watch<span class='ell'></span>", "wait");
  try {
    const r = await signAndVerifyMessage(msg);
    status(
      `${r.verified ? "signature verified ✓" : "signature NOT verified ✗"}<br>` +
        `<span class="k">signer</span> ${esc(short(r.accountId))}<br>` +
        `<span class="k">key</span> ${esc(r.publicKey)}<br>` +
        `<span class="k">recipient</span> ${esc(r.recipient)}<br>` +
        `<span class="k">signature</span> <span class="mono">${esc(r.signature)}</span>` +
        (r.verified ? "" : `<br>${esc(r.why)}`),
      r.verified ? "ok" : "err",
    );
  } catch (e) {
    status(esc(e instanceof Error ? e.message : String(e)), "err");
  } finally {
    btn.disabled = false;
  }
};

onAccountChange((id) => {
  account = id;
  refresh();
});

function tick() {
  const d = new Date();
  const h = d.getHours() % 12 || 12;
  $("clock").textContent = `${String(h).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}${d.getHours() < 12 ? "AM" : "PM"}`;
}
tick();
setInterval(tick, 10_000);
setInterval(loadGreeting, 15_000);

$("network").textContent = NETWORK;
$("contract").textContent = CONTRACT_ID;
$("mainnetNote").hidden = NETWORK !== "mainnet";
account = await currentAccount();
refresh();
loadGreeting();
console.log("explorer", EXPLORER);
