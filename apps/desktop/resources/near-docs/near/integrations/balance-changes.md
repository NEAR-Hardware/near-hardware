> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Balances & Reconciliation

> Learn how to query and track account balances in NEAR protocol, including native NEAR tokens, fungible tokens, and balance management for integrations.

Balance changes on accounts can be tracked by using our [changes RPC endpoint](https://docs.near.org/api/rpc/contracts.md#view-account-changes). You can test this out by sending tokens to an account using [NEAR-CLI](https://docs.near.org/tools/cli.md#send-near) and then viewing the changes made.

> [!TIP]
>
> For continuous monitoring, use an [indexer](https://docs.near.org/data-infrastructure/indexers.md) to process finalized receipts and outcomes across shards and store the movements affecting your accounts.

***

## View Balance Changes

For an incoming deposit, identify the successful finalized receiving receipt and use its outcome’s `block_hash`; the transaction-inclusion block may be different. Query changes for the exchange **receiver**, not the original signer.

For general reconciliation, select one finalized block hash and query all relevant accounts and token contracts at that checkpoint. Inspect change causes; fees, outgoing transfers, and refunds also change balances.

The example below queries the receiving receipt of [this finalized testnet transaction](https://testnet.nearblocks.io/txns/GgjJMwGhJF8ybgMCCc6v9HxE7DPm8UJyRT6yxdJV3stj) from `influencer.testnet`. It transfers **2 NEAR** to `linkdrop.primitives.testnet`. The returned `amount` is the receiver’s total balance after the transfer, in yoctoNEAR. The `receipt_hash` identifies the receipt that caused the update.

**Example Query using HTTPie:**

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
http post https://archival-rpc.testnet.near.org jsonrpc=2.0 id=dontcare \
    method=changes \
    'params:={
        "block_id": "C8hyrSb5LJjHS5fJXGroWA56hDenCL5YR5bVbuuguDCj",
        "changes_type": "account_changes",
        "account_ids": ["linkdrop.primitives.testnet"]
    }'
```

<details>
  <summary>**Example Response:**</summary>

  ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
  {
    "jsonrpc": "2.0",
    "result": {
      "block_hash": "C8hyrSb5LJjHS5fJXGroWA56hDenCL5YR5bVbuuguDCj",
      "changes": [
        {
          "cause": {
            "receipt_hash": "Eide5UwGWRDUk3ZFJVKFu9rdL7hJiUiEZ7wqeyvwTuP4",
            "type": "receipt_processing"
          },
          "change": {
            "account_id": "linkdrop.primitives.testnet",
            "amount": "2998044874632158900000000",
            "code_hash": "11111111111111111111111111111111",
            "locked": "0",
            "storage_paid_at": 0,
            "storage_usage": 182
          },
          "type": "account_update"
        }
      ]
    },
    "id": "dontcare"
  }
  ```
</details>

***

## Balance Snapshot

Alternatively, [query `view_account`](https://docs.near.org/api/rpc/contracts#view-account) for a balance snapshot. Use the same finalized block hash for reconciliation.

> [!TIP]
>
> Balances like this do not include Fungible Tokens; FT balances require `ft_balance_of` on the token contract

**Example HTTPie Request:**

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
http post https://archival-rpc.testnet.near.org jsonrpc=2.0 id=dontcare method=query \
params:='{
  "request_type": "view_account",
  "block_id": "C8hyrSb5LJjHS5fJXGroWA56hDenCL5YR5bVbuuguDCj",
  "account_id": "linkdrop.primitives.testnet"
}'
```

**Example Response:**

```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
{
  "jsonrpc": "2.0",
  "result": {
    "amount": "2998044874632158900000000",
    "block_hash": "C8hyrSb5LJjHS5fJXGroWA56hDenCL5YR5bVbuuguDCj",
    "block_height": 271205691,
    "code_hash": "11111111111111111111111111111111",
    "locked": "0",
    "storage_paid_at": 0,
    "storage_usage": 182
  },
  "id": "dontcare"
}
```

***

## Frequently Asked Questions

> [accordion] Which balance look-ups exist? What is required?
>
> We have an [RPC method for viewing account](https://docs.near.org/api/rpc/contracts.md#view-account).
>
> The [JS implementation is here](https://github.com/near/near-api-js/blob/d7f0cb87ec320b723734045a4ee9d17d94574a19/src/providers/json-rpc-provider.ts#L73). Note that in this RPC interface you can specify the finality requirement (whether to query the latest state or finalized state).
>
> For custody purposes, query finalized state.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.