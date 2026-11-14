> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Block / Chunk

> Learn how to retrieve details about blocks and chunks from the NEAR RPC API.

The RPC API enables you to query the network and get details about specific blocks or chunks.

## Quick Reference

| Method | Description | Parameters |
| - | - | - |
| [`block`](#block-details) | Get block details by height, hash, or finality | `finality` OR `block_id` |
| [`block_effects`](#block-effects) | Get changes in a specific block | `finality` OR `block_id` |
| [`chunk`](#chunk-details) | Get chunk details by chunk\_id or block\_id + shard\_id | `chunk_id` OR `block_id` + `shard_id` |

***

## Block Details

Queries network and returns block for given height or hash. You can also use `finality` param to return latest block details.

**Note**: You may choose to search by a specific block *or* finality, you cannot choose both.

* **method**: `block`
* **params**: `finality` OR `block_id`

> [tab] by finality
>
> > [tab] JSON
> >
> > ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > {
> >   "jsonrpc": "2.0",
> >   "id": "dontcare",
> >   "method": "block",
> >   "params": {
> >     "finality": "final"
> >   }
> > }
> > ```
>
> > [tab] JavaScript
> >
> > ```js theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > import { JsonRpcProvider } from "near-api-js";
> >
> > const provider = new JsonRpcProvider({
> >     url: "https://test.rpc.fastnear.com",
> > });
> >
> > const response = await provider.block({
> >   finality: 'final',
> > });
> > ```
>
> > [tab] HTTPie
> >
> > ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > http POST https://rpc.testnet.near.org \
> >   jsonrpc=2.0 \
> >   id=dontcare \
> >   method=block \
> >   params:='{"finality": "final"}'
> > ```

> [tab] by block height
>
> > [tab] JSON
> >
> > ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > {
> >   "jsonrpc": "2.0",
> >   "id": "dontcare",
> >   "method": "block",
> >   "params": {
> >     "block_id": 187310138
> >   }
> > }
> > ```
>
> > [tab] JavaScript
> >
> > ```js theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > import { JsonRpcProvider } from "near-api-js";
> >
> > const provider = new JsonRpcProvider({
> >     url: "https://archival-rpc.testnet.near.org",
> > });
> >
> > const response = await provider.block({
> >   blockId: 187310138,
> > });
> > ```
>
> > [tab] HTTPie
> >
> > ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > http POST https://archival-rpc.testnet.near.org \
> >   jsonrpc=2.0 \
> >   id=dontcare \
> >   method=block \
> >   params:='{"block_id": 187310138}'
> > ```

> [tab] by block hash
>
> > [tab] JSON
> >
> > ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > {
> >   "jsonrpc": "2.0",
> >   "id": "dontcare",
> >   "method": "block",
> >   "params": {
> >     "block_id": "6RWmTYhXCzjMjoY3Mz1rfFcnBm8E6XeDDbFEPUA4sv1w"
> >   }
> > }
> > ```
>
> > [tab] JavaScript
> >
> > ```js theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > import { JsonRpcProvider } from "near-api-js";
> >
> > const provider = new JsonRpcProvider({
> >     url: "https://archival-rpc.testnet.near.org",
> > });
> >
> > const response = await provider.block({
> >   blockId: '6RWmTYhXCzjMjoY3Mz1rfFcnBm8E6XeDDbFEPUA4sv1w',
> > });
> > ```
>
> > [tab] HTTPie
> >
> > ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > http POST https://archival-rpc.testnet.near.org \
> >   jsonrpc=2.0 \
> >   id=dontcare \
> >   method=block \
> >   params:='{"block_id": "6RWmTYhXCzjMjoY3Mz1rfFcnBm8E6XeDDbFEPUA4sv1w"}'
> > ```

> [accordion] Example response
>
> ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
> {
>   "jsonrpc": "2.0",
>   "result": {
>     "author": "node2",
>     "chunks": [
>       {
>         "chunk_hash": "CzPafxtJmM1FnRoasKWAVhceJzZzkz9RKUBQQ4kY9V1v",
>         "shard_id": 0,
>         "gas_limit": 1000000000000000,
>         "gas_used": 0,
>         "height_created": 187310138,
>         "height_included": 187310138
>       }
>     ],
>     "header": {
>       "hash": "6RWmTYhXCzjMjoY3Mz1rfFcnBm8E6XeDDbFEPUA4sv1w",
>       "height": 187310138,
>       "timestamp": 1739254177539033760,
>       "gas_price": "100000000",
>       "latest_protocol_version": 73
>     }
>   },
>   "id": "dontcare"
> }
> ```

***

## Block Effects

Returns changes in a block for given block height or hash. Includes changes like `account_touched`, `access_key_touched`, `data_touched`, `contract_code_touched`.

* **method**: `block_effects`
* **params**: `finality` OR `block_id`

> [tab] by finality
>
> > [tab] JSON
> >
> > ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > {
> >   "jsonrpc": "2.0",
> >   "id": "dontcare",
> >   "method": "block_effects",
> >   "params": {
> >     "finality": "final"
> >   }
> > }
> > ```
>
> > [tab] JavaScript
> >
> > ```js theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > import { JsonRpcProvider } from "near-api-js";
> >
> > const provider = new JsonRpcProvider({
> >     url: "https://test.rpc.fastnear.com",
> > });
> >
> > const response = await provider.blockChanges({
> >   finality: 'final',
> > });
> > ```
>
> > [tab] HTTPie
> >
> > ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > http POST https://rpc.testnet.near.org \
> >   jsonrpc=2.0 \
> >   id=dontcare \
> >   method=block_effects \
> >   params:='{"finality": "final"}'
> > ```

> [tab] by block height
>
> > [tab] JSON
> >
> > ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > {
> >   "jsonrpc": "2.0",
> >   "id": "dontcare",
> >   "method": "block_effects",
> >   "params": {
> >     "block_id": 187310138
> >   }
> > }
> > ```
>
> > [tab] JavaScript
> >
> > ```js theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > import { JsonRpcProvider } from "near-api-js";
> >
> > const provider = new JsonRpcProvider({
> >     url: "https://archival-rpc.testnet.near.org",
> > });
> >
> > const response = await provider.blockChanges({
> >   blockId: 187310138,
> > });
> > ```
>
> > [tab] HTTPie
> >
> > ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > http POST https://archival-rpc.testnet.near.org \
> >   jsonrpc=2.0 \
> >   id=dontcare \
> >   method=block_effects \
> >   params:='{"block_id": 187310138}'
> > ```

> [tab] by block hash
>
> > [tab] JSON
> >
> > ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > {
> >   "jsonrpc": "2.0",
> >   "id": "dontcare",
> >   "method": "block_effects",
> >   "params": {
> >     "block_id": "6RWmTYhXCzjMjoY3Mz1rfFcnBm8E6XeDDbFEPUA4sv1w"
> >   }
> > }
> > ```
>
> > [tab] JavaScript
> >
> > ```js theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > import { JsonRpcProvider } from "near-api-js";
> >
> > const provider = new JsonRpcProvider({
> >     url: "https://archival-rpc.testnet.near.org",
> > });
> >
> > const response = await provider.blockChanges({
> >   blockId: '6RWmTYhXCzjMjoY3Mz1rfFcnBm8E6XeDDbFEPUA4sv1w',
> > });
> > ```
>
> > [tab] HTTPie
> >
> > ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > http POST https://archival-rpc.testnet.near.org \
> >   jsonrpc=2.0 \
> >   id=dontcare \
> >   method=block_effects \
> >   params:='{"block_id": "6RWmTYhXCzjMjoY3Mz1rfFcnBm8E6XeDDbFEPUA4sv1w"}'
> > ```

> [accordion] Example response
>
> ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
> {
>   "jsonrpc": "2.0",
>   "result": {
>     "block_hash": "6RWmTYhXCzjMjoY3Mz1rfFcnBm8E6XeDDbFEPUA4sv1w",
>     "changes": [
>       { "account_id": "account.rpc-examples.testnet", "type": "account_touched" },
>       { "account_id": "ping-account.testnet", "type": "account_touched" },
>       { "account_id": "account.rpc-examples.testnet", "type": "access_key_touched" },
>       { "account_id": "dev2-nsp.testnet", "type": "data_touched" }
>     ]
>   },
>   "id": "dontcare"
> }
> ```

***

## Chunk Details

Returns details of a specific chunk. You can run a [block details](#block-details) query to get a valid chunk hash.

* **method**: `chunk`
* **params**: `chunk_id` OR `block_id` + `shard_id`

> [tab] by chunk\_id
>
> > [tab] JSON
> >
> > ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > {
> >   "jsonrpc": "2.0",
> >   "id": "dontcare",
> >   "method": "chunk",
> >   "params": {
> >     "chunk_id": "CzPafxtJmM1FnRoasKWAVhceJzZzkz9RKUBQQ4kY9V1v"
> >   }
> > }
> > ```
>
> > [tab] JavaScript
> >
> > ```js theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > import { JsonRpcProvider } from "near-api-js";
> >
> > const provider = new JsonRpcProvider({
> >     url: "https://archival-rpc.testnet.near.org",
> > });
> >
> > const response = await provider.chunk(
> >   'CzPafxtJmM1FnRoasKWAVhceJzZzkz9RKUBQQ4kY9V1v',
> > );
> > ```
>
> > [tab] HTTPie
> >
> > ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > http POST https://archival-rpc.testnet.near.org \
> >   jsonrpc=2.0 \
> >   id=dontcare \
> >   method=chunk \
> >   params:='{"chunk_id": "CzPafxtJmM1FnRoasKWAVhceJzZzkz9RKUBQQ4kY9V1v"}'
> > ```

> [tab] by block\_id + shard\_id
>
> > [tab] JSON
> >
> > ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > {
> >   "jsonrpc": "2.0",
> >   "id": "dontcare",
> >   "method": "chunk",
> >   "params": {
> >     "block_id": 187310138,
> >     "shard_id": 0
> >   }
> > }
> > ```
>
> > [tab] JavaScript
> >
> > ```js theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > import { JsonRpcProvider } from "near-api-js";
> >
> > const provider = new JsonRpcProvider({
> >     url: "https://archival-rpc.testnet.near.org",
> > });
> >
> > const response = await provider.chunk([187310138, 0]);
> > ```
>
> > [tab] HTTPie
> >
> > ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > http POST https://archival-rpc.testnet.near.org \
> >   jsonrpc=2.0 \
> >   id=dontcare \
> >   method=chunk \
> >   params:='{"block_id": 187310138, "shard_id": 0}'
> > ```

> [accordion] Example response
>
> ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
> {
>   "jsonrpc": "2.0",
>   "result": {
>     "author": "kiln.pool.f863973.m0",
>     "header": {
>       "chunk_hash": "CzPafxtJmM1FnRoasKWAVhceJzZzkz9RKUBQQ4kY9V1v",
>       "shard_id": 0,
>       "gas_limit": 1000000000000000,
>       "gas_used": 0,
>       "height_created": 187310138,
>       "height_included": 187310138
>     },
>     "receipts": [],
>     "transactions": [
>       {
>         "hash": "J3KbUXF9YPu2eGnbDCACxGvmMDZMdP7acGYhVLHGu9y2",
>         "signer_id": "account.rpc-examples.testnet",
>         "receiver_id": "contract.rpc-examples.testnet"
>       }
>     ]
>   },
>   "id": "dontcare"
> }
> ```

***

## Error Handling

| Error Code | Description | Solution |
| - | - | - |
| `UNKNOWN_BLOCK` | Block not found or garbage-collected | Check block validity; use archival node for old blocks |
| `UNKNOWN_CHUNK` | Chunk not found in database | Verify chunk ID; use archival node for old chunks |
| `INVALID_SHARD_ID` | Shard ID does not exist | Provide valid shard ID for existing shard |
| `NOT_SYNCED_YET` | Node still syncing | Wait for sync completion or use different node |
| `PARSE_ERROR` | Invalid request parameters | Check parameter format and completeness |
| `INTERNAL_ERROR` | Server-side issue | Retry request or try different RPC endpoint |


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.