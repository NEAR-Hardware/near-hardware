// wiring.json: the board's pins plus the parts wired to them. Agents write it
// (rules in resources/hardware-agent.md); the Wiring view draws it.

export const WIRING_FILE = 'wiring.json'

export type PinKind = 'power' | 'ground' | 'gpio' | 'analog' | 'i2c' | 'spi' | 'uart' | 'other'
export type WireKind = 'power' | 'ground' | 'signal' | 'data' | 'mains'

export type BoardPin = {
  id: string
  label: string
  kind: PinKind
  functions: string[]
  // Taken by something on the board itself, e.g. "display" or "PSRAM"
  used?: string
  note?: string
}

export type Header = { id: string; side: 'left' | 'right'; label?: string; pins: BoardPin[] }

export type Part = {
  id: string
  name: string
  kind?: string
  pins: { id: string; label: string }[]
  note?: string
}

// "board" or a part id, plus a pin id
export type Endpoint = { part: string; pin: string }

export type Wire = {
  from: Endpoint
  to: Endpoint
  kind: WireKind
  label?: string
  color?: string
}

export type Wiring = {
  board: { name?: string; headers: Header[]; onboard: { name: string; pins: string[] }[] }
  parts: Part[]
  wires: Wire[]
  notes: string[]
}

export const BOARD = 'board'

const PIN_KINDS: PinKind[] = ['power', 'ground', 'gpio', 'analog', 'i2c', 'spi', 'uart', 'other']
const WIRE_KINDS: WireKind[] = ['power', 'ground', 'signal', 'data', 'mains']

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

// Power and ground pins are recognisable by name when the agent leaves out the kind
function inferPinKind(label: string): PinKind {
  if (/^(gnd|ground|vss)\b/i.test(label)) return 'ground'
  if (/^(3v3|3\.3v|5v|vin|vbus|vbat|vcc|vdd|bat)\b/i.test(label)) return 'power'
  return 'gpio'
}

function parseEndpoint(value: unknown): Endpoint | undefined {
  const raw = text(value)
  const dot = raw?.indexOf('.') ?? -1
  if (!raw || dot <= 0 || dot === raw.length - 1) return undefined
  return { part: raw.slice(0, dot), pin: raw.slice(dot + 1) }
}

export type ParsedWiring = { wiring?: Wiring; error?: string; problems: string[] }

// Tolerant parse: keeps everything usable and lists what it had to drop
export function parseWiring(source: string): ParsedWiring {
  let raw: unknown
  try {
    raw = JSON.parse(source)
  } catch (error) {
    return { error: `wiring.json isn’t valid JSON: ${(error as Error).message}`, problems: [] }
  }
  if (!isObject(raw)) return { error: 'wiring.json should be a JSON object', problems: [] }
  const problems: string[] = []

  const board = isObject(raw.board) ? raw.board : {}
  const headers: Header[] = list(board.headers)
    .filter(isObject)
    .map((header, h) => ({
      id: text(header.id) ?? `header${h + 1}`,
      side: header.side === 'right' ? ('right' as const) : ('left' as const),
      label: text(header.label),
      pins: list(header.pins)
        .filter(isObject)
        .flatMap((pin): BoardPin[] => {
          const id = text(pin.id) ?? text(pin.label)
          if (!id) return []
          const label = text(pin.label) ?? id
          const kind = PIN_KINDS.includes(pin.kind as PinKind)
            ? (pin.kind as PinKind)
            : inferPinKind(label)
          return [
            {
              id,
              label,
              kind,
              functions: list(pin.functions).flatMap((f) => text(f) ?? []),
              used: text(pin.used),
              note: text(pin.note)
            }
          ]
        })
    }))
  const onboard = list(board.onboard)
    .filter(isObject)
    .flatMap((item) => {
      const name = text(item.name)
      return name ? [{ name, pins: list(item.pins).flatMap((p) => text(p) ?? []) }] : []
    })

  const parts: Part[] = list(raw.parts ?? raw.components)
    .filter(isObject)
    .flatMap((part): Part[] => {
      const id = text(part.id)
      if (!id || id === BOARD) return []
      return [
        {
          id,
          name: text(part.name) ?? id,
          kind: text(part.kind),
          note: text(part.note),
          pins: list(part.pins).flatMap((pin) => {
            if (typeof pin === 'string')
              return text(pin) ? [{ id: pin.trim(), label: pin.trim() }] : []
            if (!isObject(pin)) return []
            const pinId = text(pin.id) ?? text(pin.label)
            return pinId ? [{ id: pinId, label: text(pin.label) ?? pinId }] : []
          })
        }
      ]
    })

  const boardPins = new Map(headers.flatMap((h) => h.pins.map((p) => [p.id, p] as const)))
  const partPins = new Map(parts.map((p) => [p.id, new Set(p.pins.map((pin) => pin.id))]))
  const exists = (end: Endpoint): boolean =>
    end.part === BOARD ? boardPins.has(end.pin) : !!partPins.get(end.part)?.has(end.pin)

  const wires: Wire[] = list(raw.wires)
    .filter(isObject)
    .flatMap((wire): Wire[] => {
      const from = parseEndpoint(wire.from)
      const to = parseEndpoint(wire.to)
      if (!from || !to || !exists(from) || !exists(to)) {
        problems.push(
          `Skipped a wire from “${String(wire.from)}” to “${String(wire.to)}”: unknown pin`
        )
        return []
      }
      // Without a kind, a wire takes it from the board pin it lands on
      const boardPin = boardPins.get(
        from.part === BOARD ? from.pin : to.part === BOARD ? to.pin : ''
      )
      const kind = WIRE_KINDS.includes(wire.kind as WireKind)
        ? (wire.kind as WireKind)
        : boardPin?.kind === 'power' || boardPin?.kind === 'ground'
          ? boardPin.kind
          : 'signal'
      return [{ from, to, kind, label: text(wire.label), color: text(wire.color) }]
    })

  return {
    wiring: {
      board: { name: text(board.name), headers, onboard },
      parts,
      wires,
      notes: list(raw.notes).flatMap((note) => text(note) ?? [])
    },
    problems
  }
}
