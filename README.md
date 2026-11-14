<p align="center">
  <img src="images/logo.png" alt="NEAR Hardware logo" width="160" />
</p>

<h1 align="center">NEAR Hardware</h1>

<p align="center">
  A DePIN &amp; IoT suite for NEAR Protocol: device firmware, a desktop app, and skills + MCP so any agent can set up NEAR hardware.
</p>

## What it is

NEAR Hardware connects physical devices (ESP32 boards, watches, Raspberry Pis) to NEAR. The goal: devices hold their own keys, sign NEAR transactions and Intents within on-chain spending limits, and coding agents like Claude Code and Codex customize device firmware through bundled skills and an MCP server.

**Status:** early development. What works today in the desktop app:

- **Environments:** detects Claude Code, Codex, Cursor and OpenCode on your machine (with versions) and lets you connect any of them.
- **Projects:** create a project folder (or open an existing one); its files show in a live-updating tree with VS Code-style file icons.
- **Chats:** start a chat in a project with one of your connected agents. The chat drives that agent's own CLI in the background: **Claude Code** (via the Claude Agent SDK) and **Codex** (via `codex app-server`) work today, with streaming replies, tool calls, approve/deny prompts, image paste, slash commands, model and permission-mode pickers, context usage and plan limits. **OpenCode** runs through ACP (Cursor's ACP adapter is written but not tested yet). Chats resume where they left off after a restart.
- **Hardware:** detects USB boards, installs PlatformIO, and has a terminal, serial monitor, screen preview and wiring whiteboard. Agents set up a board from its official docs, then build, flash and verify it.
- **NEAR accounts:** create free named testnet accounts (`you.testnet`, via the testnet faucet) or import any NEAR wallet's account with its recovery phrase or private key, on mainnet or testnet. Every account gets its own 16×16 pixel-art avatar, generated from its name (millions of combinations; Shuffle Avatar picks another). Each network's primary account sits at the bottom of the sidebar; click it to see every account, its balance, and its recovery phrase (after Touch ID). Keys are encrypted with the macOS Keychain and never leave the Mac; agents see account names and balances through the `near_accounts` MCP tool.
- **Agents on NEAR:** every agent (Claude Code, Codex, OpenCode, Cursor) gets the `near-hardware` MCP server and four NEAR skills. Agents use the user's accounts without ever seeing a key: they read accounts, contracts and balances (`near_accounts`, `near_account_info`, `near_view`), and send NEAR, call contracts, deploy contracts, create sub-accounts and add limited keys (`near_transfer`, `near_call`, `near_deploy_contract`, `near_create_subaccount`, `near_add_limited_key`). The app signs inside its main process and asks the user first in a native prompt: always on mainnet, on testnet unless they turn asking off. Sub-accounts like `bot.you.testnet` can be **limited** to calling one contract (chosen methods, a fee allowance); NEAR enforces the limit, so they act without prompts. A board can get a limited account for its own on-chip key. Skills (`read_skill`): `near-accounts`, `near-subaccounts`, `near-contracts`, `near-web-apps`, `near-chain-signatures`, `near-intents`, `near-ai`, `near-ironclaw`, `near-agent-market`, `near-devices`.
- **NEAR docs built in:** all of docs.near.org (protocol, smart contracts, web3 apps, multi-chain, tokens and primitives, data infrastructure, integrations, RPC API), NEAR Intents, NEAR AI Cloud, IronClaw and the NEAR Agent Market's agent docs ship with the app as Markdown, 465 pages. Agents search and read them offline with `near_docs_search` and `near_docs_read`; `apps/desktop/scripts/fetch-near-docs.mjs` refreshes them.
- **Smart contract toolchain:** the setup guide and the Environments page check for Rust, the wasm32 target, cargo-near and NEAR CLI and install what's missing with the official installers, so agents can write, test, build and deploy Rust contracts.
- **Setup guide:** a first-launch guide from install to a connected agent, NEAR accounts, PlatformIO and a projects folder.

The contract, firmware, MCP server and skills are in progress.

## Install (macOS)

NEAR Hardware runs on Macs with Apple silicon (M1 or later). In Terminal:

```sh
curl -fsSL https://raw.githubusercontent.com/NEAR-Hardware/near-hardware/main/install.sh | bash
```

This puts NEAR Hardware in Applications and opens it. On first launch a setup guide walks through the rest:

1. **This Mac:** Apple's Command Line Tools (git and Python), installed from Apple if they're missing.
2. **Coding agent:** finds Claude Code, Codex, Cursor and OpenCode, installs or signs in to the one you want with its official command, and connects it.
3. **NEAR accounts:** create a free `you.testnet` account in one click. For mainnet, get a free named account (like `you.near`) in [Meteor Wallet](https://wallet.meteorwallet.app), then paste its recovery phrase: the app finds the account and stores the key encrypted. NEAR Hardware uses the same 12-word standard as NEAR wallets, so accounts move freely between them.
4. **Smart contracts:** Rust, its WebAssembly target, cargo-near and NEAR CLI, from rustup.rs and NEAR's official installers (a few hundred MB), so your agent can build NEAR contracts.
5. **PlatformIO:** about 35 MB from PlatformIO's official installer. It isn't bundled with the app: the compiler for each kind of chip downloads the first time you build for it.
6. **Projects folder:** where projects are created (macOS asks once for access to Documents).
7. **How it works:** a short tour, then the app moves itself to Applications if it isn't there yet. Reopen the guide any time from Help › Setup Guide.

Prefer a disk image? Download `NEAR-Hardware-mac-arm64.dmg` from [Releases](https://github.com/NEAR-Hardware/near-hardware/releases) and drag the app to Applications. Until the app is notarized by Apple, macOS warns that it can't verify the app the first time you open it: go to System Settings › Privacy & Security and click **Open Anyway**. The install script avoids this because files downloaded with `curl` aren't quarantined.

## Repository layout

```
apps/desktop/                       Electron + React + TypeScript desktop app
apps/desktop/resources/skills/      NEAR Hardware's agent skills (SKILL.md playbooks)
apps/desktop/resources/near-docs/   NEAR, NEAR Intents, NEAR AI, IronClaw and Agent Market docs as Markdown, searchable by agents
apps/desktop/resources/near-hardware-mcp.mjs   MCP server every agent gets (tools run in the app)
apps/desktop/resources/hardware-agent.md       Instructions every agent gets
images/                             Logo and artwork
```

More packages (contract, firmware) land as they're built.

## Development

Requires [Bun](https://bun.sh).

```sh
bun install
bun run dev        # start the desktop app with hot reload
bun run build      # typecheck and production build
```

Package the macOS app (`apps/desktop/dist/NEAR-Hardware-mac-arm64.dmg` and `.zip`):

```sh
cd apps/desktop && bun run build:mac
```

With a "Developer ID Application" certificate in the keychain, the build is signed with it, and with `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD` and `APPLE_TEAM_ID` set it's also notarized, so the DMG opens with no warning. Without a certificate it's ad-hoc signed. To release, upload both files to a GitHub release; `install.sh` always downloads the latest one.

To try the "agent not installed" flow on a machine that has every agent, hide some in dev:

```sh
NEAR_HARDWARE_HIDE_AGENTS=codex,cursor bun run dev
```

## Credits

- File tree icons: [file-icons](https://github.com/file-icons/vscode) (MIT), regenerated with `apps/desktop/scripts/build-file-icons.mjs`.
- Agent logos: [simple-icons](https://simpleicons.org) (CC0) and [lobehub icons](https://github.com/lobehub/lobe-icons) (MIT). Product names and logos belong to their owners.
