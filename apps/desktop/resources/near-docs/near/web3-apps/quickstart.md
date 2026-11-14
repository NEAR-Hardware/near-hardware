> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Your First Web3 App

> Quick guide to create a Web3 frontend application with NEAR integration - build a React/Next.js app where users can login with wallets and interact with smart contracts.

In this guide we will show you how to **build a React app connected to NEAR**, where users can **login** using their wallets and interact with a **contract**.

> [!TIP]
>
> **Searching to integrate NEAR in your App?**
>
> If you already have an application and want to integrate NEAR into it, we recommend you to first go through this guide and then check our documentation on [using NEAR wallets on your app](https://docs.near.org/web3-apps/tutorials/wallet-login.md). Use NEAR Connect for wallet integration: the older NEAR Wallet Selector (`@near-wallet-selector/*`) is deprecated and should not be used.

> [!TIP]
>
> **Testing with a local blockchain**
>
> You can use `near-sandbox` to test your frontend and contracts fully locally, without deploying to testnet. See [Test Your App Locally](https://docs.near.org/web3-apps/tutorials/localnet/run.md) for the complete setup.

## Template Setup

If you already have [Node.js](https://nodejs.org/en/download) installed, you can use `create-near-app` to quickly setup a template:

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
  npx create-near-app@latest

  # ✔ What do you want to build? › Web Application
  # ✔ Select a framework for your frontend › Next.js (Classic)
  # ✔ Name your project (we will create a directory with that name) … near-template
  # ✔ Run 'npm install' now? … yes
```

Once the folder is ready - and all dependencies installed - you can start the development server using `pnpm`.

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
cd near-template # go to your project folder
npm run dev
```

Visit `http://localhost:3000` in your browser to view the dApp. Note that since the dApp uses NextJS the app might take longer to load the pages on first visit.

> [accordion] The app is not starting?
>
> Make sure you are using **Node.js 22.22.2 or newer**. You can install and select Node.js 24 with `nvm install 24` and `nvm use 24`.

> [!TIP]
>
> **Framework**
> In this tutorial we are using the **Next.js** framework with the "classic" page-based routing, but you can select other frameworks such as Vite when creating the app

***

## Landing Page

Once the app starts you will see the landing page, rendering a navigation bar that allows users to login using their NEAR wallet. You can then navigate to the docs or the `Near Integration` page (which we will do).

![img](https://mintcdn.com/neardocs/qO2GD-gji1aakHqN/assets/docs/smart-contracts/tutorials/examples/hello-near-landing-page.png?fit=max\&auto=format\&n=qO2GD-gji1aakHqN\&q=85\&s=957eef6d01b0d644c07877537068ab6e)

*Landing page of Hello NEAR Gateway*

Go ahead and sign in with your NEAR account.

> [!TIP]
>
> **Testnet Account**
>
> The app runs on `testnet`, so you need a `testnet` account to sign in. If you don't have one, check how to [create one using a wallet](https://docs.near.org/getting-started/create-account.md#using-a-wallet).

***

### Context Provider

[Next.js](https://nextjs.org/) uses a template system, where each page is a React component. Our main logic is defined at `./src/pages/_app.tsx`, which:

1. Creates a `NearProvider` that wraps the entire application to provide NEAR functionality
2. Renders the navigation menu and the page's content

```jsx title="_app.tsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
import "@/styles/globals.css";

import type { AppProps } from "next/app";
import { Navigation } from "@/components/navigation";
import { NearProvider } from "@/providers/near-provider";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <NearProvider>
      <Navigation />
      <Component {...pageProps} />
    </NearProvider>
  );
}
```

[See code on GitHub](https://github.com/near-examples/hello-near-examples/blob/be63c9f326b47d881dddaea87564fe578bcd844e/frontend/src/pages/_app.tsx)

> [accordion] How does the NEAR provider work?
>
> The app defines its own `NearProvider` and `useNearWallet` hook in [`src/providers/near-provider.tsx`](https://github.com/near-examples/hello-near-examples/blob/main/frontend/src/providers/near-provider.tsx). The provider uses `@hot-labs/near-connect` to manage wallet connections and sign transactions, and `near-api-js` to query the blockchain.

***

### Navigation Bar

The navigation bar implements a button to allow users to `login` and `logout` with their NEAR wallet. It uses the local `useNearWallet` hook from `@/providers/near-provider`, which exposes the provider's wallet state and sign-in and sign-out functions.

```jsx title="navigation.tsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
import Image from 'next/image';
import Link from 'next/link';
import { useNearWallet } from '@/providers/near-provider';

import NearLogo from '../../public/near-logo.svg';

export const Navigation = () => {
   const { signedAccountId, loading, signIn, signOut } = useNearWallet();

  const handleAction = () => {
    if (signedAccountId) {
      signOut();
    } else {
      void signIn();
    }
  };

  const label = loading
    ? "Loading..."
    : signedAccountId
    ? `Logout ${signedAccountId}`
    : "Login";

  return (
    <nav className="navbar navbar-expand-lg">
      <div className="container-fluid">
        <Link href="/">
          <Image
            priority
            src={NearLogo}
            alt="NEAR"
            width={30}
            height={24}
            className="d-inline-block align-text-top"
          />
        </Link>
        <div className="navbar-nav pt-1">
          <button className="btn btn-secondary" onClick={handleAction}>
            {label}
          </button>
        </div>
      </div>
    </nav>
  );
};
```

[See code on GitHub](https://github.com/near-examples/hello-near-examples/blob/be63c9f326b47d881dddaea87564fe578bcd844e/frontend/src/components/navigation.tsx)

***

## How Do I Call Smart Contract Functions?

Now that you understand how the landing page works, we can move to the `Near Integration` page, which retrieves a greeting from the [hello.near-examples.testnet](https://testnet.nearblocks.io/address/hello.near-examples.testnet) contract.

### Read vs. Write Operations

| Operation Type | Method | Cost | Requires Signature |
| - | - | - | - |
| **Read (view)** | `viewFunction()` | Free | No |
| **Write (call)** | `callFunction()` | Gas fees (\~0.0001 Ⓝ) | Yes |

View methods query contract state without modifying it. Call methods change state and require the user to sign a transaction.

![img](https://mintcdn.com/neardocs/qO2GD-gji1aakHqN/assets/docs/smart-contracts/tutorials/examples/hello-near-gateway.png?fit=max\&auto=format\&n=qO2GD-gji1aakHqN\&q=85\&s=04194370abe18860993bc7f0e35cd368)

*View of the `Near Integration` page*

Login if you haven't done it yet and you will see a simple form that allows you to store a greeting in the smart contract.

***

### Contract Functions

Just like the [navigation bar](#navigation-bar), we use the app's local `useNearWallet` hook to get functions that allow us to call methods on the contract:

* `viewFunction` calls read-only methods through the `near-api-js` RPC provider
* `callFunction` calls methods that modify contract state through the connected wallet's `signAndSendTransaction` method

```jsx title="index.tsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
const { signedAccountId, viewFunction, callFunction } = useNearWallet();
```

[See code on GitHub](https://github.com/near-examples/hello-near-examples/blob/8420b0ea2bc312c401ee79c2066d1bb8e57ee4e6/frontend/src/pages/hello-near/index.tsx#L11-L11)

#### Calling Read-Only Methods

For example, when we want to fetch the current greeting stored in the contract, we use `viewFunction` inside a `useEffect` hook:

```jsx title="index.tsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
useEffect(() => {
  viewFunction({ contractId: HelloNearContract, method: 'get_greeting' }).then((greeting) => setGreeting(greeting as string));
}, [viewFunction]);
```

[See code on GitHub](https://github.com/near-examples/hello-near-examples/blob/8420b0ea2bc312c401ee79c2066d1bb8e57ee4e6/frontend/src/pages/hello-near/index.tsx#L17-L19)

#### Calling Change Methods

On the other hand, when the user submits a new greeting, we use `callFunction` to send a transaction to the contract:

```jsx title="index.tsx" lines theme={"theme":{"light":"github-light","dark":"github-dark"}}
const saveGreeting = () => {
  // Try to store greeting, revert if it fails
  callFunction({ contractId: HelloNearContract, method: 'set_greeting', args: { greeting: newGreeting } })
    .then(async () => {
      const greeting = (await viewFunction({ contractId: HelloNearContract, method: 'get_greeting' })) as string;
      setGreeting(greeting);
      setShowSpinner(false);
    });

  // Assume the transaction will be successful and update the UI optimistically
  setShowSpinner(true);
  setGreeting(newGreeting);
};
```

[See code on GitHub](https://github.com/near-examples/hello-near-examples/blob/8420b0ea2bc312c401ee79c2066d1bb8e57ee4e6/frontend/src/pages/hello-near/index.tsx#L22-L34)

***

## Common Questions

### Do users need NEAR tokens to login?

No. Wallet login is free. Users only pay gas fees when they call contract functions that modify state.

### What wallets can users connect with?

Users can choose from the NEAR wallets available in the NEAR Connect wallet selection modal.

### How do I avoid users signing every transaction?

The template's local provider registers `function-call-key-plugin` with NEAR Connect to create a **function-call access key** scoped to the contract's `set_greeting` method. This allows the app to sign permitted non-payable calls automatically. See [function-call keys at login](https://docs.near.org/web3-apps/tutorials/wallet-login.md#function-call-keys-at-login) for the setup.

### Can I use this with an existing React app?

Yes. Install `@hot-labs/near-connect` and `near-api-js` and follow our [integration guide](https://docs.near.org/web3-apps/tutorials/wallet-login.md).

### Why Next.js instead of plain React?

Next.js is recommended but not required. You can use Vite/React, Vue, Svelte, or any framework. Check `create-near-app` templates for options.

***

## Moving Forward

That's it for our quickstart tutorial. You have now seen a fully functional frontend that can talk with NEAR contracts and render Web3 components.

To see how a frontend fits into a complete app - together with its contract, tests, and an indexer - follow [Mastering NEAR](https://docs.near.org/web3-apps/tutorials/mastering-near/2.1-frontend.md), where you build the frontend for an auction contract.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.