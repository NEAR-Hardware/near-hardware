# Prompt: NEAR Hardware Wallet

This is the prompt one Claude Code agent got in NEAR Hardware to build this demo, with local paths removed. Give it to your own agent to rebuild the wallet, or to make your own version on your own board.

**How to use it**
1. Install NEAR Hardware, create a project, plug in your board (it's detected) and run board setup with its exact product name.
2. Copy this demo's `design/` folder into the project. Everything else the agent needs (pixel font, mascot sprites, screens, BIP39 wordlist, firmware) is in `demos/near-wallet/`; point the agent at it.
3. Paste the prompt below. On another board, change the board name in the first ground rule; the agent sets the board up from its docs and lays the screens out for its display.
4. Optional: also give it this demo's `RECIPE.md` (the agent's build log, with every version and pitfall) so it follows the known-good path.

---

Build a hardware NEAR wallet on my watch, plus a Chrome extension and a small test website that use it. Work on your own from start to finish; don't stop to ask me questions unless something physical is blocking you (e.g. the board needs the BOOT button held). This is a demo for the NEAR hackathon, so it has to work end to end and look great.

## Ground rules
- The board is the "ESP32-S3 2.06inch AMOLED Touch Watch Development Board" (replace with your board's exact product name) on the USB port NEAR Hardware detected. Only ever use that port. Never touch other disks, volumes or USB devices.
- Keep everything inside this project folder. Testnet only, never mainnet.
- Reuse what already works: the NEAR Hardware repository's demos/near-wallet has a working PlatformIO setup for this watch, BOARD.md (pins, CO5300 display, touch), the pixel font, the drawing layer, the mascot sprites and every screen. Read it first and copy what you need instead of starting from zero. On a different board, keep the design and lay the screens out for its display.
- Read the skills first with read_skill: near-devices, near-accounts, near-web-apps, near-subaccounts. Use near_docs_search / near_docs_read whenever you're unsure about NEAR details (NEAR Connect, transactions, NEP-413).
- Keep a RECIPE.md in the project root as you go: the exact steps, libraries, versions, commands and every pitfall you hit and how you fixed it, so this build can be repeated perfectly later. Keep README.md short: what it is and how to use it.

## Look and feel
Match my designs in design/ exactly in style: the green background, white pixel font, pixel-bordered buttons, the clock and wifi icon at the top, < > arrows, page dots, the little mascot.
- design/01-vault-home-reference.png: the vault home screen (portrait, "illia's vault", NEAR price at the bottom)
- design/02-wallet-flow-screens.png: home with "gen wallet" and "settings", the "generating wallet..." screens with the soldering mascot, the NOTE screen before the 12 words
- design/03-seed-words-and-password.png: one seed word per screen ("12/01 doctor", back / next, last one has Finish), then the NOTE before creating the password
Keep screens/ previews in sync so they show in NEAR Hardware's screen preview.

## Wallet on the watch (firmware/)
1. First boot (no wallet): home screen with "gen wallet" and "settings".
2. gen wallet: the "generating wallet..." screen, entropy from the ESP32-S3 hardware RNG, a BIP39 12-word phrase (English wordlist), then derive the NEAR key exactly like NEAR wallets do: BIP39 seed (PBKDF2-HMAC-SHA512, 2048 rounds, salt "mnemonic") → SLIP-10 ed25519 at m/44'/397'/0' (all hardened). It must be compatible with Meteor and NEAR Hardware. Test vector you must pass: the phrase "shoot island position soft burden budget tooth cruel issue economy destroy above" must give public key ed25519:r4yuiZE45mzeZAENDEF2pWeFBJkW8mQYGx3rU46zCqh.
3. NOTE screen, then the 12 words one per screen (01..12, back / next, Finish), then the NOTE about the password.
4. The password is numeric: a pixel number pad on the touchscreen, a 6-digit PIN entered twice. Encrypt the seed with a key derived from the PIN (e.g. PBKDF2 + AES-GCM via mbedTLS) and store it in NVS. Never store or send the seed or private key in clear, never print them over serial or in logs.
5. Wallet home: the vault-style screen with the account (the implicit account ID shortened, e.g. 3f2a…9c1d), the balance if you can get it from the computer, and a way to see the full account ID.
6. Settings: show the public key and implicit account, lock, and wipe wallet (with a confirmation and the PIN).
7. Serial protocol over USB at 115200, one JSON object per line, for example:
   - {"cmd":"info"} → state (no wallet / locked / ready), public key, implicit account ID
   - {"cmd":"sign_tx","tx":"<base64 Borsh transaction>","network":"testnet"} → the watch decodes it and shows signer, receiver and each action (transfer amount in NEAR, function call method + args + deposit, add key etc.; show a hash if it can't decode), the user taps Approve and enters the PIN, then it signs SHA-256(tx bytes) with ed25519 and returns {"ok":true,"signature":"<base64 64 bytes>"}; Reject returns {"ok":false,"error":"rejected"}
   - {"cmd":"sign_message", ...} for NEP-413 (message, recipient, nonce): show them, PIN, sign per NEP-413
   Pick robust details (request ids, timeouts, a busy state) and document the protocol in README.md.

## Chrome extension (extension/)
A Manifest V3 extension called "NEAR Hardware Wallet" that shows up in NEAR Connect's wallet list on any site, via the near-wallet-injected mechanism. Check the NEAR Connect docs (near_docs_search "near connect injected wallet") and the @hot-labs/near-connect package source for the exact interface. It implements signIn, signOut, getAccounts, signAndSendTransaction, signAndSendTransactions and signMessage. A content script can't use USB, so an extension page (a small popup window in the same pixel style: "Approve on your watch") holds the Web Serial connection to the watch, builds the transaction with near-api-js (nonce and block hash from testnet RPC), sends it to the watch, gets the signature and broadcasts it. The account is the watch's implicit account on testnet.

## Test website (webapp/)
A small Vite page using NEAR Connect on testnet: connect wallet (our extension appears in the list), show the account and balance, and a "set greeting" button that calls set_greeting on hello.near-examples.testnet, plus a NEP-413 "sign message" button. Show the transaction's explorer link.

## Prove it works
- Build and flash the firmware, walk through gen wallet on the device and check the test vector (e.g. a test-only build flag or a serial self-test that derives from the fixed phrase without saving it).
- Fund the watch's implicit account with 1 test NEAR using near_transfer (from my primary testnet account) so it exists on testnet.
- Before the browser: a Node script (tools/) that builds a real testnet transaction, sends it to the watch over serial, waits for my approval on the watch, attaches the signature and broadcasts it. That proves the device signs correctly.
- Then build the extension and the webapp and tell me exactly how to load the extension in Chrome (chrome://extensions → Developer mode → Load unpacked → extension/) and open the webapp, so I can click through: connect → set greeting → approve on the watch.
- Finish with a short summary of what works and the explorer links.
