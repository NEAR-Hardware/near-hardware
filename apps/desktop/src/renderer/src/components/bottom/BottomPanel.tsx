import { useEffect, useRef, useState } from 'react'
import { Cable, ChevronDown, ChevronUp, SquareTerminal } from 'lucide-react'
import type { Project } from '../../../../shared/projects'
import SerialMonitor from './SerialMonitor'
import TerminalView from './TerminalView'
import './BottomPanel.css'

type Tab = 'terminal' | 'serial'

// Height of the tab row, which stays on screen as a bar while the panel is collapsed
export const BOTTOM_BAR_HEIGHT = 32

type BottomPanelProps = {
  project: Project
  open: boolean
  height: number
  onHeightChange: (height: number) => void
  onOpen: () => void
  onClose: () => void
}

// Serial ports open right now, by this window or an agent
function useOpenPortCount(): number {
  const [ports, setPorts] = useState<ReadonlySet<string>>(new Set())
  useEffect(() => {
    const offs = [
      window.api.serial.onOpened(({ path }) => setPorts((current) => new Set(current).add(path))),
      window.api.serial.onClosed(({ path }) =>
        setPorts((current) => {
          const next = new Set(current)
          next.delete(path)
          return next
        })
      )
    ]
    return () => offs.forEach((off) => off())
  }, [])
  return ports.size
}

// VS Code-style panel under the chat: terminal and serial monitor
function BottomPanel({
  project,
  open,
  height,
  onHeightChange,
  onOpen,
  onClose
}: BottomPanelProps): React.JSX.Element {
  const [tab, setTab] = useState<Tab>('terminal')
  const drag = useRef<{ startY: number; startHeight: number } | null>(null)
  const serialOpen = useOpenPortCount() > 0

  // Clicking a tab in the collapsed bar brings the panel back on that tab
  const showTab = (next: Tab): void => {
    setTab(next)
    if (!open) onOpen()
  }

  return (
    <section
      className={`bottom-panel${open ? '' : ' collapsed'}`}
      style={{ height: open ? height : BOTTOM_BAR_HEIGHT }}
      aria-label="Panel"
    >
      <div
        hidden={!open}
        className="bottom-resizer"
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize panel"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          drag.current = { startY: event.clientY, startHeight: height }
        }}
        onPointerMove={(event) => {
          if (!drag.current) return
          const next = drag.current.startHeight - (event.clientY - drag.current.startY)
          onHeightChange(Math.round(Math.min(window.innerHeight * 0.75, Math.max(120, next))))
        }}
        onPointerUp={() => (drag.current = null)}
        onDoubleClick={() => onHeightChange(260)}
      />
      <div className="bottom-tabs">
        <button
          className={`bottom-tab${open && tab === 'terminal' ? ' active' : ''}`}
          title={open ? undefined : 'Show terminal (⌘J)'}
          onClick={() => showTab('terminal')}
        >
          <SquareTerminal size={13} strokeWidth={1.5} /> Terminal
        </button>
        <button
          className={`bottom-tab${open && tab === 'serial' ? ' active' : ''}`}
          title={open ? undefined : 'Show serial monitor'}
          onClick={() => showTab('serial')}
        >
          <Cable size={13} strokeWidth={1.5} /> Serial Monitor
          {serialOpen && <span className="bottom-tab-dot" aria-label="(port open)" />}
        </button>
        <div className="panel-spacer" />
        <button
          className="icon-button small"
          aria-label={open ? 'Hide panel' : 'Show panel'}
          title={open ? 'Hide panel (⌘J)' : 'Show panel (⌘J)'}
          onClick={open ? onClose : onOpen}
        >
          {open ? (
            <ChevronDown size={14} strokeWidth={1.5} />
          ) : (
            <ChevronUp size={14} strokeWidth={1.5} />
          )}
        </button>
      </div>
      {/* Stays mounted while collapsed so the shell and serial connection keep running */}
      <div className="bottom-body" inert={!open}>
        <div className="bottom-view" hidden={tab !== 'terminal'}>
          <TerminalView
            key={project.id}
            projectId={project.id}
            visible={open && tab === 'terminal'}
          />
        </div>
        <div className="bottom-view" hidden={tab !== 'serial'}>
          <SerialMonitor key={project.id} defaultPort={project.board?.port} />
        </div>
      </div>
    </section>
  )
}

export default BottomPanel
