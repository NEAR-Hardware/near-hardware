---
name: near-web-apps
description: Put a NEAR contract on the web - a site where visitors log in with their own NEAR wallet (NEAR Connect), read the contract and send calls they sign themselves, on testnet or mainnet, then publish it free on GitHub Pages, Vercel or Netlify.
---

# Put a NEAR contract on the web

A NEAR web app is a static site. **Reads** (view calls) go straight to a public RPC node. **Writes** (change calls) are signed by the **visitor's own wallet** (Meteor, Intear, Nightly, Ledger…) through NEAR Connect. NEAR Hardware's `near_*` tools are for you and the user while building; the site never uses them and never holds a key. Deploy the contract first (`near-contracts`).

Everything here was run in November 2026 on Node 26: scaffolding, `npm run build`, view calls in a real browser on testnet and mainnet, the wallet picker opening, base-path builds. Signing needs a real wallet, so the user tests login and change calls.

Docs: `near_docs_search { "query": "...", "source": "near", "section": "web3-apps" }`, then `near_docs_read`. Key pages: `near/web3-apps/quickstart.md`, `near/web3-apps/tutorials/wallet-login.md` (NEAR Connect: login, calls, multiple transactions, message signing, function-call keys), `near/web3-apps/tutorials/mastering-near/2.1-frontend.md` (per-network config, deposits), `near/web3-apps/tutorials/frontend-multiple-contracts.md`, `near/tools/near-api.md`, `near/api/rpc/providers.md`. **NEAR Wallet Selector (`@near-wallet-selector/*`) is deprecated: never use it, even when older examples do.**

## 1. Start the app

A new project needs Node 22.22.2+ or 24+. Scaffold it next to the `contract/` folder:

```sh
npx create-near-app@latest web --frontend vite-react --install    # or --frontend next-app
```

- `vite-react`: React + react-router, builds to `dist/`. This is the simplest choice for static hosting.
- `next-app`: Next.js App Router. It runs as-is on Vercel, but GitHub Pages needs a static export (§5).
- With no flags the CLI asks questions. `--contract` makes a Rust contract instead (see `near-contracts`).

To point the template at your contract:
1. `src/config.ts`: set `contractPerNetwork.testnet` to `counter.<primary>` (and `.mainnet` later), plus `NetworkId`.
2. `src/providers/near-provider.tsx`: the function-call-key plugin hard-codes `methodNames: ['set_greeting']`. Change it to your contract's non-payable change methods (e.g. `['increment']`) or remove the plugin. Otherwise login asks the visitor to add a key that is useless for your contract.
3. Replace `src/pages/hello_near.tsx` with your UI. Use `useNearWallet()`, which gives `signedAccountId, signIn, signOut, viewFunction, callFunction`.

To add NEAR to any existing app (React, Vue, Svelte, plain JS), run `npm install @hot-labs/near-connect near-api-js` and add the module in §2.

Versions tested: create-near-app 10.0.0, @hot-labs/near-connect 0.12.0 (the template pins 0.11.4, which has the same API), near-api-js 7.5.3, Vite 8.3, React 19.3, Next 16.4, TypeScript 6/7.

## 2. The NEAR module

This module works with any framework and type-checks. `src/config.ts` holds public settings only:

```ts
export type Network = "testnet" | "mainnet";
export const NETWORK: Network = import.meta.env.VITE_NEAR_NETWORK === "mainnet" ? "mainnet" : "testnet";
export const CONTRACT_ID: string = import.meta.env.VITE_CONTRACT_ID ?? "counter.alice.testnet";
export const RPC_URL = NETWORK === "mainnet" ? "https://free.rpc.fastnear.com" : "https://test.rpc.fastnear.com";
export const EXPLORER = NETWORK === "mainnet" ? "https://nearblocks.io" : "https://testnet.nearblocks.io";
```

`src/near.ts`:

```ts
import { NearConnector } from "@hot-labs/near-connect";
import { JsonRpcProvider, getTransactionLastResult, nearToYocto, teraToGas } from "near-api-js";
import { NETWORK, CONTRACT_ID, RPC_URL, EXPLORER } from "./config";

export const connector = new NearConnector({
  network: NETWORK,
  providers: { mainnet: ["https://free.rpc.fastnear.com"], testnet: ["https://test.rpc.fastnear.com"] },
});
const provider = new JsonRpcProvider({ url: RPC_URL });

export async function currentAccount(): Promise<string> {   // restores the session after a reload
  try { return (await connector.getConnectedWallet()).accounts[0]?.accountId ?? ""; } catch { return ""; }
}
export async function signIn(): Promise<string> {           // opens the wallet picker
  const [account] = await (await connector.connect()).getAccounts();
  return account?.accountId ?? "";
}
export async function signOut() { await connector.disconnect(await connector.wallet()); }
export function onAccountChange(cb: (accountId: string) => void) {
  connector.on("wallet:signIn", (e) => cb(e.accounts[0]?.accountId ?? ""));
  connector.on("wallet:signOut", () => cb(""));
}

// View call: free, no login
export const view = <T = unknown>(method: string, args: Record<string, unknown> = {}) =>
  provider.callFunction({ contractId: CONTRACT_ID, method, args }) as Promise<T>;

// Change call: the visitor's wallet asks them to approve, they pay the gas
export async function call(method: string, args: Record<string, unknown> = {},
                           { depositNear = "0", tgas = 30 }: { depositNear?: string; tgas?: number } = {}) {
  const outcome = await (await connector.wallet()).signAndSendTransaction({
    receiverId: CONTRACT_ID,
    actions: [{ type: "FunctionCall", params: { methodName: method, args,
      gas: teraToGas(tgas).toString(), deposit: nearToYocto(depositNear as `${number}`).toString() } }],
  });
  if (typeof outcome.status === "object" && "Failure" in outcome.status)
    throw new Error(`Transaction failed: ${JSON.stringify(outcome.status.Failure)}`);
  const hash = outcome.transaction.hash;
  return { result: getTransactionLastResult(outcome), hash, link: `${EXPLORER}/txns/${hash}` };
}
```

- **Views** return parsed JSON: a `u64` comes back as a number, a `U128` as a string. A wrong method name throws `ContractMethodNotFoundError`. To keep a page live, poll every 20 seconds or so with `setInterval`, as `2.1-frontend.md` does.
- **Gas and deposit** go on the wire as strings, in gas units and in yoctoNEAR. `teraToGas(30)` and `nearToYocto("0.01")` convert for you, so never do float math on yocto. The maximum is 300 Tgas. Methods that store data per user often need a small deposit. NEP-141 `ft_transfer` needs exactly `"1"` yocto. Any deposit sent to a method that isn't `#[payable]` fails.
- **Show the `link`** after every change call. If the visitor rejects in the wallet, the promise rejects: show the message and don't retry.
- **Several calls in one prompt**: `wallet.signAndSendTransactions({ transactions: [...] })`. Those transactions are independent. Several actions inside one transaction are atomic (`frontend-multiple-contracts.md`).
- **React**: create the connector once (at module scope or with `useMemo`) and share it through a context, as the template's `near-provider.tsx` does.
- **Next.js**: NEAR Connect needs `window` and IndexedDB, so load it only on the client: `'use client'` plus `dynamic(() => import(...), { ssr: false })`, as the template does.
- **No wallet popup per call (optional)**: `function-call-key-plugin` signs non-payable calls to the listed methods with a local limited key. See wallet-login.md, "Function-call keys at login".
- Vite may warn `Module "util" has been externalized`. That is harmless for this code (only near-api-js `Contract` with ABI validation uses `util`). The template silences it with `npm i -D util` plus `resolve.alias: { util: 'util/' }`.

## 3. Testnet or mainnet

|          | RPC (reads)                    | Explorer                       | Contract example        |
| -------- | ------------------------------ | ------------------------------ | ----------------------- |
| testnet  | `https://test.rpc.fastnear.com`  | `https://testnet.nearblocks.io` | `counter.alice.testnet` |
| mainnet  | `https://free.rpc.fastnear.com`  | `https://nearblocks.io`         | `counter.alice.near`    |

To switch, set `VITE_NEAR_NETWORK` and `VITE_CONTRACT_ID` (in `.env`, in the CI step, or as the defaults in `config.ts`) and **rebuild**. Both values are baked in at build time. The contract must exist on that network, and its suffix must match the network (`.testnet` vs `.near`). The wallet picker only lists wallets that support the configured network. On mainnet, visitors spend real NEAR: build on testnet first and switch only when the user asks.

Anything the app reads from `VITE_*` (Vite) or `NEXT_PUBLIC_*` (Next) ends up in the public bundle. That is fine for the network, contract ID and RPC URL. **Never** put a private key, seed phrase, `~/.near-credentials` contents or a paid API key anywhere in the frontend. The site never needs one.

## 4. Run it locally

```sh
npm run dev        # Vite: http://localhost:5173 · Next: http://localhost:3000
npm run build && npm run preview    # the production build, http://localhost:4173
```

You can check reads yourself: the page should show the same value as `near_view`. Login and change calls need a browser wallet, so ask the user to try them. Their NEAR Hardware accounts live in the app's Keychain, not in a browser extension. For testing, they need a testnet account in a wallet that the picker lists on testnet (e.g. Meteor or Intear; "Don't have a wallet?" in the picker helps).

## 5. Publish

**Ask first.** Ask which host the user wants, and get their go-ahead. Publishing uses **their** account on that host. You never create accounts, log in for them or handle their tokens. If a CLI says it isn't logged in, ask the user to run the login command themselves. All three hosts below are free for a site like this:

| Host | URL | Needs |
| --- | --- | --- |
| GitHub Pages | `https://<user>.github.io/<repo>/` | GitHub account, `gh` CLI; public repo on the free plan |
| Vercel | `https://<project>.vercel.app` | Vercel account (`npx vercel login`) |
| Netlify | `https://<site>.netlify.app` | Netlify account (`npx netlify-cli login`) |

**GitHub Pages.** Add `.github/workflows/pages.yml` (action versions current as of Nov 2026):

```yaml
name: Deploy to GitHub Pages
on: { push: { branches: [main] }, workflow_dispatch: {} }
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: "${{ steps.deployment.outputs.page_url }}" }
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with: { node-version: 24, cache: npm }
      - run: npm ci
      - run: npm run build -- --base=/${{ github.event.repository.name }}/
      - run: cp dist/index.html dist/404.html        # deep links / reloads for client-side routes
      - uses: actions/configure-pages@v6
      - uses: actions/upload-pages-artifact@v5
        with: { path: dist }                         # Next.js export: out
      - id: deployment
        uses: actions/deploy-pages@v5
```

```sh
gh auth status                                   # must be the user's account
git init -b main && git add -A && git commit -m "NEAR web app"   # .gitignore: node_modules, dist, .env*.local
gh repo create <repo> --public --source=. --remote=origin --push
gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow
gh workflow run pages.yml && gh run watch        # the push-triggered run fails if Pages wasn't on yet
```

Base-path gotchas:
- **Vite** serves from `/<repo>/` on Pages. Without `--base=/<repo>/` the page is blank and assets 404. A `<user>.github.io` repo or a custom domain uses base `/`.
- **react-router** (the Vite template): use `<BrowserRouter basename={import.meta.env.BASE_URL}>`, or no route matches under `/<repo>/`. Keep the `404.html` copy so deep links work.
- **Next.js**: in `next.config.js` set `output: 'export'`, `basePath: '/<repo>'`, `images: { unoptimized: true }` and `trailingSlash: true`. It builds to `out/`, so drop the `--base` flag and the 404 copy. Hard-coded `"/logo.svg"` strings don't get the basePath.

**Vercel**: from the project root, run `npx vercel deploy --prod`. It detects Vite or Next and builds remotely. The first run links a project, so let the user answer the prompts. For client-side routes, add `vercel.json` with `{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}`.

**Netlify**: run `npm run build && npx netlify-cli deploy --prod --dir=dist --no-build`. The first run asks which site to create or link. For client-side routes, add `public/_redirects` containing `/*  /index.html  200`.

When it's live, check that the URL returns 200 and shows contract data. Give the user the link. Write the URL, contract ID and network into the project README (or `BOARD.md`).

## 6. Example: a counter page for `counter.<primary>.testnet`

The contract comes from `near-contracts` (`get_count` returns a `u64`; `increment` returns the new count). First check it: `near_view { "contractId": "counter.alice.testnet", "method": "get_count" }`.

```sh
npm create vite@latest counter-web -- --template vanilla-ts --no-interactive
cd counter-web && npm install && npm install @hot-labs/near-connect near-api-js
```

Add `src/config.ts` and `src/near.ts` from §2, with the default `CONTRACT_ID` set to `counter.alice.testnet`. In `index.html`, replace the body's `<div id="app">` with `<h1>Count: <span id="count">…</span></h1><button id="login">Login</button> <button id="increment" hidden>+1</button><p id="status"></p>`. Then write `src/main.ts`:

```ts
import { call, currentAccount, onAccountChange, signIn, signOut, view } from "./near";

const $ = (id: string) => document.getElementById(id)!;
let account = "";
const render = () => { $("login").textContent = account ? `Logout ${account}` : "Login"; $("increment").hidden = !account; };

$("login").onclick = async () => { if (account) await signOut(); else account = await signIn(); render(); };
onAccountChange((id) => { account = id; render(); });
$("increment").onclick = async () => {
  $("status").textContent = "Approve in your wallet…";
  try {
    const { result, link } = await call("increment");
    $("count").textContent = String(result);
    $("status").innerHTML = `Done: <a href="${link}" target="_blank" rel="noreferrer">transaction</a>`;
  } catch (e) { $("status").textContent = e instanceof Error ? e.message : String(e); }
};

account = await currentAccount();
render();
$("count").textContent = String(await view<number>("get_count"));
```

Run `npm run dev`. Check that the count matches `near_view`, then have the user log in and press +1. The count goes up and the transaction link opens on testnet.nearblocks.io. Then go through §7 and publish (§5).

## 7. Before publishing

- [ ] `npm run build` passes, and `npm run preview` shows live contract data.
- [ ] The bundle targets the intended network and contract: `grep -o "counter\.[a-z0-9._-]*" dist/assets/*.js` and `grep -c "test.rpc.fastnear.com" dist/assets/*.js`.
- [ ] The user logged in with a wallet on that network, a change call succeeded, and its explorer link opens on the right network.
- [ ] No secrets in the bundle: `grep -rEn "ed25519:|secp256k1:|PRIVATE|SECRET|seed phrase" dist src .env*` finds nothing sensitive, and any secret-bearing `.env` is gitignored.
- [ ] The base path is right: assets load on the live URL and reloading a sub-page works.
- [ ] Mainnet only after testnet works and the user explicitly asks for it.

## Related skills

- `near-contracts`: write and deploy the contract the site talks to.
- `near-accounts`: the user's accounts; `near_view` / `near_call` to check what the site does.
- `near-subaccounts`: put the contract on its own `counter.<primary>` account.
- `near-devices`: boards that write to the same contract, which the site can show with view calls.
