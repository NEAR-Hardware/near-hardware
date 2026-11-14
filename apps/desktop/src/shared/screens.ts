// A board's display, as the screen preview draws it. Sizes are in panel pixels.
export type ScreenSpec = {
  width: number
  height: number
  // rounded: rectangle with rounded corners (most watch panels); circle: round panel
  shape: 'rect' | 'rounded' | 'circle'
  cornerRadius?: number
  // Diagonal in inches, e.g. 2.06
  diagonal?: number
  // Panel technology, e.g. AMOLED, IPS LCD, OLED, e-paper
  panel?: string
  // Display controller, e.g. CO5300
  controller?: string
}

export type ScreenPreset = { id: string; label: string; spec: ScreenSpec }

// Common hobby displays, for boards whose screen the agent hasn't recorded yet
export const SCREEN_PRESETS: ScreenPreset[] = [
  {
    id: 'rounded-410x502',
    label: '2.06″ AMOLED 410×502, rounded (CO5300)',
    spec: {
      width: 410,
      height: 502,
      shape: 'rounded',
      cornerRadius: 96,
      diagonal: 2.06,
      panel: 'AMOLED',
      controller: 'CO5300'
    }
  },
  {
    id: 'rounded-240x280',
    label: '1.69″ IPS 240×280, rounded (ST7789)',
    spec: {
      width: 240,
      height: 280,
      shape: 'rounded',
      cornerRadius: 40,
      diagonal: 1.69,
      panel: 'IPS LCD',
      controller: 'ST7789'
    }
  },
  {
    id: 'rounded-172x320',
    label: '1.47″ IPS 172×320, rounded (ST7789)',
    spec: {
      width: 172,
      height: 320,
      shape: 'rounded',
      cornerRadius: 22,
      diagonal: 1.47,
      panel: 'IPS LCD',
      controller: 'ST7789'
    }
  },
  {
    id: 'circle-240',
    label: '1.28″ IPS 240×240, round (GC9A01)',
    spec: {
      width: 240,
      height: 240,
      shape: 'circle',
      diagonal: 1.28,
      panel: 'IPS LCD',
      controller: 'GC9A01'
    }
  },
  {
    id: 'circle-466',
    label: '1.43″ AMOLED 466×466, round (CO5300)',
    spec: {
      width: 466,
      height: 466,
      shape: 'circle',
      diagonal: 1.43,
      panel: 'AMOLED',
      controller: 'CO5300'
    }
  },
  {
    id: 'rect-240x240',
    label: '1.54″ IPS 240×240 (ST7789)',
    spec: {
      width: 240,
      height: 240,
      shape: 'rect',
      diagonal: 1.54,
      panel: 'IPS LCD',
      controller: 'ST7789'
    }
  },
  {
    id: 'rect-320x240',
    label: '2.8″ TFT 320×240 (ILI9341)',
    spec: {
      width: 320,
      height: 240,
      shape: 'rect',
      diagonal: 2.8,
      panel: 'TFT LCD',
      controller: 'ILI9341'
    }
  },
  {
    id: 'rect-480x320',
    label: '3.5″ TFT 480×320 (ILI9488)',
    spec: {
      width: 480,
      height: 320,
      shape: 'rect',
      diagonal: 3.5,
      panel: 'TFT LCD',
      controller: 'ILI9488'
    }
  },
  {
    id: 'rect-800x480',
    label: '4.3″ RGB LCD 800×480',
    spec: { width: 800, height: 480, shape: 'rect', diagonal: 4.3, panel: 'IPS LCD' }
  },
  {
    id: 'rect-128x64',
    label: '0.96″ OLED 128×64 (SSD1306)',
    spec: {
      width: 128,
      height: 64,
      shape: 'rect',
      diagonal: 0.96,
      panel: 'OLED',
      controller: 'SSD1306'
    }
  },
  {
    id: 'rect-250x122',
    label: '2.13″ e-paper 250×122',
    spec: { width: 250, height: 122, shape: 'rect', diagonal: 2.13, panel: 'e-paper' }
  }
]

// Short line under the device, e.g. "410 × 502 · 2.06″ AMOLED"
export function describeScreen(spec: ScreenSpec): string {
  const size = spec.diagonal ? ` · ${spec.diagonal}″` : ''
  const panel = spec.panel ? `${size ? ' ' : ' · '}${spec.panel}` : ''
  return `${spec.width} × ${spec.height}${size}${panel}`
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

const text = (value: unknown, max: number): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined

// Validates a spec from an agent or the settings file; null means "no screen"
export function sanitizeScreenSpec(value: unknown): ScreenSpec | null | undefined {
  if (value === null) return null
  if (!value || typeof value !== 'object') return undefined
  const raw = value as Record<string, unknown>
  const width = Number(raw.width)
  const height = Number(raw.height)
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 8 || height < 8) {
    return undefined
  }
  const spec: ScreenSpec = {
    width: Math.round(clamp(width, 8, 4096)),
    height: Math.round(clamp(height, 8, 4096)),
    shape: raw.shape === 'circle' || raw.shape === 'rounded' ? raw.shape : 'rect'
  }
  const radius = Number(raw.cornerRadius)
  if (spec.shape === 'rounded' && Number.isFinite(radius) && radius > 0) {
    spec.cornerRadius = Math.round(clamp(radius, 1, Math.min(spec.width, spec.height) / 2))
  }
  const diagonal = Number(raw.diagonal)
  if (Number.isFinite(diagonal) && diagonal > 0) spec.diagonal = clamp(diagonal, 0.3, 40)
  const panel = text(raw.panel, 24)
  if (panel) spec.panel = panel
  const controller = text(raw.controller, 24)
  if (controller) spec.controller = controller
  return spec
}

// Transparent margin around a floating device, room for its drop shadow (CSS px).
// macOS's own window shadow would follow the window's rectangle, not the device.
export const FLOATING_PADDING = 16

// Shell around the panel, in panel pixels: thick enough to read as the plastic
// case of a watch or module, proportional so it scales with the screen
export function deviceGeometry(spec: ScreenSpec): {
  bezel: number
  screenRadius: number
  outerWidth: number
  outerHeight: number
  outerRadius: number
} {
  const short = Math.min(spec.width, spec.height)
  const bezel = Math.max(6, Math.round(short * 0.075))
  const screenRadius =
    spec.shape === 'circle'
      ? short / 2
      : spec.shape === 'rounded'
        ? (spec.cornerRadius ?? Math.round(short * 0.12))
        : 0
  const outerWidth = spec.width + bezel * 2
  const outerHeight = spec.height + bezel * 2
  // Square panels still sit in a softly rounded case
  const outerRadius =
    spec.shape === 'circle' ? Math.min(outerWidth, outerHeight) / 2 : screenRadius + bezel * 0.9
  return { bezel, screenRadius, outerWidth, outerHeight, outerRadius }
}
