> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near-intents.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Verifier Contract

> The on-chain settlement layer for NEAR Intents

![NEAR Intents Verifier Contract](https://mintcdn.com/defuselabsltd/OBaHx8_FZb8uK__Y/images/diagrams/verifier-contract-intro-light.png?fit=max\&auto=format\&n=OBaHx8_FZb8uK__Y\&q=85\&s=1e1a1cef101bddee33e469aa5bd16f62)

The Verifier Smart Contract (`intents.near`) is the on-chain settlement layer for NEAR Intents. Deposited tokens are credited to accounts in the contract's ledger. Swaps and transfers update those records; tokens leave the contract only on withdrawal through [token bridges](https://docs.near-intents.org/integration/bridging/overview.md). Intents Technology does not custody these balances — control stays with the keys that can sign for each account.

The typical flow is:

1. **Deposit** tokens to `intents.near`. The contract credits your account in its on-chain ledger. *(See [Deposits](https://docs.near-intents.org/integration/verifier-contract/deposits-and-withdrawals/deposits.md))*

2. **Swap or transfer** by submitting intents. Users express their "intent" to perform a transaction (e.g., exchange USDT for USDC, or transfer tokens to another user). Intents can be submitted directly or bundled together by a third party like the Message Bus for atomic execution. *(See [Intent Types](https://docs.near-intents.org/integration/verifier-contract/intent-types-and-execution.md))*

3. **Withdraw** tokens to your NEAR account or external chain. For external chain asset transfer, the Verifier settles the withdrawal through the appropriate token bridge, delivering tokens to the destination address. *(See [Withdrawals](https://docs.near-intents.org/integration/verifier-contract/deposits-and-withdrawals/withdrawals.md))*

## Who is this documentation for?

Most applications integrating token swaps do not need to interact with the Verifier contract directly. The [1Click Swap API](https://docs.near-intents.org/integration/distribution-channels/1click-api/about-1click-api.md) handles intent creation, market maker coordination, and execution.

This section is for developers who need lower-level control and want to:

* Interact with the Verifier smart contract directly
* Create payloads for the [Message Bus](https://docs.near-intents.org/integration/market-makers/message-bus/introduction.md) (a matching system that brings together quotes from market makers with transaction requests)

## Prerequisites

Before working directly with the Verifier contract, you should have:

* A [NEAR account](https://docs.near.org/tutorials/protocol/create-account) (named account like `yourname.near` or implicit account)
* Tokens to deposit (fungible tokens like USDC, USDT, or wrapped NEAR)
* Basic understanding of [NEAR transactions](https://docs.near.org/concepts/protocol/transactions) and [cross-contract calls](https://docs.near.org/smart-contracts/anatomy/crosscontract)
* Familiarity with JSON and digital signatures

> [!TIP]
>
> If you're new to NEAR, start with the [NEAR documentation](https://docs.near.org/) to understand accounts, transactions, and the basics of smart contract interaction.

## Deployment

The Verifier smart contract is deployed at [`intents.near`](https://nearblocks.io/address/intents.near).

> [!WARNING]
>
> There is no testnet deployment. Use small amounts for testing purposes.

## Source code

The contract is open source. You can find it on GitHub:

> [card] [NEAR Intents Repository](https://github.com/near/intents)
>
> View the source code for the Verifier smart contract

> [!NOTE]
>
> The former name of the smart contract is "Defuse". You may still see this name in some places in the codebase. It is planned to be updated in the future.

## Next steps

> [card] [Account Abstraction](https://docs.near-intents.org/integration/verifier-contract/account-abstraction.md)
>
> Learn about account identification and key management

> [card] [Deposits & Withdrawals](https://docs.near-intents.org/integration/verifier-contract/deposits-and-withdrawals/deposits.md)
>
> Learn how to deposit and withdraw tokens

> [card] [Intent Types](https://docs.near-intents.org/integration/verifier-contract/intent-types-and-execution.md)
>
> Explore available intent types and how to structure them

> [card] [Signing Intents](https://docs.near-intents.org/integration/verifier-contract/signing-intents.md)
>
> Understand how to sign intents for different wallet types


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.