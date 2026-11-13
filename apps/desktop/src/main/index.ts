import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { closeAllChats } from './chat/manager'
import { setBridgeWindow, startBridge } from './hardware/bridge'
import { closeAllTerminals } from './hardware/ipc'
import { closeAllPorts, setSerialEventSink } from './hardware/serial'
import { registerIpcHandlers } from './ipc'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 780,
    // Leaves room for the sidebar, files panel and a usable main area
    minWidth: 900,
    minHeight: 480,
    show: false,
    autoHideMenuBar: true,
    // Hide the native title bar so the app's background runs to the top edge.
    // Keep in sync with --bg and --titlebar-height in the renderer's main.css.
    backgroundColor: '#161616',
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 12, y: 11 },
    ...(process.platform !== 'darwin'
      ? { titleBarOverlay: { color: '#161616', symbolColor: '#a0a0a0', height: 36 } }
      : {}),
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  setBridgeWindow(mainWindow.webContents)
  setSerialEventSink((channel, payload) => {
    if (!mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload)
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.nearhardware.desktop')

  // Packaged builds get the icon from build/icon.icns; in dev macOS would show Electron's
  if (is.dev && process.platform === 'darwin') {
    app.dock?.setIcon(icon)
  }

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()
  // Agents' MCP servers call into the app through this local bridge
  await startBridge()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Stop every agent CLI and save open transcripts before quitting
let quitting = false
app.on('before-quit', (event) => {
  if (quitting) return
  quitting = true
  event.preventDefault()
  closeAllPorts()
  closeAllTerminals()
  closeAllChats().finally(() => app.quit())
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
