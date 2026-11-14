// End-to-end proof that the watch signs real NEAR transactions.
//
//   node tools/watch-sign.mjs [--network testnet|mainnet] ["greeting text"]
//
// 1. asks the watch for its account (implicit account of its ed25519 key)
//    and checks its firmware is built for --network (default testnet)
// 2. builds set_greeting on hello.near-examples.<testnet|near> with the key's
//    nonce and a recent block hash from that network's RPC
// 3. sends the Borsh bytes to the watch, you approve on the watch + PIN
// 4. checks the signature locally, attaches it and broadcasts
import { actions, baseDecode, createTransaction, JsonRpcProvider, PublicKey, Signature, SignedTransaction }
  from "near-api-js";
import { Watch } from "./watch-serial.mjs";

const NETWORKS = {
  testnet: { rpc: "https://rpc.testnet.fastnear.com", explorer: "https://testnet.nearblocks.io", contract: "hello.near-examples.testnet" },
  mainnet: { rpc: "https://rpc.mainnet.fastnear.com", explorer: "https://nearblocks.io", contract: "hello.near-examples.near" },
};
const args = process.argv.slice(2);
const at = args.indexOf("--network");
const NETWORK = at >= 0 ? args.splice(at, 2)[1] : "testnet";
if (!NETWORKS[NETWORK]) throw new Error(`--network must be testnet or mainnet, not ${NETWORK}`);
const { rpc: RPC, explorer: EXPLORER, contract: CONTRACT } = NETWORKS[NETWORK];
const greeting = args[0] ?? `hello from my watch, ${new Date().toISOString().slice(11, 19)} UTC`;

const provider = new JsonRpcProvider({ url: RPC });
const watch = new Watch();
await watch.open();

try {
  const info = await watch.request({ cmd: "info" });
  if (info.state === "no_wallet") throw new Error("the watch has no wallet yet: tap gen wallet on it first");
  const watchNet = info.network ?? "testnet";
  if (watchNet !== NETWORK) throw new Error(`the watch firmware signs for ${watchNet}, not ${NETWORK}: flash the ${NETWORK} env or pass --network ${watchNet}`);
  const { accountId, publicKey } = info;
  console.log(`network        ${NETWORK}`);
  console.log(`watch account  ${accountId}`);
  console.log(`watch key      ${publicKey}`);

  const account = await provider.viewAccount({ accountId });
  await watch.request({
    cmd: "set_status",
    time: Math.floor(Date.now() / 1000),
    utcOffset: -new Date().getTimezoneOffset(),
    balance: String(account.amount),
  });

  const pk = PublicKey.fromString(publicKey);
  const key = await provider.viewAccessKey({ accountId, publicKey });
  const block = await provider.viewBlock({ finality: "final" });
  const tx = createTransaction(accountId, pk, CONTRACT, BigInt(key.nonce) + 1n,
    [actions.functionCall("set_greeting", { greeting }, 30_000_000_000_000n, 0n)],
    baseDecode(block.header.hash));
  const bytes = tx.encode();

  console.log(`\nset_greeting("${greeting}") on ${CONTRACT}`);
  console.log("approve it on your watch and enter your PIN...");
  const res = await watch.request(
    { cmd: "sign_tx", tx: Buffer.from(bytes).toString("base64"), network: NETWORK, timeout: 120 },
    { timeoutMs: 130_000, onEvent: (e) => e.event === "review" && console.log("(the watch is showing the transaction)") });
  if (!res.ok) throw new Error(`watch said: ${res.error}`);

  const sig = Buffer.from(res.signature, "base64");
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  if (!pk.verify(hash, sig)) throw new Error("signature does not verify against the watch key");
  console.log("signature verified locally, broadcasting...");

  const signed = new SignedTransaction({ transaction: tx, signature: new Signature({ keyType: pk.keyType, data: sig }) });
  const outcome = await provider.sendTransaction(signed);
  const status = outcome.status;
  if (typeof status === "object" && "Failure" in status) throw new Error(JSON.stringify(status.Failure));
  const txHash = outcome.transaction.hash;
  console.log(`\nsuccess  ${EXPLORER}/txns/${txHash}`);

  const now = await provider.callFunction({ contractId: CONTRACT, method: "get_greeting", args: {}, blockQuery: { finality: "optimistic" } });
  console.log(`get_greeting -> "${now}"`);
  const after = await provider.viewAccount({ accountId });
  await watch.request({ cmd: "set_status", balance: String(after.amount) });
} finally {
  watch.close();
}
