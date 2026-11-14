import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, PictureInPicture2, Settings2, Sparkles } from 'lucide-react'
import type { Project } from '../../../../shared/projects'
import { SCREEN_PRESETS, describeScreen, type ScreenSpec } from '../../../../shared/screens'
import { DESIGNS_DIR, useScreenDesigns } from '../../hooks/useScreenDesigns'
import DeviceFrame from './DeviceFrame'
import './Screen.css'

const STORAGE_KEY = 'near-hardware.screen-pane'
const DEFAULT_LAYOUT = { open: true, height: 420 }
const MIN_HEIGHT = 160

type PaneLayout = { open: boolean; height: number }

function loadLayout(): PaneLayout {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (typeof saved?.open === 'boolean' && typeof saved?.height === 'number') return saved
  } catch {
    // Fall through
  }
  return DEFAULT_LAYOUT
}

function saveLayout(layout: PaneLayout): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
  } catch {
    // The layout just resets next time
  }
}

// Fills the open chat's message box; ChatView listens for this
function compose(text: string): void {
  window.dispatchEvent(new CustomEvent('near-hardware:compose', { detail: text }))
}

const designPrompt = (spec: ScreenSpec): string =>
  `Design the main UI for this board’s ${describeScreen(spec)} screen. Save it as ${DESIGNS_DIR}/home.html at exactly ${spec.width}×${spec.height} px, following “Screen designs” in the NEAR Hardware guide, so it shows in the screen preview.`

// The board's screen under the files, like a simulator next to the code
function ScreenPane({ project }: { project: Project }): React.JSX.Element {
  const [layout, setLayout] = useState(loadLayout)
  const [floating, setFloating] = useState<string[]>([])
  const { designs, active, content, select } = useScreenDesigns(project.id)
  const drag = useRef<{ startY: number; startHeight: number } | null>(null)
  const spec = project.board?.screen
  const isFloating = floating.includes(project.id)

  useEffect(() => saveLayout(layout), [layout])

  useEffect(() => {
    window.api.screen.floating().then(setFloating)
    return window.api.screen.onFloatingChange(setFloating)
  }, [])

  const chooseScreen = async (): Promise<void> => {
    const choice = await window.api.showMenu([
      ...SCREEN_PRESETS.map((preset) => ({ id: preset.id, label: preset.label })),
      { type: 'separator' },
      { id: 'rotate', label: 'Rotate 90°', enabled: !!spec },
      { id: 'none', label: 'This board has no screen' }
    ])
    if (!choice) return
    const screen =
      choice === 'none'
        ? null
        : choice === 'rotate'
          ? spec && { ...spec, width: spec.height, height: spec.width }
          : SCREEN_PRESETS.find((preset) => preset.id === choice)?.spec
    if (screen !== undefined) await window.api.projects.setBoard(project.id, { screen })
  }

  return (
    <section
      className={`screen-pane${layout.open ? '' : ' collapsed'}`}
      style={layout.open ? { height: layout.height } : undefined}
      aria-label="Screen"
    >
      {layout.open && (
        <div
          className="screen-resizer"
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize screen"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            drag.current = { startY: event.clientY, startHeight: layout.height }
          }}
          onPointerMove={(event) => {
            if (!drag.current) return
            const next = drag.current.startHeight - (event.clientY - drag.current.startY)
            const max = window.innerHeight - 180
            setLayout((l) => ({
              ...l,
              height: Math.round(Math.min(max, Math.max(MIN_HEIGHT, next)))
            }))
          }}
          onPointerUp={() => (drag.current = null)}
          onDoubleClick={() => setLayout((l) => ({ ...l, height: DEFAULT_LAYOUT.height }))}
        />
      )}
      <div className="screen-pane-header">
        <button
          className="screen-pane-toggle"
          aria-expanded={layout.open}
          onClick={() => setLayout((l) => ({ ...l, open: !l.open }))}
        >
          {layout.open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          Screen
        </button>
        {designs.length > 1 && (
          <select
            className="panel-select screen-design-select"
            aria-label="Screen design"
            value={active?.path}
            onChange={(event) => select(event.target.value)}
          >
            {designs.map((design) => (
              <option key={design.path} value={design.path}>
                {design.name}
              </option>
            ))}
          </select>
        )}
        <div className="panel-spacer" />
        <button
          className="icon-button small"
          aria-label="Screen size and shape"
          title="Screen size and shape"
          onClick={chooseScreen}
        >
          <Settings2 size={14} strokeWidth={1.5} />
        </button>
        <button
          className="icon-button small"
          aria-label={isFloating ? 'Bring screen back' : 'Pop out screen'}
          title={isFloating ? 'Bring back into the panel' : 'Pop out into a floating window'}
          disabled={!spec}
          onClick={() =>
            isFloating ? window.api.screen.dock(project.id) : window.api.screen.popOut(project.id)
          }
        >
          <PictureInPicture2 size={14} strokeWidth={1.5} />
        </button>
      </div>

      {layout.open && (
        <div className="screen-pane-body">
          {isFloating ? (
            <div className="screen-message">
              <p>The screen is in a floating window.</p>
              <button className="btn small" onClick={() => window.api.screen.dock(project.id)}>
                Show it here
              </button>
            </div>
          ) : spec === null ? (
            <div className="screen-message">
              <p>This board has no screen.</p>
              <button className="btn small" onClick={chooseScreen}>
                It has one
              </button>
            </div>
          ) : !spec ? (
            <div className="screen-message">
              <p>
                The agent records the board’s screen during board setup, from the official docs. You
                can also pick a common one.
              </p>
              <button className="btn small" onClick={chooseScreen}>
                Choose screen
              </button>
            </div>
          ) : (
            <>
              <DeviceFrame
                spec={spec}
                content={content}
                inset={12}
                placeholder={designs.length === 0 ? 'No screen design yet' : null}
              />
              <p className="screen-caption" title={spec.controller}>
                {active ? `${active.name} · ` : ''}
                {describeScreen(spec)}
              </p>
              {designs.length === 0 && (
                <button
                  className="btn small screen-design-button"
                  onClick={() => compose(designPrompt(spec))}
                >
                  <Sparkles size={13} /> Ask the agent to design it
                </button>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}

export default ScreenPane
