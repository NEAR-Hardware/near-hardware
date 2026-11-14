> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# What is a Smart Contract?

> Learn how NEAR smart contracts store data, execute transactions, and power decentralized applications.

Smart contracts are pieces of **executable code** that live in a NEAR account. They can **store data**, **perform transactions** in the account’s name, and **expose methods** so other accounts can interact with them.

![img](https://mintcdn.com/neardocs/qO2GD-gji1aakHqN/assets/docs/welcome-pages/4.smart-contracts.webp?fit=max\&auto=format\&n=qO2GD-gji1aakHqN\&q=85\&s=9cf15b8551b3cab56bad39fab06cce58)

Smart contracts in NEAR are written in Rust and then compiled into WebAssembly.

During development, you can test them locally using [unit tests](https://docs.near.org/smart-contracts/testing/unit-test.md) and [NEAR Sandbox](https://docs.near.org/smart-contracts/testing/integration-test.md). Sandbox tests start a local blockchain and handle account creation, balances, and contract setup in code. You do not need a public account, faucet tokens, or a wallet login to run them.

When you are ready to share your contract, you can deploy it to testnet and connect a frontend.

> [accordion] New to Smart Contract Development?
>
> Do not worry if you don't know how smart contract blockchains work. As a developer, it is sufficient to understand that NEAR smart contracts:
>
> 1. Have **limited** computational resources.
> 2. Interact with other contracts in an **asynchronous** way.
> 3. Deal with **real money**, for which security must be a top concern.

***

## Where do contracts live?

Smart contracts are deployed to [**NEAR accounts**](https://docs.near.org/protocol/accounts-contracts/account-model.md). Any NEAR account can hold a contract and must pay for the **contract's code** and the **data it stores**.

Once in an account, anyone can interact with the contract. Thanks to the underlying network structure, executing code from a contract is both **fast** (average finality of 1.2 seconds) and **cheap**. **Read-only** operations are **free for everyone**.

> [!NOTE]
>
> Storing 100 KB costs 1 Ⓝ, so deploying a contract generally costs only a few `$NEAR`s.

> [!TIP]
>
> Since protocol version 2.6, NEAR supports [**global contracts**](https://docs.near.org/smart-contracts/global-contracts.md), which can be deployed to multiple accounts without paying for code storage each time.

***

## What can they do?

Smart contracts have **complete control over the account** and can therefore perform **any action on its behalf**. For example, contracts can:

* Transfer `$NEAR` tokens
* Call methods on other contracts
* Create new accounts and deploy contracts on them
* Update their own code

In addition, smart contracts can store data in the account's storage. This allows contracts to create almost any type of application, from simple games to complex financial systems.

> [!CAUTION]
>
> **What contracts cannot do**
>
> * Smart contracts cannot **access the internet**, so they cannot make HTTP requests or access external data
> * Smart contracts cannot **execute automatically**; they must be called by an external account

***

## A contract is not a backend

Contract state is for the data the contract needs to **enforce its rules**, such as balances, ownership, or the current highest bid. It is not a database for your app.

Everything a transaction does is already recorded on-chain: who called which method, the arguments they passed, and the tokens they attached. [Indexers and data services](https://docs.near.org/data-infrastructure/what-is.md) can read this activity back at any time. If your app only needs to *display* some data, such as messages, posts or history, have the contract validate the call and leave the data in the transaction, then read it with an indexer instead of storing it in the contract.

Storage is also the expensive part: every byte requires [staking NEAR](https://docs.near.org/protocol/storage/storage-staking.md) (1 Ⓝ per 100 KB), while computation only costs gas. Never store values you can derive from other values. For example, if a message is premium when the user attaches at least 0.1 Ⓝ, store the amount *or* the premium flag, not both.

> [accordion] Example: a guest book
>
> A guest book that stores every message in the contract pays for the storage of each message for as long as it exists. Instead, a production guest book can expose an `add_message(text)` method that only checks the attached deposit. The message stays in the transaction's arguments, and the frontend lists messages by asking an indexer for every call to `add_message`.

> [!TIP]
>
> If several contracts need to report the same kind of activity in a standard format, such as fungible or non-fungible token transfers, emit [events](https://docs.near.org/smart-contracts/anatomy/events.md). For data that only your app reads, indexing the method calls is enough.

***

## What are they used for?

Smart contracts are used to create **decentralized applications**. Common examples include:

* [Decentralized Autonomous Organizations](https://nearcatalog.xyz/?cat=dao), where users create and vote on proposals
* [Marketplaces](https://nearcatalog.xyz/?cat=marketplaces), where users create and trade digital artworks
* [Decentralized exchanges](https://nearcatalog.xyz/?cat=exchanges), where users can trade different currencies
* [And many more...](https://nearcatalog.xyz/)

For instance, you can easily create a crowdfunding contract that accepts `$NEAR`. If the goal is met in time, the creator can claim the funds. Otherwise, the backers are refunded.

***

## Smart Contract SDK

[near-sdk-rs](https://github.com/near/near-sdk-rs) is NEAR's only official smart-contract SDK. Use it to write contracts in Rust and compile them to WebAssembly.

Start with the [smart-contract quickstart](https://docs.near.org/smart-contracts/quickstart.md), or see the [Rust SDK guide](https://docs.near.org/tools/sdk.md) for reference documentation.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.