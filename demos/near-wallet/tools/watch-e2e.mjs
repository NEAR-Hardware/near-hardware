// Runs the extension's own signing code (extension/src/near.js) from Node
// against the real watch, so the browser path is proven before clicking:
//   1. NEP-413 sign_message on the watch, verified with near-api-js/nep413
//      (which also checks the key is a full-access key of the account)
//   2. signAndSend() with a NEAR Connect style ConnectorAction (set_greeting)
//
//   node tools/watch-e2e.mjs            # both, on testnet
//   node tools/watch-e2e.mjs message    # only NEP-413
//   node tools/watch-e2e.mjs --network mainnet [message|tx]   # needs the mainnet firmware
import * as esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { JsonRpcProvider } from "near-api-js";
import { verifyMessage } from "near-api-js/nep413";
import { Watch } from "./watch-serial.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, ".cache", "near-ext.mjs");
await esbuild.build({
  entryPoints: [path.join(here, "..", "extension", "src", "near.js")],
  outfile: out, bundle: true, platform: "node", format: "esm", logLevel: "warning", packages: "external",
  nodePaths: [path.join(here, "node_modules")],
});
const { signAndSend, explorer, NETWORKS, watchNetwork } = await import(pathToFileURL(out).href);

const args = process.argv.slice(2);
const at = args.indexOf("--network");
const network = at >= 0 ? args.splice(at, 2)[1] : "testnet";
if (!NETWORKS[network]) throw new Error(`--network must be testnet or mainnet, not ${network}`);
const CONTRACT = { testnet: "hello.near-examples.testnet", mainnet: "hello.near-examples.near" }[network];
const only = args[0];
const provider = new JsonRpcProvider({ url: NETWORKS[network].rpc });
const watch = new Watch();
await watch.open();
try {
  const info = await watch.request({ cmd: "info" });
  console.log(`watch ${info.state}  ${watchNetwork(info)}  ${info.accountId}`);
  if (watchNetwork(info) !== network) throw new Error(`the watch firmware signs for ${watchNetwork(info)}, not ${network}`);

  if (!only || only === "message") {
    const nonce = crypto.getRandomValues(new Uint8Array(32));
    const payload = { message: "I own this account. Signed on my watch.", recipient: "near-watch-demo", nonce };
    console.log("\nNEP-413: approve the message on the watch + PIN...");
    const res = await watch.request({ cmd: "sign_message", message: payload.message, recipient: payload.recipient,
      nonce: Buffer.from(nonce).toString("base64"), network, timeout: 120 }, { timeoutMs: 130_000 });
    if (!res.ok) throw new Error(`watch said: ${res.error}`);
    await verifyMessage({ signerAccountId: res.accountId, signerPublicKey: res.publicKey, payload,
      signature: Buffer.from(res.signature, "base64"), provider });
    console.log(`ok  NEP-413 signature verified, key is full access on ${res.accountId.slice(0, 8)}…`);
  }

  if (!only || only === "tx") {
    const greeting = `set via the extension code path, ${new Date().toISOString().slice(11, 19)} UTC`;
    console.log(`\nset_greeting("${greeting}"): approve on the watch + PIN...`);
    const [outcome] = await signAndSend({
      watch, network, accountId: info.accountId, publicKey: info.publicKey,
      transactions: [{
        receiverId: CONTRACT,
        actions: [{ type: "FunctionCall", params: { methodName: "set_greeting", args: { greeting }, gas: "30000000000000", deposit: "0" } }],
      }],
      onStep: (s) => s.phase !== "watch" && console.log(`    ${s.phase}${s.hash ? " " + s.hash : ""}`),
    });
    const ok = typeof outcome.status === "object" && "SuccessValue" in outcome.status;
    console.log(`${ok ? "ok " : "FAIL"} ${explorer(network)}/txns/${outcome.transaction.hash}`);
  }
} finally {
  watch.close();
}
