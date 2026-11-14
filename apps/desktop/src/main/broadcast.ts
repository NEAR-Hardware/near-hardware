import { BrowserWindow } from 'electron'

// Sends an event to every window: the main window and any floating screens
export function broadcast(channel: string, payload?: unknown): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) window.webContents.send(channel, payload)
  }
}
