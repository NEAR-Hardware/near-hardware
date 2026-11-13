import { ipcMain } from 'electron'
import { is } from '@electron-toolkit/utils'
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
}
