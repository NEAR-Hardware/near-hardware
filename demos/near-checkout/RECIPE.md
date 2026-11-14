# Recipe: NEAR Checkout on the ESP32-S3 3.5" touch display

How this project was built, in order, with exact versions and every pitfall hit on the way. Follow it top to bottom to rebuild it.

## 0. Versions (2026-11-14, macOS 15.7.3, Apple silicon)

| Piece | Version |
|---|---|
| Board | Waveshare ESP32-S3-Touch-LCD-3.5 **Rev2.0** (ESP32-S3R8, 16 MB flash, 8 MB octal PSRAM, ST7796 + FT6336), USB `303a:1001`, serial `20:6E:F1:9A:F4:84`, `/dev/cu.usbmodem101` |
| Vendor examples | github.com/waveshareteam/ESP32-S3-Touch-LCD-3.5 @ `d9ff7837148b47b33edadc4b87775c341cf35bbe` (2026-10-21), in `vendor/` (git-ignored, 430 MB) |
| PlatformIO | Core 6.2.0, platform `espressif32@8.0.0` |
| Arduino core | framework-arduinoespressif32 4.30312.261024: lib-builder master 6671d0b, arduino master e7c1e8cd4, **ESP-IDF v5.5.5** |
| Firmware libs | Arduino_GFX ("GFX Library for Arduino") **1.5.5** copied from the vendor repo to `firmware/lib/Arduino_GFX`; ArduinoJson **7.4.3** (registry); Nayuki qrcodegen (C, MIT) from the NEAR Wallet project; libsodium and mbedTLS bundled with the core |
| Font / art | Press Start 2P (SIL OFL 1.1) and the mascots from the NEAR Wallet project's `design/02-wallet-flow-screens.png` |
| Host | Node 26.12.1, Apple clang 17.0.0, libsodium 1.0.22 (Homebrew, simulator), Pillow 11.3.0 in `/usr/bin/python3` |
| JS | `@defuse-protocol/one-click-sdk-typescript` **0.1.26** (quote signature check) |
| 1Click | `https://1click.chaindefuser.com`, OpenAPI 0.1.10, no partner key |

## 1. Identify the board

- `list_devices`: one Espressif native-USB device, `303a:1001` on `/dev/cu.usbmodem101`.
- The name matches two Waveshare boards: **ESP32-S3-Touch-LCD-3.5** (ST7796 SPI + FT6336) and **-3.5B** (AXS15231B QSPI). A bring-up sketch scanned I2C: `0x18` ES8311, `0x20` TCA9554, `0x34` AXP2101, **`0x38` FT6336**, `0x51` PCF85063, `0x6B` QMI8658 (plus an unexplained `0x7E`). FT6336 means the original 3.5. Bring-up also printed `psram 8388608`, `flash 16777216`, LCD `begin()` true.
- Pins came from the vendor BSP header `examples/factory/components/esp32_s3_touch_lcd_3_5/include/bsp/esp32_s3_touch_lcd_3_5.h`, the Arduino examples, and the wiki's pinout image (`docs.waveshare.com/assets/images/ESP32-S3-Touch-LCD-3.5-details-intro-…webp`, converted with `dwebp`). See BOARD.md and `wiring.json`.

## 2. PlatformIO setup (`firmware/platformio.ini`)

There's no PlatformIO board id for this board: `esp32-s3-devkitc-1` with `board_upload.flash_size = 16MB`, `default_16MB.csv`, `qio` flash, `memory_type = qio_opi`, `-DBOARD_HAS_PSRAM`. Plus `-DARDUINO_USB_CDC_ON_BOOT=0 -DARDUINO_USB_MODE=1` (see pitfall 2) and `-DARDUINOJSON_USE_LONG_LONG=1 -DARDUINOJSON_USE_DOUBLE=1` (the same flags go into the simulator Makefile, so both builds parse 1Click numbers the same way).

Display bring-up, from the vendor's `08_gfx_helloworld`:
- `Arduino_ESP32SPI(DC 3, CS -1, SCK 5, MOSI 1, MISO 2)` + `Arduino_ST7796(bus, RST -1, rotation 0, ips true, 320, 480)`, `begin(40000000)`.
- The LCD reset is **EXIO1 on the TCA9554** (I2C 0x20, SDA 8 / SCL 7): output register 0x01 = 0x82, config register 0x03 = ~0x82 (EXIO1 and EXIO7 outputs, as the BSP does), pulse EXIO1 low for 20 ms, wait 150 ms.
- Backlight GPIO6, `ledcAttach(6, 5000, 8)` + `ledcWrite(6, 230)`.
- Touch: FT6336 at 0x38 read directly (reg 0x02 = touch count, 0x03-0x06 = X/Y, 12 bits), polled every 15 ms. Rotation 0 needs no mapping.

## 3. Assets (`firmware/tools/make_assets.py`)

```sh
cd firmware && /usr/bin/python3 tools/make_assets.py     # -> src/assets_gen.h, assets/preview/*.png
```
The NEAR Wallet project's generator, copied and adapted: same 8×8 Press Start 2P rasterisation, same mascots cut from the same design export (`../design/02-wallet-flow-screens.png`) but scaled by 320/314 for this panel (soldering mascot 167×145, peeking mascot 84×106), the wallet's icon set, plus new ones: price tag, receipt, a spark for the waiting animation, and 16×16 coins (USDC, ETH, SOL, BTC, NEAR) made from a circle mask with a hand-drawn 8×8 glyph.

`gfx.cpp/.h` (framebuffer, font, sprites, pixel buttons) is the wallet's, with `SCR_W 320`, `SCR_H 480` and a condensed text mode (7-px advance) for long token amounts. Pitfall: `python3 -I` can't see the user-site Pillow; run `/usr/bin/python3` without `-I`.

## 4. 1Click research (do this before writing the flow)

Read the `near-intents` skill and the bundled docs (`near_docs_read`): `request-a-swap-quote.md`, `check-swap-execution-status.md`, `verify-quote-signature.md`. Then checked against the live API:
- `GET /v0/tokens` (231 tokens): the six payment assets are listed (`nep141:base-0x8335…omft.near`, `nep141:arb-0xaf88…omft.near`, `nep141:eth.omft.near`, `nep141:sol.omft.near`, `nep141:btc.omft.near`, `nep141:wrap.near`). There's **no native NEAR**, only wNEAR, so the NEAR option asks for wNEAR.
- The quote: `swapType: EXACT_OUTPUT`, `amount` = cents × 10⁴ (USDC has 6 decimals), `destinationAsset` USDC on NEAR, `recipient` = merchant with `recipientType: DESTINATION_CHAIN`, `refundTo` = merchant with **`refundType: INTENTS`** (accepted without a partner key), `depositType: ORIGIN_CHAIN`, `slippageTolerance: 100`, ISO `deadline` 15 min ahead (60 for BTC; the docs say Bitcoin can take an hour).
- For $12.50 on 2026-11-14: USDC Base/Arbitrum 12.63 (1 bp app fee), ETH 0.00694 (20 bp), SOL 0.175, BTC 0.000194 (~13 min estimate), wNEAR 4.08. Every quote's `withdrawFee` was 3902 (0.0039 USDC). `amountIn` includes the 1% slippage buffer; the unused part is refunded to `refundTo` (the merchant's Intents balance).
- **Pitfall: two deadlines.** A real quote's `quote.deadline` (= `timeWhenInactive`) was **3 days** after the request's `deadline`. The request deadline is when 1Click starts refunding instead of swapping; `quote.deadline` is when the address goes inactive and "funds may be lost". The till counts down to the **request** deadline.
- **Pitfall: BTC quote signatures.** With `originAsset: "nep141:btc.omft.near"`, 1Click's signature never verifies, not even with the official SDK 0.1.26 (tested with 15-60 min deadlines; ETH/SOL with the same deadlines verify). Rebuilding the payload with every field kept except `originAsset` showed that 1Click signs with `originAsset: "1cs_v1:btc:native:coin"` (its "BTC(OMNI)" asset, also listed in `/v0/tokens`, blockchain `btc`, 8 decimals) and echoes the other id. Asking for `1cs_v1:btc:native:coin` directly gives a native `bc1q…` deposit address, a signature the unmodified SDK accepts, and a working `/v0/status`. The till uses that id for BTC.
- Explorer links: `https://explorer.near-intents.org/transactions/<depositAddress>` (found on the explorer's home page; not in the docs).
- **Quote signatures** (SDK 0.1.26, `src/quote-signature.ts`): 1Click signs `base58(sha256(json-stable-stringify({...signedRequest, ...signedQuote, timestamp})))` with ed25519 key `ed25519:reYaWhvwu8Jzo3WUM3zhn6VrhuMEF4eADL17qtRVifc`. The signed request fields are fixed (dry, swapType, slippageTolerance, originAsset, depositType, destinationAsset, amount, refundTo, refundType, recipient, recipientType, deadline, plus a few optional ones). The quote fields are the 8 amount fields, plus for non-dry quotes depositAddress, depositMemo, deadline, timeWhenInactive, timeEstimate, refundFee, withdrawFee (each `|| undefined`). Subtle: the non-dry `deadline: quote.deadline || undefined` overrides the request's deadline in the spread. `co_parse_quote()` in `firmware/src/checkout.cpp` rebuilds that string field by field (sorted keys, JSON escaping, JS number formatting), hashes with libsodium's SHA-256 and verifies with `crypto_sign_verify_detached`. `tools/check-live.mjs` proves it matches the SDK on a real dry quote and a real live quote, and the simulator proves a one-character change fails.

## 5. Portable core + simulator (test before flashing)

```sh
cd firmware && pio pkg install          # ArduinoJson for the simulator too
cd sim && make                          # tests + renders ../../screens/*.png
```
- `checkout.cpp`: the asset table, quote body, quote/status parsing, signature check, payment URIs, exact decimal formatting from integer strings (24-decimal wNEAR included), ISO 8601, NEAR account validation, Base58.
- `app.cpp`: every screen and the sale state machine (home, price keypad, choose token, quoting, quote with QR/amount/chain/fee/countdown, payment seen/swapping, paid with receipt QR, expired/refunded/incomplete/failed, no quote, settings, "real money" confirmation, merchant keyboard).
- Payment URIs: EIP-681 `ethereum:<USDC contract>@<chainId>/transfer?address=<deposit>&uint256=<amountIn>` (Base 8453, Arbitrum 42161), `ethereum:<deposit>@1?value=<wei>` for ETH, BIP-21 `bitcoin:<deposit>?amount=<BTC>`, Solana Pay `solana:<deposit>?amount=<SOL>&label=NEAR%20Checkout`, and the bare account for wNEAR.
- The simulator runs the same `app.cpp`/`gfx.cpp`/`checkout.cpp` against a fake platform and writes `screens/*.png`, so the previews can't drift from the device. The preview data is a real quote's numbers with a deliberately invalid deposit address, so the preview PNGs' QR codes can't be paid.

## 6. Board firmware

```sh
cd firmware && pio run && pio run -t upload --upload-port /dev/cu.usbmodem101
```
- `main.cpp`: display, touch, backlight, PCF85063 RTC (UTC, offset in NVS), settings in NVS (`checkout/live`, `checkout/merchant`), boot diagnostics (reset reason, AXP2101 registers 0x00/0x01/0x18/0x19/0x20/0x21 in the `boot` event).
- A full 320×480 RGB565 framebuffer in PSRAM. Interactions push the whole frame (~60 ms at 40 MHz SPI). Animations (mascot bob, sparks, smoke, dots) and the countdown push only their rectangle: full-width rows are contiguous in the framebuffer, so those go straight out; narrower rectangles are copied to a PSRAM buffer first.
- `proto.cpp`: the JSON-lines protocol (README.md), polling the USB-Serial-JTAG FIFOs directly, copied from the NEAR Wallet firmware. The `state` event goes out only while a host has talked in the last 6 s, so an unread USB port never stalls the UI.
- `net_wifi.cpp`: when `firmware/include/secrets.h` has an SSID, a FreeRTOS task does HTTPS to 1Click with `WiFiClientSecure` pinned to Google Trust Services roots R1-R4 and the GlobalSign Root CA (`src/roots_pem.h`, exported with `security find-certificate -a -c "GTS Root R4" -p /System/Library/Keychains/SystemRootCertificates.keychain`; chain on 2026-11-14: leaf → WE1 → GTS Root R4 → GlobalSign). Time comes from NTP. Without an SSID, `net_request()` relays through the companion. Both paths hand the identical 1Click body to `app_http_done()`. The network is baked in through the git-ignored `firmware/include/secrets.h` (`WIFI_SSID`, `WIFI_PASSWORD`; copy `secrets.example.h` to make one). With Wi-Fi up the till reaches 1Click on its own; the companion is then only needed for the demo controller. Tested on the device on 2026-11-14: the till joined the network within 4 s of boot and fetched both e2e quotes over its own HTTPS connection (the companion relayed nothing).

## 7. DEMO and LIVE

Both modes request **real** quotes (`dry: false`), verify the signature, show the real payment QR and poll `/v0/status` every 5 s. They differ only in what ends the sale: in DEMO, the companion's `{"cmd":"demo","action":"paid"|"expire"}` (the till then walks through `KNOWN_DEPOSIT_TX` → `PROCESSING` → paid over ~4.5 s); in LIVE, only `/v0/status` (`SUCCESS` → paid, `REFUNDED` / `INCOMPLETE_DEPOSIT` / `FAILED` → ended), and the till refuses demo commands (`live_mode`). The mode is shown only in Settings and on the controller page. LIVE can only be switched on at the till behind the "real money" screen; the host can only switch back to DEMO.

## 8. Host tools (`tools/`)

```sh
cd tools && npm install
node companion.mjs        # relay + demo controller on http://localhost:8787
node check-live.mjs       # mainnet path check, moves no funds
node e2e-demo.mjs         # full DEMO sale + expiry on the real till (companion must run)
```
- `board-serial.mjs`: the wallet's `watch-serial.mjs` approach (`stty -f … raw -echo -hupcl clocal` + a non-blocking fd polled every 5 ms). `stdio: "pipe"` keeps stty quiet while the companion retries a missing port.
- `companion.mjs`: answers the till's `http` events only for `POST /v0/quote`, `GET /v0/status?depositAddress=…` and `GET /v0/tokens`, verifies each quote with the SDK, saves real quotes to `tools/receipts/`, sends `hello` every 2 s (clock + heartbeat), and serves the controller with server-sent events and a PNG mirror of the till's framebuffer (`shot`: RLE rows of (count, RGB565) in base64, about 0.5 s).
- `check-live.mjs` writes `tools/fixtures/quote-dry.json` (tracked) and `quote-live.json` (git-ignored: a real deposit address), which the simulator also verifies.

## Pitfalls, in the order they bit

1. **`Arduino_GFX.h` `#define`s `WHITE`, `BLACK`…**: include your own headers before `Arduino_GFX_Library.h` (same as the wallet).
2. **USB serial**: with `ARDUINO_USB_CDC_ON_BOOT=0`, `Serial` is UART0 on GPIO43/44, not USB, so the bring-up sketch printed nothing at first. Write to the USB-Serial-JTAG FIFO directly (`usb_serial_jtag_ll_*`, ≤63-byte packets, flush each), as the wallet does.
3. **Catching boot output**: opening the port doesn't reset the S3. To see boot lines, pulse RTS with DTR low (`EN` low), then raise DTR (pyserial from PlatformIO's penv).
4. **Two deadlines in a real quote** (section 4): counting down to `quote.deadline` would have shown a 3-day countdown.
5. ArduinoJson 7: `doc.to<JsonObject>()` clears the document; set fields like `event` after filling it.
6. **The board dropped off USB** about 40 s after the first Checkout firmware booted (16:53:22 UTC) and didn't come back until it was replugged. After the replug, the boot report read AXP2101 `0x20 = 0x04` (powered on by VBUS insert), `0x21 = 0x00` (no power-off reason survived), ESP reset reason 11 (USB). So the board lost all power at the USB cable/port; the firmware didn't crash. It hasn't happened again. The `boot` event keeps reporting these registers in case it does.

## Results (2026-11-14)

- `firmware/sim`: all tests pass; 17 screens rendered to `screens/`.
- `tools/check-live.mjs`: all six assets listed; dry $12.50 quotes for all six with exactly 12.5 USDC out; one real unfunded quote → `PENDING_DEPOSIT`; the SDK and the till's verifier both accept the dry and the real quote.
- `tools/e2e-demo.mjs` on the device, over Wi-Fi: $12.50 in ETH → real signed quote, EIP-681 QR → Simulate payment received → payment seen → swapping → paid +12.50 USDC; $4.20 in SOL → Solana Pay QR → Simulate expired → expired; a simulate with no open quote is refused.
