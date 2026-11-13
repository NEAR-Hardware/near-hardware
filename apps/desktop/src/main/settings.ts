import { app } from 'electron'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { ConnectedEnvironment, EnvironmentStatus } from '../shared/environments'

export type Settings = {
  connectedEnvironments: ConnectedEnvironment[]
}

const DEFAULT_SETTINGS: Settings = { connectedEnvironments: [] }

type StoredSettings = Partial<Settings> & {
  // Earlier versions saved a single selected environment
  environment?: (EnvironmentStatus & { selectedAt: string }) | null
}

const settingsFile = (): string => join(app.getPath('userData'), 'settings.json')

export async function readSettings(): Promise<Settings> {
  let stored: StoredSettings = {}
  try {
    stored = JSON.parse(await readFile(settingsFile(), 'utf8'))
  } catch {
    // First run or unreadable file: fall back to defaults
  }
  const { environment, ...rest } = stored
  const settings: Settings = { ...DEFAULT_SETTINGS, ...rest }
  if (!stored.connectedEnvironments && environment) {
    const { selectedAt, ...status } = environment
    settings.connectedEnvironments = [{ ...status, connectedAt: selectedAt }]
  }
  return settings
}

let pendingUpdate: Promise<unknown> = Promise.resolve()

// Updates run one at a time so concurrent changes (like connecting several
// agents at once) can't overwrite each other
export function updateSettings(update: (settings: Settings) => Settings): Promise<Settings> {
  const run = pendingUpdate.then(async () => {
    const next = update(await readSettings())
    const file = settingsFile()
    await mkdir(dirname(file), { recursive: true })
    // Write then rename so a crash mid-write can't leave a half-written file
    await writeFile(`${file}.tmp`, JSON.stringify(next, null, 2))
    await rename(`${file}.tmp`, file)
    return next
  })
  pendingUpdate = run.catch(() => undefined)
  return run
}
