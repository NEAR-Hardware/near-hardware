> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Wallet Connector

> A zero-dependencies and lightweight wallet connector

**NEAR Connect** is a zero-dependencies, robust, secure, and lightweight wallet connector for the NEAR blockchain. It executes wallet integration code in isolated sandboxed environments rather than bundling all wallet code into a single package.

> [!WARNING]
>
> **Do not use NEAR Wallet Selector (`@near-wallet-selector/*`).** It is deprecated and no longer maintained. Use NEAR Connect (`@hot-labs/near-connect`) to integrate wallets in new and existing apps.

![Preview](https://github.com/user-attachments/assets/c4422057-38bb-4cd9-8bd0-568e29f46280)

> [card] Sandboxed Execution
>
> Reduces supply chain risk by running wallet scripts in isolated iframes.

> [card] Easily Updatable Wallets
>
> Always up-to-date thanks to a shared manifest that loads wallet code at runtime.

> [card] No Dependencies
>
> Lightweight and self-contained with zero external dependencies.

> [card] Multiple Wallets Supported
>
> HOT Wallet, Meteor Wallet, Nightly, WalletConnect, and 10+ others.

> [!TIP]
>
> Looking to integrate NEAR Connect into your app? Check out the [Web Login Guide](https://docs.near.org/web3-apps/tutorials/wallet-login.md) for step-by-step instructions

***

## Integration Guide

Read our [Web Login Guide](https://docs.near.org/web3-apps/tutorials/wallet-login.md) for a step-by-step walkthrough of integrating NEAR Connect into your app, including code examples and best practices.

> [card] [Sign In](https://docs.near.org/web3-apps/tutorials/wallet-login.md#signing-in-%2F-out)
>
> Sign in with optional message signing.

> [card] [Transactions](https://docs.near.org/web3-apps/tutorials/wallet-login.md#calling-contract-method)
>
> Sign and send transactions.

***

## Additional Resources

* [NEAR Web Login Guide](https://docs.near.org/web3-apps/tutorials/wallet-login.md)
* [Github](https://github.com/azbang/near-connect)


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.