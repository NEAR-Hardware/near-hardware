# NEAR Hardware: guide for judges and AI reviewers

This page is for the people judging NEAR HACKATHON and for the AI agents (Claude Code, Codex) that screen submissions. It says what the product is, how to try it quickly, where every feature lives in the code, how to verify it, and what is and isn't tested. The human-facing overview is the [README](README.md).

## In one paragraph

**NEAR Hardware is a macOS desktop app that turns a coding agent (Claude Code, Codex, OpenCode or Cursor) into a NEAR hardware engineer.** The problem: a device that lives on NEAR (a wallet, a payment terminal, a sensor that pays or gets paid) needs embedded firmware, key management, NEAR transactions, wallets and NEAR's docs all at once, and coding agents know neither the user's board nor NEAR, and must not hold the user's keys. NEAR Hardware detects the board (1,500+ through PlatformIO, plus Raspberry Pi over SSH), has the agent set it up from the maker's docs, and gives every agent 10 NEAR skills, an 18-tool MCP server and 465 pages of NEAR docs offline. Agents use the user's NEAR accounts without seeing a key: the app signs, asks for approval on mainnet, and agents can create limited sub-accounts whose function-call keys only reach one contract. Two devices were built autonomously in the app from one prompt each: a hardware wallet on an ESP32-S3 watch and a point-of-sale till settled by NEAR Intents.

## Platform

- **macOS on Apple silicon (M1 or later), macOS 12+.** This is the only supported platform today.
- **Windows and Linux support is coming soon.** The app is Electron, so the UI ports; the work left is the installers, serial-port and Keychain equivalents, and testing.

## Quickest way to try it (about 5 minutes)

1. **Install** (Terminal, Apple silicon Mac):
   ```sh
   curl -fsSL https://raw.githubusercontent.com/NEAR-Hardware/near-hardware/main/install.sh | bash
   ```
   → NEAR Hardware opens on a setup guide. The script downloads with `curl`, so macOS opens it without a Gatekeeper warning (the app isn't notarized yet). From source instead: `bun install && bun run dev`.
2. **Setup guide → Coding agent:** connect Claude Code or Codex (installed and signed in) → it shows **Ready**.
3. **Setup guide → NEAR accounts:** type a name, click **Create** → `name.testnet` exists on testnet with 10 free NEAR from the faucet, and appears at the bottom of the sidebar with a pixel avatar.
4. **New Project → New chat → Continue without a board**, then ask:
   *"Read the near-contracts skill, write a Rust counter contract, deploy it to a new sub-account of my testnet account, and call increment."*
   → the agent writes, builds and tests the contract, NEAR Hardware asks you to approve the sub-account and the deployment, and the chat shows the transactions with explorer links.
5. **Ask:** *"Use near_docs_search: how does a 1Click EXACT_OUTPUT quote work?"* → the answer comes from the bundled docs, offline.
6. **With an ESP32 board:** plug it in, start a new chat → the card shows the board detected over USB → type its exact product name → **Start board setup** → the agent finds the official docs, writes `BOARD.md`, then builds and flashes.

Step 4 needs the contract toolchain, which the setup guide installs (Rust, wasm32, cargo-near, NEAR CLI).

## Checks an AI reviewer can run without the GUI

| Command (from the repo root) | Expected |
| --- | --- |
| `bun install` | installs the workspace |
| `bun run typecheck` | exits 0 (main and renderer TypeScript projects) |
| `cd apps/desktop && bunx eslint src` | exits 0 (the app's source; `bun run lint` also lints helper `.mjs` scripts and reports style errors there) |
| `ls apps/desktop/resources/skills` | 10 skills: near-accounts, near-agent-market, near-ai, near-chain-signatures, near-contracts, near-devices, near-intents, near-ironclaw, near-subaccounts, near-web-apps |
| `find apps/desktop/resources/near-docs -name '*.md' \| wc -l` | 465 |
| `grep -c "name: '" apps/desktop/src/main/hardware/bridge.ts apps/desktop/src/main/near/agentTools.ts` | 8 + 10 = the 18 MCP tools |
| `cd demos/near-checkout/tools && npm install && node check-live.mjs` | checks the mainnet 1Click path without moving funds: assets listed, dry quotes, one unfunded real quote with its signature verified, a status call (needs internet) |
| `curl -sI https://github.com/NEAR-Hardware/near-hardware/releases/latest/download/NEAR-Hardware-mac-arm64.zip` | the release the installer downloads exists |

## Feature map: where it is and how to verify it

Status key: **Device** = verified on real hardware · **Testnet** = verified with real testnet transactions · **Mainnet read-only** = verified against mainnet without moving funds · **App** = verified in the running app · **Skill** = agent playbook and bundled docs, not exercised with real accounts.

| Feature | Code | Verify | Status |
| --- | --- | --- | --- |
| Create named testnet accounts (faucet), import mainnet/testnet from 12 words or a private key; BIP39 + SLIP-10 ed25519 `m/44'/397'/0'` | `apps/desktop/src/main/near/accounts.ts`, `keys.ts` | Quickest way, step 3 | Testnet |
| Keys encrypted with the macOS Keychain (Electron safeStorage); recovery phrase shown only after Touch ID | `apps/desktop/src/main/near/accounts.ts` | Accounts page → an account's ⋯ menu → Show Recovery Phrase… | App |
| Transactions built and signed in the app: Borsh, nonce cache, FastNEAR RPC | `apps/desktop/src/main/near/transactions.ts`, `rpc.ts` | Step 4 | Testnet |
| Native approval prompt for agent actions (always on mainnet; testnet optional) | `apps/desktop/src/main/near/approval.ts` | Step 4 | App, Testnet |
| Limited sub-accounts: function-call key, one contract, chosen methods, fee allowance; NEAR rejects transfers and deposits from it | `near_create_subaccount`, `near_add_limited_key` in `apps/desktop/src/main/near/agentTools.ts` | Ask the agent for a limited sub-account, then for a transfer from it | Testnet |
| Rust contracts: write, test, build (cargo-near), deploy | `near_deploy_contract`; skill `near-contracts`; `apps/desktop/src/main/contractTools.ts` | Step 4 (done end to end with both Claude Code and Codex) | Testnet |
| Offline NEAR docs search (465 pages) | `apps/desktop/src/main/near/docs.ts`, `resources/near-docs/` | Step 5 | App |
| MCP server every agent gets (18 tools) | `apps/desktop/resources/near-hardware-mcp.mjs`, `src/main/hardware/bridge.ts` | Any chat: ask the agent to list its near-hardware tools | App |
| USB board detection, PlatformIO install, serial monitor, live screen preview, wiring whiteboard | `apps/desktop/src/main/hardware/`, `src/renderer/src/components/` | Step 6 | Device |
| Raspberry Pi over SSH: password used once to install the app's key, never saved; green/red status | `apps/desktop/src/main/hardware/pi.ts` | New chat → Raspberry Pi | App (tested against an SSH server on the Mac) |
| Chats driving Claude Code (Agent SDK) and Codex (`codex app-server`); OpenCode over ACP | `apps/desktop/src/main/chat/` | Start chats with each | App (Cursor's ACP adapter is written but untested) |
| NEAR Intents / 1Click: exact-output quotes, deposit addresses, status, quote signature checks | skill `near-intents`; `demos/near-checkout/` | `check-live.mjs` above; the checkout demo | Mainnet read-only, Device |
| NEAR Connect wallet + NEP-413 signing | skill `near-web-apps`; `demos/near-wallet/extension`, `webapp` | The wallet demo | Testnet, Device |
| Chain Signatures (`v1.signer-prod.testnet`) | skill `near-chain-signatures` | Ask the agent to derive an address and sign through the MPC contract | Testnet |
| NEAR AI Cloud, IronClaw, NEAR Agent Market | skills `near-ai`, `near-ironclaw`, `near-agent-market` with their docs | `read_skill` in a chat | Skill |

## The demos: proof the pipeline works

Both were built inside NEAR Hardware by one Claude Code agent (Opus 5.5), with zero hand-written code: the board was plugged in, the agent got one prompt (the checkout also got one follow-up message about on-screen wording), and it wrote the firmware and host software, flashed the board over USB, tested on the device and kept a `RECIPE.md` build log. Each has a safe version and a mainnet version.

| Demo | What it proves | Evidence |
| --- | --- | --- |
| [NEAR Hardware Wallet](demos/near-wallet/) (ESP32-S3 2.06" AMOLED watch) | On-device key generation, an on-device Borsh transaction decoder, PIN approval, NEAR Connect integration | Testnet transaction signed on the watch: [`CPtV4ezeP5tpNaKdSQgyGtzdHx6T7fCezTdKWNCbq4G6`](https://testnet.nearblocks.io/txns/CPtV4ezeP5tpNaKdSQgyGtzdHx6T7fCezTdKWNCbq4G6); [video](demos/near-wallet/demo.mp4); 26 screens in `screens/`; testnet and mainnet firmware builds compile, simulator tests pass |
| [NEAR Checkout](demos/near-checkout/) (ESP32-S3 3.5" touch display) | Cross-chain payments settled by NEAR Intents into the merchant's NEAR account; quote signatures verified on the device | [video](demos/near-checkout/demo.mp4); full sales run on the device; mainnet path checked with real quotes and no funds moved; 17 screens in `screens/` |

NEAR Intents has no testnet (HACKATHON.md Q-007), so the checkout's safe version is **Demo mode**: real quotes, payment simulated from the Mac. **LIVE** mode takes real payments.

## Tracks it fits

- **Real-World Money (`realworld`):** the checkout is a merchant terminal that settles stablecoins through NEAR Intents.
- **Agent Economy (`agents`):** agents that hold NEAR accounts, deploy contracts and act on chain; skills for the Agent Market and IronClaw.
- **AI Security & Defense (`security`):** keys never reach the agent, approval prompts, and limited function-call keys that cap what an agent or a board can do.
- **Open Innovation (`open`):** a DePIN layer that brings NEAR to physical devices.

## Hackathon rules

- **Built in the window:** the repository's first commit is 2026-11-14; all code here was written during NEAR HACKATHON (Q-001).
- **AI-assisted:** built with AI coding agents (Claude Code), which the rules allow (Q-005). The two demos were written entirely by an agent inside NEAR Hardware.
- **Libraries (Q-005):** Electron, electron-vite, React, Vite, TypeScript, the Claude Agent SDK, node-pty, serialport, xterm.js, Monaco Editor, react-markdown, @scure/bip39, @scure/base, lucide-react, simple-icons. Demos: PlatformIO with the Arduino core for ESP32, ArduinoJson, Arduino_GFX and Arduino_DriveBus (vendored from Waveshare), qrcodegen, near-api-js, NEAR Connect, the 1Click SDK.
- **Demo (Q-012):** the app runs locally; the launch video is [`media/near-hardware-launch.mp4`](media/near-hardware-launch.mp4) and each demo has its own video.
- **License (Q-014):** [MIT](LICENSE).
- **Secrets:** none committed. Wi-Fi credentials and API keys live in git-ignored files (`demos/near-checkout/firmware/include/secrets.h`, `tools/.env`); NEAR keys live in the user's Keychain.

## Known limitations

- macOS on Apple silicon only; Windows and Linux are coming soon.
- The app isn't notarized yet: the one-line installer avoids the warning; a browser-downloaded DMG needs **Open Anyway** once.
- The wallet demo is demo-grade: flash encryption and secure boot are off. Use testnet or small mainnet amounts.
- NEAR Intents is mainnet only; no real swap was made during development (quotes and status are real).
- The NEAR AI, IronClaw and Agent Market skills haven't been exercised with real accounts; Cursor's adapter is untested; Raspberry Pi support was tested against an SSH server on the Mac.

## Repository map

```
apps/desktop/src/main/near/          NEAR accounts, keys, RPC, transactions, approvals, agent tools, docs search
apps/desktop/src/main/hardware/      board detection, serial, MCP bridge, Raspberry Pi over SSH
apps/desktop/src/main/chat/          Claude Code, Codex, OpenCode and Cursor chat drivers
apps/desktop/src/renderer/           React UI
apps/desktop/resources/skills/       the 10 NEAR skills
apps/desktop/resources/near-docs/    465 pages of NEAR docs (refresh: apps/desktop/scripts/fetch-near-docs.mjs)
apps/desktop/resources/near-hardware-mcp.mjs   the MCP server
demos/near-wallet/                   hardware wallet: firmware, Chrome extension, test site, tools, RECIPE.md
demos/near-checkout/                 checkout till: firmware, companion, demo controller, tools, RECIPE.md
install.sh                           one-line installer (downloads the latest release)
```
