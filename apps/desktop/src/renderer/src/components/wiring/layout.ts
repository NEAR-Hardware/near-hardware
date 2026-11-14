import { BOARD, type BoardPin, type Endpoint, type Part, type Wire, type Wiring } from './model'

// Diagram units are CSS pixels at 100% zoom
const ROW = 24
const MIN_BOARD_W = 236
// Text inside the board: 11 px monospace pin labels, 9 px detail notes
const LABEL_CHAR = 6.7
const DETAIL_CHAR = 5.1
export const DETAIL_CHARS = 18
const EDGE = 14
const TEXT_GAP = 12
const MIDDLE = 24
const BOARD_HEAD = 54
const BOARD_FOOT = 20
const HEADER_GAP = 16
const STUB = 16
const PART_W = 176
const PART_HEAD = 40
const PART_ROW = 22
const PART_FOOT = 10
const PART_GAP = 18
const INNER_GAP = 150
const OUTER_GAP = 110

type Side = 'left' | 'right'
export type Point = { x: number; y: number }
// dir: which way a wire leaves the anchor (+1 right, -1 left)
export type Anchor = Point & { dir: 1 | -1 }

export type PlacedPin = BoardPin & { y: number; side: Side; anchor: Anchor }

export type BoardShape = {
  w: number
  h: number
  // Relative to the board's top-left corner
  pins: PlacedPin[]
  labels: { text: string; side: Side; y: number }[]
  // Where each side's detail notes start, so they never run into the labels
  detailX: Record<Side, number>
  // Characters that fit in a header label or the board title
  headerChars: number
  titleChars: number
}

export type PartShape = Part & { w: number; h: number; side: Side }

// Where things go before the user moves anything, with the board at 0,0
export type BaseLayout = {
  board: BoardShape
  parts: PartShape[]
  defaults: Map<string, Point>
}

// Positions the user dragged things to; anything missing uses the default
export type Positions = { board?: Point; parts: Record<string, Point> }

export type ScenePart = PartShape & Point & { anchors: Map<string, Anchor> }
export type SceneWire = Wire & { key: string; path: string; color: string; ends: string[] }

export type Scene = {
  board: BoardShape & Point
  parts: ScenePart[]
  wires: SceneWire[]
  // Colours of the wires on each board pin, for the dots beside its pad
  pinColors: Map<string, string[]>
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
}

const SIGNAL_COLORS = ['#22d3ee', '#a78bfa', '#facc15', '#34d399', '#f472b6', '#60a5fa', '#fb923c']
const KIND_COLORS = { power: '#f87171', ground: '#94a3b8', mains: '#fb923c' }

export const endKey = (end: Endpoint): string => `${end.part}.${end.pin}`

// The small note beside a pin: what uses it, or its first alternate functions
export const pinDetail = (pin: BoardPin): string =>
  pin.used ? `used: ${pin.used}` : pin.functions.slice(0, 2).join(' · ')

const partPinY = (index: number): number => PART_HEAD + index * PART_ROW + PART_ROW / 2

export function layoutWiring(wiring: Wiring): BaseLayout {
  // The board grows to fit its longest pin names and notes on both sides
  const widest = (side: Side, measure: (pin: BoardPin) => number): number =>
    Math.max(
      0,
      ...wiring.board.headers.filter((h) => h.side === side).flatMap((h) => h.pins.map(measure))
    )
  const labelW = (side: Side): number => widest(side, (pin) => pin.label.length * LABEL_CHAR)
  const detailW = (side: Side): number =>
    widest(side, (pin) => Math.min(DETAIL_CHARS, pinDetail(pin).length) * DETAIL_CHAR)
  const sideW = (side: Side): number =>
    labelW(side) + (detailW(side) ? TEXT_GAP + detailW(side) : 0)
  const boardW = Math.max(
    MIN_BOARD_W,
    Math.round(EDGE * 2 + sideW('left') + MIDDLE + sideW('right'))
  )

  // Board pins, header by header down each side
  const pins: PlacedPin[] = []
  const labels: BoardShape['labels'] = []
  const cursor: Record<Side, number> = { left: BOARD_HEAD, right: BOARD_HEAD }
  for (const header of wiring.board.headers) {
    const side = header.side
    if (cursor[side] > BOARD_HEAD) cursor[side] += HEADER_GAP
    if (header.label) {
      labels.push({ text: header.label, side, y: cursor[side] + 8 })
      cursor[side] += 18
    }
    for (const pin of header.pins) {
      const y = cursor[side] + ROW / 2
      const anchor: Anchor =
        side === 'left' ? { x: -STUB, y, dir: -1 } : { x: boardW + STUB, y, dir: 1 }
      pins.push({ ...pin, y, side, anchor })
      cursor[side] += ROW
    }
  }
  const boardH = Math.max(140, Math.max(cursor.left, cursor.right) + BOARD_FOOT)
  const boardPins = new Map(pins.map((pin) => [pin.id, pin]))

  // Default spots: parts wired to the board sit beside it on the side most of
  // their wires land; parts wired only to other parts one column further out
  const neighbours = new Map<string, Set<string>>()
  const boardSides = new Map<string, Record<Side, number>>()
  for (const wire of wiring.wires) {
    for (const [a, b] of [
      [wire.from, wire.to],
      [wire.to, wire.from]
    ]) {
      if (a.part === BOARD) continue
      if (b.part === BOARD) {
        const counts = boardSides.get(a.part) ?? { left: 0, right: 0 }
        const pin = boardPins.get(b.pin)
        if (pin) counts[pin.side]++
        boardSides.set(a.part, counts)
      } else {
        if (!neighbours.has(a.part)) neighbours.set(a.part, new Set())
        neighbours.get(a.part)!.add(b.part)
      }
    }
  }
  const placement = new Map<string, { side: Side; level: number }>()
  const sideCount: Record<Side, number> = { left: 0, right: 0 }
  const lighterSide = (): Side => (sideCount.left <= sideCount.right ? 'left' : 'right')
  for (const part of wiring.parts) {
    const counts = boardSides.get(part.id)
    if (!counts) continue
    const side: Side =
      counts.left > counts.right ? 'left' : counts.right > counts.left ? 'right' : lighterSide()
    placement.set(part.id, { side, level: 1 })
    sideCount[side]++
  }
  let frontier = [...placement.keys()]
  while (frontier.length) {
    const next: string[] = []
    for (const id of frontier) {
      const from = placement.get(id)!
      for (const other of neighbours.get(id) ?? []) {
        if (placement.has(other)) continue
        placement.set(other, { side: from.side, level: Math.min(2, from.level + 1) })
        next.push(other)
      }
    }
    frontier = next
  }
  for (const part of wiring.parts) {
    if (placement.has(part.id)) continue
    const side = lighterSide()
    placement.set(part.id, { side, level: 1 })
    sideCount[side]++
  }

  const columnX = (side: Side, level: number): number =>
    side === 'right'
      ? boardW + INNER_GAP + (level - 1) * (PART_W + OUTER_GAP)
      : -INNER_GAP - PART_W - (level - 1) * (PART_W + OUTER_GAP)

  // Stack each column, ordering parts by the height of what they connect to
  const parts: PartShape[] = []
  const defaults = new Map<string, Point>()
  for (const level of [1, 2]) {
    for (const side of ['left', 'right'] as Side[]) {
      const column = wiring.parts.filter((part) => {
        const where = placement.get(part.id)!
        return where.side === side && where.level === level
      })
      const target = (part: Part): number => {
        const ys: number[] = []
        for (const wire of wiring.wires) {
          for (const [a, b] of [
            [wire.from, wire.to],
            [wire.to, wire.from]
          ]) {
            if (a.part !== part.id) continue
            if (b.part === BOARD) {
              const pin = boardPins.get(b.pin)
              if (pin) ys.push(pin.y)
            } else {
              const other = defaults.get(b.part)
              const shape = parts.find((p) => p.id === b.part)
              if (other && shape) ys.push(other.y + shape.h / 2)
            }
          }
        }
        return ys.length ? ys.reduce((sum, y) => sum + y, 0) / ys.length : boardH / 2
      }
      const ordered = column
        .map((part) => ({ part, target: target(part) }))
        .sort((a, b) => a.target - b.target)
      let bottom = -Infinity
      for (const { part, target: wanted } of ordered) {
        const h = PART_HEAD + part.pins.length * PART_ROW + PART_FOOT
        const y = Math.max(wanted - h / 2, bottom + PART_GAP)
        bottom = y + h
        parts.push({ ...part, w: PART_W, h, side })
        defaults.set(part.id, { x: columnX(side, level), y })
      }
    }
  }

  return {
    board: {
      w: boardW,
      h: boardH,
      pins,
      labels,
      detailX: {
        left: EDGE + labelW('left') + TEXT_GAP,
        right: boardW - EDGE - labelW('right') - TEXT_GAP
      },
      headerChars: Math.floor((boardW / 2 - EDGE - 6) / 7),
      titleChars: Math.floor((boardW - 24) / 7.4)
    },
    parts,
    defaults
  }
}

// Places everything where the user left it and routes the wires between them.
// A part the user never moved keeps its default spot relative to the board.
export function buildScene(wiring: Wiring, base: BaseLayout, positions: Positions): Scene {
  const boardAt = positions.board ?? { x: 0, y: 0 }
  const board = { ...base.board, ...boardAt }
  const boardPins = new Map(base.board.pins.map((pin) => [pin.id, pin]))

  const parts: ScenePart[] = base.parts.map((part) => {
    const fallback = base.defaults.get(part.id) ?? { x: 0, y: 0 }
    const at = positions.parts[part.id] ?? {
      x: fallback.x + boardAt.x,
      y: fallback.y + boardAt.y
    }
    return { ...part, ...at, anchors: new Map() }
  })
  const byId = new Map(parts.map((part) => [part.id, part]))
  const center = (end: Endpoint): Point | undefined => {
    if (end.part === BOARD) {
      const pin = boardPins.get(end.pin)
      return pin && { x: board.x + pin.anchor.x, y: board.y + pin.anchor.y }
    }
    const part = byId.get(end.part)
    return part && { x: part.x + part.w / 2, y: part.y + part.h / 2 }
  }

  // Each part pin faces whatever it's wired to, so dragging a part to the
  // other side of the board flips its pins
  for (const part of parts) {
    const middle = part.x + part.w / 2
    part.pins.forEach((pin, i) => {
      const partners = wiring.wires.flatMap((wire) =>
        wire.from.part === part.id && wire.from.pin === pin.id
          ? [wire.to]
          : wire.to.part === part.id && wire.to.pin === pin.id
            ? [wire.from]
            : []
      )
      const targets = partners.flatMap((end) => center(end) ?? [])
      const towardX = targets.length
        ? targets.reduce((sum, p) => sum + p.x, 0) / targets.length
        : board.x + board.w / 2
      const y = part.y + partPinY(i)
      part.anchors.set(
        pin.id,
        towardX >= middle ? { x: part.x + part.w + 8, y, dir: 1 } : { x: part.x - 8, y, dir: -1 }
      )
    })
  }

  const anchorOf = (end: Endpoint): Anchor | undefined => {
    if (end.part === BOARD) {
      const pin = boardPins.get(end.pin)
      return pin && { x: board.x + pin.anchor.x, y: board.y + pin.anchor.y, dir: pin.anchor.dir }
    }
    return byId.get(end.part)?.anchors.get(end.pin)
  }

  let signal = 0
  const pinColors = new Map<string, string[]>()
  const wires: SceneWire[] = wiring.wires.flatMap((wire, i): SceneWire[] => {
    const a = anchorOf(wire.from)
    const b = anchorOf(wire.to)
    if (!a || !b) return []
    const color =
      wire.color ??
      (wire.kind === 'power' || wire.kind === 'ground' || wire.kind === 'mains'
        ? KIND_COLORS[wire.kind]
        : SIGNAL_COLORS[signal++ % SIGNAL_COLORS.length])
    for (const end of [wire.from, wire.to]) {
      if (end.part !== BOARD) continue
      pinColors.set(end.pin, [...(pinColors.get(end.pin) ?? []), color])
    }
    const reach = Math.max(40, Math.abs(b.x - a.x) * 0.45)
    const path = `M ${a.x} ${a.y} C ${a.x + a.dir * reach} ${a.y}, ${b.x + b.dir * reach} ${b.y}, ${b.x} ${b.y}`
    return [{ ...wire, key: `wire${i}`, path, color, ends: [endKey(wire.from), endKey(wire.to)] }]
  })

  const xs = [board.x - STUB - 40, board.x + board.w + STUB + 40]
  const ys = [board.y, board.y + board.h]
  for (const part of parts) {
    xs.push(part.x - 16, part.x + part.w + 16)
    ys.push(part.y, part.y + part.h)
  }
  return {
    board,
    parts,
    wires,
    pinColors,
    bounds: {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys)
    }
  }
}
