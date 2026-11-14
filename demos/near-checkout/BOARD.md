# ESP32-S3 3.5inch Capacitive Touch Display Development Board

The board name as entered: "ESP32-S3 3.5inch Capacitive Touch Display Development Board, 320×480 Pixels, IPS Panel, 262K Color, Onboard Camera Interface, Supports Wi-Fi and Bluetooth 5, ESP32 With Display".

Manufacturer: **Waveshare**, product **ESP32-S3-Touch-LCD-3.5** (SKU 30733; the `-C` kit, SKU 30934, adds a case and an OV5640 camera). The sticker on the PCB reads `ESP32-S3-Touch-LCD-3.5 Rev2.0`.
Not to be confused with the **ESP32-S3-Touch-LCD-3.5B** (AXS15231B QSPI panel, different pins).

## Sources
- Wiki: https://docs.waveshare.com/ESP32-S3-Touch-LCD-3.5 (specs, pinout and dimension images)
- Product page: https://www.waveshare.com/esp32-s3-touch-lcd-3.5.htm
- Examples: https://github.com/waveshareteam/ESP32-S3-Touch-LCD-3.5, cloned to `vendor/ESP32-S3-Touch-LCD-3.5/` (Arduino examples + their pinned libraries, ESP-IDF examples, factory firmware, V1/V2 schematics)
- Pins below come from `examples/factory/components/esp32_s3_touch_lcd_3_5/include/bsp/esp32_s3_touch_lcd_3_5.h` and `bsp_board.cpp` (Waveshare's board support package), the Arduino examples `08_gfx_helloworld` / `11_lvgl_arduino_v8`, and the wiki's "Pinout Definition" image.

## Core
- MCU: **ESP32-S3R8**, dual-core Xtensa LX7 up to 240 MHz, 512 KB SRAM, Wi-Fi 802.11 b/g/n + Bluetooth 5 LE, onboard antenna (IPEX after moving a resistor)
- Flash: **16 MB** quad SPI NOR (W25Q128JVSIQ). PSRAM: **8 MB octal**, in the S3R8 package
- USB: native USB on GPIO19 (D-) / GPIO20 (D+), Type-C. Enumerates as Espressif `303a:1001` (USB-Serial-JTAG) on `/dev/cu.usbmodem101`, serial number `20:6E:F1:9A:F4:84`
- Power: USB-C, MX1.25 3.7 V Li-ion connector (charging), SH1.0 RTC backup cell connector, **AXP2101** PMIC
- Buttons: PWR (via the TCA9554 expander, EXIO6), RESET, BOOT (GPIO0)

## Peripherals
| Function | Part | Bus / address | Driver |
|---|---|---|---|
| Display | 3.5" IPS 320×480, 262K colours, **ST7796** | SPI2: MOSI 1, MISO 2, SCLK 5, DC 3, CS tied low, reset via EXIO1 | Arduino_GFX `Arduino_ST7796(bus, -1, 0, true /*IPS*/, 320, 480)` |
| Backlight | | GPIO6 (PWM, high = on) | ledc |
| Touch | **FT6336** capacitive | I2C 0x38, no INT/RST wired to the MCU | SensorLib `TouchDrvFT6X36`, or plain register reads |
| IO expander | **TCA9554** | I2C 0x20 | EXIO1 = LCD reset (output), EXIO7 = output driven high by the BSP, EXIO6 = PWR button (input, high = pressed) |
| PMIC | **AXP2101** | I2C 0x34 | XPowersLib |
| IMU | **QMI8658** 6-axis | I2C 0x6B | SensorLib |
| RTC | **PCF85063** | I2C 0x51 | SensorLib or registers |
| Audio | **ES8311** codec + mic + MX1.25 speaker header | I2C 0x18, I2S MCLK 12, BCLK 13, LRCK 15, DOUT 16, DIN 14 | es8311 |
| TF card | SDMMC 1-bit | CLK 11, CMD 10, D0 9 | SD_MMC |
| Camera | DVP 24-pin FPC (OV2640 / OV5640) | XCLK 38, PCLK 41, VSYNC 17, HREF 18, D0-D7 45, 47, 48, 46, 42, 40, 39, 21, SCCB on the shared I2C | esp32-camera |

I2C (SDA **GPIO8**, SCL **GPIO7**, 400 kHz) is shared by touch, expander, PMIC, IMU, RTC, codec and the camera's SCCB.

## Display geometry
- 320 × 480 portrait (rotation 0 in every vendor example), RGB565 over SPI, IPS so `ips = true` (colour inversion on), BGR element order (`BSP_LCD_COLOR_SPACE`).
- Active area 48.96 × 73.44 mm (wiki dimension drawing), i.e. 6.54 px/mm. The panel's active area has square corners; only the optional case has R7.3 mm corners.

## Header (2×16, 2.54 mm, as seen from the back, pin 1 top-left)
| Pin | Signal | Pin | Signal |
|---|---|---|---|
| 1 | BAT | 2 | 5V |
| 3 | GND | 4 | GND |
| 5 | GPIO21 | 6 | DN (GPIO19, USB D-) |
| 7 | GPIO38 | 8 | DP (GPIO20, USB D+) |
| 9 | GPIO39 | 10 | GPIO11 |
| 11 | GPIO40 | 12 | GPIO10 |
| 13 | GPIO41 | 14 | GPIO9 |
| 15 | GPIO42 | 16 | GPIO17 |
| 17 | GPIO45 | 18 | GPIO18 |
| 19 | GPIO46 | 20 | BOOT (GPIO0) |
| 21 | GPIO47 | 22 | RST |
| 23 | GPIO48 | 24 | PWR |
| 25 | RXD (GPIO44) | 26 | SCL (GPIO7) |
| 27 | TXD (GPIO43) | 28 | SDA (GPIO8) |
| 29 | GND | 30 | GND |
| 31 | 3V3 | 32 | 3V3 |

Source: wiki "Pinout Definition" image. GPIO9/10/11 are shared with the TF card, and GPIO17/18/21/38-42/45-48 with the camera connector: they are free only when no card / camera is used. GPIO45 and GPIO46 are strapping pins (keep them unloaded at boot).

## Bootloader
Native USB normally auto-resets into the ROM bootloader for uploads. If an upload can't connect: hold **BOOT**, tap **RESET**, release BOOT, then upload again (and tap RESET afterwards).

## Quirks
- LCD reset is on the TCA9554 (EXIO1), not a GPIO: write config reg 0x03 (0 = output) and output reg 0x01 over I2C, pulse EXIO1 low → high, then wait ~120 ms before `gfx->begin()`.
- LCD chip select is hard-wired; nothing else may share the LCD SPI pins.
- The vendor Arduino examples pin their libraries in `vendor/.../examples/arduino/libraries`: GFX Library for Arduino 1.5.5, SensorLib 0.3.1, XPowersLib 0.2.9, TCA9554 0.1.2, lvgl 8.4.0, ES8311.
- The FT6336 reports in panel coordinates for rotation 0, so touch maps 1:1 to the 320×480 portrait framebuffer.
- USB serial: like the NEAR Wallet watch, this firmware builds with `ARDUINO_USB_CDC_ON_BOOT=0` and polls the USB-Serial-JTAG FIFOs itself (see RECIPE.md). Hosts keep DTR high and never raise RTS with DTR low (that resets the chip).

## Verified on this unit (2026-11-14)
- Bring-up sketch: `lcd.begin()` true, PSRAM 8 388 608 B, flash 16 777 216 B.
- I2C scan: `0x18` ES8311, `0x20` TCA9554, `0x34` AXP2101, `0x38` FT6336 (so this is the 3.5, not the 3.5B), `0x51` PCF85063, `0x6B` QMI8658, and an unexplained `0x7E`.
- The board dropped off USB once, ~40 s after the first NEAR Checkout boot, until it was replugged. Afterwards the AXP2101 reported power-on by VBUS insert and no power-off reason: the board lost all USB power (cable/port). See RECIPE.md, pitfall 6.
- Wi-Fi: joins the network from the git-ignored `firmware/include/secrets.h` within ~4 s, and HTTPS to 1Click works with the pinned roots.

## NEAR on this board
- NEAR Checkout (this project): no keys on the board. It only asks 1Click (`1click.chaindefuser.com`, mainnet NEAR Intents) for quotes and status. Merchant (receives USDC on NEAR, refunds to its Intents balance): `rythmn.near` by default, set under Settings.
