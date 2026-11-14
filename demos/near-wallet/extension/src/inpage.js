// Runs in the page's own JS world (content script with "world": "MAIN").
// Announces the wallet to NEAR Connect through the near-wallet-injected
// event, and forwards every call to the isolated content script.
import ICON from "../icons/icon128.png";

const manifest = {
  id: "near-hardware-wallet",
  name: "NEAR Hardware Wallet",
  icon: ICON,
  description: "Your key lives on a watch. Approve every signature on it.",
  website: "https://near.org",
  version: "1.0.0",
  executor: "",
  type: "injected",
  platform: ["chrome"],
  permissions: { storage: true },
  features: {
    signMessage: true,
    signTransaction: false,
    signAndSendTransaction: true,
    signAndSendTransactions: true,
    signInWithoutAddKey: true,
    signInAndSignMessage: false,
    signInWithFunctionCallKey: false,
    signDelegateActions: false,
    // the watch's firmware is built for one of them; content.js and the
    // wallet window refuse requests for the other
    mainnet: true,
    testnet: true,
  },
};

// Uint8Array does not survive chrome.runtime messaging (JSON), so wrap it
const enc = (v) => {
  if (v instanceof Uint8Array) {
    let s = "";
    for (const b of v) s += String.fromCharCode(b);
    return { $bytes: btoa(s) };
  }
  if (typeof v === "bigint") return v.toString();
  if (Array.isArray(v)) return v.map(enc);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)]));
  return v;
};

let seq = 0;
const pending = new Map();

window.addEventListener("message", (e) => {
  if (e.source !== window || e.data?.target !== "nhw-inpage") return;
  const p = pending.get(e.data.id);
  if (!p) return;
  pending.delete(e.data.id);
  if (e.data.ok) p.resolve(e.data.result);
  else p.reject(new Error(e.data.error || "NEAR Hardware Wallet error"));
});

function call(method, params) {
  const id = `nhw-${Date.now()}-${++seq}`;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    window.postMessage({ target: "nhw-content", id, method, params: enc(params ?? {}) }, window.location.origin);
  });
}

const wallet = {
  manifest,
  signIn: (data) => call("signIn", data),
  signInAndSignMessage: () => Promise.reject(new Error("signInAndSignMessage is not supported")),
  signOut: (data) => call("signOut", data),
  getAccounts: (data) => call("getAccounts", data),
  signAndSendTransaction: (params) => call("signAndSendTransaction", params),
  signAndSendTransactions: (params) => call("signAndSendTransactions", params),
  signMessage: (params) => call("signMessage", params),
  signDelegateActions: () => Promise.reject(new Error("signDelegateActions is not supported")),
};

const announce = () => window.dispatchEvent(new CustomEvent("near-wallet-injected", { detail: wallet }));
// NEAR Connect fires near-selector-ready when it starts; answer it, and also
// announce once in case the connector is already listening
window.addEventListener("near-selector-ready", announce);
announce();
