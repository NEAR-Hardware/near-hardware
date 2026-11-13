export const SIDEBAR_DEFAULT_WIDTH = 260
export const SIDEBAR_MIN_WIDTH = 200
export const SIDEBAR_MAX_WIDTH = 480
// Dragging the sidebar narrower than this snaps it closed, like VS Code
export const SIDEBAR_COLLAPSE_THRESHOLD = 140

export type SidebarLayout = {
  open: boolean
  width: number
}

const STORAGE_KEY = 'near-hardware.sidebar'

export function clampSidebarWidth(width: number): number {
  return Math.round(Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, width)))
}

export function loadSidebarLayout(): SidebarLayout {
  const fallback = { open: true, width: SIDEBAR_DEFAULT_WIDTH }
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (typeof saved?.open !== 'boolean' || typeof saved?.width !== 'number') return fallback
    return { open: saved.open, width: clampSidebarWidth(saved.width) }
  } catch {
    return fallback
  }
}

export function saveSidebarLayout(layout: SidebarLayout): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
  } catch {
    // Storage unavailable: the layout just won't survive a restart
  }
}
