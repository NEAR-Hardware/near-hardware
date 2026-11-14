> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Transaction Lifecycle

> How NEAR transactions are signed, validated, included in chunks, and executed.

A NEAR transaction passes through signing, validation, and chunk inclusion before execution outcomes are available. The steps below describe this lifecycle; see [Blocks & Finality](https://docs.near.org/integrations/blocks-and-finality.md) for when execution can be treated as final.

***

## The Life of a Transaction

**1. Create and sign**

A client creates a transaction, computes the transaction hash and signs this hash to get a signed transaction. Now this signed transaction can be sent to a node.

**2. Route to the signer’s shard**

The RPC node uses `signer_id` to identify the signer’s shard. Transactions are forwarded to upcoming chunk producers for that shard.

**3. Validate and propagate**

The receiving node checks transaction metadata, including the signature, before forwarding it. A chunk producer tracking the signer’s shard validates it against available state, including access-key permissions, nonce, and balance. Invalid transactions can be rejected before inclusion; see [transaction execution](https://docs.near.org/protocol/transactions/transaction-execution.md).

**4. Add to the transaction pool**

Valid transactions are added to the transaction pool (every validating node has its own independent copy of a transaction pool). The transaction pool maintains transactions that are not yet discarded and not yet included into the chain.

**5. Select transactions for a chunk**

A pool iterator is used to pick transactions from the pool one at a time, with increasing nonces for each access key (there is no global ordering across accounts), until the pool is drained or some chunk limit is reached (max number of transactions per chunk or max gas burnt per chunk to process transactions).  Please refer to [transaction execution](https://docs.near.org/protocol/transactions/transaction-execution.md) and [gas](https://docs.near.org/protocol/transactions/gas.md) documentation for more details.

Transactions that cannot fit in the current chunk can remain pending. Admission to a node’s pool does not guarantee inclusion or execution; do not use pool admission as a settlement signal.

**6. Validate before chunk production**

Before producing a chunk, transactions are ordered and validated again. This is done to produce chunks with only valid transactions across a distributed system.

**7. Execute receipts**

When the included transaction is processed on the signer’s shard, it charges the signer and creates an action receipt. That receipt executes on the receiver’s shard; function calls can generate further receipts, including cross-contract calls, callbacks, and refunds. Execution may span multiple blocks.

**8. Read execution outcomes**

Execution errors are recorded in transaction and receipt outcomes. Read these outcomes through RPC; a successful HTTP response or initial transaction outcome does not prove that later receipts succeeded.

***

## Frequently Asked Questions

> [accordion] How are transactions constructed and signed?
>
> Transactions are a collection of related data that is composed and cryptographically signed by the sender using their private key. The related public key is part of the transaction and used for signature verification. Only signed transactions may be sent to the network for processing.
>
> Transactions can be constructed and signed offline. Signing itself does not require a node, but the mandatory recent block hash and access-key nonce must be obtained beforehand. Use a fresh finalized block and a nonce reserved for that key; see [transaction construction](https://docs.near.org/integrations/create-transactions.md).
>
> See [transactions](https://docs.near.org/protocol/transactions.md) in the concepts section of our documentation.

> [accordion] How is the hash preimage generated? Which fields does the raw transaction consist of?
>
> For a transaction, we sign the hash of the transaction. More specifically, what is signed is the `sha256` of the transaction object serialized in borsh ([https://github.com/near/borsh](https://github.com/near/borsh)).

> [accordion] How do transactions work on the NEAR platform?
>
> A `Transaction` is made up of one or more `Action`s. Common action types include `CreateAccount`,
> `DeployContract`, `FunctionCall`, `Transfer`, `Stake`, `AddKey`, `DeleteKey` and `DeleteAccount`. Delegation, global-contract, deterministic-initialization, and gas-key actions are also supported; consult the [versioned action definitions](https://github.com/near/nearcore/blob/2.13.4/core/primitives/src/action/mod.rs). Transactions are composed by a sender and then signed using the private keys of a valid NEAR account to create a `SignedTransaction`. This signed transaction is considered ready to send to the network for processing.
>
> Transactions are received via our JSON-RPC endpoint and routed to the shard where the `sender` account lives. This "home shard" for the sender account is then responsible for processing the transaction and generating related receipts to be applied across the network.
>
> Once received by the network, signed transactions are verified (using the embedded public key of the signer) and processed into an initial action receipt containing the transaction’s action list; function calls can generate additional receipts. `Action Receipt`s carry actions to execute, while `Data Receipt`s carry execution results to dependent calls, such as callbacks.
>
> These receipts are then propagated around the network using the receiver account's "home shard" since each account lives on one and only one shard. The receiving shard schedules receipt execution subject to dependencies and execution limits.
>
> Receipts may generate other, new receipts which in turn are propagated around the network until all receipts have been applied. If an action fails, state changes within that receipt are rolled back. Earlier successful receipts remain committed, and gas can still be charged. Refunds and callbacks execute as separate receipts; inspect their finalized outcomes.
>
> For more detail, see the documentation on [transactions](https://docs.near.org/protocol/transactions.md), [actions](https://docs.near.org/protocol/transactions/transaction-anatomy.md#actions), and [receipts](https://docs.near.org/protocol/transactions/transaction-execution.md)

> [accordion] How does NEAR serialize transactions?
>
> We use a simple binary serialization format that's deterministic: [https://borsh.io](https://borsh.io)

> [accordion] How old can the referenced block hash be before it's invalid?
>
> Query the network’s protocol configuration at a finalized block:
>
> ```sh theme={"theme":{"light":"github-light","dark":"github-dark"}}
> http post https://rpc.testnet.near.org jsonrpc=2.0 id=dontcare method=EXPERIMENTAL_protocol_config \
>   params:='{"finality":"final"}'
> # Replace testnet with mainnet to query mainnet.
> ```
>
> Use `transaction_validity_period`, measured in blocks, from the [`protocol_config` RPC endpoint](https://docs.near.org/api/rpc/protocol#protocol-config). For example, `86400` blocks at a 600ms cadence correspond to approximately 14.4 hours; validity is determined by blocks, not a fixed wall-clock deadline.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.