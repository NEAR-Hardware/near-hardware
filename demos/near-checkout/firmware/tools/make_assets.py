#!/usr/bin/env python3
"""Generate src/assets_gen.h for the NEAR Checkout firmware.

Adapted from the NEAR Wallet project's tools/make_assets.py (same font, same
mascots, same icon style), re-scaled for the 320x480 panel.

Run from the firmware/ folder with a Python that has Pillow:
    /usr/bin/python3 tools/make_assets.py

Inputs (all in the repo):
  assets/fonts/PressStart2P-Regular.ttf   pixel font (SIL OFL 1.1, see assets/fonts/OFL.txt)
  ../design/02-wallet-flow-screens.png    source of the soldering and peeking mascots

Outputs:
  src/assets_gen.h      font table + palette-indexed sprites (index 0 = transparent)
  assets/preview/*.png  every sprite, for eyeballing
"""
import math
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FW = os.path.dirname(HERE)
ROOT = os.path.dirname(FW)
BG = (148, 190, 117)          # the design's green (#94BE75)
SCALE = 320 / 314             # design frames are 314 px wide, this panel is 320

PREVIEW = os.path.join(FW, "assets", "preview")
os.makedirs(PREVIEW, exist_ok=True)


def rgb565(c):
    r, g, b = c[:3]
    return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3)


def bits(art):
    rows = []
    for line in art:
        v = 0
        for x, ch in enumerate(line):
            if ch == "X":
                v |= 0x80 >> x
        rows.append(v)
    return rows


# ---------------------------------------------------------------- font
def make_font():
    ft = ImageFont.truetype(os.path.join(FW, "assets/fonts/PressStart2P-Regular.ttf"), 8)
    glyphs = []
    for code in range(0x20, 0x7F):
        im = Image.new("L", (8, 8), 0)
        ImageDraw.Draw(im).text((0, 0), chr(code), font=ft, fill=255)
        rows = []
        for y in range(8):
            v = 0
            for x in range(8):
                if im.getpixel((x, y)) > 127:
                    v |= 0x80 >> x
            rows.append(v)
        glyphs.append((chr(code), rows))
    # custom glyphs, 0x80 upwards (the first six match the wallet's)
    custom = {
        "ARROW_L": ["........", "...X....", "..XX....", ".XXXXXX.", ".XXXXXX.", "..XX....", "...X....", "........"],
        "ARROW_R": ["........", "....X...", "....XX..", ".XXXXXX.", ".XXXXXX.", "....XX..", "....X...", "........"],
        "ELLIPSIS": ["........", "........", "........", "........", "........", "........", "X..X..X.", "........"],
        "CHECK": ["........", "......XX", ".....XX.", "XX..XX..", ".XXXX...", "..XX....", "........", "........"],
        "MIDDOT": ["........", "........", "........", "...XX...", "...XX...", "........", "........", "........"],
        "BULLET": ["........", ".XX.....", ".XXX....", ".XXXX...", ".XXX....", ".XX.....", "........", "........"],
        "APPROX": ["........", ".XX...X.", "X..XXX..", "........", ".XX...X.", "X..XXX..", "........", "........"],
    }
    for name, art in custom.items():
        glyphs.append((name, bits(art)))
    return glyphs, list(custom.keys())


# ---------------------------------------------------------------- sprites
class Sprite:
    def __init__(self, name, w, h, pal, px):
        self.name, self.w, self.h, self.pal, self.px = name, w, h, pal, px

    def save_preview(self, scale=4):
        im = Image.new("RGB", (self.w, self.h), BG)
        for i, p in enumerate(self.px):
            if p:
                im.putpixel((i % self.w, i // self.w), self.pal[p][:3])
        im.resize((self.w * scale, self.h * scale), Image.NEAREST).save(os.path.join(PREVIEW, self.name + ".png"))


def ascii_sprite(name, art, colors):
    """art: list of strings; colors: char -> (r,g,b). '.' is transparent."""
    pal = [(0, 0, 0)]
    idx = {}
    for ch, c in colors.items():
        idx[ch] = len(pal)
        pal.append(c)
    h = len(art)
    w = max(len(r) for r in art)
    px = []
    for row in art:
        row = row.ljust(w, ".")
        for ch in row:
            px.append(idx.get(ch, 0))
    return Sprite(name, w, h, pal, px)


def dist2(a, b):
    return sum((x - y) ** 2 for x, y in zip(a, b))


def raster_sprite(name, path, box, scale, ncolors, transparent=lambda c: False):
    """Crop a region from a low-resolution design export, scale it to panel
    pixels and snap every pixel back to the region's own palette so the
    result stays flat like pixel art (same method as the wallet)."""
    src = Image.open(path).convert("RGB").crop(box)
    w, h = round(src.width * scale), round(src.height * scale)
    big = src.resize((w, h), Image.Resampling.LANCZOS)
    # octree keeps small saturated details (the yellow iron, orange chips)
    q = big.quantize(colors=ncolors, method=Image.Quantize.FASTOCTREE)
    raw = q.getpalette()[: ncolors * 3]
    cand = [tuple(raw[i:i + 3]) for i in range(0, len(raw), 3)]
    pal = [(0, 0, 0)]
    keep = [c for c in cand if dist2(c, BG) > 600 and not transparent(c)]
    for c in keep:
        pal.append(c)
    px = []
    cache = {}
    for c in big.getdata():
        if c not in cache:
            if dist2(c, BG) < 900 or transparent(c):
                cache[c] = 0
            else:
                best = min(range(1, len(pal)), key=lambda i: dist2(c, pal[i]))
                cache[c] = best if dist2(c, pal[best]) < dist2(c, BG) else 0
        px.append(cache[c])
    return Sprite(name, w, h, pal, px)


def coin_sprite(name, fill, glyph, glyph_color=(255, 255, 255)):
    """16x16 pixel coin: dark outline ring, brand-coloured face, 8x8 glyph."""
    n = 16
    art = []
    for y in range(n):
        row = ""
        for x in range(n):
            d = math.hypot(x + 0.5 - n / 2, y + 0.5 - n / 2)
            if d <= n / 2 - 1.0:
                row += "c"
            elif d <= n / 2 + 0.1:
                row += "o"
            else:
                row += "."
        art.append(row)
    art = [list(r) for r in art]
    for gy, line in enumerate(glyph):
        for gx, ch in enumerate(line):
            if ch == "X":
                art[4 + gy][4 + gx] = "w"
    art = ["".join(r) for r in art]
    return ascii_sprite(name, art, {"o": DARK, "c": fill, "w": glyph_color})


WHITE = (255, 255, 255)
DARK = (9, 22, 28)


def make_sprites():
    s = []
    design2 = os.path.join(ROOT, "design/02-wallet-flow-screens.png")

    # the soldering mascot from the "generating wallet" frame (waiting screen)
    s.append(raster_sprite("mascot_solder", design2, (178, 628, 342, 770), SCALE, 96))

    # the mascot peeking in at the bottom-left of the home frame; the grey
    # outside the frame's rounded corner becomes transparent
    grey = lambda c: abs(c[0] - c[1]) < 12 and abs(c[1] - c[2]) < 12 and 90 < c[0] < 160
    s.append(raster_sprite("mascot_peek", design2, (96, 346, 178, 450), SCALE, 10, transparent=grey))

    # icons: the wallet's hand-drawn set
    s.append(ascii_sprite("wifi", [
        "..XXXXXX..",
        ".XXXXXXXX.",
        "XX......XX",
        "X..XXXX..X",
        "..XXXXXX..",
        "..X....X..",
        "....XX....",
        "....XX....",
    ], {"X": WHITE}))
    s.append(ascii_sprite("wifi_off", [
        "..XXXXX..X",
        ".XXXXX..XX",
        "XX.....XX.",
        "X..XX.XX.X",
        "..XX.XX...",
        "..X.XX.X..",
        "...XX.....",
        "..XXX.....",
    ], {"X": WHITE}))
    s.append(ascii_sprite("chev_r", [
        "XX...", ".XX..", "..XX.", "...XX", "..XX.", ".XX..", "XX...",
    ], {"X": WHITE}))
    s.append(ascii_sprite("chev_l", [
        "...XX", "..XX.", ".XX..", "XX...", ".XX..", "..XX.", "...XX",
    ], {"X": WHITE}))
    s.append(ascii_sprite("chev_d", [
        "X.....X", "XX...XX", ".XX.XX.", "..XXX..", "...X...",
    ], {"X": WHITE}))
    s.append(ascii_sprite("near_logo", [
        "...XXXX...",
        ".XX....XX.",
        ".X......X.",
        "X.X...X..X",
        "X.XX..X..X",
        "X.X.X.X..X",
        "X.X..XX..X",
        ".X.....X.X",
        ".XX....XX.",
        "...XXXX...",
    ], {"X": WHITE}))
    s.append(ascii_sprite("gear", [
        ".......XXXX.......",
        ".......XXXX.......",
        "...XX..XXXX..XX...",
        "..XXXXXXXXXXXXXX..",
        "..XXXXXXXXXXXXXX..",
        "...XXXXXXXXXXXX...",
        "...XXXX....XXXX...",
        "XXXXXX......XXXXXX",
        "XXXXX........XXXXX",
        "XXXXX........XXXXX",
        "XXXXXX......XXXXXX",
        "...XXXX....XXXX...",
        "...XXXXXXXXXXXX...",
        "..XXXXXXXXXXXXXX..",
        "..XXXXXXXXXXXXXX..",
        "...XX..XXXX..XX...",
        ".......XXXX.......",
        ".......XXXX.......",
    ], {"X": WHITE}))
    s.append(ascii_sprite("check_big", [
        "........XX",
        ".......XXX",
        "......XXX.",
        "XX...XXX..",
        "XXX.XXX...",
        ".XXXXX....",
        "..XXX.....",
        "...X......",
    ], {"X": WHITE}))
    s.append(ascii_sprite("usb", [
        "......XX......",
        ".....XXXX.....",
        "......XX...XX.",
        "..XX..XX...XX.",
        ".XXXX.XX...XX.",
        "..XX..XX..XX..",
        "..XX..XX.XX...",
        "...XX.XXXX....",
        "....XXXX......",
        "......XX......",
        ".....XXXX.....",
        ".....XXXX.....",
    ], {"X": WHITE}))
    # new for the till: a price tag and a receipt
    s.append(ascii_sprite("tag", [
        "....XXXXXXXXXXX",
        "...XXXXXXXXXXXX",
        "..XXX.XXXXXXXXX",
        ".XXX...XXXXXXXX",
        "XXXXX.XXXXXXXXX",
        "XXXXXXXXXXXXXXX",
        ".XXXXXXXXXXXXXX",
        "..XXXXXXXXXXXXX",
        "...XXXXXXXXXXXX",
        "....XXXXXXXXXXX",
    ], {"X": WHITE}))
    s.append(ascii_sprite("receipt", [
        "XXXXXXXXXXXX",
        "X..........X",
        "X.XXXXXXXX.X",
        "X..........X",
        "X.XXXXX....X",
        "X..........X",
        "X.XXXXXXX..X",
        "X..........X",
        "X.....XXXX.X",
        "X..........X",
        "XX.XX.XX.XXX",
        ".X..X..X..X.",
    ], {"X": WHITE}))
    # spark for the waiting animation (tip of the soldering iron)
    s.append(ascii_sprite("spark", [
        "..Y..",
        "Y.W.Y",
        ".WWW.",
        "Y.W.Y",
        "..Y..",
    ], {"Y": (255, 222, 89), "W": WHITE}))

    # coins for the payment choices
    s.append(coin_sprite("coin_usdc", (39, 117, 202), [
        "...X....",
        ".XXXXX..",
        "XX.X....",
        ".XXXXX..",
        "...X.XX.",
        "XXXXXX..",
        "...X....",
        "........",
    ]))
    s.append(coin_sprite("coin_eth", (98, 126, 234), [
        "...X....",
        "..XXX...",
        ".XXXXX..",
        "XXXXXXX.",
        ".XXXXX..",
        "X.XXX.X.",
        ".XXXXX..",
        "...X....",
    ]))
    s.append(coin_sprite("coin_sol", (153, 69, 255), [
        "..XXXXXX",
        ".XXXXXX.",
        "........",
        ".XXXXXX.",
        "..XXXXXX",
        "........",
        "..XXXXXX",
        ".XXXXXX.",
    ]))
    s.append(coin_sprite("coin_btc", (247, 147, 26), [
        ".X.X....",
        "XXXXXX..",
        ".XX..XX.",
        ".XXXXX..",
        ".XX..XX.",
        ".XX..XX.",
        "XXXXXX..",
        ".X.X....",
    ]))
    s.append(coin_sprite("coin_near", DARK, [
        "XX....XX",
        "XXX...XX",
        "XXXX..XX",
        "XX.XX.XX",
        "XX..XXXX",
        "XX...XXX",
        "XX....XX",
        "........",
    ]))
    return s


# ---------------------------------------------------------------- emit
def emit_assets(glyphs, custom_names, sprites):
    out = []
    out.append("// Generated by tools/make_assets.py. Do not edit.")
    out.append("#pragma once")
    out.append("#include <stdint.h>\n")
    out.append("// Press Start 2P (SIL OFL 1.1), 8x8 cells, MSB = leftmost pixel.")
    out.append("#define FONT_FIRST 0x20")
    out.append(f"#define FONT_COUNT {len(glyphs)}")
    for i, n in enumerate(custom_names):
        out.append(f"#define G_{n} \"\\x{0x80 + i:02X}\"")
    out.append("static const uint8_t FONT8[FONT_COUNT][8] = {")
    for ch, rows in glyphs:
        label = ch if len(ch) > 1 else repr(ch)
        out.append("  {" + ",".join(f"0x{r:02X}" for r in rows) + "}, // " + label.replace("\\", "backslash"))
    out.append("};\n")
    out.append("typedef struct { uint16_t w, h; uint8_t npal; const uint16_t *pal; const uint8_t *px; } Sprite;\n")
    for sp in sprites:
        out.append(f"static const uint16_t {sp.name}_pal[{len(sp.pal)}] = {{" + ",".join(f"0x{rgb565(c):04X}" for c in sp.pal) + "};")
        out.append(f"static const uint8_t {sp.name}_px[{len(sp.px)}] = {{")
        for i in range(0, len(sp.px), 40):
            out.append("  " + ",".join(str(v) for v in sp.px[i:i + 40]) + ",")
        out.append("};")
        out.append(f"static const Sprite SPR_{sp.name.upper()} = {{{sp.w}, {sp.h}, {len(sp.pal)}, {sp.name}_pal, {sp.name}_px}};\n")
    with open(os.path.join(FW, "src/assets_gen.h"), "w") as f:
        f.write("\n".join(out) + "\n")


if __name__ == "__main__":
    glyphs, custom = make_font()
    sprites = make_sprites()
    for sp in sprites:
        sp.save_preview()
        print(f"{sp.name:14s} {sp.w}x{sp.h} {len(sp.pal) - 1} colours")
    emit_assets(glyphs, custom, sprites)
    print("wrote src/assets_gen.h")
