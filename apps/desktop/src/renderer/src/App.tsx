import { useCallback, useEffect, useState } from 'react'
import { PanelBottom, PanelRight, Usb } from 'lucide-react'
import type { EnvironmentId } from '../../shared/environments'
import type { Chat, Project } from '../../shared/projects'
import BottomPanel from './components/bottom/BottomPanel'
import ChatView from './components/chat/ChatView'
import EnvironmentsView from './components/EnvironmentsView'
import FilesPanel from './components/FilesPanel'
import NewProjectDialog from './components/NewProjectDialog'
import PanelResizer from './components/PanelResizer'
import ProjectHome from './components/ProjectHome'
import Sidebar, { SidebarHeader } from './components/Sidebar'
import { revealLabel } from './format'
import { describeDevice } from './hooks/useDevices'
import { useNow } from './hooks/useNow'
import { usePanel } from './hooks/usePanel'
import { FILES_PANEL, MAIN_MIN_WIDTH, SIDEBAR_PANEL } from './panelLayout'
import { loadView, saveView, type View } from './view'

function App(): React.JSX.Element {
  const sidebar = usePanel(SIDEBAR_PANEL)
  const files = usePanel(FILES_PANEL)
  const [requestedView, setView] = useState<View>(loadView)
  const [projects, setProjects] = useState<Project[]>()
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const now = useNow()
  const [bottom, setBottom] = useState(loadBottomPanel)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => saveBottomPanel(bottom), [bottom])

  // Toast when a board is plugged in (not for devices already there at launch)
  useEffect(() => {
    let known: string[] | undefined
    window.api.devices.list().then((list) => (known = list.map((d) => d.path)))
    return window.api.devices.onChange((list) => {
      const added = known ? list.filter((d) => !known!.includes(d.path)) : []
      known = list.map((d) => d.path)
      if (added[0])
        setToast(`${describeDevice(added[0])} connected on ${added[0].path.replace('/dev/', '')}`)
    })
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(timer)
  }, [toast])

  const refreshProjects = useCallback(async () => {
    setProjects(await window.api.projects.list())
  }, [])

  useEffect(() => {
    window.api.projects.list().then(setProjects)
    // The main process renames chats after their first message, for example
    return window.api.projects.onChange(() => window.api.projects.list().then(setProjects))
  }, [])

  const project =
    requestedView.kind === 'project'
      ? projects?.find((p) => p.id === requestedView.projectId)
      : undefined
  const chat =
    requestedView.kind === 'project' && requestedView.chatId
      ? project?.chats.find((c) => c.id === requestedView.chatId)
      : undefined

  // The requested view can point at a project or chat that's since been removed;
  // fall back to the closest thing that still exists
  let view = requestedView
  if (projects && requestedView.kind === 'project') {
    if (!project) view = { kind: 'environments' }
    else if (requestedView.chatId && !chat) view = { kind: 'project', projectId: project.id }
  }

  useEffect(() => saveView(view), [view])

  // ⌘B toggles the sidebar and ⌥⌘B the files panel, like Cursor and VS Code
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!(event.metaKey || event.ctrlKey)) return
      // ⌘J toggles the terminal / serial monitor panel, like VS Code
      if (event.code === 'KeyJ') {
        event.preventDefault()
        setBottom((b) => ({ ...b, open: !b.open }))
        return
      }
      if (event.code !== 'KeyB') return
      event.preventDefault()
      if (event.altKey) files.toggle()
      else sidebar.toggle()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [files, sidebar])

  const openProject = (created: Project): void => {
    setNewProjectOpen(false)
    refreshProjects()
    setView({ kind: 'project', projectId: created.id })
  }

  const createChat = async (environmentId: EnvironmentId): Promise<void> => {
    if (!project) return
    const created = await window.api.projects.createChat(project.id, environmentId)
    await refreshProjects()
    setView({ kind: 'project', projectId: project.id, chatId: created.id })
  }

  const showProjectMenu = async (target: Project): Promise<void> => {
    const choice = await window.api.showMenu([
      { id: 'new-chat', label: 'New Chat' },
      { id: 'reveal', label: revealLabel() },
      { id: 'copy-path', label: 'Copy Path' },
      { type: 'separator' },
      { id: 'remove', label: 'Remove from NEAR Hardware' }
    ])
    if (choice === 'new-chat') setView({ kind: 'project', projectId: target.id })
    if (choice === 'reveal') window.api.projects.reveal(target.id)
    if (choice === 'copy-path') navigator.clipboard.writeText(target.path)
    if (choice === 'remove') {
      // Only forgets the project; its folder and files stay on disk
      await window.api.projects.remove(target.id)
      await refreshProjects()
    }
  }

  const showChatMenu = async (target: Project, targetChat: Chat): Promise<void> => {
    const choice = await window.api.showMenu([{ id: 'delete', label: 'Delete Chat' }])
    if (choice !== 'delete') return
    if (!window.confirm(`Delete “${targetChat.title}”? This can’t be undone.`)) return
    await window.api.projects.deleteChat(target.id, targetChat.id)
    await refreshProjects()
  }

  const resizing = sidebar.resizing || files.resizing
  const sidebarWidth = sidebar.layout.open ? sidebar.layout.width : 0

  return (
    <div
      className="app"
      data-sidebar={sidebar.layout.open ? 'open' : 'collapsed'}
      data-files={files.layout.open ? 'open' : 'collapsed'}
      data-resizing={resizing ? '' : undefined}
      style={
        {
          '--sidebar-width': `${sidebar.layout.width}px`,
          '--files-width': `${files.layout.width}px`
        } as React.CSSProperties
      }
    >
      <Sidebar
        open={sidebar.layout.open}
        view={view}
        projects={projects ?? []}
        now={now}
        onNavigate={setView}
        onNewProject={() => setNewProjectOpen(true)}
        onProjectMenu={showProjectMenu}
        onChatMenu={showChatMenu}
      />

      <main className="main">
        {/* Invisible strip so the window can be dragged from the main area too */}
        <div className="titlebar">
          {project && (
            <button
              className="icon-button"
              aria-label="Toggle panel"
              title="Terminal and serial monitor (⌘J)"
              onClick={() => setBottom((b) => ({ ...b, open: !b.open }))}
            >
              <PanelBottom size={16} strokeWidth={1.5} />
            </button>
          )}
          {project && !files.layout.open && (
            <button
              className="icon-button"
              aria-label="Show files"
              title="Show files (⌥⌘B)"
              onClick={files.toggle}
            >
              <PanelRight size={16} strokeWidth={1.5} />
            </button>
          )}
        </div>
        <div className="main-content">
          {view.kind === 'environments' && <EnvironmentsView />}
          {project && chat && <ChatView key={chat.id} project={project} chat={chat} />}
          {project && !chat && (
            <ProjectHome
              key={project.id}
              project={project}
              onCreateChat={createChat}
              onOpenEnvironments={() => setView({ kind: 'environments' })}
            />
          )}
        </div>
        {project && (
          <BottomPanel
            project={project}
            open={bottom.open}
            height={bottom.height}
            onHeightChange={(height) => setBottom((b) => ({ ...b, height }))}
            onClose={() => setBottom((b) => ({ ...b, open: false }))}
          />
        )}
      </main>

      {project && (
        <>
          <FilesPanel project={project} open={files.layout.open} onToggle={files.toggle} />
          <PanelResizer
            side="right"
            className="files-resizer"
            label="Resize files panel"
            open={files.layout.open}
            width={files.layout.width}
            minWidth={FILES_PANEL.minWidth}
            maxWidth={FILES_PANEL.maxWidth}
            onResize={(width, startWidth) =>
              files.resize(width, startWidth, window.innerWidth - sidebarWidth - MAIN_MIN_WIDTH)
            }
            onResizingChange={files.setResizing}
            onReset={files.reset}
          />
        </>
      )}

      <PanelResizer
        side="left"
        className="sidebar-resizer"
        label="Resize sidebar"
        open={sidebar.layout.open}
        width={sidebar.layout.width}
        minWidth={SIDEBAR_PANEL.minWidth}
        maxWidth={SIDEBAR_PANEL.maxWidth}
        onResize={(width, startWidth) =>
          sidebar.resize(
            width,
            startWidth,
            window.innerWidth -
              (project && files.layout.open ? files.layout.width : 0) -
              MAIN_MIN_WIDTH
          )
        }
        onResizingChange={sidebar.setResizing}
        onReset={sidebar.reset}
      />
      {/* Must stay after the drag strips above, see SidebarHeader */}
      <SidebarHeader open={sidebar.layout.open} onToggle={sidebar.toggle} />
      {/* Last so its no-drag backdrop overrides every drag strip while open */}
      {newProjectOpen && (
        <NewProjectDialog onClose={() => setNewProjectOpen(false)} onCreated={openProject} />
      )}
      {toast && (
        <div className="toast" role="status">
          <Usb size={14} /> {toast}
        </div>
      )}
    </div>
  )
}

// Bottom panel open state and height, remembered across restarts
type BottomPanelLayout = { open: boolean; height: number }
const BOTTOM_KEY = 'near-hardware.bottom-panel'

function loadBottomPanel(): BottomPanelLayout {
  try {
    const saved = JSON.parse(localStorage.getItem(BOTTOM_KEY) ?? 'null')
    if (typeof saved?.open === 'boolean' && typeof saved?.height === 'number') return saved
  } catch {
    // Fall through to the default
  }
  return { open: false, height: 260 }
}

function saveBottomPanel(layout: BottomPanelLayout): void {
  try {
    localStorage.setItem(BOTTOM_KEY, JSON.stringify(layout))
  } catch {
    // Only a convenience
  }
}

export default App
