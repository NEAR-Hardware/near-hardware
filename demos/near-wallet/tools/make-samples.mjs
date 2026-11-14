// Builds sample transactions and a NEP-413 message with near-api-js, signed
// with the PUBLIC test phrase from the task, and writes them to
// firmware/sim/samples.txt. The host simulator decodes and signs the same
// bytes with the firmware's code; the signatures must match byte for byte.
//
//   node tools/make-samples.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { actions, createTransaction, KeyPairSigner, PublicKey } from "near-api-js";
import { parseSeedPhrase } from "near-api-js/seed-phrase";

const PHRASE = "shoot island position soft burden budget tooth cruel issue economy destroy above";
const kp = parseSeedPhrase(PHRASE);
const signer = new KeyPairSigner(kp);
const pk = kp.getPublicKey();
const account = Buffer.from(pk.data).toString("hex");
const blockHash = new Uint8Array(32).fill(7);
const NEAR = 10n ** 24n;

const txs = {
  set_greeting: ["hello.near-examples.testnet", [actions.functionCall("set_greeting", { greeting: "hello from my watch" }, 30_000_000_000_000n, 0n)]],
  transfer: ["bob.testnet", [actions.transfer(15n * NEAR / 10n)]],
  add_fc_key: [account, [actions.addFunctionCallAccessKey(
    PublicKey.fromString("ed25519:APtL2MZsdnFTY2WcsrBxTNzae3uD6juwdMFN31BgL7RP"),
    "hello.near-examples.testnet", ["set_greeting"], NEAR / 4n)]],
  create_sub: ["sub.bob.testnet", [actions.createAccount(), actions.transfer(NEAR / 10n),
    actions.addFullAccessKey(pk)]],
  delete_acct: [account, [actions.deleteAccount("bob.testnet")]],
};

const lines = [];
let nonce = 100n;
for (const [name, [receiver, acts]] of Object.entries(txs)) {
  const tx = createTransaction(account, pk, receiver, nonce++, acts, blockHash);
  const { signedTransaction } = await signer.signTransaction(tx);
  lines.push(["tx", name, Buffer.from(tx.encode()).toString("base64"),
    Buffer.from(signedTransaction.signature.data).toString("base64")].join("\t"));
}

const msg = { message: "log in to the NEAR watch demo", recipient: "near-watch-demo", nonce: new Uint8Array(32).fill(9) };
const signed = await signer.signNep413Message(account, msg);
lines.push(["msg", msg.message, msg.recipient, Buffer.from(msg.nonce).toString("base64"),
  Buffer.from(signed.signature).toString("base64")].join("\t"));

const out = fileURLToPath(new URL("../firmware/sim/samples.txt", import.meta.url));
writeFileSync(out, lines.join("\n") + "\n");
console.log(`wrote ${lines.length} samples to ${out} (account ${account})`);
