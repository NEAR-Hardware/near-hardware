import { useCallback, useEffect, useState } from 'react'
import {
  clampPanelWidth,
  loadPanelLayout,
  savePanelLayout,
  type PanelConfig,
  type PanelLayout
} from '../panelLayout'

export type Panel = {
  layout: PanelLayout
  resizing: boolean
  setResizing: (resizing: boolean) => void
  toggle: () => void
  // startWidth is the width before the drag, restored if it snaps closed
  resize: (width: number, startWidth: number, maxWidth?: number) => void
  reset: () => void
}

// Open/closed state and width of a resizable side panel, persisted per panel
export function usePanel(config: PanelConfig): Panel {
  const [layout, setLayout] = useState(() => loadPanelLayout(config))
  const [resizing, setResizing] = useState(false)

  // Save once a drag ends rather than on every pointer move
  useEffect(() => {
    if (!resizing) savePanelLayout(config, layout)
  }, [config, layout, resizing])

  const toggle = useCallback(() => setLayout((l) => ({ ...l, open: !l.open })), [])

  const resize = useCallback(
    (width: number, startWidth: number, maxWidth?: number) =>
      setLayout(
        width < config.collapseThreshold
          ? { open: false, width: startWidth }
          : { open: true, width: clampPanelWidth(config, width, maxWidth) }
      ),
    [config]
  )

  const reset = useCallback(
    () => setLayout((l) => ({ ...l, width: config.defaultWidth })),
    [config]
  )

  return { layout, resizing, setResizing, toggle, resize, reset }
}
