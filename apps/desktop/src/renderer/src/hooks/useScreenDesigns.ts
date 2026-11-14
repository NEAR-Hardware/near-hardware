import { useEffect, useState } from 'react'

// Agents save UI mockups here, one file per screen, at the panel's exact resolution
export const DESIGNS_DIR = 'screens'

export type ScreenDesign = { path: string; name: string }
export type DesignContent = { kind: 'html'; html: string } | { kind: 'image'; src: string }

const DESIGN_FILE = /\.(html?|svg|png|jpe?g|gif|webp|bmp)$/i
const selectionKey = (projectId: string): string => `near-hardware.screen-design.${projectId}`

function readSelection(projectId: string): string | null {
  try {
    return localStorage.getItem(selectionKey(projectId))
  } catch {
    return null
  }
}

const inDesigns = (path: string): boolean =>
  path === DESIGNS_DIR || path.startsWith(`${DESIGNS_DIR}/`)

// The project's screen designs and the selected one's content, kept live as the
// agent edits them. The selection is shared with the floating screen window.
export function useScreenDesigns(projectId: string): {
  designs: ScreenDesign[]
  active: ScreenDesign | undefined
  content: DesignContent | null
  select: (path: string) => void
} {
  const [designs, setDesigns] = useState<ScreenDesign[]>([])
  const [selected, setSelected] = useState(() => readSelection(projectId))
  const [revision, setRevision] = useState(0)
  const [loaded, setLoaded] = useState<{ path: string; content: DesignContent | null }>()

  useEffect(() => {
    let cancelled = false
    const list = (): void => {
      window.api.files.list(projectId, DESIGNS_DIR, { optional: true }).then(
        (entries) => {
          if (cancelled) return
          setDesigns(
            entries
              .filter((entry) => entry.kind === 'file' && DESIGN_FILE.test(entry.name))
              .map((entry) => ({ path: entry.path, name: entry.name.replace(/\.[^.]+$/, '') }))
          )
        },
        () => !cancelled && setDesigns([])
      )
    }
    list()
    const offChange = window.api.files.onChange((event) => {
      if (event.projectId !== projectId) return
      if (event.dirs.some((dir) => dir === '' || inDesigns(dir))) list()
      if (event.paths.some(inDesigns)) setRevision((r) => r + 1)
    })
    // Another window picked a different design
    const onStorage = (event: StorageEvent): void => {
      if (event.key === selectionKey(projectId)) setSelected(event.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => {
      cancelled = true
      offChange()
      window.removeEventListener('storage', onStorage)
    }
  }, [projectId])

  const active = designs.find((design) => design.path === selected) ?? designs[0]
  const activePath = active?.path

  useEffect(() => {
    if (!activePath) return
    let cancelled = false
    window.api.files.read(projectId, activePath).then(
      (file): void => {
        if (cancelled) return
        let content: DesignContent | null = null
        if (file.kind === 'image') content = { kind: 'image', src: file.dataUrl }
        else if (file.kind === 'text') content = { kind: 'html', html: file.text }
        setLoaded({ path: activePath, content })
      },
      () => !cancelled && setLoaded({ path: activePath, content: null })
    )
    return () => {
      cancelled = true
    }
  }, [projectId, activePath, revision])

  const select = (path: string): void => {
    setSelected(path)
    try {
      localStorage.setItem(selectionKey(projectId), path)
    } catch {
      // The choice just won't be remembered
    }
  }

  return {
    designs,
    active,
    content: active && loaded?.path === active.path ? loaded.content : null,
    select
  }
}
