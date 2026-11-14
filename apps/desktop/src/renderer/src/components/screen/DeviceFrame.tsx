import { useLayoutEffect, useRef, useState } from 'react'
import { deviceGeometry, type ScreenSpec } from '../../../../shared/screens'
import type { DesignContent } from '../../hooks/useScreenDesigns'
import './Screen.css'

// Designs are authored at panel resolution; this keeps them from scrolling or
// showing the browser's white background before their own styles apply
const BASE_STYLE =
  '<style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000}</style>'

type DeviceFrameProps = {
  spec: ScreenSpec
  content: DesignContent | null
  // Space kept free around the device inside its stage
  inset?: number
  // Largest upscale, so a 128×64 OLED doesn't fill the whole panel
  maxScale?: number
  placeholder?: React.ReactNode
  // Drawn on the shell, e.g. the floating window's buttons in the top bezel
  children?: React.ReactNode
}

// The board's screen inside a black plastic shell, scaled to fit its container
function DeviceFrame({
  spec,
  content,
  inset = 0,
  maxScale = 3,
  placeholder,
  children
}: DeviceFrameProps): React.JSX.Element {
  const stageRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState({ width: 0, height: 0 })
  const { bezel, screenRadius, outerWidth, outerHeight, outerRadius } = deviceGeometry(spec)

  useLayoutEffect(() => {
    const element = stageRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) =>
      setStage({ width: entry.contentRect.width, height: entry.contentRect.height })
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const scale = Math.max(
    0,
    Math.min(
      (stage.width - inset * 2) / outerWidth,
      (stage.height - inset * 2) / outerHeight,
      maxScale
    )
  )

  return (
    <div ref={stageRef} className="device-stage">
      {scale > 0 && (
        <div
          className={`device ${spec.shape}`}
          style={
            {
              width: outerWidth * scale,
              height: outerHeight * scale,
              padding: bezel * scale,
              borderRadius: outerRadius * scale,
              '--bezel': `${bezel * scale}px`
            } as React.CSSProperties
          }
        >
          <div
            className="device-screen"
            style={{
              width: spec.width * scale,
              height: spec.height * scale,
              borderRadius: screenRadius * scale
            }}
          >
            {content?.kind === 'html' && (
              <iframe
                title="Screen design"
                // No scripts, no same-origin access: designs are pictures, not apps
                sandbox=""
                srcDoc={BASE_STYLE + content.html}
                style={{ width: spec.width, height: spec.height, transform: `scale(${scale})` }}
              />
            )}
            {content?.kind === 'image' && (
              <img
                src={content.src}
                alt="Screen design"
                // Upscaled small panels show their real pixels
                style={{ imageRendering: scale >= 1.5 ? 'pixelated' : 'auto' }}
              />
            )}
            {!content && <div className="device-placeholder">{placeholder}</div>}
          </div>
          {children}
        </div>
      )}
    </div>
  )
}

export default DeviceFrame
