import { useRef, useState } from 'react'
import { Cable, SquareTerminal, X } from 'lucide-react'
import type { Project } from '../../../../shared/projects'
import SerialMonitor from './SerialMonitor'
import TerminalView from './TerminalView'
import './BottomPanel.css'

type Tab = 'terminal' | 'serial'

type BottomPanelProps = {
  project: Project
  open: boolean
  height: number
  onHeightChange: (height: number) => void
  onClose: () => void
}

// VS Code-style panel under the chat: terminal and serial monitor
function BottomPanel({
  project,
  open,
  height,
  onHeightChange,
  onClose
}: BottomPanelProps): React.JSX.Element {
  const [tab, setTab] = useState<Tab>('terminal')
  const drag = useRef<{ startY: number; startHeight: number } | null>(null)

  return (
    <section
      className="bottom-panel"
      style={{ height: open ? height : 0 }}
      inert={!open}
      aria-label="Panel"
    >
      <div
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
          className={`bottom-tab${tab === 'terminal' ? ' active' : ''}`}
          onClick={() => setTab('terminal')}
        >
          <SquareTerminal size={13} strokeWidth={1.5} /> Terminal
        </button>
        <button
          className={`bottom-tab${tab === 'serial' ? ' active' : ''}`}
          onClick={() => setTab('serial')}
        >
          <Cable size={13} strokeWidth={1.5} /> Serial Monitor
        </button>
        <div className="panel-spacer" />
        <button
          className="icon-button small"
          aria-label="Close panel"
          title="Close panel (⌘J)"
          onClick={onClose}
        >
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>
      <div className="bottom-body">
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
