import { useCallback, useEffect, useState } from 'react'
import EnvironmentsView from './components/EnvironmentsView'
import Sidebar, { SidebarHeader } from './components/Sidebar'
import SidebarResizer from './components/SidebarResizer'
import {
  SIDEBAR_COLLAPSE_THRESHOLD,
  SIDEBAR_DEFAULT_WIDTH,
  clampSidebarWidth,
  loadSidebarLayout,
  saveSidebarLayout
} from './sidebarLayout'

function App(): React.JSX.Element {
  const [sidebar, setSidebar] = useState(loadSidebarLayout)
  const [resizing, setResizing] = useState(false)

  // Save once a drag ends rather than on every pointer move
  useEffect(() => {
    if (!resizing) saveSidebarLayout(sidebar)
  }, [sidebar, resizing])

  const toggleSidebar = useCallback(() => setSidebar((s) => ({ ...s, open: !s.open })), [])

  const resizeSidebar = useCallback((width: number, startWidth: number) => {
    setSidebar(
      width < SIDEBAR_COLLAPSE_THRESHOLD
        ? { open: false, width: startWidth }
        : { open: true, width: clampSidebarWidth(width) }
    )
  }, [])

  const resetSidebarWidth = useCallback(
    () => setSidebar((s) => ({ ...s, width: SIDEBAR_DEFAULT_WIDTH })),
    []
  )

  // ⌘B / Ctrl+B toggles the sidebar, like Cursor and VS Code
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggleSidebar])

  return (
    <div
      className="app"
      data-sidebar={sidebar.open ? 'open' : 'collapsed'}
      data-resizing={resizing ? '' : undefined}
      style={{ '--sidebar-width': `${sidebar.width}px` } as React.CSSProperties}
    >
      <Sidebar open={sidebar.open} />
      <main className="main">
        {/* Invisible strip so the window can be dragged from the main area too */}
        <div className="titlebar" />
        <div className="main-content">
          <EnvironmentsView />
        </div>
      </main>
      <SidebarResizer
        open={sidebar.open}
        width={sidebar.width}
        onResize={resizeSidebar}
        onResizingChange={setResizing}
        onReset={resetSidebarWidth}
      />
      {/* Must stay last, see SidebarHeader */}
      <SidebarHeader open={sidebar.open} onToggle={toggleSidebar} />
    </div>
  )
}

export default App
