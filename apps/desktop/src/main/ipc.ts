import { ipcMain } from 'electron'
import { is } from '@electron-toolkit/utils'
import { ENVIRONMENTS, isEnvironmentId, type EnvironmentId } from '../shared/environments'
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

  ipcMain.handle('environments:get-selected', async () => (await readSettings()).environment)

  ipcMain.handle('environments:select', async (_event, id: unknown) => {
    const status = await detect(assertEnvironmentId(id))
    if (!status.installed) return { ok: false, status }
    const environment = { ...status, selectedAt: new Date().toISOString() }
    await updateSettings({ environment })
    return { ok: true, environment }
  })

  ipcMain.handle('environments:clear', async () => {
    await updateSettings({ environment: null })
  })
}
