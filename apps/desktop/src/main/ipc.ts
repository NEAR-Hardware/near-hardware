import { BrowserWindow, Menu, dialog, ipcMain, shell } from 'electron'
import { is } from '@electron-toolkit/utils'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { PermissionDecision, SendMessageInput } from '../shared/chat'
import type { MenuItemSpec } from '../shared/projects'
import {
  disposeChat,
  interruptChat,
  openChat,
  respondToPermission,
  sendMessage,
  setChatModel,
  setChatPermissionMode
} from './chat/manager'
import {
  listDirectory,
  readProjectFile,
  resolveInProject,
  stopWatching,
  watchProject,
  writeProjectFile
} from './files'
import { registerHardwareIpc } from './hardware/ipc'
import {
  addExistingFolder,
  createChat,
  createProject,
  defaultProjectLocation,
  deleteChat,
  getProject,
  removeProject
} from './projects'
import {
  ENVIRONMENTS,
  isEnvironmentId,
  type ConnectEnvironmentResult,
  type ConnectedEnvironment,
  type EnvironmentId
} from '../shared/environments'
import { detectEnvironment } from './environments'
import { readSettings, updateSettings } from './settings'

// Dev only: pretend some agents are missing to try the install flow, e.g.
// NEAR_HARDWARE_HIDE_AGENTS=codex,cursor bun run dev
const hiddenInDev = new Set(
  is.dev ? (process.env.NEAR_HARDWARE_HIDE_AGENTS ?? '').split(',').map((id) => id.trim()) : []
)

const detect = (id: EnvironmentId): ReturnType<typeof detectEnvironment> =>
  hiddenInDev.has(id) ? Promise.resolve({ id, installed: false }) : detectEnvironment(id)

function assertEnvironmentId(value: unknown): EnvironmentId {
  if (!isEnvironmentId(value)) throw new Error(`Unknown environment: ${String(value)}`)
  return value
}

export function registerIpcHandlers(): void {
  registerHardwareIpc()

  ipcMain.handle('environments:detect-all', () =>
    Promise.all(ENVIRONMENTS.map((environment) => detect(environment.id)))
  )

  ipcMain.handle('environments:detect', (_event, id: unknown) => detect(assertEnvironmentId(id)))

  ipcMain.handle(
    'environments:list-connected',
    async () => (await readSettings()).connectedEnvironments
  )

  ipcMain.handle(
    'environments:connect',
    async (_event, id: unknown): Promise<ConnectEnvironmentResult> => {
      const status = await detect(assertEnvironmentId(id))
      if (!status.installed) return { ok: false, status }

      let environment: ConnectedEnvironment = { ...status, connectedAt: new Date().toISOString() }
      await updateSettings((settings) => {
        const existing = settings.connectedEnvironments.find((e) => e.id === status.id)
        if (!existing) {
          return {
            ...settings,
            connectedEnvironments: [...settings.connectedEnvironments, environment]
          }
        }
        // Reconnecting refreshes the saved paths and version, keeping the original date
        environment = { ...environment, connectedAt: existing.connectedAt }
        return {
          ...settings,
          connectedEnvironments: settings.connectedEnvironments.map((e) =>
            e.id === status.id ? environment : e
          )
        }
      })
      return { ok: true, environment }
    }
  )

  ipcMain.handle('environments:disconnect', async (_event, id: unknown) => {
    const environmentId = assertEnvironmentId(id)
    await updateSettings((settings) => ({
      ...settings,
      connectedEnvironments: settings.connectedEnvironments.filter((e) => e.id !== environmentId)
    }))
  })

  ipcMain.handle('projects:list', async () => (await readSettings()).projects)

  ipcMain.handle('projects:default-location', () => defaultProjectLocation())

  ipcMain.handle('projects:choose-location', async (event, current: unknown) => {
    const window = BrowserWindow.fromWebContents(event.sender)!
    const result = await dialog.showOpenDialog(window, {
      title: 'Choose where to create the project',
      buttonLabel: 'Choose',
      defaultPath: typeof current === 'string' ? current : undefined,
      properties: ['openDirectory', 'createDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('projects:create', (_event, input: unknown) => createProject(input))

  ipcMain.handle('projects:open-existing', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)!
    const result = await dialog.showOpenDialog(window, {
      title: 'Open a folder as a project',
      buttonLabel: 'Open',
      properties: ['openDirectory', 'createDirectory']
    })
    return result.canceled ? null : addExistingFolder(result.filePaths[0])
  })

  ipcMain.handle('projects:remove', async (_event, projectId: string) => {
    const project = await getProject(projectId)
    await Promise.all(project.chats.map((chat) => disposeChat(chat.id)))
    await removeProject(projectId)
  })

  ipcMain.handle('projects:reveal', async (_event, projectId: string) => {
    shell.showItemInFolder((await getProject(projectId)).path)
  })

  ipcMain.handle('projects:create-chat', (_event, projectId: string, environmentId: unknown) =>
    createChat(projectId, assertEnvironmentId(environmentId))
  )

  ipcMain.handle('projects:delete-chat', async (_event, projectId: string, chatId: string) => {
    await disposeChat(chatId)
    await deleteChat(projectId, chatId)
  })

  ipcMain.handle('chat:open', (event, projectId: string, chatId: string) =>
    openChat(projectId, chatId, event.sender)
  )

  ipcMain.handle(
    'chat:send',
    (_event, projectId: string, chatId: string, input: SendMessageInput) =>
      sendMessage(projectId, chatId, input)
  )

  // Native warning before an agent may act without asking
  ipcMain.handle('chat:confirm-yolo', async (event, agentName: string) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const options = {
      type: 'warning' as const,
      message: 'Turn on YOLO mode?',
      detail: `${agentName} will run commands, edit and delete files, and use the web without asking you first. Only use it in projects you trust.`,
      buttons: ['Turn On YOLO', 'Cancel'],
      defaultId: 1,
      cancelId: 1,
      checkboxLabel: 'Don’t ask again'
    }
    const { response, checkboxChecked } = window
      ? await dialog.showMessageBox(window, options)
      : await dialog.showMessageBox(options)
    return { confirmed: response === 0, dontAskAgain: response === 0 && checkboxChecked }
  })

  ipcMain.handle('chat:interrupt', (_event, chatId: string) => interruptChat(chatId))

  ipcMain.handle('chat:set-model', (_event, chatId: string, model: string) =>
    setChatModel(chatId, model)
  )

  ipcMain.handle('chat:set-permission-mode', (_event, chatId: string, mode: string) =>
    setChatPermissionMode(chatId, mode)
  )

  ipcMain.handle(
    'chat:respond-permission',
    (_event, chatId: string, itemId: string, decision: PermissionDecision) =>
      respondToPermission(chatId, itemId, decision)
  )

  ipcMain.handle(
    'files:list',
    async (_event, projectId: string, dir: string, options?: { optional?: boolean }) => {
      const root = (await getProject(projectId)).path
      if (options?.optional && !existsSync(join(root, dir))) return []
      return listDirectory(root, dir)
    }
  )

  ipcMain.handle('files:read', async (_event, projectId: string, path: string) =>
    readProjectFile((await getProject(projectId)).path, path)
  )

  ipcMain.handle('files:write', async (_event, projectId: string, path: string, text: string) =>
    writeProjectFile((await getProject(projectId)).path, path, text)
  )

  // Native "Save changes?" prompt before closing an edited tab
  ipcMain.handle('files:confirm-close', async (event, name: string) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const options = {
      type: 'warning' as const,
      message: `Do you want to save the changes you made to ${name}?`,
      detail: 'Your changes will be lost if you don’t save them.',
      buttons: ['Save', 'Don’t Save', 'Cancel'],
      defaultId: 0,
      cancelId: 2
    }
    const { response } = window
      ? await dialog.showMessageBox(window, options)
      : await dialog.showMessageBox(options)
    return (['save', 'discard', 'cancel'] as const)[response]
  })

  ipcMain.handle('files:open', async (_event, projectId: string, path: string) => {
    const error = await shell.openPath(
      await resolveInProject((await getProject(projectId)).path, path)
    )
    if (error) throw new Error(error)
  })

  ipcMain.handle('files:reveal', async (_event, projectId: string, path: string) => {
    shell.showItemInFolder(await resolveInProject((await getProject(projectId)).path, path))
  })

  ipcMain.handle('files:watch', async (event, projectId: string | null) => {
    if (!projectId) return stopWatching(event.sender)
    watchProject(projectId, (await getProject(projectId)).path, event.sender)
  })

  ipcMain.handle('menu:show', (event, items: MenuItemSpec[]) => {
    const window = BrowserWindow.fromWebContents(event.sender) ?? undefined
    return new Promise<string | null>((resolve) => {
      const menu = Menu.buildFromTemplate(
        items.map((item) =>
          'type' in item
            ? { type: 'separator' as const }
            : { label: item.label, enabled: item.enabled ?? true, click: () => resolve(item.id) }
        )
      )
      // The close callback can fire before click, so let a click resolve first
      menu.popup({ window, callback: () => setTimeout(() => resolve(null), 0) })
    })
  })
}
