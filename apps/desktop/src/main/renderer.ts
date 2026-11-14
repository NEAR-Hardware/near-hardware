import type { BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

// Loads the renderer: the dev server with HMR in development, the built files otherwise.
// The hash picks a view, e.g. "/screen/<projectId>" for a floating screen.
export function loadRenderer(window: BrowserWindow, hash = ''): void {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}${hash ? `#${hash}` : ''}`)
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'), hash ? { hash } : undefined)
  }
}
