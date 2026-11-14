// "An agent needs you": the dock bounces while the app is in the background
import { app, BrowserWindow, ipcMain } from 'electron'

export function requestAttention(): void {
  const focused = BrowserWindow.getAllWindows().some((w) => !w.isDestroyed() && w.isFocused())
  if (!focused) app.dock?.bounce('informational')
}

export function registerAttentionIpc(): void {
  ipcMain.handle('app:request-attention', () => requestAttention())
}
