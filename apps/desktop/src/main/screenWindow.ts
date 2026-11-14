import { BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { FLOATING_PADDING, deviceGeometry } from '../shared/screens'
import { broadcast } from './broadcast'
import { getProject } from './projects'
import { loadRenderer } from './renderer'

// Floating screen previews, one per project: frameless, transparent windows
// that are just the device, like the iOS Simulator
const floating = new Map<string, BrowserWindow>()

const announce = (): void => broadcast('screen:floating', [...floating.keys()])

// Device height on screen when it first pops out
const START_HEIGHT = 440
const EXTRA = { width: FLOATING_PADDING * 2, height: FLOATING_PADDING * 2 }

async function popOut(projectId: string, parent: BrowserWindow | null): Promise<void> {
  const existing = floating.get(projectId)
  if (existing && !existing.isDestroyed()) {
    existing.show()
    existing.focus()
    return
  }
  const project = await getProject(projectId)
  const spec = project.board?.screen ?? { width: 410, height: 502, shape: 'rounded' as const }
  const { outerWidth, outerHeight } = deviceGeometry(spec)
  const aspect = outerWidth / outerHeight
  const deviceHeight = Math.round(aspect > 1.2 ? 560 / aspect : START_HEIGHT)
  const width = Math.round(deviceHeight * aspect) + EXTRA.width
  const height = deviceHeight + EXTRA.height
  const anchor = parent?.getBounds()

  const window = new BrowserWindow({
    width,
    height,
    minWidth: 80,
    minHeight: 80,
    ...(anchor && {
      x: anchor.x + anchor.width - width - 48,
      y: anchor.y + 72
    }),
    title: `${project.name} screen`,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    alwaysOnTop: true,
    resizable: true,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  window.setAspectRatio(aspect, EXTRA)
  window.once('ready-to-show', () => window.show())
  window.on('closed', () => {
    floating.delete(projectId)
    announce()
  })
  floating.set(projectId, window)
  loadRenderer(window, `/screen/${projectId}`)
  announce()
}

export function closeFloatingScreens(): void {
  for (const window of floating.values()) if (!window.isDestroyed()) window.close()
}

export function registerScreenIpc(): void {
  ipcMain.handle('screen:pop-out', (event, projectId: string) =>
    popOut(projectId, BrowserWindow.fromWebContents(event.sender))
  )
  ipcMain.handle('screen:dock', (_event, projectId: string) => floating.get(projectId)?.close())
  ipcMain.handle('screen:floating', () => [...floating.keys()])
  // The floating window keeps the device's proportions when the screen spec changes
  ipcMain.handle('screen:fit', (event, aspect: number) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window || !Number.isFinite(aspect) || aspect <= 0) return
    const [, height] = window.getSize()
    window.setAspectRatio(aspect, EXTRA)
    window.setSize(Math.round((height - EXTRA.height) * aspect) + EXTRA.width, height)
  })
}
