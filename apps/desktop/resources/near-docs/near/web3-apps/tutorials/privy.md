> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Privy

> Enable users to login with their social accounts (Google, GitHub, etc.)

[Privy](https://www.privy.io/) is a third-party service that allows users to login using their email or social accounts (Google, Facebook, Twitter, etc). Upon login, a NEAR wallet is created for the user, which they can fund and use to interact with your dApp.

> [accordion] Common use cases
>
> * **Sign users up with email or Google, with no seed phrase:** users log in with an account they already have, and a NEAR wallet is created for them.
> * **Onboard Web2 users without a wallet extension:** your dApp works for users who have never installed a crypto wallet.

![Preview](https://framerusercontent.com/images/ugUCPrqIGlKFdxBwSbRoWriZtE.png?scale-down-to=2048\&width=4018\&height=2262)

> [!TIP]
>
> See full working example [here](https://github.com/near-examples/hello-privy)

> [!NOTE]
>
> **Web3Auth**
> For an alternative social login method you can check [Web3Auth](https://web3auth.io/). Our [Web3Auth Integration Example](https://github.com/near-examples/hello-web3auth/) includes a Modal integration that derives a NEAR Ed25519 key from the authenticated session and an MPC Core Kit integration that signs through a custom SDK `Signer`. Both use `near-api-js` to query NEAR and submit transactions.

***

## Installation

Choose whether to expose your Privy wallet through [NEAR Connect](https://docs.near.org/web3-apps/tutorials/wallet-login.mdx) or integrate Privy directly into your application:

> [tab] NEAR Connect
>
> Install the plugin, NEAR Connect, and the UI packages used by the signing page:
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> npm install @peerfolio/privy-near-connect @hot-labs/near-connect @radix-ui/themes @radix-ui/react-collapsible @radix-ui/react-icons
> ```

> [tab] Direct Privy
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> npm install @privy-io/react-auth near-api-js @noble/hashes
> ```

### Which should I choose?

Using **NEAR Connect** would give your application access to **all NEAR Wallets** that support NEAR Connect, **plus social login** with Privy. This will provide an experience closer to Web3 applications.

Integrating **Privy directly** would make your application support **only social login** (through Privy). This should be the preferred way for applications that want to abstract away the wallet and provide a Web2-like experience to their users.

***

## Setup

> [tab] NEAR Connect
>
> [`privy-near-connect`](https://github.com/beneviolabs/privy-near-connect) lets you expose a Privy embedded wallet through [NEAR Connect](https://github.com/azbang/near-connect).
>
> **1. Create a Privy app**
>
> Create an application in the [Privy dashboard](https://dashboard.privy.io/) and copy its **App ID** and **Client ID**. Store both values in your application's environment variables:
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> VITE_PRIVY_APP_ID=your-privy-app-id
> VITE_PRIVY_APP_CLIENT_ID=your-privy-client-id
> ```
>
> **2. Publish a wallet manifest**
>
> Add `manifest.json` to your application's public directory. Replace the example URLs and wallet metadata with your own:
>
> ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
> {
>   "version": "1.0.0",
>   "wallets": [
>     {
>       "id": "myprivywallet",
>       "name": "My Privy Wallet",
>       "icon": "https://yourdapp.com/favicon.ico",
>       "description": "Web wallet for NEAR",
>       "website": "https://yourdapp.com",
>       "version": "1.0.0",
>       "executor": "https://raw.githubusercontent.com/beneviolabs/privy-near-connect/3d56b782669d242a1ea432921e291abc26b4ebc7/executor.js",
>       "type": "sandbox",
>       "platform": {
>         "web": "https://yourdapp.com"
>       },
>       "features": {
>         "signMessage": true,
>         "signInWithoutAddKey": true,
>         "signInAndSignMessage": true,
>         "signInWithFunctionCallKey": true,
>         "signAndSendTransaction": true,
>         "signAndSendTransactions": true,
>         "mainnet": true,
>         "testnet": true
>       },
>       "permissions": {
>         "isPrivyConnect": true,
>         "storage": true,
>         "allowsOpen": [
>           "https://yourdapp.com"
>         ]
>       },
>       "metadata": {
>         "signPageURL": "https://yourdapp.com/sign"
>       }
>     }
>   ]
> }
> ```
>
> > [!WARNING]
> >
> > Keep the `executor` URL pinned to an immutable commit SHA. NEAR Connect fetches and runs this script at runtime, so you should update the SHA deliberately when adopting a new executor build.
>
> **3. Create the signing page**
>
> Add a `/sign` route and render the plugin's signing component there:
>
> ```jsx theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import Privy, { LocalStorage } from '@privy-io/js-sdk-core'
> import { SignPagePlugin } from '@peerfolio/privy-near-connect/sign-page-plugin'
> import '@radix-ui/themes/styles.css'
> import '@peerfolio/privy-near-connect/sign-page-plugin/theme.css'
>
> const privy = new Privy({
>   appId: import.meta.env.VITE_PRIVY_APP_ID,
>   clientId: import.meta.env.VITE_PRIVY_APP_CLIENT_ID,
>   storage: new LocalStorage(),
> })
>
> export default function SignPage() {
>   return (
>     <SignPagePlugin
>       privy={privy}
>       options={{ allowedOrigins: ['https://yourdapp.com'] }}
>     />
>   )
> }
> ```
>
> `allowedOrigins` limits which applications can send requests to the signing page. Add every dApp origin that should be able to use the wallet.
>
> **4. Load the plugin with NEAR Connect**
>
> Initialize `NearConnector` with the manifest you created:
>
> ```jsx theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import { NearConnector } from '@hot-labs/near-connect'
>
> const connector = new NearConnector({
>   manifest: '/manifest.json',
>   network: 'testnet',
> })
> ```
>
> That's it! The plugin will now be available in the NEAR Connect modal.
>
> > [!TIP]
> >
> > Continue with the [wallet login tutorial](https://docs.near.org/web3-apps/tutorials/wallet-login.md) to connect the wallet and use it from your dApp.

> [tab] Direct Privy
>
> Use Node.js 22.22.2 or newer. Wrap your application with `PrivyProvider` and a custom `NEARxPrivy` context that bridges Privy's authentication with a NEAR account:
>
> ```tsx title="App.tsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import { Navigation } from './components/navigation'
> import Home from './pages/home'
>
> import HelloNear from './pages/hello_near'
> import { BrowserRouter, HashRouter, Routes, Route } from 'react-router'
>
> import { PrivyProvider } from '@privy-io/react-auth'
> import { NEARxPrivy } from './context/provider'
>
> function App() {
>   // Use HashRouter when deployed under a subpath (GitHub Pages)
>   const useHashRouter = import.meta.env.BASE_URL !== '/'
>   const Router = useHashRouter ? HashRouter : BrowserRouter
>
>   return (
>     <PrivyProvider
>       appId="cme1neps40007jy0b5hyesl0s"
>       config={{
>         appearance: {
>           accentColor: '#6A6FF5',
>           theme: '#FFFFFF',
>           showWalletLoginFirst: false,
>           logo: 'https://auth.privy.io/logos/privy-logo.png',
>         },
>         loginMethods: ['email', 'google', 'github'],
>       }}
>     >
>       <NEARxPrivy>
>         <Router>
>           <Navigation />
>           <Routes>
>             <Route path="/" element={<Home />} />
>             <Route path="/hello-near" element={<HelloNear />} />
>           </Routes>
>         </Router>
>       </NEARxPrivy>
>     </PrivyProvider>
>   )
> }
>
> export default App
> ```
>
> [See code on GitHub](https://github.com/near-examples/hello-privy/blob/5aa847ac74551dbfdeb6dc7f5ace4ed0b105c5d8/src/App.tsx)
>
> > [accordion] Get a Privy App ID
> >
> > 1. Sign up at [privy.io](https://www.privy.io/) and create a new app.
> > 2. Copy the **App ID** from the dashboard and set it as your `appId` prop.
> > 3. Configure your allowed login methods and other settings in the Privy dashboard.
>
> ### Context
>
> The `NEARxPrivy` provider listens to Privy's authentication state and selects the NEAR wallet from the user's linked accounts. If the user has no NEAR wallet, it creates one. It then exposes a `nearAccount` instance through context:
>
> ```tsx title="provider.tsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> // Privy
> import { usePrivy } from '@privy-io/react-auth'
> import { useCreateWallet } from '@privy-io/react-auth/extended-chains'
> import { useSignRawHash } from '@privy-io/react-auth/extended-chains'
>
> // near api js
> import { JsonRpcProvider } from 'near-api-js'
> import { Account } from 'near-api-js'
>
> // config
> import { useEffect, useRef, type PropsWithChildren } from 'react'
> import { useState } from 'react'
> import { NearContext } from './useNear'
> import { providerUrl } from '../config'
> import { privySigner } from './signer'
>
> // Provider
> const provider = new JsonRpcProvider({ url: providerUrl })
>
> export function NEARxPrivy({ children }: PropsWithChildren) {
>   const { authenticated, user } = usePrivy()
>   const [walletId, setWalletId] = useState('')
>   const [nearAccount, setNearAccount] = useState<Account | null>(null)
>
>   const { signRawHash } = useSignRawHash()
>   const { createWallet } = useCreateWallet()
>   const creatingWallet = useRef(false)
>
>   useEffect(() => {
>     if (!authenticated || !user) {
>       setWalletId('')
>       setNearAccount(null)
>       return
>     }
>
>     // A user may also have an Ethereum/Solana wallet. Select the NEAR wallet
>     // explicitly rather than treating the first linked wallet as a NEAR account.
>     const nearWallet = user.linkedAccounts.find((account) =>
>       account.type === 'wallet' && account.chainType === 'near'
>     )
>     if (nearWallet?.type !== 'wallet') {
>       if (!creatingWallet.current) {
>         creatingWallet.current = true
>         createWallet({ chainType: 'near' })
>           .catch((error) => console.error('Could not create NEAR wallet', error))
>           .finally(() => { creatingWallet.current = false })
>       }
>       return
>     }
>
>     const signer = new privySigner(signRawHash, nearWallet.address, provider)
>     setNearAccount(new Account(nearWallet.address, provider, signer))
>     setWalletId(nearWallet.address)
>   }, [authenticated, user, createWallet, signRawHash])
>
>   return (
>     <NearContext.Provider value={{ provider, nearAccount, walletId }}>
>       {children}
>     </NearContext.Provider>
>   )
> }
> ```
>
> [See code on GitHub](https://github.com/near-examples/hello-privy/blob/5aa847ac74551dbfdeb6dc7f5ace4ed0b105c5d8/src/context/provider.tsx)
>
> | Value | Type | Description |
> | - | - | - |
> | `walletId` | `string` | The user's NEAR account address |
> | `nearAccount` | `Account` | A `near-api-js` `Account` ready to sign transactions |
> | `provider` | `JsonRpcProvider` | A read-only RPC provider to query the network |
>
> ***
>
> ### Custom signer
>
> Privy signs through its embedded wallet via `signRawHash`. The `privySigner` class extends `Signer` from `near-api-js` and implements `getPublicKey` and `signBytes`. The SDK serializes and hashes transactions, delegate actions, and NEP-413 messages before requesting a signature:
>
> ```typescript title="signer.ts" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import { Account, PublicKey, Signer } from 'near-api-js'
> import type { JsonRpcProvider } from 'near-api-js'
> import type { useSignRawHash } from '@privy-io/react-auth/extended-chains'
> import { bytesToHex, hexToBytes } from '@noble/hashes/utils'
>
> // Keep Privy's embedded wallet as the signer. The SDK handles transaction,
> // delegate-action and NEP-413 serialization and hashing consistently.
> type SignRawHash = ReturnType<typeof useSignRawHash>['signRawHash']
>
> export class privySigner extends Signer {
>   private signRawHash: SignRawHash
>   private nearAccId: string
>   private provider: JsonRpcProvider
>
>   constructor(signRawHash: SignRawHash, nearAccId: string, provider: JsonRpcProvider) {
>     super()
>     this.signRawHash = signRawHash
>     this.nearAccId = nearAccId
>     this.provider = provider
>   }
>
>   async getPublicKey() {
>     if (/^[a-f0-9]{64}$/i.test(this.nearAccId)) {
>       return new PublicKey({ keyType: 0, data: hexToBytes(this.nearAccId) })
>     }
>     const account = new Account(this.nearAccId, this.provider)
>     const { keys } = await account.getAccessKeyList()
>     if (!keys.length) throw new Error('The account has no registered access key')
>     return PublicKey.fromString(keys[0].public_key)
>   }
>
>   async signBytes(bytes: Uint8Array) {
>     const { signature } = await this.signRawHash({
>       address: this.nearAccId,
>       chainType: 'near',
>       hash: `0x${bytesToHex(bytes)}`,
>     })
>     return hexToBytes(signature.replace(/^0x/, ''))
>   }
> }
> ```
>
> [See code on GitHub](https://github.com/near-examples/hello-privy/blob/5aa847ac74551dbfdeb6dc7f5ace4ed0b105c5d8/src/context/signer.ts)
>
> ***
>
> ### Signing in and out
>
> Use `useLogin` and `useLogout` from Privy to open the login modal and sign the user out:
>
> ```tsx title="navigation.tsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import { useEffect, useState } from 'react'
>
> import NearLogo from '@/assets/near-logo.svg'
> import { Link } from 'react-router'
> import styles from '@/styles/app.module.css'
>
> import { useLogin, useLogout, usePrivy } from '@privy-io/react-auth'
> import { useNEAR } from '../context/useNear'
> import { NEAR } from 'near-api-js/tokens'
>
> export const Navigation = () => {
>   const [action, setAction] = useState<() => void>(() => () => {})
>   const [label, setLabel] = useState('Loading...')
>   const [balance, setBalance] = useState<string>('0')
>   const { authenticated, user } = usePrivy()
>
>   const { login: privyLogin } = useLogin()
>   const { logout: privyLogout } = useLogout()
>
>   const { walletId, nearAccount } = useNEAR()
>
>   useEffect(() => {
>     if (authenticated && user) {
>       const userId = user.google?.email ?? user.email?.address ?? user.github?.username ?? 'User'
>       setAction(() => privyLogout)
>       setLabel(`Logout ${userId}`)
>     } else {
>       setAction(() => privyLogin)
>       setLabel('Login')
>       setBalance('0')
>     }
>   }, [authenticated, privyLogin, privyLogout, user])
>
>   useEffect(() => {
>     if (walletId && nearAccount) {
>       nearAccount
>         .getBalance()
>         .then((b) => setBalance(Number(NEAR.toDecimal(b)).toFixed(2)))
>         .catch(() => setBalance('0')) // non existing account
>     }
>   }, [walletId, nearAccount])
>
>   return (
>     <>
>       <nav className="navbar navbar-expand-lg">
>         <div className="container-fluid">
>           <Link to="/">
>             <img
>               src={NearLogo}
>               alt="NEAR"
>               width="30"
>               height="24"
>               className={styles.logo}
>             />
>           </Link>
>           <div className="navbar-nav pt-1">
>             {authenticated ? (
>               <span className="badge text-dark small">
>                 {' '}
>                 <br />
>                 {walletId}: {balance} Ⓝ
>               </span>
>             ) : null}
>
>             <button className="btn btn-secondary" onClick={action}>
>               {label}
>             </button>
>           </div>
>         </div>
>       </nav>
>     </>
>   )
> }
> ```
>
> [See code on GitHub](https://github.com/near-examples/hello-privy/blob/5aa847ac74551dbfdeb6dc7f5ace4ed0b105c5d8/src/components/navigation.tsx)
>
> ***
>
> ### Call read-only methods
>
> Use the `provider` from context to call view methods — no login required:
>
> ```jsx theme={"theme":{"light":"github-light","dark":"github-dark"}}
> const greeting = await provider.callFunction({
>   contractId: CONTRACT,
>   method: 'get_greeting',
>   args: {},
> })
> ```
>
> ***
>
> ### Call change methods
>
> Use the `nearAccount` from context to call change methods. The transaction is signed silently by Privy's embedded wallet, providing a Web2-like UX:
>
> ```jsx theme={"theme":{"light":"github-light","dark":"github-dark"}}
> await nearAccount.callFunction({
>   contractId: CONTRACT,
>   methodName: 'set_greeting',
>   args: { greeting: newGreeting },
> })
> ```
>
> ***
>
> ### Get balance
>
> ```jsx theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import { NEAR } from 'near-api-js/tokens'
>
> const balance = await nearAccount.getBalance(NEAR)
> const formatted = Number(NEAR.toDecimal(balance)).toFixed(2)
> console.log(`Balance: ${formatted} Ⓝ`)
> ```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.