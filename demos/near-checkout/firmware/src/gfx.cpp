#include "gfx.h"
#include <string.h>

namespace gfx {

uint16_t *fb = nullptr;

void clear(uint16_t c) {
  for (int i = 0; i < SCR_W * SCR_H; i++) fb[i] = c;
}

void rect(int x, int y, int w, int h, uint16_t c) {
  if (x < 0) { w += x; x = 0; }
  if (y < 0) { h += y; y = 0; }
  if (x + w > SCR_W) w = SCR_W - x;
  if (y + h > SCR_H) h = SCR_H - y;
  if (w <= 0 || h <= 0) return;
  for (int j = 0; j < h; j++) {
    uint16_t *p = fb + (y + j) * SCR_W + x;
    for (int i = 0; i < w; i++) p[i] = c;
  }
}

void frame(int x, int y, int w, int h, int t, uint16_t c) {
  rect(x, y, w, t, c);
  rect(x, y + h - t, w, t, c);
  rect(x, y, t, h, c);
  rect(x + w - t, y, t, h, c);
}

void glyph(int x, int y, uint8_t ch, int s, uint16_t c) {
  int idx;
  if (ch >= 0x20 && ch < 0x7F) idx = ch - FONT_FIRST;
  else if (ch >= 0x80 && ch < 0x80 + (FONT_COUNT - 95)) idx = 95 + (ch - 0x80);
  else idx = '?' - FONT_FIRST;
  const uint8_t *g = FONT8[idx];
  for (int row = 0; row < 8; row++) {
    uint8_t bits = g[row];
    if (!bits) continue;
    for (int col = 0; col < 8; col++)
      if (bits & (0x80 >> col)) rect(x + col * s, y + row * s, s, s, c);
  }
}

int text(int x, int y, const char *s, int scale, uint16_t c) {
  for (; *s; s++) {
    glyph(x, y, (uint8_t)*s, scale, c);
    x += 8 * scale;
  }
  return x;
}

int textW(const char *s, int scale) {
  int n = (int)strlen(s);
  // the last column of every glyph is spacing, don't count it for centering
  return n ? n * 8 * scale - scale : 0;
}

void textC(int cx, int y, const char *s, int scale, uint16_t c) {
  text(cx - textW(s, scale) / 2, y, s, scale, c);
}

int textN(int x, int y, const char *s, int scale, uint16_t c) {
  for (; *s; s++) {
    glyph(x, y, (uint8_t)*s, scale, c);
    x += 7 * scale;
  }
  return x;
}

int textNW(const char *s, int scale) {
  int n = (int)strlen(s);
  return n ? n * 7 * scale : 0;
}

void sprite(int x, int y, const Sprite &sp, int scale) {
  for (int j = 0; j < sp.h; j++) {
    const uint8_t *row = sp.px + j * sp.w;
    for (int i = 0; i < sp.w; i++) {
      uint8_t p = row[i];
      if (!p) continue;
      if (scale == 1) {
        int xx = x + i, yy = y + j;
        if (xx >= 0 && yy >= 0 && xx < SCR_W && yy < SCR_H) fb[yy * SCR_W + xx] = sp.pal[p];
      } else {
        rect(x + i * scale, y + j * scale, scale, scale, sp.pal[p]);
      }
    }
  }
}

void spriteMono(int x, int y, const Sprite &sp, int scale, uint16_t c) {
  for (int j = 0; j < sp.h; j++)
    for (int i = 0; i < sp.w; i++)
      if (sp.px[j * sp.w + i]) rect(x + i * scale, y + j * scale, scale, scale, c);
}

void button(int x, int y, int w, int h, bool pressed, uint16_t c) {
  const int u = 3;
  if (pressed) rect(x + u, y + u, w - 2 * u, h - 2 * u, c);
  rect(x + u, y, w - 2 * u, u, c);              // top
  rect(x, y + u, u, h - 2 * u, c);              // left
  rect(x + w - u, y + u, u, h - 2 * u, c);      // right
  rect(x + u, y + h - 3 * u, w - 2 * u, 3 * u, c);  // thick bottom
  rect(x + u, y + u, u, u, c);                  // notched corners
  rect(x + w - 2 * u, y + u, u, u, c);
  // perforations along the bottom edge
  for (int px = x + 2 * u; px + u <= x + w - 2 * u; px += 2 * u)
    rect(px, y + h - 2 * u, u, u, pressed ? c : BG);
}

void dots(int cx, int y, int n, int sel) {
  const int gap = 32;
  int x0 = cx - (n - 1) * gap / 2;
  for (int i = 0; i < n; i++) {
    int x = x0 + i * gap;
    if (i == sel) rect(x - 6, y - 6, 12, 12, WHITE);
    else rect(x - 2, y - 2, 5, 5, WHITE);
  }
}

int wrap(const char *s, int cols, char (*lines)[40], int maxLines) {
  if (cols > 39) cols = 39;
  int n = 0;
  const char *p = s;
  while (*p && n < maxLines) {
    if (*p == '\n') { p++; continue; }
    int len = (int)strlen(p);
    const char *nl = strchr(p, '\n');
    int lim = nl ? (int)(nl - p) : len;
    int take;
    if (lim <= cols) {
      take = lim;
    } else {
      take = cols;
      // break at the last space inside the window if there is one
      for (int i = cols; i > cols / 2; i--)
        if (p[i] == ' ') { take = i; break; }
    }
    memcpy(lines[n], p, take);
    lines[n][take] = 0;
    n++;
    p += take;
    while (*p == ' ') p++;
  }
  return n;
}

}  // namespace gfx
