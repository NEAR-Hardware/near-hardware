> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Start Building

> Choose what to build on NEAR, and find the guides and tools you need for it

NEAR lets you write smart contracts in Rust, build Web3 apps where users log in with their wallets, control accounts on other chains, and give AI agents access to the blockchain.

Pick what you want to build, and follow its guide.

> [card] [Smart Contracts](#smart-contracts)
>
> Write programs in Rust that store data, hold tokens, and run on-chain.

> [card] [Web3 Apps](#web3-apps)
>
> Build frontends where users log in with their NEAR wallets.

> [card] [Multichain Apps](#multichain-apps)
>
> Sign transactions for Bitcoin, Ethereum, Solana, and more.

> [card] [AI Agents](#ai-agents)
>
> Help your coding agent build on NEAR, or let agents use the blockchain.

> [card] [On-Chain Data](#on-chain-data)
>
> Query the history of accounts, transactions, and events.

> [card] [Build a Complete App](#go-further)
>
> Combine a contract, tests, a frontend, and an indexer in one app.

> [card] [Need Help?](https://docs.near.org/communities.md)
>
> Ask questions in the NEAR developer channels, and find answers to common questions.

***

## Smart Contracts

Smart contracts are programs that live on the blockchain: they store data, hold tokens, and execute code when users call their functions. In NEAR, contracts are written in Rust.

> [card] [Smart Contract Quickstart](https://docs.near.org/smart-contracts/quickstart.md)
>
> Create, test and deploy an auction contract.

#### Tools you will use

> [card] [near-sdk-rs](https://docs.near.org/tools/sdk.md)
>
> The official SDK to write contracts in Rust.

> [card] [NEAR Sandbox](https://docs.near.org/smart-contracts/testing/integration-test.md)
>
> Tests your contract locally, no account needed.

> [card] [NEAR CLI](https://docs.near.org/tools/cli.md)
>
> Creates accounts, deploys contracts, and calls their functions from the terminal.

> [card] [cargo-near](https://github.com/near/cargo-near)
>
> Creates, builds and deploys contracts.

***

## Web3 Apps

Web3 apps are frontends where users log in with their NEAR wallets and interact with smart contracts.

> [card] [Web3 App Quickstart](https://docs.near.org/web3-apps/quickstart.md)
>
> Create a React app where users log in and call a contract already deployed on `testnet`.

> [card] [Add Wallet Login](https://docs.near.org/web3-apps/tutorials/wallet-login.md)
>
> Already have an app? Add NEAR wallet login to it.

#### Tools you will use

> [card] [NEAR Connect](https://docs.near.org/tools/near-connect.md)
>
> Lets users log in with any NEAR wallet.

> [card] [NEAR API JS](https://docs.near.org/tools/near-api.md#🌐-near-api-js)
>
> Reads data from the blockchain and sends transactions.

> [card] [near-kit](https://docs.near.org/tools/near-api.md#🌐-near-kit)
>
> Modern TypeScript client with a fetch-like API.

> [card] [near-kit-py](https://docs.near.org/tools/near-api.md#🐍-near-kit-py)
>
> Reads data from the blockchain and sends transactions from Python.

> [card] [create-near-app](https://github.com/near/create-near-app)
>
> Creates a frontend template ready to talk with NEAR.

> [card] [near-sign-verify](https://github.com/elliotBraem/near-sign-verify)
>
> Creates and validates NEP-413 signed messages.

> [card] [better-near-auth](https://github.com/elliotBraem/better-near-auth)
>
> Sign in with NEAR plugin for Better Auth.

***

## Multichain Apps

NEAR accounts and contracts can sign transactions for other chains, such as Bitcoin, Ethereum and Solana, and users can swap assets across chains by simply expressing the outcome they want.

> [card] [Chain Signatures](https://docs.near.org/chain-abstraction/chain-signatures/implementation.md)
>
> Sign transactions for other chains from a NEAR account or contract.

> [card] [NEAR Intents](https://docs.near.org/chain-abstraction/intents/overview.md)
>
> Let users swap assets across chains, with solvers competing to fill their request.

#### Tools you will use

> [card] [chainsig.js](https://docs.near.org/chain-abstraction/chain-signatures/implementation.md)
>
> Builds and signs transactions for other chains from TypeScript.

> [card] [omni-transaction-rs](https://github.com/near/omni-transaction-rs)
>
> Builds transactions for other chains from Rust, including from within a contract.

> [card] 1Click SDKs
>
> Request cross-chain swaps through NEAR Intents, from [TypeScript](https://github.com/defuse-protocol/one-click-sdk-typescript), [Rust](https://github.com/defuse-protocol/one-click-sdk-rs) or [Go](https://github.com/defuse-protocol/one-click-sdk-go).

> [card] [intents-sdk](https://github.com/defuse-protocol/sdk-monorepo/tree/main/packages/intents-sdk)
>
> SDK to build intents-based applications.

> [card] [NEAR Intents Docs](https://docs.near-intents.org/near-intents)
>
> The complete documentation of NEAR Intents.

> [card] [NEAR Intents Explorer](https://explorer.near-intents.org/)
>
> Explore the transactions made through NEAR Intents.

***

## AI Agents

Coding agents can help you build on NEAR, and agents can use NEAR to hold assets and send transactions.

> [card] [Tools for AI Agents](https://docs.near.org/getting-started/tools-for-ai.md)
>
> Give your agent access to these docs, to task-specific skills, and to the blockchain.

#### Tools you will use

> [card] [Agent Skills](https://docs.near.org/getting-started/tools-for-ai.md#near-agent-skills)
>
> Task-specific guidance for coding agents building on NEAR.

> [card] [NEAR AI Cloud](https://docs.near.ai/)
>
> Private, verifiable AI inference.

> [card] [near-ai-chat](https://github.com/jlwaugh/near-ai-chat)
>
> AI chat agent starter template for NEAR AI Cloud.

> [!TIP]
>
> **Need NEAR AI credits?** You can [request NEAR AI Cloud credits](https://www.notion.so/Requesting-NEAR-AI-Cloud-Credits-2deda22d7b6481aea8e1e30282efcb5e) for your project.

***

## On-Chain Data

If your app needs historical data, such as all the transactions of a user or the events of a contract, you will need more than the RPC: data APIs, public datasets, and indexers.

> [card] [What is Data Infrastructure?](https://docs.near.org/data-infrastructure/what-is.md)
>
> Learn about the options to access on-chain data, and when to use each.

#### Tools you will use

> [card] [Data APIs](https://docs.near.org/data-infrastructure/data-api.md)
>
> Track the assets, transactions and events of any account through simple API calls.

> [card] [BigQuery](https://docs.near.org/data-infrastructure/big-query.md)
>
> Query historical on-chain data using SQL.

> [card] [Neardata](https://docs.fastnear.com/neardata)
>
> Stream blocks into your own indexer.

> [card] [Stream NEAR](https://stream.near.tools)
>
> Server-Sent Events stream for real-time block data.

***

## Go Further

> [card] [Mastering NEAR](https://docs.near.org/web3-apps/tutorials/mastering-near/0-intro.md)
>
> Once you have gone through a quickstart, build a complete app: an auction contract with tests, a frontend, an indexer, NFT and FT support, and a factory to deploy new auctions.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.