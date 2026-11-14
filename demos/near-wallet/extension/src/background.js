// Service worker: queues requests from pages and opens one wallet window
// (an extension page, so it can hold the Web Serial connection to the watch).
// State lives in chrome.storage.session so a restarted worker loses nothing.

const WINDOW = { type: "popup", width: 400, height: 660 };

async function getState() {
  const { windowId = null, queue = [] } = await chrome.storage.session.get(["windowId", "queue"]);
  return { windowId, queue };
}

async function windowAlive(id) {
  if (id == null) return false;
  try {
    await chrome.windows.get(id);
    return true;
  } catch {
    return false;
  }
}

async function openWallet(mode = "requests") {
  const { windowId } = await getState();
  if (await windowAlive(windowId)) {
    await chrome.windows.update(windowId, { focused: true });
    chrome.runtime.sendMessage({ type: "nhw:queue-changed" }).catch(() => {});
    return;
  }
  const w = await chrome.windows.create({ ...WINDOW, url: chrome.runtime.getURL(`wallet.html?mode=${mode}`), focused: true });
  await chrome.storage.session.set({ windowId: w.id });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type !== "nhw:request") return;
  (async () => {
    const { queue } = await getState();
    queue.push({
      id: msg.id,
      method: msg.method,
      params: msg.params,
      origin: msg.origin,
      tabId: sender.tab?.id,
      frameId: sender.frameId ?? 0,
      at: Date.now(),
    });
    await chrome.storage.session.set({ queue });
    await openWallet();
    sendResponse({ queued: true });
  })().catch((e) => sendResponse({ error: String(e?.message ?? e) }));
  return true;
});

// Closing the window rejects whatever was still waiting
chrome.windows.onRemoved.addListener(async (closedId) => {
  const { windowId, queue } = await getState();
  if (closedId !== windowId) return;
  for (const r of queue) {
    if (r.tabId != null)
      chrome.tabs.sendMessage(r.tabId, { type: "nhw:result", id: r.id, ok: false, error: "User closed the wallet window" },
        { frameId: r.frameId }).catch(() => {});
  }
  await chrome.storage.session.set({ windowId: null, queue: [] });
});

chrome.action.onClicked.addListener(() => openWallet("status"));
