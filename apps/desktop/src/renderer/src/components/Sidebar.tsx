import { ArrowLeft, ArrowRight, Layers, PanelLeft, Search } from 'lucide-react'
import './Sidebar.css'

const ICON_SIZE = 16
const ICON_STROKE = 1.5

type SidebarProps = {
  open: boolean
}

type SidebarHeaderProps = {
  open: boolean
  onToggle: () => void
}

// Separate from the sidebar so the controls stay put when it collapses.
// Render it after every other drag region: Electron resolves overlapping
// app-regions by DOM order, not z-index, so a later drag strip would swallow
// clicks on these buttons.
export function SidebarHeader({ open, onToggle }: SidebarHeaderProps): React.JSX.Element {
  return (
    <div className="sidebar-header">
      <button
        className="icon-button"
        aria-label="Toggle sidebar"
        aria-expanded={open}
        title="Toggle sidebar (⌘B)"
        onClick={onToggle}
      >
        <PanelLeft size={ICON_SIZE} strokeWidth={ICON_STROKE} />
      </button>
      <button className="icon-button" aria-label="Search" title="Search">
        <Search size={ICON_SIZE} strokeWidth={ICON_STROKE} />
      </button>
      <div className="sidebar-header-spacer" />
      <button className="icon-button" aria-label="Back" title="Back" disabled>
        <ArrowLeft size={ICON_SIZE} strokeWidth={ICON_STROKE} />
      </button>
      <button className="icon-button" aria-label="Forward" title="Forward" disabled>
        <ArrowRight size={ICON_SIZE} strokeWidth={ICON_STROKE} />
      </button>
    </div>
  )
}

function Sidebar({ open }: SidebarProps): React.JSX.Element {
  return (
    <aside className="sidebar" inert={!open}>
      <div className="sidebar-content">
        <nav className="sidebar-nav">
          <button className="nav-item active">
            <Layers size={ICON_SIZE} strokeWidth={ICON_STROKE} />
            <span>Environments</span>
          </button>
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar
