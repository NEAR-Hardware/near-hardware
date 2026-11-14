import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { Project } from '../../../../shared/projects'
import { FLOATING_PADDING, deviceGeometry, type ScreenSpec } from '../../../../shared/screens'
import { useScreenDesigns } from '../../hooks/useScreenDesigns'
import DeviceFrame from './DeviceFrame'
import './Screen.css'

// Until the project's screen loads; matches the size the main process opens with
const FALLBACK: ScreenSpec = { width: 410, height: 502, shape: 'rounded' }

// A floating window that is just the device: drag it by the shell, resize from
// the edges, close it to put the screen back in the files panel
function FloatingScreen({ projectId }: { projectId: string }): React.JSX.Element {
  const [project, setProject] = useState<Project>()
  const { designs, active, content, select } = useScreenDesigns(projectId)
  const spec = project?.board?.screen ?? FALLBACK
  const { outerWidth, outerHeight } = deviceGeometry(spec)
  const aspect = outerWidth / outerHeight

  useEffect(() => {
    const load = (): void => {
      window.api.projects.list().then((projects) => {
        const found = projects.find((p) => p.id === projectId)
        setProject(found)
        document.title = found ? `${found.name} screen` : 'Screen'
      })
    }
    load()
    // Live updates for this project's designs, independent of the main window
    window.api.files.watch(projectId)
    const offProjects = window.api.projects.onChange(load)
    // ⌘W closes this window, like any tab
    const offMenu = window.api.onMenuCommand(
      (command) => command === 'close-tab' && window.api.screen.dock(projectId)
    )
    return () => {
      offProjects()
      offMenu()
    }
  }, [projectId])

  useEffect(() => {
    window.api.screen.fit(aspect)
  }, [aspect])

  const step = (direction: number): void => {
    if (designs.length < 2) return
    const index = designs.findIndex((design) => design.path === active?.path)
    select(designs[(index + direction + designs.length) % designs.length].path)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'ArrowLeft') step(-1)
      if (event.key === 'ArrowRight') step(1)
      if (event.key === 'Escape') window.api.screen.dock(projectId)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  return (
    <div className="floating-screen">
      <DeviceFrame
        spec={spec}
        content={content}
        inset={FLOATING_PADDING}
        maxScale={20}
        placeholder="No screen design yet"
      >
        <div className="device-controls">
          {designs.length > 1 && (
            <button
              aria-label="Previous design"
              title="Previous design (←)"
              onClick={() => step(-1)}
            >
              <ChevronLeft size={12} strokeWidth={2} />
            </button>
          )}
          <button
            aria-label="Close floating screen"
            title="Back to the files panel (Esc)"
            onClick={() => window.api.screen.dock(projectId)}
          >
            <X size={11} strokeWidth={2.25} />
          </button>
          {designs.length > 1 && (
            <button aria-label="Next design" title="Next design (→)" onClick={() => step(1)}>
              <ChevronRight size={12} strokeWidth={2} />
            </button>
          )}
        </div>
      </DeviceFrame>
    </div>
  )
}

export default FloatingScreen
