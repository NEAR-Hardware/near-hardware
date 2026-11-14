#!/usr/bin/env python3
"""Pixel PNGs for the Chrome extension and the web app, from the same sprites
the watch uses. Run from the repo root: /usr/bin/python3 firmware/tools/make_web_assets.py"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image
import make_assets as A

ROOT = A.ROOT
sprites = {s.name: s for s in A.make_sprites()}

def img(sp, scale, color=None):
    im = Image.new("RGBA", (sp.w * scale, sp.h * scale), (0, 0, 0, 0))
    px = im.load()
    for i, p in enumerate(sp.px):
        if not p:
            continue
        c = color or sp.pal[p][:3]
        x0, y0 = (i % sp.w) * scale, (i // sp.w) * scale
        for y in range(y0, y0 + scale):
            for x in range(x0, x0 + scale):
                px[x, y] = (*c, 255)
    return im

def icon(size):
    # green rounded tile with the pixel NEAR logo, like a tiny watch face
    s = max(1, size // 16)
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    tile = Image.new("RGBA", (size, size), (*A.BG, 255))
    mask = Image.new("L", (size, size), 0)
    from PIL import ImageDraw
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=size // 4, fill=255)
    im.paste(tile, (0, 0), mask)
    logo = img(sprites["near_logo"], max(1, int(size * 0.62) // 10), (255, 255, 255))
    im.alpha_composite(logo, ((size - logo.width) // 2, (size - logo.height) // 2))
    return im

out = os.path.join(ROOT, "extension")
for n in (16, 32, 48, 128):
    icon(n).save(os.path.join(out, "icons", f"icon{n}.png"))
img(sprites["mascot_solder"], 1).save(os.path.join(out, "img", "mascot-solder.png"))
img(sprites["mascot_peek"], 1).save(os.path.join(out, "img", "mascot-peek.png"))
img(sprites["portrait"], 4).save(os.path.join(out, "img", "portrait.png"))
img(sprites["check_big"], 6, (255, 255, 255)).save(os.path.join(out, "img", "check.png"))
img(sprites["usb"], 4, (255, 255, 255)).save(os.path.join(out, "img", "usb.png"))
img(sprites["near_logo"], 2, (255, 255, 255)).save(os.path.join(out, "img", "near.png"))
img(sprites["wifi"], 2, (255, 255, 255)).save(os.path.join(out, "img", "wifi.png"))
img(sprites["wifi_off"], 2, (255, 255, 255)).save(os.path.join(out, "img", "wifi-off.png"))
print("wrote extension/icons and extension/img")
