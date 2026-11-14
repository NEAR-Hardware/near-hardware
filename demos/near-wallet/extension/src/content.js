// Isolated-world content script: the bridge between the page (inpage.js) and
// the extension. Account lookups are answered here from storage; anything
// that needs the watch goes to the background, which opens the wallet window.
const origin = window.location.origin;

const reply = (id, ok, payload) =>
  window.postMessage({ target: "nhw-inpage", id, ok, ...(ok ? { result: payload } : { error: payload }) }, origin);

// the network of the last watch the wallet window talked to (from its "info")
const accountNetwork = (account) => account?.network ?? "testnet";

async function accounts(network) {
  const { account, origins = {} } = await chrome.storage.local.get(["account", "origins"]);
  if (!account || !origins[origin]) return [];
  if (network && network !== accountNetwork(account)) return [];
  return [{ accountId: account.accountId, publicKey: account.publicKey }];
}

window.addEventListener("message", async (e) => {
  if (e.source !== window || e.data?.target !== "nhw-content") return;
  const { id, method, params } = e.data;
  try {
    if (method === "getAccounts") return reply(id, true, await accounts(params?.network));
    if (method === "signOut") {
      const { origins = {} } = await chrome.storage.local.get("origins");
      delete origins[origin];
      await chrome.storage.local.set({ origins });
      return reply(id, true, undefined);
    }
    // signIn may bring a different watch, so only the wallet window (which asks
    // the watch itself) judges it; everything else fails fast here
    const { account } = await chrome.storage.local.get("account");
    if (method !== "signIn" && account && params?.network && params.network !== accountNetwork(account))
      return reply(id, false, `The connected watch signs for ${accountNetwork(account)} only, not ${params.network}`);
    const res = await chrome.runtime.sendMessage({ type: "nhw:request", id, method, params, origin });
    if (!res?.queued) reply(id, false, res?.error ?? "could not open the wallet window");
  } catch (err) {
    reply(id, false, String(err?.message ?? err));
  }
});

// results come back from the wallet window
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type !== "nhw:result") return;
  reply(msg.id, msg.ok, msg.ok ? msg.result : msg.error);
});
