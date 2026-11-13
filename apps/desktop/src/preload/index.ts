import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { NearHardwareApi } from '../shared/api'
import type { ChatEventMessage } from '../shared/chat'
import type { FilesChangedEvent } from '../shared/projects'

// Subscribes to a main-process event; returns the unsubscribe function
function subscribe<T>(channel: string, listener: (payload: T) => void): () => void {
  const handler = (_event: IpcRendererEvent, payload: T): void => listener(payload)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

// Custom APIs for renderer
const api: NearHardwareApi = {
  environments: {
    detectAll: () => ipcRenderer.invoke('environments:detect-all'),
    detect: (id) => ipcRenderer.invoke('environments:detect', id),
    listConnected: () => ipcRenderer.invoke('environments:list-connected'),
    connect: (id) => ipcRenderer.invoke('environments:connect', id),
    disconnect: (id) => ipcRenderer.invoke('environments:disconnect', id)
  },
  projects: {
    list: () => ipcRenderer.invoke('projects:list'),
    defaultLocation: () => ipcRenderer.invoke('projects:default-location'),
    chooseLocation: (current) => ipcRenderer.invoke('projects:choose-location', current),
    create: (input) => ipcRenderer.invoke('projects:create', input),
    openExisting: () => ipcRenderer.invoke('projects:open-existing'),
    remove: (projectId) => ipcRenderer.invoke('projects:remove', projectId),
    reveal: (projectId) => ipcRenderer.invoke('projects:reveal', projectId),
    createChat: (projectId, environmentId) =>
      ipcRenderer.invoke('projects:create-chat', projectId, environmentId),
    deleteChat: (projectId, chatId) =>
      ipcRenderer.invoke('projects:delete-chat', projectId, chatId),
    onChange: (listener) => subscribe('projects:changed', listener)
  },
  chat: {
    open: (projectId, chatId) => ipcRenderer.invoke('chat:open', projectId, chatId),
    send: (projectId, chatId, input) => ipcRenderer.invoke('chat:send', projectId, chatId, input),
    interrupt: (chatId) => ipcRenderer.invoke('chat:interrupt', chatId),
    setModel: (chatId, model) => ipcRenderer.invoke('chat:set-model', chatId, model),
    setPermissionMode: (chatId, mode) =>
      ipcRenderer.invoke('chat:set-permission-mode', chatId, mode),
    respondToPermission: (chatId, itemId, decision) =>
      ipcRenderer.invoke('chat:respond-permission', chatId, itemId, decision),
    onEvent: (listener) => subscribe<ChatEventMessage>('chat:event', listener)
  },
  files: {
    list: (projectId, dir) => ipcRenderer.invoke('files:list', projectId, dir),
    open: (projectId, path) => ipcRenderer.invoke('files:open', projectId, path),
    reveal: (projectId, path) => ipcRenderer.invoke('files:reveal', projectId, path),
    watch: (projectId) => ipcRenderer.invoke('files:watch', projectId),
    onChange: (listener) => subscribe<FilesChangedEvent>('files:changed', listener)
  },
  showMenu: (items) => ipcRenderer.invoke('menu:show', items)
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
