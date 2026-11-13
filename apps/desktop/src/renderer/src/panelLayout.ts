export type PanelConfig = {
  storageKey: string
  defaultWidth: number
  minWidth: number
  maxWidth: number
  // Dragging the panel narrower than this snaps it closed, like VS Code
  collapseThreshold: number
}

export const SIDEBAR_PANEL: PanelConfig = {
  storageKey: 'near-hardware.sidebar',
  defaultWidth: 260,
  minWidth: 200,
  maxWidth: 480,
  collapseThreshold: 140
}

export const FILES_PANEL: PanelConfig = {
  storageKey: 'near-hardware.files-panel',
  defaultWidth: 280,
  minWidth: 220,
  maxWidth: 560,
  collapseThreshold: 160
}

// Panels never squeeze the main area below this
export const MAIN_MIN_WIDTH = 320

export type PanelLayout = {
  open: boolean
  width: number
}

export function clampPanelWidth(config: PanelConfig, width: number, maxWidth = Infinity): number {
  const max = Math.max(config.minWidth, Math.min(config.maxWidth, maxWidth))
  return Math.round(Math.min(max, Math.max(config.minWidth, width)))
}

export function loadPanelLayout(config: PanelConfig): PanelLayout {
  const fallback = { open: true, width: config.defaultWidth }
  try {
    const saved = JSON.parse(localStorage.getItem(config.storageKey) ?? 'null')
    if (typeof saved?.open !== 'boolean' || typeof saved?.width !== 'number') return fallback
    return { open: saved.open, width: clampPanelWidth(config, saved.width) }
  } catch {
    return fallback
  }
}

export function savePanelLayout(config: PanelConfig, layout: PanelLayout): void {
  try {
    localStorage.setItem(config.storageKey, JSON.stringify(layout))
  } catch {
    // Storage unavailable: the layout just won't survive a restart
  }
}
