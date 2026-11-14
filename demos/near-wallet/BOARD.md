# ESP32-S3 2.06inch AMOLED Touch Watch Development Board

Manufacturer: Waveshare (product name: ESP32-S3-Touch-AMOLED-2.06)

## Sources
- Wiki: https://docs.waveshare.com/ESP32-S3-Touch-AMOLED-2.06
- Examples: https://github.com/waveshareteam/ESP32-S3-Touch-AMOLED-2.06 (their Arduino_GFX and Arduino_DriveBus are vendored in `firmware/lib/`)
- Pin tables below are from the wiki page and the repo's `board_config/pin_config.h`, as researched for the esp32-watch project.

## Core
- MCU: ESP32-S3R8 (dual-core LX7, Wi-Fi + BLE, 8 MB octal PSRAM)
- Flash: 32 MB quad (Winbond-class id c8:4019, verified with esptool flash-id); PSRAM 8 MB octal. Partition table currently default_16MB.csv (first 16 MB only).
- USB: native USB (GPIO19 D-, GPIO20 D+), enumerates as 303a:1001
- Power: USB-C, MX1.25 3.7 V LiPo connector, AXP2101 PMIC

## Peripherals
| Function | Part | Notes |
|---|---|---|
| Display | CO5300 AMOLED 410x502 | QSPI; Arduino_GFX `Arduino_CO5300`, col_offset1 = 22 |
| Touch | FT3168 | I2C, INT GPIO38, RST GPIO9 |
| IMU | QMI8658C | I2C, INT GPIO21 |
| RTC | PCF85063ATL | I2C, INT GPIO39 |
| PMIC | AXP2101 | I2C (XPowersLib) |
| Codec | ES8311 (playback) + ES7210 (mic ADC) + NS4150B amp | I2C + I2S |
| SD | TF slot | SPI |

## Display geometry
- 410 x 502 portrait (rotation 0 in all vendor examples), 16.7M colours, 600 cd/m², CO5300 over QSPI.
- Active area 33.09 x 40.51 mm with R9.2 mm corners, from the official outline drawing:
  https://www.waveshare.com/img/devkit/ESP32-S3-Touch-AMOLED-2.06/ESP32-S3-Touch-AMOLED-2.06-details-size.jpg
- 410 / 33.09 = 502 / 40.51 = 12.39 px/mm, so the corner radius is about 114 px (derived from the drawing; not published in pixels).

## Pins
| Signal | GPIO |
|---|---|
| LCD SIO0-SIO3 | 4, 5, 6, 7 |
| LCD SCLK | 11 |
| LCD CS | 12 |
| LCD RESET | 8 |
| LCD TE | 13 |
| I2C SDA / SCL (shared by all I2C parts) | 15 / 14 |
| Touch INT / RST | 38 / 9 |
| IMU INT | 21 |
| RTC INT | 39 |
| SD MOSI / SCK / MISO / CS | 1 / 2 / 3 / 17 |
| I2S MCLK | 16 |
| I2S SCLK / LRCK | 41 / 45 |
| I2S DSDIN (playback) / ASDOUT (mic) | 40 / 42 |
| Amp enable (PA_CTRL) | 46 |
| BOOT button | 0 (low = pressed) |
| PWR button | 10 (high = pressed; hold ~6 s to power off, click to power on) |
| UART0 TX / RX (pads) | 43 / 44 |
| Vibration motor (via Q1 MMBT3904, pads P1+/P2) | 18 |

## Expansion pads
No pin header. A row of 10 solder pads runs along the bottom edge on the back of the PCB, in this silkscreen order:
VBUS, GND, D+/IO20, D-/IO19, IO15, IO14, RXD (IO44), TXD (IO43), GND, 3V3.
Only IO43/IO44 are free when Serial goes over native USB. IO14/IO15 are the shared I2C bus, and IO19/IO20 are USB.
Source: schematic V1.0 bottom-layer view (`vendor/.../hardware/schematic/`); motor GPIO from `examples/factory/components/VibrationTest/VibrationTest.hpp`.

## Bootloader
Hold BOOT while powering on / plugging in USB to enter download mode.

## Quirks
- Arduino_GFX and Arduino_DriveBus live in `firmware/lib/`. LVGL is not used: the UI draws into its own framebuffer.
- I2C addresses used here: FT3168 touch 0x38, PCF85063 RTC 0x51.
- USB serial: this Arduino core's HWCDC (and the IDF usb_serial_jtag driver) left replies stuck until the host wrote again. The firmware builds with `ARDUINO_USB_CDC_ON_BOOT=0` and polls the USB-Serial-JTAG FIFOs itself (`firmware/src/proto.cpp`). Hosts must keep DTR high and must not raise RTS with DTR low (that resets the chip).

## NEAR wallet on this board
- Network: one per firmware build, `pio run -e testnet` (default) or `-e mainnet`; it refuses the other network.
- Key: made on the watch (hardware RNG → BIP39 12 words → SLIP-10 ed25519 m/44'/397'/0'), encrypted with the PIN in NVS.
- Account: implicit `8103187969cc6baf6875abf63f118881281cdfd767713be2a02ca8783b411f92`, public key `ed25519:9gcLBjjDup9FWGpFZ72ifabqGbjudS6i78L6rTQ38geV` (full access). Funded with 1 testnet NEAR on 2026-11-14.
- Contract used by the demo: `hello.near-examples.testnet`, or `hello.near-examples.near` on mainnet (`set_greeting` / `get_greeting`).
- Protocol and security notes: README.md. Build log: RECIPE.md.
