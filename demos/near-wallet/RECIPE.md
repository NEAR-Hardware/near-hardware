# Recipe: NEAR hardware wallet on the ESP32-S3 2.06" AMOLED watch

How this project was built, in order, with exact versions and every pitfall hit on the way. Follow it top to bottom to rebuild it.

## 0. Versions (November 2026, macOS 15 / Darwin 24.6, Apple silicon)

| Piece | Version |
|---|---|
| Board | Waveshare ESP32-S3-Touch-AMOLED-2.06 (ESP32-S3R8, 32 MB flash, 8 MB OPI PSRAM), USB 303a:1001 on `/dev/cu.usbmodem101` |
| PlatformIO Core | 6.2.0, platform `espressif32` 8.0.0 |
| Arduino core | lib-builder master 6671d0b, arduino master e7c1e8cd4, **ESP-IDF v5.5.5** (from `framework-arduinoespressif32-esp32s3-libs/versions.txt`) |
| Crypto on the watch | mbedTLS 3.6.6 (bundled, hardware SHA/AES), libsodium (`espressif__libsodium`, bundled and linked by default) |
| Display / touch libs | Waveshare's vendored Arduino_GFX 1.6.0 (CO5300 QSPI) and Arduino_DriveBus (FT3168), copied to `firmware/lib/` |
| Other firmware libs | ArduinoJson 7.4.3 (registry), Nayuki qrcodegen (C, MIT, master) in `firmware/lib/qrcodegen` |
| Font | Press Start 2P (SIL OFL 1.1) from google/fonts, rasterised to an 8×8 bitmap table |
| BIP39 list | bitcoin/bips `bip-0039/english.txt`, sha256 `2f5eed53a4727b4bf8880d8f3f199efc90e58503646d9ff8eff3a2ed3b24dbda` (checked by the generator) |
| Host | Node 26.12.1, Apple clang 17, libsodium 1.0.22 (Homebrew, simulator only), Pillow 11.3 in `/usr/bin/python3` |
| JS | near-api-js 7.5.3, @hot-labs/near-connect 0.12.0, Vite 8.3.8, TypeScript 7.0.2, esbuild 0.28.2, puppeteer-core 25.17.0, Chrome for Testing 148 |

## 1. Start from the working watch project

An earlier project (`esp32-watch`) already drove this exact board. Copied (that project is untouched):
- `platformio.ini` board settings: `esp32-s3-devkitc-1`, `qio` flash, `qio_opi` memory, `-DBOARD_HAS_PSRAM`, `default_16MB.csv`.
- `src/pin_config.h`, `BOARD.md`, `wiring.json`, and the vendored `Arduino_GFX` + `Arduino_DriveBus` into `firmware/lib/`.
- Display init: `Arduino_ESP32QSPI(CS 12, SCK 11, D0-D3 4-7)` + `Arduino_CO5300(bus, RST 8, rot 0, 410, 502, col_offset1 = 22)`.
- `assets/vault.png` (1806×2214) as `firmware/assets/vault-reference.png`, the source of the portrait.

## 2. Assets: font, sprites, wordlist (`firmware/tools/make_assets.py`)

```sh
cd firmware && /usr/bin/python3 tools/make_assets.py    # -> src/assets_gen.h, src/wordlist_gen.h, assets/preview/
/usr/bin/python3 tools/make_web_assets.py               # -> extension/icons, extension/img (same sprites as PNG)
```
- The designs' font is Press Start 2P. At 8 px every glyph is pure black/white inside an 8×8 cell (descenders included), so it rasterises losslessly. The firmware draws it at integer scales: ×2 body, ×3 clock/titles, ×5 "NOTE" and seed words.
- **Portrait**: grid-sampled from the high-res vault render. Dark pixels span x 364–1442, y 496–1546 → 40×39 cells of 26.975 px. Sampling cell centres gives a perfect 3-colour sprite (0 mismatches at ±10 px).
- **Mascots** come from the low-res design export (314-px-wide frames → ×410/314). Pitfall: median-cut quantisation dropped the soldering iron's yellow and the PCB's orange chips. Octree (`Image.Quantize.FASTOCTREE`, 96 colours) on the resized crop keeps them.
- Icons (wifi, wifi-off, chevrons, gear, wallet, lock, trash, usb, NEAR logo, check) are hand-drawn ASCII art in the script. The wifi icon was measured off the vault render.
- Pitfall: `python3 -I` (isolated) can't see the user-site Pillow. Run `/usr/bin/python3` without `-I` from a folder holding only your own scripts.

## 3. Portable core + host simulator (test before flashing)

`firmware/src/` is split so the same code runs on the Mac:
- `wallet_core.cpp`: Base58/64, BIP39 (entropy → 12 words with checksum), BIP39 seed, SLIP-10 ed25519 `m/44'/397'/0'` (all hardened: `I = HMAC-SHA512("ed25519 seed", seed)`, then `HMAC-SHA512(c, 0x00‖k‖ser32(i|0x80000000))`), Borsh transaction decoder → review lines, NEP-413 hash, exact u128 yocto formatting.
- `gfx.cpp` (framebuffer, font, sprites, pixel buttons), `app.cpp` (all screens and flows).
- `crypto_port.h` is implemented by `crypto_esp.cpp` (mbedTLS + libsodium) on the watch and `sim/crypto_host.cpp` (libsodium + hand-written PBKDF2) on the Mac.

```sh
cd tools && npm install && node make-samples.mjs   # sample txs + NEP-413 signed by near-api-js with the public test phrase
cd ../firmware/sim && make                          # runs the tests, renders ../../screens/*.png
```
The simulator checks the test vector (`shoot island … above` → `ed25519:r4yuiZE45mzeZAENDEF2pWeFBJkW8mQYGx3rU46zCqh`, account `0c91f6…4117ec`), the BIP39 vectors `7f…7f` and `80…80`, and Base58. For 5 transactions (function call, transfer, add limited key, create sub-account with 3 actions, delete account) and one NEP-413 message, the firmware's decode + digest + ed25519 signature is **byte-identical** to near-api-js. The screens in `screens/` are rendered from the firmware drawing code, so they can't drift from the device.

Pitfall: near-api-js 7 has no `actions.addKey`; use `actions.addFunctionCallAccessKey(pk, receiver, methods, allowance)` / `actions.addFullAccessKey(pk)`.

## 4. Firmware on the watch

```sh
cd firmware && pio run && pio run -t upload --upload-port /dev/cu.usbmodem101
```
- Two envs in `platformio.ini`: `testnet` (the default) and `mainnet`, which only adds `-DNEAR_MAINNET`. `platform.h` turns that into `NEAR_NETWORK`, used by `info`, the `sign_tx`/`sign_message` network check and every on-screen "testnet"/"mainnet". `cd firmware/sim && make mainnet` renders the mainnet build's screens to `screens/mainnet/`.
- Hardware RNG: the S3's RNG is only a true RNG while Wi-Fi/BT or the SAR-ADC entropy source is on. Wi-Fi is off here, so `cp_random()` wraps sampling in `bootloader_random_enable()/disable()`, pools 64 bytes plus timer jitter and hashes the pool with SHA-256.
- Keystore (`keystore_esp.cpp`, NVS namespace `nhw`): `pub` (32 B, public) and `blob` = iters ‖ salt(16) ‖ iv(12) ‖ tag(16) ‖ AES-256-GCM(entropy‖ed25519 seed, AAD "nhw1"‖pub). The key is PBKDF2-HMAC-SHA256(PIN, salt, 20 000), which takes 1.13 s on the S3 (measured by `selftest` → `pinKdfMs`). The wrong-PIN counter is bumped *before* each attempt, so pulling the power doesn't reset it. 10 wrong PINs wipe the wallet.
- Self-test on the watch: `{"cmd":"selftest"}` → `pass: true`, derived `ed25519:r4yuiZE45mzeZAENDEF2pWeFBJkW8mQYGx3rU46zCqh` in 190 ms. It's also under Settings → self test when no wallet exists.
- Display: a full 410×502 RGB565 framebuffer in PSRAM, pushed with one `draw16bitRGBBitmap`. The panel dims after 45 s idle, and the first tap only wakes it.
- Touch: FT3168 via Arduino_DriveBus, polled every 15 ms. Taps fire on release when the finger stayed on the same button. A >70 px horizontal swipe changes page.
- Clock: the PCF85063 RTC (I2C 0x51) holds UTC, the offset sits in NVS (`nhw-set/utcoff`), and hosts set both with `set_status`.
- Vibration motor on GPIO18: buzzes on taps, on new requests and on a wrong PIN.

Pitfalls, in the order they bit:
1. **`Arduino_GFX.h` `#define`s `WHITE`, `BLACK`…**, which breaks any `constexpr uint16_t WHITE`. Include your own headers before `Arduino_GFX_Library.h`.
2. **USB serial replies stalled.** With `ARDUINO_USB_CDC_ON_BOOT=1` (HWCDC), a reply only reached the Mac when the host sent its next byte. The IDF `usb_serial_jtag` driver did the same for replies longer than one 64-byte packet. `HWCDC::flush()` also *drops* queued bytes when it thinks no host is connected. Fix: `ARDUINO_USB_CDC_ON_BOOT=0`, all USB-Serial-JTAG interrupts off, and `proto.cpp` polls the FIFOs from `loop()`. It writes packets of ≤ 63 bytes (every packet ends a USB transfer), waits for `usb_serial_jtag_ll_txfifo_writable()` and flushes each one. It reads by draining `rxfifo` while packets keep arriving (<1.5 ms apart).
3. **DTR/RTS.** The S3 only sends to the host while DTR is asserted, and RTS=1 with DTR=0 resets the chip. pyserial's `dtr=False` on open toggles the lines and reset the watch. Keep DTR high and RTS low.
4. **The node-serialport 13 macOS read poller** only handed over this device's data after the next write (pyserial read the same bytes within 5 ms). `tools/watch-serial.mjs` uses `stty -f /dev/cu.usbmodem101 115200 raw -echo -hupcl clocal` plus a non-blocking fd polled every 5 ms instead, with no native addon. The extension sends an empty line every 150 ms while a request is outstanding as insurance; the firmware ignores empty lines.
5. ArduinoJson 7 copies strings. The pending request id is kept in its own `JsonDocument` so the answer can echo a number or a string.

## 5. Fund the account and prove signing with Node

```sh
# the watch's implicit account (from {"cmd":"info"}) was funded with 1 NEAR via NEAR Hardware's near_transfer
node tools/watch-sign.mjs "hello from my watch"     # set_greeting, you approve on the watch
node tools/watch-e2e.mjs                            # NEP-413 (verified by near-api-js/nep413) + the extension's signing code
```
`watch-sign.mjs`: `info` → `viewAccessKey` nonce + 1 and a `final` block hash from `https://rpc.testnet.fastnear.com` (`--network mainnet`: `https://rpc.mainnet.fastnear.com`) → `createTransaction` → base64 Borsh → `sign_tx` → verify the ed25519 signature locally → `SignedTransaction` → `sendTransaction`. Pitfall: reading `get_greeting` with `final` finality right after sending returns the old value. Read with `{ finality: "optimistic" }`.

Results on testnet (account `8103187969cc6baf6875abf63f118881281cdfd767713be2a02ca8783b411f92`):
- funding 1 NEAR: `5ybZ7M6pqhj1GUjCFLdcqoNuK7PkPfzA73sRSmEsgHed`
- watch-signed `set_greeting`: `CPtV4ezeP5tpNaKdSQgyGtzdHx6T7fCezTdKWNCbq4G6`
- extension code path `set_greeting`: `49UdMRn7pirHSCJtfHkkZTSG7yF4LRKLucUpXzWgooyq`

## 6. Chrome extension (`extension/`)

```sh
cd tools && node build-extension.mjs          # esbuild: extension/src/*.js -> extension/dist/
```
- NEAR Connect 0.12 discovers injected wallets through `window.dispatchEvent(new CustomEvent("near-wallet-injected", { detail: wallet }))`. It fires `near-selector-ready` when a connector starts, so the wallet announces itself at load *and* on that event. The `wallet` object is `{ manifest, signIn, signOut, getAccounts, signAndSendTransaction, signAndSendTransactions, signMessage, … }` (see `build/InjectedWallet.js` and `types/index.d.ts` in the package).
- The manifest needs `type: "injected"` and `features.testnet: true`. On testnet the picker hides wallets without it. `features.mainnet` is true as well; the wallet window takes the network from the watch's `info` and refuses a request for the other one. Items render as `.connect-item[data-type="<id>"]`.
- `inpage.js` runs in the page (`"world": "MAIN"` content script). `content.js` (isolated world) bridges with `postMessage`. `background.js` queues requests in `chrome.storage.session` and opens one `wallet.html` popup window. That window is an extension page, so it can hold the Web Serial port: `navigator.serial.requestPort({ filters: [{ usbVendorId: 0x303a }] })` the first time (needs a click), then `getPorts()`. It builds the tx with near-api-js, has the watch sign it, broadcasts it and answers the tab with `chrome.tabs.sendMessage`. Closing the window rejects everything pending.
- Uint8Array doesn't survive `chrome.runtime` messaging (JSON). The inpage script wraps bytes as `{ $bytes: base64 }`.
- Pitfalls: Chrome refuses an unpacked extension that contains files starting with `_` (node_modules does), so the build tooling lives in `tools/`. near-api-js pulls in `is-my-json-valid` → Node `util`, so `util` is aliased to a small shim (`extension/src/shims/util.js`, `webapp/src/shims/util.ts`). Branded Chrome 137+ ignores `--load-extension`, so automated checks use Chrome for Testing.
- Smoke test: `cd webapp && npm run build && npx vite preview --port 4173`, then `node tools/check-extension.mjs` → the service worker runs, the site loads, **NEAR Hardware Wallet is listed**, and the wallet window opens on "connect your watch". Screenshots land in `tools/screenshots/`.

## 7. Test site (`webapp/`)

```sh
cd webapp && npm install && npm run dev       # http://localhost:5173
```
Vanilla TS + Vite with the NEAR module from the near-web-apps skill: `NearConnector({ network })` with `network` from `VITE_NEAR_NETWORK` (testnet unless `npm run dev:mainnet`), `JsonRpcProvider` for views and balance, `signAndSendTransaction` for `set_greeting` on `hello.near-examples.testnet` / `hello.near-examples.near` (explorer link shown), and `wallet.signMessage({ message, recipient, nonce })` checked with `verifyMessage` from `near-api-js/nep413`.

## 8. Load it in Chrome and click through

1. `chrome://extensions` → **Developer mode** on → **Load unpacked** → select `extension/`.
2. `cd webapp && npm run dev`, open http://localhost:5173.
3. **connect wallet** → **NEAR Hardware Wallet** → in the pixel window, **connect watch** → pick "USB JTAG/serial debug unit (cu.usbmodem101)". Chrome remembers it afterwards.
4. **set greeting** → the watch buzzes and shows the call → **approve** → PIN → the page shows the explorer link.
5. **sign message** → approve on the watch → the page shows "signature verified ✓".
