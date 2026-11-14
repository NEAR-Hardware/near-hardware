> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Blocks and Finality

> Finalized block queries, skipped heights, chunk processing, and transaction execution milestones for exchanges.

NEAR blocks contain chunks from individual shards. Transactions can produce receipt chains that execute across multiple blocks; exchanges confirm asset movements using successful, finalized receipt outcomes.

***

## Block processing

Typical block time is around **600ms**, with finality around **1.2s**. Confirm deposits using finalized execution outcomes. Query the latest finalized block with `{"finality": "final"}`:

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
http post https://rpc.mainnet.near.org method=block params:='{"finality":"final"}' id=123 jsonrpc=2.0
```

### Skipped block heights

Block heights can be skipped when a block producer misses its slot. If height 101 is skipped, block 102 references block 100 as its previous block. Follow `header.prev_hash` across gaps when scanning the chain.

### New chunks

A block's `chunks` array can include chunks from earlier blocks when a shard produces no new chunk. Process a chunk as new only when its `height_included` equals the containing block's `header.height`.

***

## Transaction execution milestones

When sending or querying a transaction, you can control which execution milestone the RPC waits for before returning a response by setting the [`wait_until` field](https://docs.near.org/api/rpc/transactions#the-wait_until-field) in `send_tx`, `tx`, or `EXPERIMENTAL_tx_status`:

| Value | Milestone |
| - | - |
| `NONE` | Submission returns without waiting for inclusion. |
| `INCLUDED` | Transaction included in a block. |
| `EXECUTED_OPTIMISTIC` (default) | All non-refund receipts executed; blocks may still be unfinalized. |
| `INCLUDED_FINAL` | Transaction included in a finalized block. |
| `EXECUTED` | Transaction block finalized and all non-refund receipts executed. |
| `FINAL` | Transaction and all receipt outcomes finalized, including refunds. |

For exchange settlement, request `wait_until: "FINAL"`, verify `final_execution_status === "FINAL"`, and inspect receipt outcomes for success or failure. Finality alone does not indicate successful execution.

Query an existing transaction using its hash and original signer:

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
http post https://rpc.mainnet.near.org jsonrpc=2.0 id=txstatus method=tx \
  params:='{"tx_hash":"<transaction_hash>","sender_account_id":"<signer_account_id>","wait_until":"FINAL"}'
```

For full receipt bodies, use [`EXPERIMENTAL_tx_status`](https://docs.near.org/api/rpc/transactions#transaction-status-with-receipts). If the RPC times out, poll the saved transaction hash; see [submission recovery](https://docs.near.org/integrations/create-transactions.md#submission-errors-and-retries).

***

## Frequently Asked Questions

> [accordion] Which consensus algorithm does NEAR use?
>
> NEAR is a sharded **proof-of-stake** blockchain using Doomslug consensus. [Nightshade](https://docs.near.org/papers/Nightshade.pdf) describes its sharding architecture.

> [accordion] How does on-chain transaction finality work?
>
> Query a block with `finality: "final"` to obtain finalized block context. For a transaction, request `wait_until: "FINAL"` and verify `final_execution_status === "FINAL"` before crediting its successful asset movements. The transaction’s inclusion block can finalize before downstream receipts finish.
>
> Typical finality is approximately 1.2 seconds. Confirm deposits using finalized execution outcomes. See [transaction status](https://docs.near.org/api/rpc/transactions.md) and [native deposit checks](https://docs.near.org/integrations/deposits.md#transfer-from-function-call).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.