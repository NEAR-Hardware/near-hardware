import { useRef } from 'react'

const KEYBOARD_STEP = 16

type PanelResizerProps = {
  // Which window edge the panel sits against; a right panel grows as you drag left
  side: 'left' | 'right'
  className: string
  label: string
  open: boolean
  width: number
  minWidth: number
  maxWidth: number
  // startWidth is the width before this drag, so a snap-collapse can restore it
  onResize: (width: number, startWidth: number) => void
  onResizingChange: (resizing: boolean) => void
  onReset: () => void
}

function PanelResizer({
  side,
  className,
  label,
  open,
  width,
  minWidth,
  maxWidth,
  onResize,
  onResizingChange,
  onReset
}: PanelResizerProps): React.JSX.Element {
  const drag = useRef<{ startX: number; startWidth: number } | null>(null)
  const direction = side === 'left' ? 1 : -1

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
    onResize(startWidth + direction * (event.clientX - startX), startWidth)
  }

  const endDrag = (): void => {
    if (!drag.current) return
    drag.current = null
    onResizingChange(false)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      const step = (event.key === 'ArrowRight' ? 1 : -1) * direction * KEYBOARD_STEP
      onResize(width + step, width)
    }
  }

  return (
    <div
      className={`panel-resizer ${className}`}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={width}
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth}
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

export default PanelResizer
