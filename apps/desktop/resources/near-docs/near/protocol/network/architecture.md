> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Architectural Overview

> Understand NEAR's accounts, transactions, data flow, tokens, storage, and network.

NEAR is a blockchain for applications built with smart contracts. Users interact with these applications through accounts and transactions, while validators process their activity across parallel parts of the network called shards.

***

## Accounts and smart contracts

An **account** holds a NEAR balance, access keys, and optionally a smart contract with its own storage. Access keys determine who can sign transactions and what those transactions can do.

A **smart contract** is code deployed to an account. Applications call its methods to update stored data, transfer assets, or interact with other contracts.

Learn more about [Accounts](https://docs.near.org/protocol/accounts-contracts/account-model.md) and [Access Keys](https://docs.near.org/protocol/accounts-contracts/access-keys.md).

***

## Transactions and receipts

A user signs a **transaction** to request actions, such as sending NEAR or calling a contract. NEAR processes these actions through **receipts**, internal messages that can produce further receipts when contracts call each other.

This means a transaction can lead to several steps of execution across the network. The [runtime](https://docs.near.org/protocol/network/runtime.md) applies the rules for executing these actions and updating account state.

See [Transactions](https://docs.near.org/protocol/transactions.md) and [Lifecycle of a Transaction](https://docs.near.org/protocol/transactions/transaction-execution.md) for the full process, and [Gas](https://docs.near.org/protocol/transactions/gas.md) for execution fees.

***

## Shards and data flow

NEAR distributes accounts across **shards** so the network can process activity in parallel. Accounts on different shards communicate through receipts.

See [NEAR Data Flow](https://docs.near.org/protocol/data-flow/near-data-flow.md) for how activity moves across shards, or follow a [Token Transfer](https://docs.near.org/protocol/data-flow/token-transfer-flow.md) through the network.

***

## Tokens

The [native NEAR token](https://docs.near.org/protocol/network/tokens.md) pays transaction fees, covers on-chain storage, and secures the network through validator staking.

Smart contracts can also define **fungible tokens**, **NFTs**, and **MultiTokens**. Shared [Token Standards](https://docs.near.org/protocol/network/token-standards.md) define how wallets and applications query and transfer these assets.

***

## Storage

Accounts and contracts store data on-chain, such as access keys, token balances, and application records. **Storage staking** reserves NEAR to cover the space this data occupies. Removing data releases the corresponding storage stake.

See [Storage Staking](https://docs.near.org/protocol/storage/storage-staking.md) for how storage is priced and managed.

***

## Network

[Validators](https://docs.near.org/protocol/network/validators.md) secure NEAR through proof of stake, producing and validating blocks and shard chunks. Validator assignments are updated in periods called [epochs](https://docs.near.org/protocol/network/epoch.md).

Applications run on [mainnet, testnet, or a local network](https://docs.near.org/protocol/network/networks.md). Mainnet is the live network; testnet and local networks let developers experiment before deploying there.

> [!NOTE]
>
> **Looking for the low-level details?**
>
> The [Nomicon](https://nomicon.io/) is where `nearcore` developers document the protocol specification - data structures, chain, network, runtime, and economics - and how `nearcore` works internally. You don't need it to build on NEAR.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.