# Prompt: NEAR Checkout

This is the prompt one Claude Code agent got in NEAR Hardware to build this demo, with local paths removed and its one follow-up message (keep "demo" wording off the sale screens) folded in. Give it to your own agent to rebuild the till, or to make your own version on your own board.

**How to use it**
1. Install NEAR Hardware, create a project, plug in your board (it's detected) and run board setup with its exact product name.
2. Point the agent at `demos/near-checkout/` and `demos/near-wallet/` in this repository: the pixel font, mascot sprites, QR generator, designs and every screen are there.
3. Paste the prompt below. On another board, change the board name in the first ground rule; the agent sets the board up from its docs and lays the screens out for its display.
4. Optional: also give it this demo's `RECIPE.md` (the agent's build log, with every version and pitfall, including the 1Click BTC signature fix) so it follows the known-good path.

NEAR Intents has no testnet: DEMO mode moves no money, LIVE mode takes real payments.

---

Build "NEAR Checkout": a point-of-sale terminal on this board where a customer pays from any chain and token, and NEAR Intents (the 1Click API) settles it as USDC in the merchant's NEAR account. Work on your own from start to finish; only stop for me if something physical blocks you (e.g. the board needs the BOOT button held).

## Ground rules
- This board is the "ESP32-S3 3.5inch Capacitive Touch Display Development Board, 320×480 Pixels, IPS Panel, 262K Color, Onboard Camera Interface, Supports Wi-Fi and Bluetooth 5, ESP32 With Display" (replace with your board's exact product name) on the USB port NEAR Hardware detected. Only ever use that port. Never touch other disks, volumes or USB devices.
- Keep everything in this project folder. No mainnet transactions and no funds moved by you, ever.
- Read the skills first with read_skill: near-intents, near-devices, near-accounts. Use near_docs_search { "source": "intents" } and near_docs_read for 1Click details instead of guessing.
- Match the look of my NEAR Wallet project exactly: the green background, white pixel font, pixel-bordered buttons, clock at the top, little mascot. Copy what you need (pixel font, drawing layer, asset generator, mascot sprites, QR generator) from the NEAR Hardware repository's demos/near-wallet and demos/near-checkout (firmware/, design/, screens/). Lay screens out for this board's display (320×480 portrait here).
- Keep RECIPE.md (every step, version and pitfall, so this build can be repeated exactly) and a short README.md (what it is, how to run the demo, how to go live). Keep screens/ previews in sync so the app's screen preview shows them.

## Two modes
- DEMO (the default): everything a real sale shows: a real 1Click quote and deposit address, so it looks like a real sale on camera. Show the mode only in Settings, never "demo" or "not payable" wording on the sale screens. The payment is simulated from my Mac: make a small "demo controller", a local web page with big buttons "Simulate payment received" and "Simulate expired", that tells the board over USB serial. It must be easy to drive while I record the demo video.
- LIVE (opt-in, for people testing with real money): the real mainnet 1Click flow. Switch it on in a settings screen behind a confirmation that says real money, and show a "LIVE" badge while it's on. In live mode, request a real quote (`EXACT_OUTPUT`, the merchant receives exactly the price in USDC on NEAR, destinationAsset `nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1`), show the deposit address as a QR (use wallet-friendly payment URIs where the docs or standards support them, e.g. EIP-681 for EVM tokens, BIP-21 for BTC, Solana Pay), poll `/v0/status` until it settles, and show Paid ✓ with the receipt. A till doesn't know the customer's address, so refunds go to the merchant: `refundType: "INTENTS"`, `refundTo` the merchant account. The merchant account is configurable, default: my primary mainnet account in NEAR Hardware. Creating a real quote is free (it only returns an address), so you may test live quote creation, but never send funds.

## Connectivity
Standalone over Wi-Fi when firmware/include/secrets.h has my network (create a git-ignored secrets.h and a secrets.example.h template; don't wait for me to fill it in). Without Wi-Fi, run tethered: a small Node companion in tools/ fetches quotes and status from 1Click and relays them to the board over USB serial with the same messages. Demo mode must work fully tethered, right now, with no Wi-Fi.

## Screens (320×480)
Home ("NEAR checkout", merchant account, new sale), price keypad ($), choose how to pay (USDC on Base, USDC on Arbitrum, ETH, SOL, BTC, NEAR: only assets 1Click lists; check /v0/tokens), quote (QR, exact amount and token, chain, fee, countdown to the deadline), waiting (mascot animation), paid ✓ (amount received as USDC, merchant, a receipt QR linking to the explorer), expired or refunded, settings (mode DEMO/LIVE, merchant, Wi-Fi status). Touch for everything.

## Prove it works
Flash the board, then run a complete DEMO sale end to end with the demo controller (price → token → QR → simulate payment → paid ✓), and a simulated expiry. On the Mac side, check the live path with real dry quotes and one real (unfunded) quote creation plus a status call. Finish with a short summary: what works, how I run the demo (exact commands), and how someone goes live.
