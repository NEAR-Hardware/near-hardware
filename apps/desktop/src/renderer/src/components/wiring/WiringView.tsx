import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  CircuitBoard,
  FileJson,
  LoaderCircle,
  Maximize,
  Minus,
  PanelBottomClose,
  PanelBottomOpen,
  Plus,
  RotateCcw,
  TriangleAlert
} from 'lucide-react'
import type { Project } from '../../../../shared/projects'
import {
  DETAIL_CHARS,
  buildScene,
  layoutWiring,
  pinDetail,
  type Point,
  type Positions
} from './layout'
import { BOARD, WIRING_FILE, parseWiring, type Endpoint, type Wiring } from './model'
import './Wiring.css'

// Fills the open chat's message box, like the screen preview's buttons
const compose = (text: string): void => {
  window.dispatchEvent(new CustomEvent('near-hardware:compose', { detail: text }))
}

const openWiringFile = (): void => {
  window.dispatchEvent(new CustomEvent('near-hardware:open-file', { detail: WIRING_FILE }))
}

const MAP_PINS_PROMPT = `Map this board’s pins into ${WIRING_FILE}, following “Pins and wiring” in the NEAR Hardware guide: every header pin with its GPIO number and functions, the power and ground pins, and which pins the board already uses for its own parts.`
const EXAMPLE_PROMPT =
  'I want to switch a lamp on and off from this board. Plan the parts and the wiring, and add them to wiring.json so I can check it before we write any code.'

const short = (text: string, max: number): string =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text

function describeEnd(wiring: Wiring, end: Endpoint): string {
  if (end.part === BOARD) {
    const pins = wiring.board.headers.flatMap((header) => header.pins)
    return pins.find((pin) => pin.id === end.pin)?.label ?? end.pin
  }
  const part = wiring.parts.find((p) => p.id === end.part)
  const pin = part?.pins.find((p) => p.id === end.pin)
  return `${part?.name ?? end.part} · ${pin?.label ?? end.pin}`
}

// Where the user moved the board and parts, per project, on this computer
const positionsKey = (projectId: string): string => `near-hardware.wiring-positions.${projectId}`

function loadPositions(projectId: string): Positions {
  try {
    const saved = JSON.parse(localStorage.getItem(positionsKey(projectId)) ?? 'null')
    if (saved && typeof saved.parts === 'object') return saved
  } catch {
    // Fall through
  }
  return { parts: {} }
}

function savePositions(projectId: string, positions: Positions): void {
  try {
    if (!positions.board && Object.keys(positions.parts).length === 0) {
      localStorage.removeItem(positionsKey(projectId))
    } else localStorage.setItem(positionsKey(projectId), JSON.stringify(positions))
  } catch {
    // Positions just reset next time
  }
}

// screen = world × k + (x, y)
type View = { x: number; y: number; k: number }
type Drag =
  | { kind: 'pan'; start: Point; origin: View }
  | { kind: 'move'; id: string; start: Point; origin: Point }

const MIN_ZOOM = 0.2
const MAX_ZOOM = 3
const FIT_PADDING = 48
const clampZoom = (k: number): number => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k))

// The board's pins and everything wired to them, drawn from wiring.json on a
// whiteboard: drag the board and parts around, pan and zoom the canvas
function WiringView({
  project,
  agentName
}: {
  project: Project
  agentName: string
}): React.JSX.Element {
  // undefined while loading, null when the project has no wiring.json yet
  const [source, setSource] = useState<string | null>()
  const [hover, setHover] = useState<string | null>(null)
  const [positions, setPositions] = useState(() => loadPositions(project.id))
  // null follows "fit to window" until the user pans or zooms
  const [view, setView] = useState<View | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [details, setDetails] = useState(true)
  const [canvas, setCanvas] = useState({ width: 0, height: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const gridId = `grid${useId().replace(/[^a-zA-Z0-9]/g, '')}`

  useEffect(() => {
    let cancelled = false
    const load = async (): Promise<void> => {
      try {
        const root = await window.api.files.list(project.id, '')
        if (!root.some((entry) => entry.path === WIRING_FILE)) {
          if (!cancelled) setSource(null)
          return
        }
        const file = await window.api.files.read(project.id, WIRING_FILE)
        if (!cancelled) setSource(file.kind === 'text' ? file.text : null)
      } catch {
        if (!cancelled) setSource(null)
      }
    }
    load()
    // Redraws as the agent edits the file
    const off = window.api.files.onChange((event) => {
      if (event.projectId === project.id && event.paths.includes(WIRING_FILE)) load()
    })
    return () => {
      cancelled = true
      off()
    }
  }, [project.id])

  useLayoutEffect(() => {
    const element = canvasRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) =>
      setCanvas({ width: entry.contentRect.width, height: entry.contentRect.height })
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [source])

  const parsed = useMemo(() => (source ? parseWiring(source) : undefined), [source])
  const wiring = parsed?.wiring
  const base = useMemo(() => (wiring ? layoutWiring(wiring) : undefined), [wiring])
  const scene = useMemo(
    () => (wiring && base ? buildScene(wiring, base, positions) : undefined),
    [wiring, base, positions]
  )

  const fitted = useMemo((): View => {
    if (!scene || !canvas.width) return { x: 0, y: 0, k: 1 }
    const { minX, minY, maxX, maxY } = scene.bounds
    const k = clampZoom(
      Math.min(
        (canvas.width - FIT_PADDING * 2) / (maxX - minX),
        (canvas.height - FIT_PADDING * 2) / (maxY - minY),
        1.25
      )
    )
    return {
      k,
      x: (canvas.width - (maxX - minX) * k) / 2 - minX * k,
      y: (canvas.height - (maxY - minY) * k) / 2 - minY * k
    }
  }, [canvas, scene])
  const shown = view ?? fitted

  // Zooms around a point on screen, keeping what's under it in place
  const zoomAt = (factor: number, cx: number, cy: number): void =>
    setView((current) => {
      const v = current ?? fitted
      const k = clampZoom(v.k * factor)
      return { k, x: cx - ((cx - v.x) / v.k) * k, y: cy - ((cy - v.y) / v.k) * k }
    })

  // Trackpad: two fingers pan, pinch (or ⌘/Ctrl + scroll) zooms. React's
  // wheel events are passive, so this one is attached by hand.
  const fittedRef = useRef(fitted)
  useEffect(() => {
    fittedRef.current = fitted
  }, [fitted])
  useEffect(() => {
    const element = canvasRef.current
    if (!element) return
    const onWheel = (event: WheelEvent): void => {
      event.preventDefault()
      const rect = element.getBoundingClientRect()
      if (event.ctrlKey || event.metaKey) {
        const factor = Math.exp(-event.deltaY * 0.01)
        const cx = event.clientX - rect.left
        const cy = event.clientY - rect.top
        setView((current) => {
          const v = current ?? fittedRef.current
          const k = clampZoom(v.k * factor)
          return { k, x: cx - ((cx - v.x) / v.k) * k, y: cy - ((cy - v.y) / v.k) * k }
        })
      } else {
        setView((current) => {
          const v = current ?? fittedRef.current
          return { ...v, x: v.x - event.deltaX, y: v.y - event.deltaY }
        })
      }
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [source])

  const startPan = (event: React.PointerEvent<SVGSVGElement>): void => {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setDrag({ kind: 'pan', start: { x: event.clientX, y: event.clientY }, origin: shown })
  }

  const startMove = (event: React.PointerEvent, id: string, origin: Point): void => {
    if (event.button !== 0) return
    event.stopPropagation()
    ;(event.currentTarget.closest('svg') as SVGSVGElement).setPointerCapture(event.pointerId)
    // Stop following "fit to window" so the view holds still while things move
    setView(shown)
    setDrag({ kind: 'move', id, start: { x: event.clientX, y: event.clientY }, origin })
  }

  const onPointerMove = (event: React.PointerEvent): void => {
    if (!drag) return
    const dx = event.clientX - drag.start.x
    const dy = event.clientY - drag.start.y
    if (drag.kind === 'pan') {
      setView({ ...drag.origin, x: drag.origin.x + dx, y: drag.origin.y + dy })
      return
    }
    const at = { x: drag.origin.x + dx / shown.k, y: drag.origin.y + dy / shown.k }
    setPositions((current) =>
      drag.id === BOARD
        ? { ...current, board: at }
        : { ...current, parts: { ...current.parts, [drag.id]: at } }
    )
  }

  const endDrag = (): void => {
    if (drag?.kind === 'move') savePositions(project.id, positions)
    setDrag(null)
  }

  const resetLayout = (): void => {
    const cleared = { parts: {} }
    setPositions(cleared)
    savePositions(project.id, cleared)
    setView(null)
  }

  if (source === undefined) {
    return (
      <div className="wiring-empty">
        <LoaderCircle size={18} className="spin" />
      </div>
    )
  }

  if (source === null || !wiring || !scene) {
    return (
      <div className="wiring-empty">
        <CircuitBoard size={28} strokeWidth={1.5} />
        <h2>{parsed?.error ? 'The wiring file has a problem' : 'No wiring yet'}</h2>
        <p>
          {parsed?.error ??
            `${agentName} maps the board’s pins into ${WIRING_FILE} during board setup. Plan a connection in the chat, like a relay for a lamp or a sensor, and the wiring shows up here.`}
        </p>
        <div className="wiring-empty-actions">
          {parsed?.error ? (
            <button className="btn small" onClick={openWiringFile}>
              <FileJson size={13} /> Open {WIRING_FILE}
            </button>
          ) : (
            <>
              <button className="btn small primary" onClick={() => compose(MAP_PINS_PROMPT)}>
                Map the board’s pins
              </button>
              <button className="btn small" onClick={() => compose(EXAMPLE_PROMPT)}>
                Plan a lamp connection
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  const { board, parts, wires, pinColors } = scene
  // A hovered wire, or every wire on a hovered pin, stays bright
  const lit = (ends: string[], key: string): boolean =>
    drag !== null || hover === null || hover === key || ends.includes(hover)
  const freeGpio = board.pins.filter(
    (pin) => pin.kind !== 'power' && pin.kind !== 'ground' && !pin.used
  )
  const moved = !!positions.board || Object.keys(positions.parts).length > 0
  const hasDetails = wiring.notes.length > 0 || wires.length > 0 || !!parsed?.problems.length
  const middle = (): [number, number] => [canvas.width / 2, canvas.height / 2]

  return (
    <div className="wiring-view">
      <div className="wiring-toolbar">
        <span className="wiring-summary">
          {board.pins.length} pins · {freeGpio.length} free · {parts.length}{' '}
          {parts.length === 1 ? 'part' : 'parts'} · {wires.length}{' '}
          {wires.length === 1 ? 'wire' : 'wires'}
        </span>
        <div className="panel-spacer" />
        <div className="wiring-zoom" role="group" aria-label="Zoom">
          <button
            className="icon-button small"
            aria-label="Zoom out"
            title="Zoom out"
            onClick={() => zoomAt(1 / 1.25, ...middle())}
          >
            <Minus size={13} />
          </button>
          <span className="wiring-zoom-level">{Math.round(shown.k * 100)}%</span>
          <button
            className="icon-button small"
            aria-label="Zoom in"
            title="Zoom in (pinch, or ⌘ + scroll)"
            onClick={() => zoomAt(1.25, ...middle())}
          >
            <Plus size={13} />
          </button>
          <button
            className="icon-button small"
            aria-label="Fit to window"
            title="Fit to window"
            onClick={() => setView(null)}
          >
            <Maximize size={13} />
          </button>
        </div>
        {moved && (
          <button
            className="btn small"
            title="Put everything back where it started"
            onClick={resetLayout}
          >
            <RotateCcw size={13} /> Reset layout
          </button>
        )}
        {hasDetails && (
          <button
            className="icon-button small"
            aria-label={details ? 'Hide notes and connections' : 'Show notes and connections'}
            title={details ? 'Hide notes and connections' : 'Show notes and connections'}
            onClick={() => setDetails((d) => !d)}
          >
            {details ? <PanelBottomClose size={14} /> : <PanelBottomOpen size={14} />}
          </button>
        )}
        <button className="btn small" onClick={openWiringFile}>
          <FileJson size={13} /> {WIRING_FILE}
        </button>
      </div>

      <div ref={canvasRef} className="wiring-canvas">
        <svg
          className={`wiring-svg${drag ? ` dragging-${drag.kind}` : ''}`}
          onPointerDown={startPan}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <pattern
              id={gridId}
              width={24}
              height={24}
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${shown.x} ${shown.y}) scale(${shown.k})`}
            >
              <circle cx={1} cy={1} r={1} className="whiteboard-dot" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${gridId})`} />

          <g transform={`translate(${shown.x} ${shown.y}) scale(${shown.k})`}>
            {wires.map((wire) => (
              <g
                key={wire.key}
                className={`wire${lit(wire.ends, wire.key) ? '' : ' dim'}`}
                onMouseEnter={() => !drag && setHover(wire.key)}
              >
                <path d={wire.path} className="wire-hit" />
                <path
                  d={wire.path}
                  className="wire-line"
                  stroke={wire.color}
                  strokeDasharray={wire.kind === 'mains' ? '8 5' : undefined}
                />
                <title>
                  {describeEnd(wiring, wire.from)} → {describeEnd(wiring, wire.to)}
                  {wire.label ? ` (${wire.label})` : ''}
                </title>
              </g>
            ))}

            <g
              className="pcb movable"
              transform={`translate(${board.x} ${board.y})`}
              onPointerDown={(event) => startMove(event, BOARD, { x: board.x, y: board.y })}
            >
              <rect x={0} y={0} width={board.w} height={board.h} rx={16} className="pcb-body" />
              <rect
                x={6}
                y={6}
                width={board.w - 12}
                height={board.h - 12}
                rx={11}
                className="pcb-edge"
              />
              <text x={board.w / 2} y={26} className="pcb-title">
                {short(wiring.board.name ?? project.board?.name ?? 'Board', board.titleChars)}
              </text>
              <text x={board.w / 2} y={41} className="pcb-subtitle">
                {board.pins.length ? 'Pins as seen from the top' : 'No header pins mapped yet'}
              </text>
              {board.labels.map((label) => (
                <text
                  key={`${label.side}${label.y}`}
                  x={label.side === 'left' ? 14 : board.w - 14}
                  y={label.y}
                  textAnchor={label.side === 'left' ? 'start' : 'end'}
                  className="pcb-header"
                >
                  {short(label.text, board.headerChars)}
                  <title>{label.text}</title>
                </text>
              ))}
              {board.pins.map((pin) => {
                const left = pin.side === 'left'
                const edge = left ? 0 : board.w
                const colors = pinColors.get(pin.id) ?? []
                const detail = pinDetail(pin)
                const key = `${BOARD}.${pin.id}`
                return (
                  <g
                    key={pin.id}
                    className={`pin${hover === key ? ' hover' : ''}`}
                    onMouseEnter={() => !drag && setHover(key)}
                  >
                    <line x1={edge} x2={pin.anchor.x} y1={pin.y} y2={pin.y} className="pin-stub" />
                    <rect
                      x={edge - 5}
                      y={pin.y - 5}
                      width={10}
                      height={10}
                      rx={2}
                      className={`pin-pad${colors.length ? ' wired' : ''}`}
                    />
                    {colors.slice(0, 3).map((color, i) => (
                      <circle
                        key={i}
                        cx={pin.anchor.x + (left ? -1 : 1) * (4 + i * 7)}
                        cy={pin.y}
                        r={3}
                        fill={color}
                      />
                    ))}
                    <text
                      x={left ? 14 : board.w - 14}
                      y={pin.y + 4}
                      textAnchor={left ? 'start' : 'end'}
                      className={`pin-label ${pin.kind}${pin.used ? ' used' : ''}`}
                    >
                      {pin.label}
                    </text>
                    {detail && (
                      <text
                        x={board.detailX[pin.side]}
                        y={pin.y + 3.5}
                        textAnchor={left ? 'start' : 'end'}
                        className="pin-detail"
                      >
                        {short(detail, DETAIL_CHARS)}
                      </text>
                    )}
                    <title>
                      {[
                        pin.label,
                        pin.functions.join(', '),
                        pin.used && `Used by ${pin.used}`,
                        pin.note
                      ]
                        .filter(Boolean)
                        .join('\n')}
                    </title>
                  </g>
                )
              })}
            </g>

            {parts.map((part) => (
              <g
                key={part.id}
                className="part movable"
                onPointerDown={(event) => startMove(event, part.id, { x: part.x, y: part.y })}
              >
                <rect
                  x={part.x}
                  y={part.y}
                  width={part.w}
                  height={part.h}
                  rx={10}
                  className="part-body"
                />
                <text x={part.x + 12} y={part.y + 18} className="part-name">
                  {short(part.name, 24)}
                </text>
                {part.kind && (
                  <text x={part.x + 12} y={part.y + 31} className="part-kind">
                    {short(part.kind, 28)}
                  </text>
                )}
                <title>{[part.name, part.note].filter(Boolean).join('\n')}</title>
                {part.pins.map((pin) => {
                  const anchor = part.anchors.get(pin.id)!
                  const right = anchor.dir === 1
                  const edge = right ? part.x + part.w : part.x
                  const key = `${part.id}.${pin.id}`
                  return (
                    <g
                      key={pin.id}
                      className={`pin${hover === key ? ' hover' : ''}`}
                      onMouseEnter={() => !drag && setHover(key)}
                    >
                      <line
                        x1={edge}
                        x2={anchor.x}
                        y1={anchor.y}
                        y2={anchor.y}
                        className="pin-stub"
                      />
                      <circle cx={edge} cy={anchor.y} r={3.5} className="part-pin-dot" />
                      <text
                        x={right ? edge - 10 : edge + 10}
                        y={anchor.y + 4}
                        textAnchor={right ? 'end' : 'start'}
                        className="part-pin"
                      >
                        {short(pin.label, 18)}
                      </text>
                    </g>
                  )
                })}
              </g>
            ))}
          </g>
        </svg>
        <p className="wiring-hint">
          Drag the board and parts · drag the background or scroll to pan · pinch or ⌘ + scroll to
          zoom
        </p>
      </div>

      {details && hasDetails && (
        <div className="wiring-details">
          {wiring.notes.map((note) => (
            <p key={note} className="wiring-note">
              <TriangleAlert size={13} /> {note}
            </p>
          ))}
          {parsed?.problems.map((problem) => (
            <p key={problem} className="wiring-problem">
              {problem}
            </p>
          ))}
          {wires.length > 0 && (
            <table className="wiring-table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>What</th>
                </tr>
              </thead>
              <tbody>
                {wires.map((wire) => (
                  <tr
                    key={wire.key}
                    className={hover === wire.key ? 'hover' : undefined}
                    onMouseEnter={() => setHover(wire.key)}
                    onMouseLeave={() => setHover(null)}
                  >
                    <td>
                      <span className="wire-swatch" style={{ background: wire.color }} />
                      {describeEnd(wiring, wire.from)}
                    </td>
                    <td>{describeEnd(wiring, wire.to)}</td>
                    <td className={`wire-kind ${wire.kind}`}>{wire.label ?? wire.kind}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

export default WiringView
