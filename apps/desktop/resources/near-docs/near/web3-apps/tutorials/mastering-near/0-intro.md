> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# A Step-by-Step Guide to Mastering NEAR

> Build a full web3 app, from its contract to a frontend using indexers.

Welcome! In this guide we will help you navigate NEAR tech stack, so you can build Web3 applications from start to finish in no-time.

We'll start from a simple auction contract and slowly build on top of it to create a full Web3 application to carry out on-chain auctions.

By the time you finish this tutorial, you will have learned several concepts and how to use many key primitives along the way:

* [Creating a simple smart contract](https://docs.near.org/web3-apps/tutorials/mastering-near/1.1-basic.md#the-contracts-state)
* [Writing tests for a contract](https://docs.near.org/web3-apps/tutorials/mastering-near/1.2-testing.md)
* [Deploying a contract to testnet](https://docs.near.org/web3-apps/tutorials/mastering-near/1.3-deploy.md)
* [Locking a contract](https://docs.near.org/web3-apps/tutorials/mastering-near/1.3-deploy.md#locking-the-contract)
* [Creating a frontend to interact with the contract](https://docs.near.org/web3-apps/tutorials/mastering-near/2.1-frontend.md)
* [Using an indexing API to view historical bids](https://docs.near.org/web3-apps/tutorials/mastering-near/2.2-indexing.md)
* [Making cross-contract calls](https://docs.near.org/web3-apps/tutorials/mastering-near/3.1-nft.md#transferring-the-nft-to-the-winner)
* [Using Non-Fungible Tokens](https://docs.near.org/web3-apps/tutorials/mastering-near/3.1-nft.md)
* [Using Fungible Tokens](https://docs.near.org/web3-apps/tutorials/mastering-near/3.2-ft.md)
* [Modifying a factory contract to deploy your own contracts](https://docs.near.org/web3-apps/tutorials/mastering-near/4-factory.md)

***

## Prerequisites

Before starting, make sure to set up your development environment!

> [accordion] Working on Windows?
>
> See our blog post getting started on NEAR using Windows for a step-by-step guide on how to setup WSL and your environment

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
# Install Rust: https://www.rust-lang.org/tools/install
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Contracts will be compiled to wasm, so we need to add the wasm target
rustup target add wasm32-unknown-unknown

# Install the NEAR CLI to deploy and interact with the contract
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/near/near-cli-rs/releases/latest/download/near-cli-rs-installer.sh | sh

# Install cargo near to help building the contract
cargo install cargo-near --version 0.21.1 --locked
```

We will be using [NEAR CLI](https://docs.near.org/tools/cli.md) to interact with the blockchain through the terminal, and Rust to write the contract.

For the frontend sections, install [Node.js](https://nodejs.org/) 22.12 or newer. The example uses Node.js 24 in CI.

***

## Overview

This series will touch on different level of the NEAR tech stack. Each section will be independent of the previous one, so feel free to jump into the section that interests you the most.

#### 1. Smart contracts 101

1. [The Auction Contract](https://docs.near.org/web3-apps/tutorials/mastering-near/1.1-basic.md): We cover a simple auction smart contract
2. [Testing the Contract](https://docs.near.org/web3-apps/tutorials/mastering-near/1.2-testing.md): Learn how to test your contract in a realistic environment
3. [Deploying the Contract](https://docs.near.org/web3-apps/tutorials/mastering-near/1.3-deploy.md): Deploy your contract to the NEAR blockchain

#### 2. Frontends 101

1. [Creating the frontend](https://docs.near.org/web3-apps/tutorials/mastering-near/2.1-frontend.md): Lets learn how to connect a frontend with your smart contract
2. [indexing historical data](https://docs.near.org/web3-apps/tutorials/mastering-near/2.2-indexing.md): Use APIs to keep track of historical bids

#### 3. Using Primitives

1. [Giving an NFT to the Winner](https://docs.near.org/web3-apps/tutorials/mastering-near/3.1-nft.md): Give the highest bidder an NFT to signal their win
2. [Integrating Fungible Tokens](https://docs.near.org/web3-apps/tutorials/mastering-near/3.2-ft.md): Allow people to use fungible tokens to bid (e.g. stable coins)
3. [Updating the frontend](https://docs.near.org/web3-apps/tutorials/mastering-near/3.3-new-frontend.md): Update the frontend to use the extended functionality of the contract.

#### 3. Auction Factory

1. [Creating a factory](https://docs.near.org/web3-apps/tutorials/mastering-near/4-factory.md): Allow users to easily deploy and initialize their own auction contracts

***

## Next steps

Ready to start? Let's jump to the [The Auction Contract](https://docs.near.org/web3-apps/tutorials/mastering-near/1.1-basic.md) and begin your learning journey!

***

> [!NOTE]
>
> **Versioning for this article**
>
> * Rust: `1.97.1` (selected by the repository)
> * near-sdk: `5.29.1`
> * cargo-near: `0.21.1`
> * Node.js: `22.12+` (CI uses `24`)
> * near-api-js: `7`


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.