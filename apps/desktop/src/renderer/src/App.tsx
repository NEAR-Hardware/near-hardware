import { useCallback, useEffect, useState } from 'react'
import Sidebar, { SidebarHeader } from './components/Sidebar'

function App(): React.JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const toggleSidebar = useCallback(() => setSidebarOpen((open) => !open), [])

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
    <div className="app" data-sidebar={sidebarOpen ? 'open' : 'collapsed'}>
      <Sidebar open={sidebarOpen} />
      <main className="main">
        {/* Invisible strip so the window can be dragged from the main area too */}
        <div className="titlebar" />
      </main>
      {/* Must stay last, see SidebarHeader */}
      <SidebarHeader open={sidebarOpen} onToggle={toggleSidebar} />
    </div>
  )
}

export default App
