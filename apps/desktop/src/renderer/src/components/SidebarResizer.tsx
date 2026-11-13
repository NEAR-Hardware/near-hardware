import { useRef } from 'react'
import { SIDEBAR_MAX_WIDTH, SIDEBAR_MIN_WIDTH } from '../sidebarLayout'

const KEYBOARD_STEP = 16

type SidebarResizerProps = {
  open: boolean
  width: number
  // startWidth is the width before this drag, so a snap-collapse can restore it
  onResize: (width: number, startWidth: number) => void
  onResizingChange: (resizing: boolean) => void
  onReset: () => void
}

function SidebarResizer({
  open,
  width,
  onResize,
  onResizingChange,
  onReset
}: SidebarResizerProps): React.JSX.Element {
  const drag = useRef<{ startX: number; startWidth: number } | null>(null)

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0) return
    event.preventDefault()
    // Capture keeps the drag alive outside the window and after a snap-collapse
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { startX: event.clientX, startWidth: width }
    onResizingChange(true)
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (!drag.current) return
    const { startX, startWidth } = drag.current
    onResize(startWidth + event.clientX - startX, startWidth)
  }

  const endDrag = (): void => {
    if (!drag.current) return
    drag.current = null
    onResizingChange(false)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      onResize(width + (event.key === 'ArrowLeft' ? -KEYBOARD_STEP : KEYBOARD_STEP), width)
    }
  }

  return (
    <div
      className="sidebar-resizer"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize sidebar"
      aria-valuenow={width}
      aria-valuemin={SIDEBAR_MIN_WIDTH}
      aria-valuemax={SIDEBAR_MAX_WIDTH}
      title="Drag to resize, double-click to reset"
      tabIndex={open ? 0 : -1}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onDoubleClick={onReset}
      onKeyDown={onKeyDown}
    />
  )
}

export default SidebarResizer
