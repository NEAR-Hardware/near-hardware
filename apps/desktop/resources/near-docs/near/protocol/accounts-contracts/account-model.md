> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# NEAR Accounts

> A unique account model that supports multiple types of addresses, access keys, and smart contracts.

Users participate in the NEAR ecosystem through their NEAR accounts. These accounts are identified by a [unique address](https://docs.near.org/protocol/accounts-contracts/account-id.md), can optionally hold a [smart contract](https://docs.near.org/smart-contracts/what-is.md), and are controlled through [Access Keys](https://docs.near.org/protocol/accounts-contracts/access-keys.md).

By signing [transactions](https://docs.near.org/protocol/transactions.md) with their account, users can:

1. Send and receive **digital assets** (such as tokens or collectibles)
2. Create and interact with on-chain applications known as **smart contracts**
3. Control accounts in **other chains** (such as Ethereum or Bitcoin) ✨
4. Help onboard new users by **covering the costs** of their transactions (gas fees)

> [!TIP]
>
> **Want to create an account?**
>
> Check out our tutorial on [Creating a NEAR Account](https://docs.near.org/getting-started/create-account.md) to get started!

***

## Account Model Overview

Let's take a closer look at the different elements that compose the NEAR account model.

![Account model](https://mintcdn.com/neardocs/qO2GD-gji1aakHqN/assets/docs/welcome-pages/accounts.png?fit=max\&auto=format\&n=qO2GD-gji1aakHqN\&q=85\&s=d66e946b872d8ee682196033c6d96e3a)

### Account ID

NEAR **natively** implements multiple [types of addresses](https://docs.near.org/protocol/accounts-contracts/account-id.md), including:

1. **Named accounts** such as `alice.near`, which are simple to remember and share
2. **Implicit accounts** such as `fb924c...` (64 chars), derived from an `ed25519` private key
3. **Ethereum-like accounts**, controlled by Ethereum wallets
4. **Deterministic accounts** such as `0s85f17...` (42 chars), derived from their initial code and storage
5. **Universal accounts** such as `0u0000...` (54 chars), derived from their initial code, storage, and keys

### Multiple Keys

NEAR accounts can have [multiple keys](https://docs.near.org/protocol/accounts-contracts/access-keys.md), each with their own set of permissions:

* You can easily swap keys if one gets compromised
* You can use keys as authorization tokens for third-party applications

### Smart Contracts

NEAR accounts can optionally hold an application - known as a [smart contract](https://docs.near.org/smart-contracts/what-is.md) - which can store data and expose functions to interact with it.

***

## Comparison With Ethereum

If you're familiar with development on Ethereum, it's worth making a quick note about how accounts are different. The table below summarizes some key differences:

| | Ethereum Account | NEAR Account |
| - | - | - |
| Account ID | Public Key (`0x123...`) | - Native named accounts (`alice.near`) - Implicit accounts (`0x123...`) |
| Secret Key | Private Key (`0x456...`) | Multiple key-pairs with permissions: - `FullAccess` key - `FunctionCall` key |
| Smart Contracts | Synchronous execution | Asynchronous execution |
| Gas Fees | In the order of dollars | In the order of tenths of a cent |
| Block Time | \~12 seconds | \~600 milliseconds |


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.