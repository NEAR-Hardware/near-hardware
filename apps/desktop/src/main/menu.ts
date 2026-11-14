import { BrowserWindow, Menu, type MenuItemConstructorOptions } from 'electron'
import type { MenuCommand } from '../shared/api'

// Sends a menu command to the focused window's renderer, or the app's only
// window when the menu is used while it isn't focused (e.g. via accessibility)
const command =
  (name: MenuCommand) =>
  (_item: unknown, window: unknown): void => {
    const target =
      window instanceof BrowserWindow
        ? window
        : (BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0])
    target?.webContents.send('menu:command', name)
  }

// Electron's default menu, except ⌘W closes the editor tab and ⌘⇧W the
// window, like VS Code
export function setAppMenu(): void {
  const isMac = process.platform === 'darwin'
  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' as const }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: command('save') },
        { type: 'separator' },
        { label: 'Close Tab', accelerator: 'CmdOrCtrl+W', click: command('close-tab') },
        { role: 'close', label: 'Close Window', accelerator: 'CmdOrCtrl+Shift+W' },
        ...(isMac ? [] : [{ type: 'separator' as const }, { role: 'quit' as const }])
      ]
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' }
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
