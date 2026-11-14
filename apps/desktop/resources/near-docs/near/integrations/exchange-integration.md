> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Exchange Integration

> Learn how to integrate NEAR Protocol.

NEAR is an open-source, sharded proof-of-stake blockchain with support for smart contracts.

| Property | Value / behavior | Reference |
| - | - | - |
| Native token precision | 24 decimals; `1 NEAR = 10²⁴ yoctoNEAR`. RPC balances and transfer amounts use integer strings in yoctoNEAR. | [Balances](https://docs.near.org/integrations/balance-changes.md) |
| Account addresses | Implicit IDs: 64 lowercase hexadecimal characters; named IDs such as `alice.near`; Ethereum-like IDs starting with `0x`; deterministic IDs starting with `0s`; from protocol version 88 (nearcore 2.14.0), universal IDs starting with `0u` (54 characters). See the note below the table. | [Account IDs](https://docs.near.org/protocol/accounts-contracts/account-id.md) |
| Block time | Produced in \~600 ms, final in \~1.2 s. | [Blocks & Finality](https://docs.near.org/integrations/blocks-and-finality.md) [Execution milestones](https://docs.near.org/api/rpc/transactions.md#the-wait_until-field) |
| Transaction validity | `transaction_validity_period` is measured in blocks; `86400` blocks is \~14.4 hours at a 600 ms cadence. | [Transaction Lifecycle](https://docs.near.org/integrations/transaction-lifecycle.md#how-old-can-the-referenced-block-hash-be-before-its-invalid%3F) |
| Transaction fees | The gas price has a floor of **0.0001 NEAR/Tgas** and rises with network load. Gas for execution is bought up front at no less than 0.001 NEAR/Tgas. Unused gas and the price difference are refunded. See [Fees and required balances](#fees-and-required-balances). | [Gas fees](https://docs.near.org/protocol/transactions/gas.md) |

> [!NOTE]
>
> A transfer to a `0u` ID that does not exist yet creates an uninitialized account that holds the deposit. Before protocol version 88, a transfer to a `0u` ID fails.

## Fees and required balances

Gas usage is determined by the actions and their parameters. For function calls, it also depends on contract execution. A transaction pays for gas in three steps:

| Step | Gas | Price |
| - | - | - |
| Send the transaction | Fees for sending the transaction | The current gas price |
| Buy gas for executing it | Fees for executing the transaction, plus any gas attached to function calls | The current gas price or 0.001 NEAR/Tgas, whichever is higher |
| Execute it | The gas that is burned | The current gas price, but never above the price at which the gas was bought |

The first two steps are paid up front. With a regular access key, the account balance must cover this up-front cost plus any deposit. With a [gas key](https://docs.near.org/protocol/accounts-contracts/gas-keys.md), the gas key balance covers the gas and the account balance covers the deposit.

Unused gas and the price difference are refunded. When a transaction creates an account, part of that refund is kept so that the account creation charge comes to about 0.007 NEAR.

***

## Integration Reference

* [Nodes & RPC](https://docs.near.org/integrations/nodes.md)
* [Accessing On-chain Data](https://docs.near.org/integrations/on-chain-data.md)
* [Accounts](https://docs.near.org/integrations/accounts.md)
* [Blocks and Finality](https://docs.near.org/integrations/blocks-and-finality.md)
* [Transaction Lifecycle](https://docs.near.org/integrations/transaction-lifecycle.md)
* [Testing](https://docs.near.org/integrations/testing.md)
* [Receiving Deposits](https://docs.near.org/integrations/deposits.md)
* [Sending Withdrawals](https://docs.near.org/integrations/create-transactions.md)
* [Fungible Tokens](https://docs.near.org/integrations/fungible-tokens.md)
* [Balances & Reconciliation](https://docs.near.org/integrations/balance-changes.md)
* [Staking & Delegation](https://docs.near.org/integrations/staking.md)
* [Error Handling](https://docs.near.org/integrations/errors/introduction.md)

### Transaction Reference Links

* [Basics](https://docs.near.org/protocol/transactions.md)
* [Transaction Structure](https://docs.near.org/protocol/transactions/transaction-anatomy.md)
* [Constructing Transactions](https://docs.near.org/integrations/create-transactions.md)

***

## Additional Resources

* [The Beginner's Guide to the NEAR Blockchain](https://near.org/blog/the-beginners-guide-to-the-near-blockchain)
* [NEAR Whitepaper](https://www.near.org/papers)
* [NEAR GitHub](https://www.github.com/near)

***

## Frequently Asked Questions

These guides provide answers to frequently asked questions about integrating with the NEAR Protocol. It covers topics such as account management, validator operations, transaction processing, and more.

> [accordion] What is a good project summary for NEAR?
>
> NEAR is a sharded, public, proof-of-stake blockchain and supports smart contracts written in Rust and compiled to WebAssembly (WASM).

> [accordion] What's special about NEAR?
>
> NEAR is the blockchain for builders.
>
> If you understand the basics of web development, you can write, test and deploy scalable decentralized applications in minutes on the most developer-friendly blockchain without having to learn new tools or languages.

> [accordion] Is NEAR open source?
>
> Yes. Have a look at our [GitHub organization](https://github.com/near).

> [accordion] Do you have any on-chain governance mechanisms?
>
> NEAR has [House of Stake governance](https://gov.houseofstake.org/blog/introducing-near-house-of-stake). Governance proposals and consensus protocol activation are separate processes; follow the implementation and activation requirements for each change.

> [accordion] Do you have a bug-bounty program?
>
> Follow the current [nearcore security policy](https://github.com/near/nearcore/security/policy) for disclosure instructions and links to any applicable program.

> [accordion] What contracts should we be aware of right now?
>
> The [core-contracts repository](https://github.com/near/core-contracts) contains reference implementations. Review the deployed version and authority of each contract you integrate with:
>
> * **Staking Pool / Delegation contract**
> * **Lockup / Vesting contract**
> * Whitelist Contract
> * Staking Pool Factory
> * Multisig contract


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.