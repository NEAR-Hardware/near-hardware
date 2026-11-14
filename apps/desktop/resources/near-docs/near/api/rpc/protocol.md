> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Protocol

> Learn how to retrieve the genesis and current protocol configurations using the NEAR RPC API.

The RPC API enables you to retrieve the current genesis and protocol configuration.

## Quick Reference

| Method | Parameters | Description |
| - | - | - |
| [`genesis_config`](#genesis-config) | *none* | Returns current genesis configuration |
| [`EXPERIMENTAL_protocol_config`](#protocol-config) | `finality` OR `block_id` | Returns protocol configuration for latest or specific block |

***

## Genesis Config

Returns current genesis configuration.

* **method**: `genesis_config`
* **params**: *none*

> [tab] JSON
>
> ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
> {
>   "jsonrpc": "2.0",
>   "id": "dontcare",
>   "method": "genesis_config"
> }
> ```

> [tab] JavaScript
>
> ```js theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import { JsonRpcProvider } from "near-api-js";
>
> const provider = new JsonRpcProvider({
>     url: "https://test.rpc.fastnear.com",
> });
>
> const response = await provider.experimental_protocolConfig({
>   sync_checkpoint: 'genesis',
> });
> ```

> [tab] HTTPie
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> http POST https://rpc.testnet.near.org \
>   jsonrpc=2.0 \
>   id=dontcare \
>   method=genesis_config
> ```

> [accordion] Example response
>
> ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
> {
>   "jsonrpc": "2.0",
>   "result": {
>     "chain_id": "testnet",
>     "epoch_length": 43200,
>     "gas_limit": 1000000000000000,
>     "genesis_height": 42376888,
>     "genesis_time": "2020-07-31T03:39:42.911378Z",
>     "min_gas_price": "5000",
>     "num_block_producer_seats": 200,
>     "protocol_version": 29,
>     "total_supply": "2089646653180081825096998107194444"
>   },
>   "id": "dontcare"
> }
> ```

***

## Protocol Config

Returns most recent protocol configuration or a specific queried block. Useful for finding current storage and transaction costs.

* **method**: `EXPERIMENTAL_protocol_config`
* **params**: `finality` OR `block_id`

> [tab] JSON
>
> ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
> {
>   "jsonrpc": "2.0",
>   "id": "dontcare",
>   "method": "EXPERIMENTAL_protocol_config",
>   "params": {
>     "finality": "final"
>   }
> }
> ```

> [tab] JavaScript
>
> ```js theme={"theme":{"light":"github-light","dark":"github-dark"}}
> import { JsonRpcProvider } from "near-api-js";
>
> const provider = new JsonRpcProvider({
>     url: "https://test.rpc.fastnear.com",
> });
>
> const response = await provider.experimental_protocolConfig({
>   finality: "final"
> });
> ```

> [tab] HTTPie
>
> ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> http POST https://rpc.testnet.near.org \
>   jsonrpc=2.0 \
>   id=dontcare \
>   method=EXPERIMENTAL_protocol_config \
>   params:='{"finality": "final"}'
> ```

> [accordion] Example response
>
> ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
> {
>   "jsonrpc": "2.0",
>   "result": {
>     "chain_id": "testnet",
>     "epoch_length": 43200,
>     "gas_limit": 1000000000000000,
>     "protocol_version": 73,
>     "runtime_config": {
>       "storage_amount_per_byte": "10000000000000000000",
>       "transaction_costs": {
>         "action_receipt_creation_config": {
>           "execution": 108059500000,
>           "send_not_sir": 108059500000,
>           "send_sir": 108059500000
>         }
>       }
>     }
>   },
>   "id": "dontcare"
> }
> ```

***

## Best Practices

* Use `finality: "final"` for most recent confirmed protocol configuration
* Use specific `block_id` when you need protocol config for a particular block
* Cache protocol configuration results as they change infrequently
* Use the protocol config to calculate current storage and transaction costs


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.