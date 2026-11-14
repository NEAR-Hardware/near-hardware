import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { MenuCommand, NearHardwareApi } from '../shared/api'
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
    onChange: (listener) => subscribe('projects:changed', listener),
    setBoard: (projectId, board, replace) =>
      ipcRenderer.invoke('projects:set-board', projectId, board, replace)
  },
  devices: {
    list: () => ipcRenderer.invoke('devices:list'),
    onChange: (listener) => subscribe('devices:changed', listener)
  },
  serial: {
    open: (path, baudRate) => ipcRenderer.invoke('serial:open', path, baudRate),
    close: (path) => ipcRenderer.invoke('serial:close', path),
    write: (path, data) => ipcRenderer.invoke('serial:write', path, data),
    onData: (listener) => subscribe('serial:data', listener),
    onOpened: (listener) => subscribe('serial:opened', listener),
    onClosed: (listener) => subscribe('serial:closed', listener),
    onError: (listener) => subscribe('serial:error', listener)
  },
  terminal: {
    create: (projectId, cols, rows) => ipcRenderer.invoke('terminal:create', projectId, cols, rows),
    write: (id, data) => ipcRenderer.invoke('terminal:write', id, data),
    resize: (id, cols, rows) => ipcRenderer.invoke('terminal:resize', id, cols, rows),
    kill: (id) => ipcRenderer.invoke('terminal:kill', id),
    onData: (listener) => subscribe('terminal:data', listener),
    onExit: (listener) => subscribe('terminal:exit', listener)
  },
  platformio: {
    status: () => ipcRenderer.invoke('platformio:status'),
    install: () => ipcRenderer.invoke('platformio:install'),
    onLog: (listener) => subscribe('platformio:log', listener)
  },
  chat: {
    open: (projectId, chatId) => ipcRenderer.invoke('chat:open', projectId, chatId),
    send: (projectId, chatId, input) => ipcRenderer.invoke('chat:send', projectId, chatId, input),
    interrupt: (chatId) => ipcRenderer.invoke('chat:interrupt', chatId),
    setModel: (chatId, model) => ipcRenderer.invoke('chat:set-model', chatId, model),
    setPermissionMode: (chatId, mode) =>
      ipcRenderer.invoke('chat:set-permission-mode', chatId, mode),
    confirmYolo: (agentName) => ipcRenderer.invoke('chat:confirm-yolo', agentName),
    respondToPermission: (chatId, itemId, decision) =>
      ipcRenderer.invoke('chat:respond-permission', chatId, itemId, decision),
    onEvent: (listener) => subscribe<ChatEventMessage>('chat:event', listener)
  },
  files: {
    list: (projectId, dir, options) => ipcRenderer.invoke('files:list', projectId, dir, options),
    read: (projectId, path) => ipcRenderer.invoke('files:read', projectId, path),
    write: (projectId, path, text) => ipcRenderer.invoke('files:write', projectId, path, text),
    confirmClose: (name) => ipcRenderer.invoke('files:confirm-close', name),
    open: (projectId, path) => ipcRenderer.invoke('files:open', projectId, path),
    reveal: (projectId, path) => ipcRenderer.invoke('files:reveal', projectId, path),
    watch: (projectId) => ipcRenderer.invoke('files:watch', projectId),
    onChange: (listener) => subscribe<FilesChangedEvent>('files:changed', listener)
  },
  screen: {
    popOut: (projectId) => ipcRenderer.invoke('screen:pop-out', projectId),
    dock: (projectId) => ipcRenderer.invoke('screen:dock', projectId),
    floating: () => ipcRenderer.invoke('screen:floating'),
    onFloatingChange: (listener) => subscribe<string[]>('screen:floating', listener),
    fit: (aspect) => ipcRenderer.invoke('screen:fit', aspect)
  },
  showMenu: (items) => ipcRenderer.invoke('menu:show', items),
  onMenuCommand: (listener) => subscribe<MenuCommand>('menu:command', listener)
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
