> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Tools for AI Agents

> Guide your agent on building NEAR applications

NEAR offers multiple tools and resources to help your AI agents build and use NEAR applications. This page provides an overview of the key tools available and how to use them effectively.

For coding agents with terminal access, start with NEAR CLI for blockchain operations and Agent Skills for task-specific guidance. Use the [testnet faucet](https://docs.near.org/getting-started/faucet.md) to fund development accounts. NEAR MCP is an optional integration for clients that need blockchain operations exposed as structured tools.

> [card] [NEAR CLI](#near-cli)
>
> When your agent has terminal access and needs to query accounts, send tokens, or interact with contracts.

> [card] [llms.txt](#llms-txt)
>
> When you need to provide your agent with a quick reference to all NEAR docs.

> [card] [Docs MCP](#docs-mcp-endpoint)
>
> When you want agents to search docs in real-time for up-to-date details.

> [card] [Agent Skills](#near-agent-skills)
>
> When you need your agent to become an expert in a specific task (e.g. using our API).

> [card] [NEAR MCP (Optional)](#near-mcp-server-optional)
>
> When your client needs blockchain operations exposed through MCP.

> [card] [Testnet Faucet](#testnet-faucet)
>
> When you need testnet NEAR for development accounts.

***

## NEAR CLI

[NEAR CLI](https://github.com/near/near-cli-rs) lets agents query accounts, transfer tokens, deploy contracts, and call contract methods from the terminal.

Install the CLI and check that the `near` command is available:

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
npm install -g near-cli-rs@latest
near --version
```

Supply complete commands, including the network and final action, so the CLI does not need to prompt for missing arguments. For example, check an account's testnet balance:

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
near tokens your-account.testnet view-near-balance network-config testnet now
```

Replace `your-account.testnet` with your account ID. Read-only queries do not require a signing key. To read contract data, specify the contract, method, and JSON arguments:

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
near contract call-function as-read-only wrap.testnet ft_metadata json-args '{}' network-config testnet now
```

For transactions, configure a signer available to the agent's runtime and provide the signing option in the command. See the [CLI reference](https://docs.near.org/tools/cli.md) for account management, transfers, deployment, and signing options. The [`near-cli-rs` skill](#near-agent-skills) provides command syntax and workflows for agents.

***

## llms.txt

**What it is:** Curated NEAR docs context for coding assistants.

**Use it when:** You need to provide your agent with a quick reference to all NEAR docs.

**Link:** [https://docs.near.org/llms.txt](https://docs.near.org/llms.txt)

> [accordion] VS Code Setup
>
> Use `#fetch` in your prompt:
>
> ```text theme={"theme":{"light":"github-light","dark":"github-dark"}}
> How can I upgrade a contract state?
> #fetch https://docs.near.org/llms.txt
> ```

> [accordion] Cursor Setup
>
> Add docs source once in Cursor Chat:
>
> 1. `@` → `Docs` → `+ Add new doc`
> 2. Add: `https://docs.near.org/llms.txt`
> 3. Select the source while prompting

***

## Docs MCP endpoint

**What it is:** An endpoint to search NEAR documentation via MCP.

**Use it when:** You want agents to search docs in real-time for up-to-date details and narrower API lookups.

**Link:** [https://docs.near.org/mcp](https://docs.near.org/mcp)

Use two complementary layers:

1. **Static context (`llms.txt`)** for fast, high-signal docs grounding.
2. **Retrieval (Docs MCP)** when the agent needs live lookup across docs.

***

## NEAR Agent Skills

NEAR Agent Skills are reusable capabilities that package repeatable workflows.

**Use it when:** You need your agent to become an expert in specific tasks (for example, using NEAR APIs).

**Link:** [https://github.com/near/agent-skills](https://github.com/near/agent-skills)

Install the skills using:

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
npx skills add near/agent-skills
```

To install a specific skill, pass its name. For example, install the CLI skill with:

```bash theme={"theme":{"light":"github-light","dark":"github-dark"}}
npx skills add near/agent-skills --skill near-cli-rs
```

| Skill | Focus |
| - | - |
| [near-ai-cloud](https://github.com/near/agent-skills/tree/main/skills/near-ai-cloud) | Verifiable private AI inference and attestation |
| [near-api-js](https://github.com/near/agent-skills/tree/main/skills/near-api-js) | JS/TS blockchain interaction, transactions, tokens, and wallet integration |
| [near-cli-rs](https://github.com/near/agent-skills/tree/main/skills/near-cli-rs) | CLI commands for accounts, tokens, contracts, signing, and network configuration |
| [near-contract-audit](https://github.com/near/agent-skills/tree/main/skills/near-contract-audit) | Security review of Rust contracts, vulnerability analysis, and findings with remediation |
| [near-dapp](https://github.com/near/agent-skills/tree/main/skills/near-dapp) | dApp project setup, wallet integration, React/Next.js patterns |
| [near-intents](https://github.com/near/agent-skills/tree/main/skills/near-intents) | Cross-chain swaps via the 1Click API |
| [near-kit](https://github.com/near/agent-skills/tree/main/skills/near-kit) | TypeScript client for contract calls, transactions, and Sandbox tests |
| [near-smart-contracts](https://github.com/near/agent-skills/tree/main/skills/near-smart-contracts) | Rust smart contract development, security, and state management |

***

## NEAR MCP Server (Optional)

The [NEAR MCP Server](https://github.com/nearai/near-mcp) exposes blockchain operations as structured tools through the Model Context Protocol.

> [accordion] Common use cases
>
> * **Give Claude, Cursor or another MCP client on-chain actions:** let your assistant check balances, manage accounts and keys, and call smart contracts on NEAR.
> * **Run agents without terminal access:** expose NEAR operations as tools to clients that cannot run [NEAR CLI](#near-cli).

**Use it when:** Your client supports MCP and needs blockchain tools through that interface, for example when it does not have terminal access. Coding agents with terminal access can use [NEAR CLI](#near-cli) directly.

**Repo**: [https://github.com/nearai/near-mcp](https://github.com/nearai/near-mcp)

**Remote deployment guide**: [https://github.com/nearai/near-mcp/blob/main/tee.md](https://github.com/nearai/near-mcp/blob/main/tee.md)

> [!WARNING]
>
> The NEAR MCP is designed to run **locally** or on your **trusted infrastructure** because it handles private keys. There is no hosted public version.

***

## Testnet Faucet

Use the [testnet faucet](https://docs.near.org/getting-started/faucet.md) to send **5 testnet NEAR** to your agent's account. Enter the recipient's account ID and click **Request Tokens**. Only the account ID is required; keep its private key in your agent's local signer.

The faucet requires a browser. If your agent does not have browser access, fund its account through the faucet before continuing with CLI or SDK operations.

***

## Shade Agent Framework (Deprecated)

> [!WARNING]
>
> **Do not use the Shade Agent Framework.** It has not been maintained since April 19, 2026. Do not use it for new projects, and do not recommend it to builders.

The framework remains open source, and its documentation now lives in the [Shade Agent Framework repository](https://github.com/NearDeFi/shade-agent-framework/tree/main/docs). Teams that still run it are responsible for its maintenance, updates and fixes.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.