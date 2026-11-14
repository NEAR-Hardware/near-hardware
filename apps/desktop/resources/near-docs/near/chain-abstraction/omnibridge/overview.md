> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Omni Bridge Overview

> Learn about Omni Bridge, a multi-chain asset bridge that enables secure and efficient transfers between blockchain networks using Chain Signatures and MPC technology.

The [Omni Bridge](https://github.com/Near-One/omni-bridge) is a multi-chain asset bridge that facilitates secure and efficient asset transfers between different blockchain networks. It solves key challenges in cross-chain communication by leveraging [Chain Signatures](https://docs.near.org/chain-abstraction/chain-signatures.md) and its decentralized [Multi-Party Computation (MPC) service](https://docs.near.org/chain-abstraction/chain-signatures.md#multi-party-computation-service) to enable trustless cross-chain asset transfers.

> [!TIP]
>
> To learn more see [How Omni Bridge Works](https://docs.near.org/chain-abstraction/omnibridge/how-it-works.md).

## Supported Chains

Omni Bridge launches with a hybrid architecture, utilizing different verification methods based on chain-specific requirements and technical constraints. This approach allows us to support multiple chains from day one while progressively transitioning to full Chain Signatures integration.

Currently the supported chains are:

* **Ethereum** - *(Light client + Chain Signatures)*
* **Bitcoin** - *(Light client + Chain Signatures)*
* **Zcash** - *(Light client + Chain Signatures)*
* **Solana** - *(Wormhole + Chain Signatures)*
* **Base** - *(Wormhole + Chain Signatures)*
* **BNB** - *(Wormhole + Chain Signatures)*
* **Arbitrum** - *(Wormhole + Chain Signatures)*
* **Polygon** - *(Wormhole + Chain Signatures)*
* **HyperEVM** - *(Wormhole + Chain Signatures)*
* **Fogo** - *(Wormhole + Chain Signatures)*
* **Abstract** - *(MPC verification + Chain Signatures)*
* **Starknet** - *(MPC verification + Chain Signatures)*
* **Aptos** - *(MPC verification + Chain Signatures)*

The bridge contract lists how each chain's inbound transfers are verified. Read it with:

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
near contract call-function as-read-only omni.bridge.near get_provers json-args {} network-config mainnet now
```

Bitcoin and Zcash are listed by `get_utxo_chain_connectors` instead.

> [!NOTE]
>
> See [Omni Bridge Roadmap](https://docs.near.org/chain-abstraction/omnibridge/roadmap.md) for more details.

## Resources

* [Near-One/omni-bridge](https://github.com/Near-One/omni-bridge) - Omni Bridge repository
* [Near-One/bridge-sdk-js](https://github.com/Near-One/bridge-sdk-js) - JavaScript SDK
* [Near-One/bridge-sdk-rs](https://github.com/Near-One/bridge-sdk-rs) - Rust SDK


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.