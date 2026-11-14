> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Gas

> Query gas prices for specific blocks or hashes using the NEAR RPC API.

The RPC API enables you to query the gas price for a specific block or hash.

## Quick Reference

| Parameter | Type | Description |
| - | - | - |
| `block_height` | `number` | Specific block height to query gas price for |
| `block_hash` | `string` | Specific block hash to query gas price for |
| `null` | `null` | Returns gas price for the latest block |

***

## Gas Price

Returns gas price for a specific `block_height` or `block_hash`. Using `[null]` will return the most recent block's gas price.

* **method**: `gas_price`
* **params**: `[block_height]`, `["block_hash"]`, or `[null]`

> [tab] null (latest)
>
> > [tab] JSON
> >
> > ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > {
> >   "jsonrpc": "2.0",
> >   "id": "dontcare",
> >   "method": "gas_price",
> >   "params": [null]
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
> > const response = await provider.gasPrice(null);
> > ```
>
> > [tab] HTTPie
> >
> > ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > http POST https://rpc.testnet.near.org \
> >   jsonrpc=2.0 \
> >   id=dontcare \
> >   method=gas_price \
> >   params:='[null]'
> > ```

> [tab] by block height
>
> > [tab] JSON
> >
> > ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > {
> >   "jsonrpc": "2.0",
> >   "id": "dontcare",
> >   "method": "gas_price",
> >   "params": [187310138]
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
> > const response = await provider.gasPrice(187310138);
> > ```
>
> > [tab] HTTPie
> >
> > ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > http POST https://archival-rpc.testnet.near.org \
> >   jsonrpc=2.0 \
> >   id=dontcare \
> >   method=gas_price \
> >   params:='[187310138]'
> > ```

> [tab] by block hash
>
> > [tab] JSON
> >
> > ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > {
> >   "jsonrpc": "2.0",
> >   "id": "dontcare",
> >   "method": "gas_price",
> >   "params": ["6RWmTYhXCzjMjoY3Mz1rfFcnBm8E6XeDDbFEPUA4sv1w"]
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
> > const response = await provider.gasPrice(
> >   '6RWmTYhXCzjMjoY3Mz1rfFcnBm8E6XeDDbFEPUA4sv1w',
> > );
> > ```
>
> > [tab] HTTPie
> >
> > ```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
> > http POST https://archival-rpc.testnet.near.org \
> >   jsonrpc=2.0 \
> >   id=dontcare \
> >   method=gas_price \
> >   params:='["6RWmTYhXCzjMjoY3Mz1rfFcnBm8E6XeDDbFEPUA4sv1w"]'
> > ```

> [accordion] Example response
>
> ```json theme={"theme":{"light":"github-light","dark":"github-dark"}}
> {
>   "jsonrpc": "2.0",
>   "id": "dontcare",
>   "result": {
>     "gas_price": "100000000"
>   }
> }
> ```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.