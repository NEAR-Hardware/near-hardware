import { app } from 'electron'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { SelectedEnvironment } from '../shared/environments'

export type Settings = {
  environment: SelectedEnvironment | null
}

const DEFAULT_SETTINGS: Settings = { environment: null }

const settingsFile = (): string => join(app.getPath('userData'), 'settings.json')

export async function readSettings(): Promise<Settings> {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(await readFile(settingsFile(), 'utf8')) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await readSettings()), ...patch }
  const file = settingsFile()
  await mkdir(dirname(file), { recursive: true })
  // Write then rename so a crash mid-write can't leave a half-written file
  await writeFile(`${file}.tmp`, JSON.stringify(next, null, 2))
  await rename(`${file}.tmp`, file)
  return next
}
