import {
  ArrowLeft,
  ArrowRight,
  Ellipsis,
  Folder,
  FolderOpen,
  Layers,
  PanelLeft,
  Plus,
  Search
} from 'lucide-react'
import type { Chat, Project } from '../../../shared/projects'
import { formatRelativeTime } from '../format'
import type { View } from '../view'
import AgentIcon from './AgentIcon'
import './Sidebar.css'

const ICON_SIZE = 16
const ICON_STROKE = 1.5

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

type SidebarProps = {
  open: boolean
  view: View
  projects: Project[]
  now: number
  onNavigate: (view: View) => void
  onNewProject: () => void
  onProjectMenu: (project: Project) => void
  onChatMenu: (project: Project, chat: Chat) => void
}

function Sidebar({
  open,
  view,
  projects,
  now,
  onNavigate,
  onNewProject,
  onProjectMenu,
  onChatMenu
}: SidebarProps): React.JSX.Element {
  return (
    <aside className="sidebar" inert={!open}>
      <div className="sidebar-content">
        <div className="sidebar-scroll">
          <nav className="sidebar-nav">
            <button
              className={`nav-item${view.kind === 'environments' ? ' active' : ''}`}
              onClick={() => onNavigate({ kind: 'environments' })}
            >
              <Layers size={ICON_SIZE} strokeWidth={ICON_STROKE} />
              <span className="nav-item-label">Environments</span>
            </button>
          </nav>

          <section className="sidebar-section" aria-label="Projects">
            <div className="sidebar-section-header">
              <span>Projects</span>
              <button
                className="icon-button small"
                aria-label="New project"
                title="New project"
                onClick={onNewProject}
              >
                <Plus size={14} strokeWidth={ICON_STROKE} />
              </button>
            </div>
            <div className="sidebar-nav">
              <button className="nav-item" onClick={onNewProject}>
                <Plus size={ICON_SIZE} strokeWidth={ICON_STROKE} />
                <span className="nav-item-label">New Project</span>
              </button>
              {projects.map((project) => (
                <ProjectItem
                  key={project.id}
                  project={project}
                  view={view}
                  now={now}
                  onNavigate={onNavigate}
                  onProjectMenu={onProjectMenu}
                  onChatMenu={onChatMenu}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </aside>
  )
}

type ProjectItemProps = {
  project: Project
  view: View
  now: number
  onNavigate: (view: View) => void
  onProjectMenu: (project: Project) => void
  onChatMenu: (project: Project, chat: Chat) => void
}

function ProjectItem({
  project,
  view,
  now,
  onNavigate,
  onProjectMenu,
  onChatMenu
}: ProjectItemProps): React.JSX.Element {
  const isCurrent = view.kind === 'project' && view.projectId === project.id
  const currentChatId = isCurrent ? view.chatId : undefined
  const chats = [...project.chats].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const openHome = (): void => onNavigate({ kind: 'project', projectId: project.id })

  return (
    <div className="sidebar-project">
      <div
        className="nav-row"
        onContextMenu={(event) => {
          event.preventDefault()
          onProjectMenu(project)
        }}
      >
        <button
          className={`nav-item${isCurrent && !currentChatId ? ' active' : ''}`}
          title={project.path}
          onClick={openHome}
        >
          {isCurrent ? (
            <FolderOpen size={ICON_SIZE} strokeWidth={ICON_STROKE} />
          ) : (
            <Folder size={ICON_SIZE} strokeWidth={ICON_STROKE} />
          )}
          <span className="nav-item-label">{project.name}</span>
        </button>
        <div className="nav-row-actions">
          <button
            className="icon-button small"
            aria-label={`New chat in ${project.name}`}
            title="New chat"
            onClick={openHome}
          >
            <Plus size={14} strokeWidth={ICON_STROKE} />
          </button>
          <button
            className="icon-button small"
            aria-label={`More actions for ${project.name}`}
            title="More actions"
            onClick={() => onProjectMenu(project)}
          >
            <Ellipsis size={14} strokeWidth={ICON_STROKE} />
          </button>
        </div>
      </div>

      {chats.length > 0 && (
        <div className="project-chats">
          {chats.map((chat) => (
            <button
              key={chat.id}
              className={`nav-item chat-item${currentChatId === chat.id ? ' active' : ''}`}
              onClick={() =>
                onNavigate({ kind: 'project', projectId: project.id, chatId: chat.id })
              }
              onContextMenu={(event) => {
                event.preventDefault()
                onChatMenu(project, chat)
              }}
            >
              <AgentIcon id={chat.environmentId} size={12} tile={false} />
              <span className="nav-item-label">{chat.title}</span>
              <span className="nav-item-meta">{formatRelativeTime(chat.updatedAt, now)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Sidebar
