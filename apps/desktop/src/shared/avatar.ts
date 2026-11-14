// Pixel avatars for NEAR accounts: a 16×16 character drawn from the account ID,
// so an account gets the same face everywhere (the app, an agent, a board's
// screen). Shapes, skin, hair, eyes, mouths, glasses, hats, headphones, shirts
// and backgrounds combine into millions of different characters.

export const AVATAR_SIZE = 16

export type Avatar = {
  // #rrggbb colors; index 0 is the background
  palette: string[]
  // AVATAR_SIZE rows of AVATAR_SIZE palette indices
  pixels: number[][]
}

const BACKGROUNDS = [
  '#f4a259',
  '#e76f51',
  '#e05780',
  '#b56cd6',
  '#7b6cf6',
  '#5b8def',
  '#3fa7d6',
  '#2ec4b6',
  '#43aa8b',
  '#90be6d',
  '#f9c74f',
  '#f28482',
  '#84a59d',
  '#6d597a'
]
const SKINS = [
  '#ffdbac',
  '#f6c99b',
  '#f1c27d',
  '#e0ac69',
  '#c68642',
  '#a0663b',
  '#8d5524',
  '#5c3a1e'
]
// Now and then someone from elsewhere
const ODD_SKINS = ['#9be3a7', '#a7c7ff', '#d7b8ff']
const HAIR = [
  '#1f1a17',
  '#3b2416',
  '#5a3825',
  '#8a4f2a',
  '#b5651d',
  '#d9a441',
  '#efd27a',
  '#e8e8e8',
  '#9aa0a6',
  '#c0392b',
  '#ff6fb5',
  '#7d5cff',
  '#2e86de',
  '#1abc9c'
]
const CLOTHES = [
  '#2d3436',
  '#636e72',
  '#f5f6fa',
  '#e17055',
  '#ff6a1a',
  '#fdcb6e',
  '#00b894',
  '#0984e3',
  '#6c5ce7',
  '#d63031',
  '#e84393',
  '#1e3799'
]
const EYE = '#161616'
const WHITE = '#ffffff'
const MOUTH = '#6b1f2a'
const BLUSH = '#ff8fa3'
const GOLD = '#f6c945'

// FNV-1a: account ID → 32-bit seed
function hash(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

// mulberry32: small, fast, well-mixed
function generator(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Lighter (amount > 0) or darker (< 0) version of a #rrggbb color
function shade(color: string, amount: number): string {
  const n = parseInt(color.slice(1), 16)
  const channel = (shift: number): string => {
    const c = (n >> shift) & 0xff
    const next = amount < 0 ? c * (1 + amount) : c + (255 - c) * amount
    return Math.round(next).toString(16).padStart(2, '0')
  }
  return `#${channel(16)}${channel(8)}${channel(0)}`
}

class Canvas {
  grid: string[][]

  constructor(background: string) {
    this.grid = Array.from({ length: AVATAR_SIZE }, () => Array(AVATAR_SIZE).fill(background))
  }

  set(x: number, y: number, color: string): void {
    if (x >= 0 && y >= 0 && x < AVATAR_SIZE && y < AVATAR_SIZE) this.grid[y][x] = color
  }

  rect(x: number, y: number, w: number, h: number, color: string): void {
    for (let row = y; row < y + h; row++)
      for (let col = x; col < x + w; col++) this.set(col, row, color)
  }

  // Also drawn mirrored across the vertical center line
  mset(x: number, y: number, color: string): void {
    this.set(x, y, color)
    this.set(AVATAR_SIZE - 1 - x, y, color)
  }

  mrect(x: number, y: number, w: number, h: number, color: string): void {
    this.rect(x, y, w, h, color)
    this.rect(AVATAR_SIZE - x - w, y, w, h, color)
  }

  // Recolors only the pixels that are `only` right now (e.g. a beard over skin)
  paint(x: number, y: number, w: number, h: number, color: string, only: string): void {
    for (let row = y; row < y + h; row++)
      for (let col = x; col < x + w; col++)
        if (this.grid[row]?.[col] === only) this.set(col, row, color)
  }
}

export function generateAvatar(seed: string): Avatar {
  const random = generator(hash(seed))
  // Warm up so similar names (alice1, alice2) diverge right away
  for (let i = 0; i < 4; i++) random()
  const pick = <T>(list: T[]): T => list[Math.floor(random() * list.length)]
  const chance = (p: number): boolean => random() < p

  const background = pick(BACKGROUNDS)
  const skin = chance(0.06) ? pick(ODD_SKINS) : pick(SKINS)
  const skinShadow = shade(skin, -0.18)
  const hair = pick(HAIR)
  let clothes = pick(CLOTHES)
  if (clothes === background) clothes = shade(clothes, -0.35)
  const headShape = pick(['round', 'square', 'long'] as const)
  const hairStyle = pick([
    'short',
    'short',
    'fringe',
    'spiky',
    'long',
    'long',
    'bun',
    'mohawk',
    'bald',
    'afro',
    'cap',
    'beanie',
    'side'
  ] as const)
  const eyes = pick(['dot', 'dot', 'tall', 'white', 'sleepy', 'big', 'wink'] as const)
  const mouth = pick(['smile', 'smile', 'flat', 'open', 'smirk', 'grin', 'tongue'] as const)
  const facialHair = chance(0.16) ? pick(['beard', 'mustache', 'stubble'] as const) : null
  const eyewear = chance(0.22) ? pick(['glasses', 'glasses', 'shades'] as const) : null
  const headphones =
    hairStyle !== 'afro' && hairStyle !== 'beanie' && hairStyle !== 'cap' && chance(0.12)
  const collar = pick(['crew', 'vneck', 'hoodie', 'shirt'] as const)

  const canvas = new Canvas(background)
  const longHair = hairStyle === 'long'

  // Behind the head: long hair and afros
  if (longHair) {
    canvas.rect(3, 4, 10, 9, hair)
    canvas.rect(4, 3, 8, 1, hair)
  }
  if (hairStyle === 'afro') {
    canvas.rect(3, 1, 10, 9, hair)
    canvas.rect(2, 2, 12, 7, hair)
    canvas.rect(4, 0, 8, 1, hair)
  }

  // Shoulders and neck
  canvas.rect(3, 13, 10, 1, clothes)
  canvas.rect(2, 14, 12, 2, clothes)
  canvas.rect(6, 12, 4, 1, skinShadow)
  if (collar === 'vneck') {
    canvas.rect(6, 13, 4, 1, skinShadow)
    canvas.rect(7, 14, 2, 1, skinShadow)
  } else if (collar === 'crew') {
    canvas.rect(5, 13, 6, 1, shade(clothes, -0.25))
    canvas.rect(6, 13, 4, 1, skinShadow)
  } else if (collar === 'hoodie') {
    canvas.rect(4, 13, 8, 1, shade(clothes, -0.25))
    canvas.rect(6, 13, 4, 1, skinShadow)
    canvas.mset(6, 14, WHITE)
    canvas.mset(6, 15, WHITE)
  } else {
    canvas.rect(6, 13, 4, 1, skinShadow)
    canvas.mrect(5, 13, 1, 1, WHITE)
    canvas.mrect(6, 14, 1, 1, WHITE)
    if (chance(0.5)) canvas.rect(7, 14, 2, 2, pick(CLOTHES))
  }

  // Ears, unless long hair covers them
  if (!longHair) canvas.mrect(3, 7, 1, 2, skin)

  // Head
  const top = headShape === 'long' ? 3 : 4
  canvas.rect(4, top + 1, 8, 11 - top - 1, skin)
  canvas.rect(5, top, 6, 1, skin)
  if (headShape === 'square') canvas.rect(4, 11, 8, 1, skin)
  else canvas.rect(5, 11, 6, 1, skin)
  if (headShape === 'square') {
    canvas.rect(4, top, 8, 1, skin)
    canvas.set(4, 11, background)
    canvas.set(11, 11, background)
  }
  // Shadow under the chin
  if (headShape !== 'square') canvas.mset(4, 10, skinShadow)

  // Brows, before the hair so a fringe can cover them
  // (bald heads get natural brows, not the color of hair they don't have)
  const brows = hairStyle === 'bald' ? shade(skin, -0.45) : shade(hair, -0.2)
  if (chance(0.45)) canvas.mrect(5, 5, 2, 1, brows)

  // Eyes
  switch (eyes) {
    case 'dot':
      canvas.mset(6, 7, EYE)
      break
    case 'tall':
      canvas.mrect(6, 6, 1, 2, EYE)
      break
    case 'white':
      canvas.mrect(5, 7, 2, 1, WHITE)
      canvas.set(6, 7, EYE)
      canvas.set(10, 7, EYE)
      break
    case 'sleepy':
      canvas.mrect(5, 7, 2, 1, EYE)
      break
    case 'big':
      canvas.mrect(5, 6, 2, 2, EYE)
      canvas.mset(5, 6, WHITE)
      break
    case 'wink':
      canvas.set(6, 7, EYE)
      canvas.rect(9, 7, 2, 1, EYE)
      break
  }

  // Nose and cheeks
  if (chance(0.6)) canvas.set(chance(0.5) ? 7 : 8, 9, skinShadow)
  if (chance(0.25) && facialHair !== 'beard') canvas.mset(5, 9, BLUSH)
  else if (chance(0.12)) {
    canvas.mset(5, 8, skinShadow)
    canvas.set(6, 9, skinShadow)
  }

  // Facial hair, then the mouth on top
  if (facialHair === 'beard') canvas.paint(4, 9, 8, 3, hair, skin)
  if (facialHair === 'stubble') {
    for (let x = 5; x <= 10; x++) if ((x + 11) % 2 === 0) canvas.set(x, 11, shade(skin, -0.35))
    canvas.mset(4, 10, shade(skin, -0.35))
  }
  switch (mouth) {
    case 'smile':
      canvas.rect(7, 10, 2, 1, MOUTH)
      canvas.mset(6, 9, MOUTH)
      break
    case 'flat':
      canvas.rect(7, 10, 2, 1, MOUTH)
      break
    case 'open':
      canvas.rect(7, 10, 2, 1, MOUTH)
      canvas.rect(7, 11, 2, 1, shade(MOUTH, 0.25))
      break
    case 'smirk':
      canvas.rect(7, 10, 3, 1, MOUTH)
      canvas.set(10, 9, MOUTH)
      break
    case 'grin':
      canvas.rect(6, 10, 4, 1, MOUTH)
      canvas.rect(7, 10, 2, 1, WHITE)
      break
    case 'tongue':
      canvas.rect(7, 10, 2, 1, MOUTH)
      canvas.set(8, 11, '#ff6b81')
      break
  }
  if (facialHair === 'mustache') canvas.rect(6, 9, 4, 1, hair)

  // Hair in front
  switch (hairStyle) {
    case 'short':
      canvas.rect(5, top - 1, 6, 1, hair)
      canvas.rect(4, top, 8, 1, hair)
      canvas.mrect(4, top + 1, 1, 2, hair)
      break
    case 'fringe':
      canvas.rect(5, top - 1, 6, 1, hair)
      canvas.rect(4, top, 8, 2, hair)
      canvas.rect(4, top + 2, 1, 2, hair)
      canvas.rect(11, top + 2, 1, 1, hair)
      canvas.set(10, top + 1, skin)
      break
    case 'side':
      canvas.rect(5, top - 1, 6, 1, hair)
      canvas.rect(4, top, 8, 1, hair)
      canvas.rect(4, top + 1, 4, 1, hair)
      canvas.mrect(4, top + 1, 1, 2, hair)
      break
    case 'spiky':
      canvas.rect(4, top - 1, 8, 2, hair)
      for (let x = 4; x <= 11; x++) {
        if (chance(0.55)) canvas.set(x, top - 2, hair)
        if (chance(0.25)) canvas.set(x, top - 3, hair)
      }
      canvas.mrect(4, top + 1, 1, 1, hair)
      break
    case 'long':
      canvas.rect(5, top - 1, 6, 1, hair)
      canvas.rect(4, top, 8, 1, hair)
      canvas.rect(4, top + 1, 3, 1, hair)
      break
    case 'bun':
      canvas.rect(6, top - 3, 4, 2, hair)
      canvas.rect(5, top - 1, 6, 1, hair)
      canvas.rect(4, top, 8, 1, hair)
      canvas.mrect(4, top + 1, 1, 2, hair)
      break
    case 'mohawk':
      canvas.rect(7, top - 3, 2, 4, hair)
      canvas.rect(5, top, 2, 1, skinShadow)
      canvas.rect(9, top, 2, 1, skinShadow)
      break
    case 'bald':
      // A shine on top, clear of the brows
      canvas.set(9, top, shade(skin, 0.4))
      break
    case 'afro':
      canvas.rect(4, top - 1, 8, 2, hair)
      canvas.mrect(3, top + 1, 1, 3, hair)
      break
    case 'cap': {
      const cap = pick(CLOTHES)
      canvas.rect(5, top - 2, 6, 1, cap)
      canvas.rect(4, top - 1, 8, 2, cap)
      canvas.rect(3, top + 1, 10, 1, shade(cap, -0.3))
      canvas.set(7, top - 1, shade(cap, 0.35))
      break
    }
    case 'beanie': {
      const hat = pick(CLOTHES)
      canvas.rect(7, top - 4, 2, 1, WHITE)
      canvas.rect(5, top - 3, 6, 1, hat)
      canvas.rect(4, top - 2, 8, 2, hat)
      canvas.rect(4, top, 8, 1, shade(hat, -0.25))
      for (let x = 5; x <= 10; x += 2) canvas.set(x, top - 2, shade(hat, -0.15))
      break
    }
  }

  // Glasses and headphones go over everything
  if (eyewear === 'glasses') {
    const frame = pick(['#161616', '#5a3825', GOLD, '#c0392b'])
    canvas.mrect(5, 6, 2, 1, frame)
    canvas.mrect(5, 8, 2, 1, frame)
    canvas.mset(4, 7, frame)
    canvas.rect(7, 7, 2, 1, frame)
  } else if (eyewear === 'shades') {
    canvas.mrect(4, 7, 3, 2, EYE)
    canvas.rect(7, 7, 2, 1, EYE)
    canvas.mset(5, 7, '#4a4a4a')
  }
  if (headphones) {
    const band = pick(['#2d3436', '#f5f6fa', '#ff6a1a', '#6c5ce7'])
    canvas.rect(5, top - 2, 6, 1, band)
    canvas.mset(4, top - 1, band)
    canvas.mrect(2, 6, 2, 3, band)
    canvas.mset(2, 7, shade(band, -0.3))
  }
  if (!headphones && !longHair && chance(0.1)) canvas.set(3, 9, GOLD)

  // Index the colors
  const palette: string[] = [background]
  const pixels = canvas.grid.map((row) =>
    row.map((color) => {
      const index = palette.indexOf(color)
      if (index >= 0) return index
      palette.push(color)
      return palette.length - 1
    })
  )
  return { palette, pixels }
}

// The seed for an account: its ID, plus the variant number when the user shuffled it
export const avatarSeed = (accountId: string, variant = 0): string =>
  variant ? `${accountId}#${variant}` : accountId
