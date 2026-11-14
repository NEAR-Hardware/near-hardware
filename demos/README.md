# Demos: two NEAR devices, built end to end by an AI agent

Two production-shaped NEAR hardware products: a **hardware wallet on a smartwatch** and a **cross-chain point-of-sale terminal settled by NEAR Intents**. Each one was built **autonomously** inside the NEAR Hardware app: plug in the board, give one prompt, and a coding agent delivers firmware, browser extension or companion tools, web pages, on-device tests and a reproducible build log. Nobody wrote a line of code.

| | [NEAR Hardware Wallet](near-wallet/) | [NEAR Checkout](near-checkout/) |
| --- | --- | --- |
| Board | Waveshare ESP32-S3 2.06" AMOLED Touch Watch | Waveshare ESP32-S3-Touch-LCD-3.5 (320×480) |
| What it is | A hardware wallet: the key is born on the watch and never leaves it. A Chrome extension plugs it into **NEAR Connect**; every signature is approved on the watch with a PIN. | A till: the customer pays from **any chain and token** (USDC on Base or Arbitrum, ETH, SOL, BTC, NEAR) and **NEAR Intents (1Click)** settles it as USDC in the merchant's NEAR account. |
| NEAR features | BIP39 + SLIP-10 ed25519 keys (Meteor-compatible), Borsh transaction decoding on the device, NEP-413 message signing, NEAR Connect injected wallet | 1Click `EXACT_OUTPUT` quotes, quote signatures verified **on the device**, `/v0/status` settlement, refunds to the merchant's Intents balance |
| Size | 4,718 lines of firmware, 1,424 lines of extension, site and tools, 26 screens | 3,842 lines of firmware, 863 lines of companion and tools, 17 screens |
| Proof | A real testnet transaction signed on the watch: [`CPtV4ezeP5tpNaKdSQgyGtzdHx6T7fCezTdKWNCbq4G6`](https://testnet.nearblocks.io/txns/CPtV4ezeP5tpNaKdSQgyGtzdHx6T7fCezTdKWNCbq4G6) | Full sales run on the device by the agent; real 1Click quotes with signatures checked by the till |
| Testnet / safe version | `pio run -e testnet` (default) + `npm run dev` | **Demo** mode (default): real quotes, payment simulated from the Mac, no money moves. NEAR Intents has no testnet. |
| Mainnet version | `pio run -e mainnet` + `npm run dev:mainnet` | **LIVE** mode in Settings, behind a "real money" confirmation on the till |

## How they were made: zero hand-written code

1. **Plug in the board.** NEAR Hardware detects it over USB the moment it's connected. You type the board's product name once; the app's agent finds the manufacturer's docs, maps the pins and chips (`BOARD.md`), records the screen and sets up PlatformIO by itself.
2. **Give one agent one prompt.** Claude Code on Opus 5.5, running inside the app.
3. **The agent ships the product.** It learns NEAR from the app's **10 custom NEAR skills** (`near-devices`, `near-accounts`, `near-web-apps`, `near-intents`, `near-subaccounts`, …) and the **NEAR Hardware MCP server** (18 tools: board detection, serial, **465 bundled NEAR docs pages** with search, and the user's NEAR accounts with approval prompts). It writes the firmware and the host software, flashes the board over USB, drives the device to test it, fixes what it finds, and keeps a `RECIPE.md` with every step, version and pitfall so the build can be repeated exactly.

The wallet took **exactly one prompt**. The checkout took one prompt and one follow-up message (to drop placeholder "demo" wording from the sale screens). The only touches on a board were a person approving signatures on the watch, which is what a hardware wallet is for. The mainnet build option of the wallet was added afterwards.

Each folder has a README.md (run both versions), RECIPE.md (the agent's build log), BOARD.md (pins and chips) and `screens/` (every screen, drawn by the firmware's own code, so you can see the whole UI without the hardware).

## What you need

- The board for that demo, a USB-C cable, [PlatformIO](https://platformio.org/install/cli) and Node 20+.
- Wallet: Chrome, for the extension. Testnet NEAR is free from the faucet.
- Checkout: nothing else for Demo mode. Wi-Fi is optional (without it, the companion relays 1Click over USB).

## Safety

- The wallet is demo-grade: flash encryption and secure boot are off (turning them on burns eFuses for good). Use testnet, or small mainnet amounts.
- In the checkout, every QR code is a real 1Click deposit address, in Demo mode too. A payment sent to it really pays the merchant.

## This is two examples, not the limit

The same skills, MCP tools and board setup let an agent build any NEAR device. Examples of what fits the same pipeline:

- A sensor node that records readings on-chain with its own limited sub-account key (`sensor.you.testnet`, function-call access to one contract).
- A device that switches on when someone pays a contract, read over NEAR RPC.
- A Raspberry Pi worker that finds jobs on NEAR Agent Market, with an IronClaw agent deciding what to bid.
- A signer for other chains through NEAR Chain Signatures.
