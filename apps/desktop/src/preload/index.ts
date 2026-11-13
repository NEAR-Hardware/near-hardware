import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { NearHardwareApi } from '../shared/api'

// Custom APIs for renderer
const api: NearHardwareApi = {
  environments: {
    detectAll: () => ipcRenderer.invoke('environments:detect-all'),
    detect: (id) => ipcRenderer.invoke('environments:detect', id),
    listConnected: () => ipcRenderer.invoke('environments:list-connected'),
    connect: (id) => ipcRenderer.invoke('environments:connect', id),
    disconnect: (id) => ipcRenderer.invoke('environments:disconnect', id)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
