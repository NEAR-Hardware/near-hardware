import { useCallback, useEffect, useState } from 'react'
import {
  documentKey,
  isDirty,
  retainDocuments,
  saveDocument,
  subscribeDocuments
} from '../editor/documents'
import { basename } from '../format'

// A file open in the center area. A preview tab (single click in the files
// panel) is replaced by the next file you preview, until you edit or pin it.
export type EditorTab = { path: string; preview: boolean }

// active is null when the project's chat (or home) is showing
type ProjectTabs = { tabs: EditorTab[]; active: string | null }
type TabsState = Record<string, ProjectTabs>

const STORAGE_KEY = 'near-hardware.editor-tabs'
const EMPTY: ProjectTabs = { tabs: [], active: null }

function load(): TabsState {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    if (saved && typeof saved === 'object') return saved
  } catch {
    // Fall through
  }
  return {}
}

function save(state: TabsState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage unavailable: tabs just don't survive a restart
  }
}

function openTab(
  current: ProjectTabs,
  path: string,
  preview: boolean,
  keep: (path: string) => boolean
): ProjectTabs {
  const existing = current.tabs.find((tab) => tab.path === path)
  if (existing) {
    const tabs = preview
      ? current.tabs
      : current.tabs.map((tab) => (tab.path === path ? { path, preview: false } : tab))
    return { tabs, active: path }
  }
  const tab = { path, preview }
  const previewIndex = current.tabs.findIndex((t) => t.preview && !keep(t.path))
  if (preview && previewIndex >= 0) {
    return { tabs: current.tabs.with(previewIndex, tab), active: path }
  }
  // New tabs open to the right of the active one
  const activeIndex = current.tabs.findIndex((t) => t.path === current.active)
  const at = activeIndex >= 0 ? activeIndex + 1 : current.tabs.length
  return { tabs: current.tabs.toSpliced(at, 0, tab), active: path }
}

function closeTabs(current: ProjectTabs, paths: string[]): ProjectTabs {
  const tabs = current.tabs.filter((tab) => !paths.includes(tab.path))
  if (!current.active || !paths.includes(current.active)) return { ...current, tabs }
  // Like VS Code: the tab to the right takes over, else the one to the left
  const index = current.tabs.findIndex((tab) => tab.path === current.active)
  const next =
    current.tabs.slice(index + 1).find((tab) => !paths.includes(tab.path)) ??
    current.tabs
      .slice(0, index)
      .reverse()
      .find((tab) => !paths.includes(tab.path))
  return { tabs, active: next?.path ?? null }
}

// Editing a preview tab keeps it open, like VS Code
function pinDirty(state: TabsState): TabsState {
  let changed = false
  const next: TabsState = {}
  for (const [projectId, project] of Object.entries(state)) {
    const tabs = project.tabs.map((tab) => {
      if (!tab.preview || !isDirty(projectId, tab.path)) return tab
      changed = true
      return { ...tab, preview: false }
    })
    next[projectId] = { ...project, tabs }
  }
  return changed ? next : state
}

export type EditorTabs = {
  tabs: EditorTab[]
  active: string | null
  open: (path: string, preview: boolean) => void
  activate: (path: string | null) => void
  // Brings a project's chat tab to the front
  showChat: (projectId: string) => void
  pin: (path: string) => void
  // Asks before dropping unsaved edits; resolves false if the user cancels
  close: (paths: string[]) => Promise<boolean>
}

export function useEditorTabs(projectId: string | undefined): EditorTabs {
  const [state, setState] = useState<TabsState>(load)

  useEffect(() => save(state), [state])

  // Frees editor models once no tab shows their file
  useEffect(() => {
    const keys = new Set<string>()
    for (const [id, project] of Object.entries(state))
      for (const tab of project.tabs) keys.add(documentKey(id, tab.path))
    retainDocuments(keys)
  }, [state])

  useEffect(() => subscribeDocuments(() => setState(pinDirty)), [])

  const current = (projectId && state[projectId]) || EMPTY

  const update = useCallback(
    (change: (current: ProjectTabs) => ProjectTabs) => {
      if (!projectId) return
      setState((s) => ({ ...s, [projectId]: change(s[projectId] ?? EMPTY) }))
    },
    [projectId]
  )

  const open = useCallback(
    (path: string, preview: boolean) =>
      update((c) => openTab(c, path, preview, (p) => !!projectId && isDirty(projectId, p))),
    [update, projectId]
  )

  const activate = useCallback(
    (path: string | null) => update((c) => ({ ...c, active: path })),
    [update]
  )

  const showChat = useCallback(
    (id: string) =>
      setState((s) => (s[id]?.active ? { ...s, [id]: { ...s[id], active: null } } : s)),
    []
  )

  const pin = useCallback(
    (path: string) =>
      update((c) => ({
        ...c,
        tabs: c.tabs.map((tab) => (tab.path === path ? { path, preview: false } : tab))
      })),
    [update]
  )

  const close = useCallback(
    async (paths: string[]): Promise<boolean> => {
      if (!projectId) return false
      for (const path of paths) {
        if (!isDirty(projectId, path)) continue
        const choice = await window.api.files.confirmClose(basename(path))
        if (choice === 'cancel') return false
        if (choice === 'save') {
          try {
            await saveDocument(projectId, path)
          } catch (error) {
            window.alert(`Couldn’t save ${basename(path)}: ${(error as Error).message}`)
            return false
          }
        }
      }
      update((c) => closeTabs(c, paths))
      return true
    },
    [projectId, update]
  )

  return { tabs: current.tabs, active: current.active, open, activate, showChat, pin, close }
}
