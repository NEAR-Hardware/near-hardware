import { useEffect, useRef, useSyncExternalStore } from 'react'
import { House, X } from 'lucide-react'
import type { Chat, Project } from '../../../../shared/projects'
import { documentsRevision, isDirty, subscribeDocuments } from '../../editor/documents'
import { basename, joinPath, revealLabel } from '../../format'
import type { EditorTab } from '../../hooks/useEditorTabs'
import AgentIcon from '../AgentIcon'
import FileIcon from '../FileIcon'
import './Editor.css'

type EditorTabsProps = {
  project: Project
  chat?: Chat
  tabs: EditorTab[]
  active: string | null
  onActivate: (path: string | null) => void
  onPin: (path: string) => void
  onClose: (paths: string[]) => void
}

// Parent folder shown next to names that appear in more than one tab
function hints(tabs: EditorTab[]): Map<string, string> {
  const counts = new Map<string, number>()
  for (const tab of tabs) counts.set(basename(tab.path), (counts.get(basename(tab.path)) ?? 0) + 1)
  const result = new Map<string, string>()
  for (const tab of tabs) {
    if ((counts.get(basename(tab.path)) ?? 0) < 2) continue
    result.set(tab.path, tab.path.split('/').slice(-2, -1)[0] ?? '')
  }
  return result
}

// The chat plus open files, in the title bar like VS Code's editor tabs
function EditorTabs({
  project,
  chat,
  tabs,
  active,
  onActivate,
  onPin,
  onClose
}: EditorTabsProps): React.JSX.Element {
  useSyncExternalStore(subscribeDocuments, documentsRevision)
  const listRef = useRef<HTMLDivElement>(null)
  const folderHints = hints(tabs)

  useEffect(() => {
    listRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [active, tabs.length])

  const showMenu = async (tab: EditorTab): Promise<void> => {
    const index = tabs.indexOf(tab)
    const others = tabs.filter((t) => t !== tab).map((t) => t.path)
    const toRight = tabs.slice(index + 1).map((t) => t.path)
    const choice = await window.api.showMenu([
      { id: 'close', label: 'Close' },
      { id: 'close-others', label: 'Close Others', enabled: others.length > 0 },
      { id: 'close-right', label: 'Close to the Right', enabled: toRight.length > 0 },
      { id: 'close-all', label: 'Close All' },
      { type: 'separator' },
      ...(tab.preview ? [{ id: 'keep', label: 'Keep Open' }, { type: 'separator' as const }] : []),
      { id: 'copy-path', label: 'Copy Path' },
      { id: 'copy-relative', label: 'Copy Relative Path' },
      { id: 'reveal', label: revealLabel() },
      { id: 'open-external', label: 'Open in Default App' }
    ])
    if (choice === 'close') onClose([tab.path])
    if (choice === 'close-others') onClose(others)
    if (choice === 'close-right') onClose(toRight)
    if (choice === 'close-all') onClose(tabs.map((t) => t.path))
    if (choice === 'keep') onPin(tab.path)
    if (choice === 'copy-path') navigator.clipboard.writeText(joinPath(project.path, tab.path))
    if (choice === 'copy-relative') navigator.clipboard.writeText(tab.path)
    if (choice === 'reveal') window.api.files.reveal(project.id, tab.path)
    if (choice === 'open-external') window.api.files.open(project.id, tab.path)
  }

  return (
    <div ref={listRef} className="editor-tabs" role="tablist" aria-label="Open editors">
      <button
        role="tab"
        aria-selected={active === null}
        className={`editor-tab${active === null ? ' active' : ''}`}
        title={chat?.title ?? project.name}
        onClick={() => onActivate(null)}
      >
        {chat ? (
          <AgentIcon id={chat.environmentId} size={13} tile={false} />
        ) : (
          <House size={13} strokeWidth={1.75} />
        )}
        <span className="editor-tab-name">{chat?.title ?? project.name}</span>
      </button>
      {tabs.map((tab) => {
        const dirty = isDirty(project.id, tab.path)
        const hint = folderHints.get(tab.path)
        return (
          <div
            key={tab.path}
            role="tab"
            aria-selected={active === tab.path}
            className={`editor-tab file${active === tab.path ? ' active' : ''}${tab.preview ? ' preview' : ''}${dirty ? ' dirty' : ''}`}
            title={tab.path}
            onClick={() => onActivate(tab.path)}
            onDoubleClick={() => onPin(tab.path)}
            onMouseDown={(event) => {
              // Middle-click closes, like a browser or VS Code
              if (event.button === 1) event.preventDefault()
            }}
            onAuxClick={(event) => event.button === 1 && onClose([tab.path])}
            onContextMenu={(event) => {
              event.preventDefault()
              showMenu(tab)
            }}
          >
            <FileIcon name={basename(tab.path)} kind="file" />
            <span className="editor-tab-name">{basename(tab.path)}</span>
            {hint && <span className="editor-tab-hint">{hint}</span>}
            <button
              className="editor-tab-close"
              aria-label={
                dirty ? `Close ${basename(tab.path)} (unsaved)` : `Close ${basename(tab.path)}`
              }
              title={dirty ? 'Unsaved changes' : 'Close (⌘W)'}
              onClick={(event) => {
                event.stopPropagation()
                onClose([tab.path])
              }}
            >
              <X size={12} strokeWidth={2} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default EditorTabs
