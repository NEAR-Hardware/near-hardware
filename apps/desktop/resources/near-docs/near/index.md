> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

[MCP Ready](https://docs.near.org/mcp)

[LLMs.txt Ready](https://docs.near.org/llms.txt)

# NEAR Developer Docs

Build contracts in Rust, create Web3 apps, and sign transactions on any chain from a single NEAR account.

### Deploy your First Contract

Create, test and deploy contracts with simple commands.

[What is a Contract? →](https://docs.near.org/smart-contracts/what-is.md)

[Quickstart →](https://docs.near.org/smart-contracts/quickstart.md)

```bash bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
cargo near new hello-world
# ✅ Success! Created 'hello-near', a smart contract in Rust

# Build, test, and deploy your contract with Cargo
cargo near build
cargo test
cargo near deploy
```

```bash create-near-app theme={"theme":{"light":"github-light","dark":"github-dark"}}
npx create-near-app@latest

# ✅ What do you want to build? › "A Web App"
# ✅ Select a framework for your frontend › "Vite (React)"
# ✅ Name your project: "hello-near"

#Start using your new NEAR app:
cd hello-near
npm run dev
```

### Build Web3 Applications

Easily authenticate users and call smart contracts from any frontend framework.

[What are Web3 Apps? →](https://docs.near.org/web3-apps/what-is.md)

[Create your first app →](https://docs.near.org/web3-apps/quickstart.md)

***

## Why NEAR?

> [card] Sub-second block finality
>
> Transactions reach deterministic finality in 1.2s, no reorgs, no waiting.

> [card] Near-zero fees
>
> Average transaction fees are \$0.002. Storage costs are fully refundable upon deletion.

> [card] Sharded & scalable
>
> The network automatically scales as demand grows, with no downtime or hard forks.

> [card] WASM contracts in Rust
>
> Write smart contracts in Rust with NEAR's official SDK.

> [card] Chain Signatures
>
> Control accounts on Bitcoin, Ethereum, Solana, and more.

> [card] TEE-backed agents
>
> Run AI inference inside Trusted Execution Environments for verifiable, tamper-proof outputs.

***

## Browse the docs

> [card] [Protocol](https://docs.near.org/protocol/network/architecture.md)
>
> Accounts, access keys, gas, transactions, consensus, and more.

> [card] [Smart contract reference](https://docs.near.org/smart-contracts/anatomy/anatomy.md)
>
> State, functions, collections, callbacks, cross-contract calls, and security.

> [card] [Web application guides](https://docs.near.org/web3-apps/quickstart.md)
>
> Wallet authentication, JavaScript APIs, data types, and contract calls.

> [card] [Tokens and primitives](https://docs.near.org/primitives/what-is.md)
>
> FTs, NFTs, DAOs, linkdrops, staking, oracles, and off-chain compute.

> [card] [Data infrastructure](https://docs.near.org/data-infrastructure/what-is.md)
>
> Index and query on-chain data with Data APIs, BigQuery, and block streams.

> [card] [AI agent tooling](https://docs.near.org/getting-started/tools-for-ai.md)
>
> Use llms.txt, Docs MCP, agent skills, and on-chain MCP tools.

## More NEAR docs

> [card] [NEAR Intents](https://docs.near-intents.org/near-intents)
>
> Let users express the outcome they want, such as swapping assets across chains, while solvers compete to fulfill it.

> [card] [NEAR AI](https://docs.near.ai/)
>
> Private, verifiable AI inference running inside Trusted Execution Environments.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.