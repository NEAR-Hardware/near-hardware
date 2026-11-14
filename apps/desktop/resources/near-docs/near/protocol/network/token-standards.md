> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Token Standards

> Compare NEAR's smart contract standards for fungible tokens, NFTs, and MultiTokens.

Beyond the [native NEAR token](https://docs.near.org/protocol/network/tokens.md), smart contracts can define their own tokens. NEAR provides standards for fungible tokens, non-fungible tokens (NFTs), and MultiTokens, so wallets and applications can interact with them consistently.

Unlike native NEAR balances, these token balances and ownership records are stored in the **token contract**, which handles transfers and tracks each account's holdings.

| Token type | What it represents | Core standard |
| - | - | - |
| Fungible token (FT) | Interchangeable units, such as stablecoins or governance tokens | [NEP-141](https://github.com/near/NEPs/blob/master/neps/nep-0141.md) |
| Non-fungible token (NFT) | Individually identified assets, such as collectibles or event tickets | [NEP-171](https://github.com/near/NEPs/blob/master/neps/nep-0171.md) |
| MultiToken (MT) | Multiple token types managed by one contract, including fungible and non-fungible assets | [NEP-245](https://github.com/near/NEPs/blob/master/neps/nep-0245.md) |

***

## Fungible tokens

Each FT contract tracks balances of one fungible token. Units of that token are interchangeable: transferring 10 units reduces the sender's balance by 10 and increases the receiver's balance by 10.

See the [FT standard](https://docs.near.org/primitives/ft/standard.md) for the interface, or [Using FTs](https://docs.near.org/primitives/ft/ft.md) for querying balances and transferring tokens.

***

## Non-fungible tokens

An NFT contract tracks individually identified tokens and their owners. Each token has a unique ID within its contract and can carry metadata describing the asset it represents.

See the [NFT standard](https://docs.near.org/primitives/nft/standard.md) for the interface, or [Using NFTs](https://docs.near.org/primitives/nft/nft.md) for querying and transferring NFTs.

***

## MultiTokens

A MultiToken contract manages multiple token types, each identified by a token ID, and tracks each account's balance for each ID. It can represent fungible, non-fungible, and semi-fungible assets in one contract and transfer multiple token types in a batch.

See [NEP-245](https://github.com/near/NEPs/blob/master/neps/nep-0245.md) for the MultiToken interface and extensions.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.