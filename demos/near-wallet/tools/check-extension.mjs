// Smoke test for the extension + test site in Chrome for Testing (branded
// Chrome ignores --load-extension). It cannot pick the watch in the native
// serial chooser, so it stops at the wallet window's "connect your watch".
//
//   CHROME=".../Google Chrome for Testing" node tools/check-extension.mjs [http://localhost:5173]
import puppeteer from "puppeteer-core";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ext = path.join(root, "extension");
const site = process.argv[2] ?? "http://localhost:4173";
const shots = path.join(root, "tools", "screenshots");
const chrome = process.env.CHROME ??
  `${process.env.HOME}/.cache/puppeteer/chrome/mac_arm-148.0.7778.97/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: "new",
  userDataDir: mkdtempSync(path.join(tmpdir(), "nhw-chrome-")),
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`, "--window-size=1200,900"],
});

const errors = [];
try {
  const sw = await browser.waitForTarget((t) => t.type() === "service_worker" && t.url().includes("background.js"), { timeout: 10000 });
  console.log("ok   extension service worker running:", sw.url().split("/")[2]);

  const page = await browser.newPage();
  page.on("pageerror", (e) => errors.push(`page: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text()}`));
  await page.setViewport({ width: 1200, height: 900 });
  await page.goto(site, { waitUntil: "networkidle0" });
  await page.screenshot({ path: path.join(shots, "1-site.png") });
  const greeting = await page.$eval("#greeting", (e) => e.textContent);
  console.log("ok   site loaded, greeting:", greeting);

  await page.click("#login");
  // NEAR Connect's picker lists each wallet as .connect-item[data-type=<id>]
  const item = '.connect-item[data-type="near-hardware-wallet"]';
  const found = await page.waitForSelector(item, { timeout: 20000 }).then(() => true).catch(() => false);
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(shots, "2-picker.png") });
  console.log(found ? "ok   NEAR Hardware Wallet is listed in NEAR Connect" : "FAIL wallet not listed in the picker");

  if (found) {
    const popupTarget = browser.waitForTarget((t) => t.url().includes("wallet.html"), { timeout: 15000 });
    await page.click(item);
    const t = await popupTarget;
    const wallet = await t.page();
    wallet.on("pageerror", (e) => errors.push(`wallet: ${e.message}`));
    await wallet.setViewport({ width: 400, height: 660 });
    await wallet.waitForSelector("#connect", { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 800));
    await wallet.screenshot({ path: path.join(shots, "3-wallet-window.png") });
    console.log("ok   wallet window opened:", await wallet.$eval("h1", (e) => e.innerText.replace(/\n/g, " ")));
  }
} finally {
  if (errors.length) console.log("errors:\n  " + errors.join("\n  "));
  await browser.close();
}
