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
import {
  NETWORK_LABEL,
  NEAR_NETWORKS,
  accountKey,
  formatNear,
  shortAccountId,
  type NearAccount
} from '../../../shared/near'
import type { Chat, Project } from '../../../shared/projects'
import { formatRelativeTime } from '../format'
import { useNearAccounts } from '../hooks/useNearAccounts'
import type { View } from '../view'
import AgentIcon from './AgentIcon'
import AccountAvatar from './near/AccountAvatar'
import { showAccountMenu } from './near/accountMenu'
import type { AccountsIntent } from './near/AccountsView'
import NearMark from './near/NearMark'
import './Sidebar.css'
import './near/Near.css'

const ICON_SIZE = 16
const ICON_STROKE = 1.5

type SidebarHeaderProps = {
  open: boolean
  onToggle: () => void
  canGoBack: boolean
  canGoForward: boolean
  onBack: () => void
  onForward: () => void
}

// Separate from the sidebar so the controls stay put when it collapses.
// Render it after every other drag region: Electron resolves overlapping
// app-regions by DOM order, not z-index, so a later drag strip would swallow
// clicks on these buttons.
export function SidebarHeader({
  open,
  onToggle,
  canGoBack,
  canGoForward,
  onBack,
  onForward
}: SidebarHeaderProps): React.JSX.Element {
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
      <button
        className="icon-button"
        aria-label="Back"
        title="Back (⌘[)"
        disabled={!canGoBack}
        onClick={onBack}
      >
        <ArrowLeft size={ICON_SIZE} strokeWidth={ICON_STROKE} />
      </button>
      <button
        className="icon-button"
        aria-label="Forward"
        title="Forward (⌘])"
        disabled={!canGoForward}
        onClick={onForward}
      >
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
  onOpenAccounts: (intent?: Omit<AccountsIntent, 'key'>) => void
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
  onOpenAccounts,
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
        <NearAccountsSection onOpenAccounts={onOpenAccounts} />
      </div>
    </aside>
  )
}

// Each network's primary account, pinned at the bottom. Clicking one shows it
// on the accounts page; ⋯ (or a right-click) has its actions; + adds an account
function NearAccountsSection({
  onOpenAccounts
}: {
  onOpenAccounts: (intent?: Omit<AccountsIntent, 'key'>) => void
}): React.JSX.Element {
  const { data, balances, primary } = useNearAccounts()
  const others = data ? data.accounts.length - NEAR_NETWORKS.filter((n) => primary(n)).length : 0

  const showAddMenu = async (): Promise<void> => {
    const choice = await window.api.showMenu([
      { id: 'create', label: 'Create Testnet Account' },
      { id: 'import-mainnet', label: 'Import Mainnet Account…' },
      { id: 'import-testnet', label: 'Import Testnet Account…' },
      { type: 'separator' },
      { id: 'all', label: 'All NEAR Accounts' }
    ])
    if (choice === 'create') onOpenAccounts({ add: { network: 'testnet', mode: 'create' } })
    if (choice === 'import-mainnet') onOpenAccounts({ add: { network: 'mainnet', mode: 'import' } })
    if (choice === 'import-testnet') onOpenAccounts({ add: { network: 'testnet', mode: 'import' } })
    if (choice === 'all') onOpenAccounts()
  }

  const showMenu = async (account: NearAccount): Promise<void> => {
    const choice = await showAccountMenu(account, true, [
      { id: 'open', label: 'Show in NEAR Accounts' }
    ])
    if (choice === 'open') onOpenAccounts({ focus: accountKey(account.network, account.accountId) })
  }

  return (
    <section className="sidebar-near" aria-label="NEAR accounts">
      <div className="sidebar-section-header">
        <button className="sidebar-section-link" onClick={() => onOpenAccounts()}>
          NEAR accounts
        </button>
        <button
          className="icon-button small"
          aria-label="Add a NEAR account"
          title="Add a NEAR account"
          onClick={showAddMenu}
        >
          <Plus size={14} strokeWidth={ICON_STROKE} />
        </button>
      </div>
      <div className="sidebar-near-list">
        {data &&
          NEAR_NETWORKS.map((network) => {
            const account = primary(network)
            if (!account) {
              return (
                <button
                  key={network}
                  className="nav-item empty"
                  onClick={() =>
                    onOpenAccounts({
                      add: { network, mode: network === 'testnet' ? 'create' : 'import' }
                    })
                  }
                >
                  <NearMark size={ICON_SIZE} />
                  <span className="nav-item-label">
                    {network === 'testnet' ? 'Create account' : 'Add account'}
                  </span>
                  <span className={`near-network-tag ${network}`}>{NETWORK_LABEL[network]}</span>
                </button>
              )
            }
            const balance = balances[accountKey(network, account.accountId)]
            return (
              <div
                key={network}
                className="nav-row"
                onContextMenu={(event) => {
                  event.preventDefault()
                  showMenu(account)
                }}
              >
                <button
                  className="nav-item"
                  title={`${account.accountId}${balance ? ` · ${formatNear(balance.total)} NEAR` : ''}`}
                  onClick={() => onOpenAccounts({ focus: accountKey(network, account.accountId) })}
                >
                  <AccountAvatar
                    accountId={account.accountId}
                    variant={account.avatarVariant}
                    size={18}
                  />
                  <span className="nav-item-label">{shortAccountId(account.accountId)}</span>
                  <span className={`near-network-tag ${network}`}>{NETWORK_LABEL[network]}</span>
                </button>
                <div className="nav-row-actions">
                  <button
                    className="icon-button small"
                    aria-label={`More actions for ${account.accountId}`}
                    title="More actions"
                    onClick={() => showMenu(account)}
                  >
                    <Ellipsis size={14} strokeWidth={ICON_STROKE} />
                  </button>
                </div>
              </div>
            )
          })}
        {others > 0 && (
          <button className="nav-item near-more" onClick={() => onOpenAccounts()}>
            <span className="nav-item-label">
              {others} more account{others === 1 ? '' : 's'}
            </span>
          </button>
        )}
      </div>
    </section>
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
