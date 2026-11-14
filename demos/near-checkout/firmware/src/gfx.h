// Framebuffer drawing for the 320x480 IPS panel, copied from the NEAR Wallet
// firmware (same palette, font and pixel buttons). Portable: the firmware
// flushes the buffer to the ST7796, the host simulator writes screens/*.png.
#pragma once
#include <stdint.h>
#include "assets_gen.h"

#define SCR_W 320
#define SCR_H 480

namespace gfx {

constexpr uint16_t rgb(uint8_t r, uint8_t g, uint8_t b) {
  return (uint16_t)(((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3));
}

// Palette from the wallet designs
constexpr uint16_t BG = rgb(148, 190, 117);     // #94BE75 green
constexpr uint16_t WHITE = 0xFFFF;
constexpr uint16_t DARK = rgb(9, 22, 28);       // outlines, QR modules
constexpr uint16_t LIGHT = rgb(228, 247, 212);  // QR background
constexpr uint16_t DIM = rgb(222, 240, 205);    // secondary text
constexpr uint16_t SHADE = rgb(122, 166, 94);   // darker green panels
constexpr uint16_t ALERT = rgb(255, 214, 196);  // destructive actions
constexpr uint16_t LABEL = rgb(44, 86, 34);     // field labels
constexpr uint16_t LIVE_RED = rgb(214, 48, 40); // the LIVE badge

extern uint16_t *fb;

void clear(uint16_t c = BG);
void rect(int x, int y, int w, int h, uint16_t c);
void frame(int x, int y, int w, int h, int t, uint16_t c);
void glyph(int x, int y, uint8_t ch, int s, uint16_t c);
// ASCII plus the G_* custom glyphs; returns the x after the last glyph
int text(int x, int y, const char *s, int scale, uint16_t c);
int textW(const char *s, int scale);
void textC(int cx, int y, const char *s, int scale, uint16_t c);
// Condensed: glyphs advance 7*scale instead of 8*scale (for long amounts)
int textN(int x, int y, const char *s, int scale, uint16_t c);
int textNW(const char *s, int scale);
void sprite(int x, int y, const Sprite &sp, int scale = 1);
void spriteMono(int x, int y, const Sprite &sp, int scale, uint16_t c);
// Pixel button frame from the designs: notched corners and a perforated
// bottom edge. Filled when pressed.
void button(int x, int y, int w, int h, bool pressed, uint16_t c = WHITE);
// Page indicator: big square for the current page, small ones for the rest
void dots(int cx, int y, int n, int sel);

// Word-wrap `s` to lines of at most `cols` characters. Long words are hard
// broken. Returns the number of lines written.
int wrap(const char *s, int cols, char (*lines)[40], int maxLines);

}  // namespace gfx
