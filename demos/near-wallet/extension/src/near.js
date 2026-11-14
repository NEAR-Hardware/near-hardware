// Building, signing (on the watch) and sending NEAR transactions. The network
// is whatever the watch's firmware was built for (its "info" answer).
import { actions, baseDecode, createTransaction, JsonRpcProvider, PublicKey, Signature, SignedTransaction }
  from "near-api-js";

export const NETWORKS = {
  testnet: { rpc: "https://rpc.testnet.fastnear.com", explorer: "https://testnet.nearblocks.io" },
  mainnet: { rpc: "https://rpc.mainnet.fastnear.com", explorer: "https://nearblocks.io" },
};
// firmware older than the mainnet build answered "testnet" or nothing
export const watchNetwork = (info) => (info?.network === "mainnet" ? "mainnet" : "testnet");
export const explorer = (network) => NETWORKS[network].explorer;
const providers = {};
export const providerFor = (network) =>
  (providers[network] ??= new JsonRpcProvider({ url: NETWORKS[network].rpc }));

const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const toB64 = (u8) => {
  let s = "";
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return btoa(s);
};
const bytes = (v) => (v?.$bytes ? fromB64(v.$bytes) : v instanceof Uint8Array ? v : new Uint8Array(Object.values(v ?? {})));

// NEAR Connect hands wallets "ConnectorAction"s; map them to near-api-js actions
export function toAction(a) {
  const p = a.params ?? {};
  switch (a.type) {
    case "FunctionCall": {
      const args = p.args?.$bytes ? fromB64(p.args.$bytes) : p.args ?? {};
      return actions.functionCall(p.methodName, args, BigInt(p.gas ?? "30000000000000"), BigInt(p.deposit ?? "0"));
    }
    case "Transfer": return actions.transfer(BigInt(p.deposit));
    case "CreateAccount": return actions.createAccount();
    case "DeployContract": return actions.deployContract(bytes(p.code));
    case "Stake": return actions.stake(BigInt(p.stake), PublicKey.fromString(p.publicKey));
    case "AddKey": {
      if (p.gasKeyInfo) throw new Error("Gas keys are not supported by NEAR Hardware Wallet");
      const pk = PublicKey.fromString(p.publicKey);
      const perm = p.accessKey?.permission;
      if (perm === "FullAccess") return actions.addFullAccessKey(pk);
      return actions.addFunctionCallAccessKey(pk, perm.receiverId, perm.methodNames ?? [],
        perm.allowance != null ? BigInt(perm.allowance) : undefined);
    }
    case "DeleteKey": return actions.deleteKey(PublicKey.fromString(p.publicKey));
    case "DeleteAccount": return actions.deleteAccount(p.beneficiaryId);
    default: throw new Error(`${a.type} is not supported by NEAR Hardware Wallet`);
  }
}

const yoctoToNear = (y) => {
  const s = BigInt(y).toString().padStart(25, "0");
  const whole = s.slice(0, -24), frac = s.slice(-24).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
};

// one-line summary per action for the window (the watch shows its own decode)
export function describe(a) {
  const p = a.params ?? {};
  switch (a.type) {
    case "FunctionCall": {
      const dep = BigInt(p.deposit ?? "0");
      return `call ${p.methodName}${dep ? ` + ${yoctoToNear(dep)} NEAR` : ""}`;
    }
    case "Transfer": return `send ${yoctoToNear(p.deposit)} NEAR`;
    case "AddKey": return p.accessKey?.permission === "FullAccess" ? "add FULL ACCESS key" : "add limited key";
    case "DeleteAccount": return "DELETE ACCOUNT";
    default: return a.type;
  }
}

export async function accountBalance(accountId, network) {
  try {
    const a = await providerFor(network).viewAccount({ accountId });
    return String(a.amount);
  } catch {
    return null;
  }
}

export { yoctoToNear };

// Build every transaction up front with consecutive nonces, then have the
// watch sign them one by one, sending each as soon as it is signed.
export async function signAndSend({ watch, network, accountId, publicKey, transactions, onStep }) {
  const provider = providerFor(network);
  const pk = PublicKey.fromString(publicKey);
  const key = await provider.viewAccessKey({ accountId, publicKey });
  const block = await provider.viewBlock({ finality: "final" });
  const blockHash = baseDecode(block.header.hash);
  let nonce = BigInt(key.nonce);
  const outcomes = [];
  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    const tx = createTransaction(accountId, pk, t.receiverId, ++nonce, t.actions.map(toAction), blockHash);
    const encoded = tx.encode();
    onStep?.({ phase: "watch", index: i, total: transactions.length, tx: t });
    const res = await watch.request(
      { cmd: "sign_tx", tx: toB64(encoded), network, timeout: 120 },
      { timeoutMs: 130_000 },
    );
    if (!res.ok) throw watchError(res.error, network);
    const sig = fromB64(res.signature);
    const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", encoded));
    if (!pk.verify(hash, sig)) throw new Error("The watch returned a signature that does not verify");
    onStep?.({ phase: "send", index: i, total: transactions.length, tx: t });
    const signed = new SignedTransaction({ transaction: tx, signature: new Signature({ keyType: pk.keyType, data: sig }) });
    const outcome = await provider.sendTransaction(signed);
    outcomes.push(JSON.parse(JSON.stringify(outcome, (_, v) => (typeof v === "bigint" ? v.toString() : v))));
    onStep?.({ phase: "sent", index: i, total: transactions.length, tx: t, hash: outcome.transaction.hash });
  }
  return outcomes;
}

export function watchError(code, network) {
  const map = {
    rejected: "User rejected the request on the watch",
    timeout: "Timed out waiting for approval on the watch",
    cancelled: "The request was cancelled",
    busy: "The watch is busy with another request",
    no_wallet: "The watch has no wallet yet. Tap gen wallet on the watch first",
    setup_in_progress: "Finish setting up the wallet on the watch first",
    wrong_key: "This transaction is for a different key than the watch's",
    wiped: "The wallet was wiped after too many wrong PINs",
    network_not_allowed: `The watch does not sign for ${network ?? "this network"}`,
  };
  return new Error(map[code] ?? `Watch error: ${code}`);
}

export { fromB64, toB64 };
