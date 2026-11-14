import { useCallback, useEffect, useRef, useState } from 'react'
import { Files, PanelRight } from 'lucide-react'
import type { FileEntry, Project } from '../../../shared/projects'
import { basename, joinPath, revealLabel } from '../format'
import FileIcon from './FileIcon'
import './FilesPanel.css'

type FilesPanelProps = {
  project: Project
  open: boolean
  // The file showing in the editor, highlighted in the tree
  activePath: string | null
  onToggle: () => void
  // Single click previews a file in a tab; double click or Enter keeps it open
  onOpenFile: (path: string, preview: boolean) => void
}

function FilesPanel({
  project,
  open,
  activePath,
  onToggle,
  onOpenFile
}: FilesPanelProps): React.JSX.Element {
  return (
    <aside className="files-panel" inert={!open} aria-label="Files">
      <div className="files-panel-content">
        <div className="files-header">
          <div className="files-tab">
            <Files size={14} strokeWidth={1.5} /> Files
          </div>
          <div className="files-header-spacer" />
          <button
            className="icon-button"
            aria-label="Hide files"
            title="Hide files (⌥⌘B)"
            onClick={onToggle}
          >
            <PanelRight size={16} strokeWidth={1.5} />
          </button>
        </div>
        {/* Remount per project so tree state never leaks between projects */}
        <FileTree
          key={project.id}
          project={project}
          activePath={activePath}
          onOpenFile={onOpenFile}
        />
      </div>
    </aside>
  )
}

type Row = { entry: FileEntry; depth: number }

type FileTreeProps = Pick<FilesPanelProps, 'project' | 'activePath' | 'onOpenFile'>

function FileTree({ project, activePath, onOpenFile }: FileTreeProps): React.JSX.Element {
  // Loaded directory listings, keyed by relative path ("" is the project folder)
  const [listings, setListings] = useState<Record<string, FileEntry[]>>({})
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set())
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const treeRef = useRef<HTMLDivElement>(null)
  // Lets the change listener and click handlers see which folders are loaded
  const listingsRef = useRef(listings)
  useEffect(() => {
    listingsRef.current = listings
  }, [listings])

  const load = useCallback(
    (dir: string) =>
      window.api.files.list(project.id, dir).then(
        (entries) => {
          setListings((current) => ({ ...current, [dir]: entries }))
          if (dir === '') setError(null)
        },
        () => {
          if (dir === '') {
            setError('This folder can’t be read. It may have been moved or deleted.')
            return
          }
          // The folder is gone; forget its stale listing
          setListings((current) => {
            const next = { ...current }
            delete next[dir]
            return next
          })
        }
      ),
    [project.id]
  )

  useEffect(() => {
    load('')
    window.api.files.watch(project.id)
    const unsubscribe = window.api.files.onChange((event) => {
      if (event.projectId !== project.id) return
      // Only re-list folders that are on screen; others load fresh when opened
      for (const dir of event.dirs) if (dir in listingsRef.current) load(dir)
    })
    return () => {
      unsubscribe()
      window.api.files.watch(null)
    }
  }, [project.id, load])

  const rows: Row[] = []
  const walk = (dir: string, depth: number): void => {
    for (const entry of listings[dir] ?? []) {
      rows.push({ entry, depth })
      if (entry.kind === 'directory' && expanded.has(entry.path)) walk(entry.path, depth + 1)
    }
  }
  walk('', 0)

  const setFolderOpen = (path: string, isOpen: boolean): void => {
    setExpanded((current) => {
      const next = new Set(current)
      if (isOpen) next.add(path)
      else next.delete(path)
      return next
    })
    if (isOpen && !(path in listingsRef.current)) load(path)
  }

  const select = (path: string): void => {
    setSelected(path)
    treeRef.current
      ?.querySelector(`[data-path="${CSS.escape(path)}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }

  const activate = (entry: FileEntry): void => {
    if (entry.kind === 'directory') setFolderOpen(entry.path, !expanded.has(entry.path))
    else onOpenFile(entry.path, false)
  }

  const showMenu = async (entry: FileEntry): Promise<void> => {
    setSelected(entry.path)
    const choice = await window.api.showMenu([
      ...(entry.kind === 'file'
        ? [
            { id: 'open', label: 'Open' },
            { id: 'open-external', label: 'Open in Default App' }
          ]
        : []),
      { id: 'reveal', label: revealLabel() },
      { type: 'separator' as const },
      { id: 'copy-path', label: 'Copy Path' },
      { id: 'copy-relative', label: 'Copy Relative Path' }
    ])
    if (choice === 'open') onOpenFile(entry.path, false)
    if (choice === 'open-external') window.api.files.open(project.id, entry.path)
    if (choice === 'reveal') window.api.files.reveal(project.id, entry.path)
    if (choice === 'copy-path') navigator.clipboard.writeText(joinPath(project.path, entry.path))
    if (choice === 'copy-relative') navigator.clipboard.writeText(entry.path)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    const index = rows.findIndex((row) => row.entry.path === selected)
    const current = rows[index]?.entry
    const handled = (): void => event.preventDefault()

    if (event.key === 'ArrowDown') {
      handled()
      const next = rows[Math.min(rows.length - 1, index + 1)]
      if (next) select(next.entry.path)
    } else if (event.key === 'ArrowUp') {
      handled()
      const previous = rows[Math.max(0, index - 1)]
      if (previous) select(previous.entry.path)
    } else if (event.key === 'ArrowRight' && current?.kind === 'directory') {
      handled()
      if (!expanded.has(current.path)) setFolderOpen(current.path, true)
      else if (rows[index + 1]?.depth > rows[index].depth) select(rows[index + 1].entry.path)
    } else if (event.key === 'ArrowLeft' && current) {
      handled()
      if (current.kind === 'directory' && expanded.has(current.path)) {
        setFolderOpen(current.path, false)
      } else {
        const parent = current.path.split('/').slice(0, -1).join('/')
        if (parent) select(parent)
      }
    } else if (event.key === 'Enter' && current) {
      handled()
      activate(current)
    }
  }

  if (error) return <p className="files-message">{error}</p>

  return (
    <div
      ref={treeRef}
      className="file-tree"
      role="tree"
      aria-label={`Files in ${project.name}`}
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <div className="file-tree-root" title={project.path}>
        {basename(project.path)}
      </div>
      {listings[''] && rows.length === 0 && (
        <p className="files-message">
          This folder is empty. Files your agent creates will show up here.
        </p>
      )}
      {rows.map(({ entry, depth }) => (
        <div
          key={entry.path}
          data-path={entry.path}
          className={`tree-row${selected === entry.path ? ' selected' : ''}${activePath === entry.path ? ' current' : ''}`}
          role="treeitem"
          aria-level={depth + 1}
          aria-selected={selected === entry.path}
          aria-expanded={entry.kind === 'directory' ? expanded.has(entry.path) : undefined}
          style={{ paddingLeft: 12 + depth * 14 }}
          title={entry.path}
          onClick={() => {
            setSelected(entry.path)
            if (entry.kind === 'directory') setFolderOpen(entry.path, !expanded.has(entry.path))
            else onOpenFile(entry.path, true)
          }}
          onDoubleClick={() => entry.kind === 'file' && activate(entry)}
          onContextMenu={(event) => {
            event.preventDefault()
            showMenu(entry)
          }}
        >
          <FileIcon name={entry.name} kind={entry.kind} expanded={expanded.has(entry.path)} />
          <span className="tree-name">{entry.name}</span>
        </div>
      ))}
    </div>
  )
}

export default FilesPanel
