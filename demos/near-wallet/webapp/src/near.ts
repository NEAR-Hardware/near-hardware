import { NearConnector } from "@hot-labs/near-connect";
import { JsonRpcProvider, getTransactionLastResult, nearToYocto, teraToGas } from "near-api-js";
import { verifyMessage } from "near-api-js/nep413";

// VITE_NEAR_NETWORK=mainnet (npm run dev:mainnet) or testnet by default.
// The watch must run the firmware built for the same network.
export const NETWORK: "testnet" | "mainnet" = import.meta.env.VITE_NEAR_NETWORK === "mainnet" ? "mainnet" : "testnet";
const NETWORKS = {
  // the same hello contract from near-examples is deployed on both
  testnet: { contract: "hello.near-examples.testnet", rpc: "https://rpc.testnet.fastnear.com", explorer: "https://testnet.nearblocks.io" },
  mainnet: { contract: "hello.near-examples.near", rpc: "https://rpc.mainnet.fastnear.com", explorer: "https://nearblocks.io" },
};
export const CONTRACT_ID = NETWORKS[NETWORK].contract;
export const RPC_URL = NETWORKS[NETWORK].rpc;
export const EXPLORER = NETWORKS[NETWORK].explorer;

export const connector = new NearConnector({
  network: NETWORK,
  providers: { mainnet: [NETWORKS.mainnet.rpc], testnet: [NETWORKS.testnet.rpc] },
});
export const provider = new JsonRpcProvider({ url: RPC_URL });

export async function currentAccount(): Promise<string> {
  try {
    return (await connector.getConnectedWallet()).accounts[0]?.accountId ?? "";
  } catch {
    return "";
  }
}

export async function signIn(): Promise<string> {
  const [account] = await (await connector.connect()).getAccounts();
  return account?.accountId ?? "";
}

export async function signOut() {
  await connector.disconnect(await connector.wallet());
}

export function onAccountChange(cb: (accountId: string) => void) {
  connector.on("wallet:signIn", (e) => cb(e.accounts[0]?.accountId ?? ""));
  connector.on("wallet:signOut", () => cb(""));
}

export async function walletName(): Promise<string> {
  try {
    return (await connector.wallet()).manifest.name;
  } catch {
    return "";
  }
}

export async function balance(accountId: string): Promise<string> {
  const a = await provider.viewAccount({ accountId });
  const yocto = BigInt(a.amount);
  const whole = yocto / 10n ** 24n;
  const frac = (yocto % 10n ** 24n).toString().padStart(24, "0").slice(0, 4);
  return `${whole}.${frac}`;
}

export const greeting = () =>
  provider.callFunction({ contractId: CONTRACT_ID, method: "get_greeting", args: {}, blockQuery: { finality: "optimistic" } }) as Promise<string>;

export async function setGreeting(text: string) {
  const outcome = await (await connector.wallet()).signAndSendTransaction({
    receiverId: CONTRACT_ID,
    actions: [{
      type: "FunctionCall",
      params: { methodName: "set_greeting", args: { greeting: text }, gas: teraToGas(30).toString(), deposit: nearToYocto("0").toString() },
    }],
  });
  if (typeof outcome.status === "object" && "Failure" in outcome.status)
    throw new Error(`Transaction failed: ${JSON.stringify(outcome.status.Failure)}`);
  const hash = outcome.transaction.hash;
  return { result: getTransactionLastResult(outcome), hash, link: `${EXPLORER}/txns/${hash}` };
}

// NEP-413: the wallet signs off-chain; we check the signature and that the
// key really is a full-access key of the account, like a backend would
export async function signAndVerifyMessage(message: string) {
  const wallet = await connector.wallet();
  const nonce = crypto.getRandomValues(new Uint8Array(32));
  const recipient = window.location.host || "near-watch-demo";
  const signed = await wallet.signMessage({ message, recipient, nonce });
  const signature = Uint8Array.from(atob(signed.signature), (c) => c.charCodeAt(0));
  let verified = true;
  let why = "";
  try {
    await verifyMessage({
      signerAccountId: signed.accountId,
      signerPublicKey: signed.publicKey,
      payload: { message, recipient, nonce },
      signature,
      provider,
    });
  } catch (e) {
    verified = false;
    why = e instanceof Error ? e.message : String(e);
  }
  return { ...signed, recipient, verified, why };
}
