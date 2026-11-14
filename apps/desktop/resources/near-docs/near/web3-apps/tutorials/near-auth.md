> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# NEAR Auth

> Let users sign NEAR transactions with a Web2 login — Google, Apple, email, or passkeys — with no seed phrase, secured by MPC.

[NEAR Auth](https://docs.auth.near.org) lets your users sign real NEAR transactions using the Web2 identities they already have — Google, Apple, email, or passkeys — with **no seed phrase and no wallet extension**. Logins run through Auth0, and the signing keys are secured by a **Multi-Party Computation (MPC)** network, so no single party ever holds a user's private key. Each identity deterministically derives its own NEAR key, so the same login always controls the same account.

> [accordion] Common use cases
>
> * **Sign users up with Google, Apple, email or passkeys, with no seed phrase:** users sign NEAR transactions with an identity they already have.
> * **Onboard Web2 users without a wallet extension:** no browser extension or wallet app is needed to transact.

This quickstart takes you from an empty project to a signed NEAR transaction.

> [!NOTE]
>
> NEAR Auth uses **Auth0** on **mainnet**. Mainnet requires approved credentials, so [apply for access](https://form.typeform.com/to/VWHjf3HV) to receive your Auth0 client id before shipping. You can develop against **testnet** first — see the [NEAR Auth docs](https://docs.auth.near.org/resources/testnet) for testnet configuration.

Pick your stack and follow the steps.

> [tab] React
>
> **1. Install the SDK and provider**
>
> Add the React SDK, the JavaScript (Auth0) provider, and `near-api-js`.
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> npm install @fast-auth-near/react-sdk @fast-auth-near/javascript-provider near-api-js
> ```
>
> **2. Initialize the provider (mainnet)**
>
> Create a `JavascriptProvider` for `mainnet` with your client id, connect to the mainnet RPC, and wrap your app in `FastAuthProvider`. The provider fills in the correct Auth0 domain and signing audience for mainnet automatically.
>
> ```tsx App.tsx theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import { FastAuthProvider } from "@fast-auth-near/react-sdk";
> import { JavascriptProvider } from "@fast-auth-near/javascript-provider";
> import { connect } from "near-api-js";
>
> const provider = new JavascriptProvider({
>   network: "mainnet",
>   clientId: "<your-auth0-client-id>",
> });
>
> const { connection } = await connect({
>   networkId: "mainnet",
>   nodeUrl: "https://rpc.mainnet.near.org",
> });
>
> export default function App() {
>   return (
>     <FastAuthProvider
>       providerConfig={{ provider }}
>       connection={connection}
>       network="mainnet"
>     >
>       <YourApp />
>     </FastAuthProvider>
>   );
> }
> ```
>
> > [!NOTE]
> >
> > `FastAuthProvider` builds a relayer-aware `FastAuthClient` under the hood, pointed at `fast-auth.near` and `v1.signer`. You reach it through the hooks below.
>
> **3. Log the user in**
>
> Grab the client with `useFastAuth`, check status with `useIsLoggedIn`, and call `login()` to open the Auth0 flow.
>
> ```tsx LoginButton.tsx theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import { useFastAuth, useIsLoggedIn } from "@fast-auth-near/react-sdk";
>
> function LoginButton() {
>   const { client } = useFastAuth();
>   const { isLoggedIn } = useIsLoggedIn();
>
>   if (isLoggedIn) return <span>You're signed in 🎉</span>;
>   return <button onClick={() => client?.login()}>Sign in</button>;
> }
> ```
>
> **4. Get a signer and read the public key**
>
> Once the user is authenticated, obtain a signer and read the NEAR public key derived for their identity. The `usePublicKey` hook returns the key directly, or you can pull a signer yourself with `useSigner`.
>
> ```tsx AccountInfo.tsx theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import { useSigner, usePublicKey } from "@fast-auth-near/react-sdk";
>
> function AccountInfo() {
>   const { signer } = useSigner();
>   const { publicKey } = usePublicKey();
>
>   return <code>{publicKey?.toString()}</code>;
> }
> ```
>
> > [!TIP]
> >
> > The derived key is deterministic — the same Auth0 login always controls the same NEAR key. `getPublicKey()` returns an Ed25519 key by default; pass `"secp256k1"` if you need that curve.
>
> **5. Request a signature and complete the flow**
>
> Build a transfer, request the signature (this triggers an Auth0 approval), then let the relayer-backed signer submit it. In the React SDK the signer exposes `signAndSendTransaction`, which requests the signature, calls the NEAR Auth contract, and broadcasts the result for you.
>
> ```tsx Transfer.tsx theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import { transactions } from "near-api-js";
> import { useSigner, usePublicKey } from "@fast-auth-near/react-sdk";
>
> function Transfer({ senderId, nonce, blockHash }) {
>   const { signer } = useSigner();
>   const { publicKey } = usePublicKey();
>
>   async function transfer() {
>     const transaction = transactions.createTransaction(
>       senderId,                 // sender account id
>       publicKey,                // sender's derived public key
>       "receiver.near",          // receiver
>       nonce,                    // account nonce
>       [transactions.transfer(BigInt("1000000000000000000000000"))], // 1 NEAR
>       blockHash,                // recent block hash
>     );
>
>     // Requests the Auth0 signature, submits to fast-auth.near,
>     // and broadcasts via the relayer.
>     const result = await signer.signAndSendTransaction({ transaction });
>     console.log(result.transaction.hash);
>   }
>
>   return <button onClick={transfer}>Send 1 NEAR</button>;
> }
> ```
>
> > [!WARNING]
> >
> > Requesting a signature performs an **Auth0 context switch** — a popup or a full-page redirect, depending on how you configure the provider. Design your UX to expect it: persist any in-flight state before the call, and handle the return so users land back where they started. On redirect, the signature is retrieved on the callback page.

> [tab] Browser / JS
>
> **1. Install the SDK and provider**
>
> Add the framework-agnostic Browser SDK, the JavaScript (Auth0) provider, and `near-api-js`.
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> npm install @fast-auth-near/browser-sdk @fast-auth-near/javascript-provider near-api-js
> ```
>
> **2. Initialize the provider (mainnet)**
>
> Create a `JavascriptProvider` for `mainnet`, connect to the mainnet RPC, and build a `FastAuthClient` pointed at the mainnet NEAR Auth and MPC contracts.
>
> ```ts main.ts theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import { FastAuthClient } from "@fast-auth-near/browser-sdk";
> import { JavascriptProvider } from "@fast-auth-near/javascript-provider";
> import { connect } from "near-api-js";
>
> const provider = new JavascriptProvider({
>   network: "mainnet",
>   clientId: "<your-auth0-client-id>",
> });
>
> const { connection } = await connect({
>   networkId: "mainnet",
>   nodeUrl: "https://rpc.mainnet.near.org",
> });
>
> const client = new FastAuthClient(provider, connection, {
>   fastAuthContractId: "fast-auth.near",
>   mpcContractId: "v1.signer",
> });
> ```
>
> **3. Log the user in**
>
> Kick off the Auth0 login. You can check status any time with the provider's `isLoggedIn()`.
>
> ```ts login.ts theme={"theme":{"light":"github-light","dark":"github-dark"}}
> await client.login();
>
> const loggedIn = await provider.isLoggedIn();
> if (loggedIn) console.log("Authenticated!");
> ```
>
> **4. Get a signer and read the public key**
>
> Obtain a signer and read the derived NEAR public key. `getPublicKey()` returns Ed25519 by default; pass `"secp256k1"` for that curve.
>
> ```ts signer.ts theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const signer = await client.getSigner();
>
> const publicKey = await signer.getPublicKey();
> console.log(publicKey.toString());
> ```
>
> > [!TIP]
> >
> > The key is derived deterministically from the user's identity, so the same login always maps to the same NEAR key.
>
> **5. Request a signature and complete the flow**
>
> Build a transfer, request the signature (this triggers an Auth0 approval), then retrieve the signature request, turn it into a sign action for the NEAR Auth contract, and have a relayer submit it.
>
> ```ts transfer.ts theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import { transactions } from "near-api-js";
>
> // 1. Build the transaction.
> const transaction = transactions.createTransaction(
>   senderId,                 // sender account id
>   publicKey,                // sender's derived public key
>   "receiver.near",          // receiver
>   nonce,                    // account nonce
>   [transactions.transfer(BigInt("1000000000000000000000000"))], // 1 NEAR
>   blockHash,                // recent block hash
> );
>
> // 2. Request the signature (Auth0 popup or redirect).
> await signer.requestTransactionSignature({ transaction });
>
> // 3. On return, read the signature request and build the sign action.
> const { signatureRequest } = await signer.getSignatureRequest();
> const action = await signer.createSignAction(signatureRequest, {
>   deposit: 1n,
> });
>
> // 4. A relayer submits `action` to fast-auth.near, which verifies
> //    the Auth0 JWT and returns the MPC signature. The relayer then
> //    broadcasts the signed transaction.
> ```
>
> > [!WARNING]
> >
> > `requestTransactionSignature` performs an **Auth0 context switch** — a popup or a full-page redirect. Design your UX to expect it: persist in-flight state before the call, and on redirect read the signature back on the callback page with `getSignatureRequest()`.

> [tab] React Native
>
> **1. Install the provider**
>
> Add the React Native provider alongside `react-native-auth0`, which it uses under the hood for the native Auth0 flow.
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> npm install @fast-auth-near/react-native-provider react-native-auth0
> ```
>
> **2. Initialize the provider (mainnet)**
>
> Wrap your app in `Auth0Provider` with the mainnet domain, and create a `ReactNativeProvider` for `mainnet` with your client id.
>
> ```tsx App.tsx theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import { Auth0Provider } from "react-native-auth0";
> import { ReactNativeProvider } from "@fast-auth-near/react-native-provider";
>
> const provider = new ReactNativeProvider({
>   network: "mainnet",
>   clientId: "<your-auth0-client-id>",
> });
>
> export default function App() {
>   return (
>     <Auth0Provider
>       domain="login.auth.near.org"
>       clientId="<your-auth0-client-id>"
>     >
>       <YourApp provider={provider} />
>     </Auth0Provider>
>   );
> }
> ```
>
> > [!NOTE]
> >
> > On mobile you drive login and signature requests through the provider. To read keys and submit transactions, pair the provider with the Browser SDK's `FastAuthClient` and a mainnet NEAR connection (`https://rpc.mainnet.near.org`), configured with `fastAuthContractId: "fast-auth.near"` and `mpcContractId: "v1.signer"` — exactly as in the Browser / JS tab.
>
> **3. Log the user in**
>
> Trigger the native Auth0 login from anywhere in your component tree.
>
> ```tsx theme={"theme":{"light":"github-light","dark":"github-dark"}}
> await provider.login();
> ```
>
> **4. Get a signer and read the public key**
>
> Build a `FastAuthClient` with the provider and a mainnet connection, then read the derived public key.
>
> ```tsx theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import { FastAuthClient } from "@fast-auth-near/browser-sdk";
> import { connect } from "near-api-js";
>
> const { connection } = await connect({
>   networkId: "mainnet",
>   nodeUrl: "https://rpc.mainnet.near.org",
> });
>
> const client = new FastAuthClient(provider, connection, {
>   fastAuthContractId: "fast-auth.near",
>   mpcContractId: "v1.signer",
> });
>
> const signer = await client.getSigner();
>
> const publicKey = await signer.getPublicKey();
> console.log(publicKey.toString());
> ```
>
> **5. Request a signature and complete the flow**
>
> Request the transfer signature, read the signature request, and turn it into a sign action for the NEAR Auth contract. A relayer then submits it to `fast-auth.near`.
>
> ```tsx theme={"theme":{"light":"github-light","dark":"github-dark"}}
> await provider.requestTransactionSignature({ transaction });
>
> const { signatureRequest } = await signer.getSignatureRequest();
> const action = await signer.createSignAction(signatureRequest, {
>   deposit: 1n,
> });
> // A relayer submits `action` to fast-auth.near and broadcasts the result.
> ```
>
> > [!WARNING]
> >
> > On mobile, a signature request opens the native Auth0 browser session — a **context switch** away from your app. Persist any in-flight state before the call so you can restore it when control returns.

***

## Learn more

You've completed the full loop — login, key derivation, signature, and submission. Head to the NEAR Auth documentation for the SDK reference, protocol details, and going live on mainnet.

> [card] [NEAR Auth documentation](https://docs.auth.near.org)
>
> Full SDK reference, protocol concepts, and deployed contract addresses.

> [card] [Apply for mainnet access](https://form.typeform.com/to/VWHjf3HV)
>
> Request approved production credentials to launch on `fast-auth.near`.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.