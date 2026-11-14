// First-run setup guide: the app's location, Apple's Command Line Tools, the
// projects folder and whether each agent is signed in
import { app, ipcMain, shell } from 'electron'
import { execFile } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { delimiter, dirname, join } from 'node:path'
import { promisify } from 'node:util'
import type { AuthStatus, EnvironmentStatus } from '../shared/environments'
import type { PrepareFolderResult, SetupState } from '../shared/setup'
import { getSearchPath } from './environments'
import { readSettings, updateSettings } from './settings'

const execFileAsync = promisify(execFile)

const PRIVACY_FILES_AND_FOLDERS =
  'x-apple.systempreferences:com.apple.preference.security?Privacy_FilesAndFolders'

// xcode-select -p fails until the Command Line Tools (or Xcode) are installed;
// until then /usr/bin/git and python3 are stubs that ask to install them
async function hasDevTools(): Promise<boolean> {
  if (process.platform !== 'darwin') return true
  try {
    await execFileAsync('/usr/bin/xcode-select', ['-p'], { timeout: 5000 })
    return true
  } catch {
    return false
  }
}

async function setupState(): Promise<SetupState> {
  const settings = await readSettings()
  return {
    completed: Boolean(settings.setupCompletedAt),
    packaged: app.isPackaged,
    inApplications: process.platform !== 'darwin' || app.isInApplicationsFolder(),
    devTools: await hasDevTools()
  }
}

// Runs a CLI's status command; failures still carry their output
async function run(file: string, args: string[]): Promise<{ ok: boolean; output: string }> {
  const env = { ...process.env, PATH: (await getSearchPath()).join(delimiter) }
  try {
    const { stdout, stderr } = await execFileAsync(file, args, { timeout: 15000, env })
    return { ok: true, output: stdout + stderr }
  } catch (error) {
    const { stdout = '', stderr = '' } = error as { stdout?: string; stderr?: string }
    return { ok: false, output: stdout + stderr }
  }
}

export async function readAuthStatus(status: EnvironmentStatus): Promise<AuthStatus> {
  switch (status.id) {
    case 'claude-code': {
      if (!status.cliPath) return 'unknown'
      // Prints JSON like {"loggedIn": true, "authMethod": "claude.ai", ...}
      const { output } = await run(status.cliPath, ['auth', 'status'])
      const json = /\{[\s\S]*\}/.exec(output)?.[0]
      try {
        return JSON.parse(json ?? '').loggedIn ? 'signed-in' : 'signed-out'
      } catch {
        return 'unknown'
      }
    }
    case 'codex': {
      if (!status.cliPath) return 'unknown'
      // "Logged in using ChatGPT", or "Not logged in" with a non-zero exit
      const { ok, output } = await run(status.cliPath, ['login', 'status'])
      if (/not logged in/i.test(output)) return 'signed-out'
      return ok && /logged in/i.test(output) ? 'signed-in' : 'unknown'
    }
    case 'cursor': {
      if (!status.agentCliPath) return 'unknown'
      const { output } = await run(status.agentCliPath, ['status'])
      if (/not (logged|signed) in|unauthenticated|login required/i.test(output)) return 'signed-out'
      return /logged in|signed in/i.test(output) ? 'signed-in' : 'unknown'
    }
    case 'opencode':
      return 'not-needed'
  }
}

// Electron's Move to Applications relaunches the app without its command-line
// switches. A copy running on its own profile (--user-data-dir, e.g. to try the
// setup guide) leaves this note in the default profile folder so the relaunched
// app reopens the same profile.
const relaunchNote = (): string => join(app.getPath('appData'), app.name, 'relaunch-profile.json')

function moveToApplications(): boolean {
  const userData = app.getPath('userData')
  const custom = userData !== join(app.getPath('appData'), app.name)
  if (custom) {
    mkdirSync(dirname(relaunchNote()), { recursive: true })
    writeFileSync(relaunchNote(), JSON.stringify({ userData, at: Date.now() }))
  }
  let moved = false
  try {
    // On success the app quits here and relaunches from Applications
    moved = app.moveToApplicationsFolder()
  } finally {
    if (custom && !moved) rmSync(relaunchNote(), { force: true })
  }
  return moved
}

// Called before the app is ready: picks up a note left by moveToApplications
export function restoreProfileAfterMove(): void {
  try {
    const { userData, at } = JSON.parse(readFileSync(relaunchNote(), 'utf8'))
    rmSync(relaunchNote(), { force: true })
    if (typeof userData === 'string' && Date.now() - at < 60_000) app.setPath('userData', userData)
  } catch {
    // No note: the usual profile
  }
}

async function prepareProjectsFolder(path: unknown): Promise<PrepareFolderResult> {
  if (typeof path !== 'string' || !path.startsWith('/')) {
    return { ok: false, blocked: false, message: 'Choose a folder for your projects.' }
  }
  try {
    // In Documents this is what triggers macOS's "access files in your Documents folder" prompt
    await mkdir(path, { recursive: true })
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    const blocked = code === 'EPERM' || code === 'EACCES'
    return {
      ok: false,
      blocked,
      message: blocked
        ? 'macOS didn’t let NEAR Hardware use this folder.'
        : `Couldn’t create the folder: ${(error as Error).message}`
    }
  }
  await updateSettings((settings) => ({ ...settings, lastProjectLocation: path }))
  return { ok: true, path }
}

export function registerSetupIpc(): void {
  ipcMain.handle('setup:state', () => setupState())

  ipcMain.handle('setup:complete', async () => {
    await updateSettings((settings) => ({
      ...settings,
      setupCompletedAt: settings.setupCompletedAt ?? new Date().toISOString()
    }))
  })

  // Opens Apple's "install the command line developer tools" dialog; the
  // guide polls setup:state until they're in
  ipcMain.handle('setup:install-dev-tools', async () => {
    await execFileAsync('/usr/bin/xcode-select', ['--install']).catch(() => undefined)
  })

  // Moves the app and relaunches it from /Applications; false if the user
  // cancelled or it couldn't be moved
  ipcMain.handle('setup:move-to-applications', () => {
    try {
      return moveToApplications()
    } catch {
      return false
    }
  })

  ipcMain.handle('setup:prepare-projects-folder', (_event, path: unknown) =>
    prepareProjectsFolder(path)
  )

  ipcMain.handle('setup:open-privacy-settings', () => shell.openExternal(PRIVACY_FILES_AND_FOLDERS))
}
