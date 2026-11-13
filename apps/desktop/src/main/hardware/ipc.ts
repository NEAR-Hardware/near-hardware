// IPC for the hardware side of the app: device detection, serial monitor,
// integrated terminal and PlatformIO install
import { ipcMain, type WebContents } from 'electron'
import { execFile, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { promisify } from 'node:util'
import { spawn as spawnPty, type IPty } from 'node-pty'
import { getSearchPath } from '../environments'
import { getProject, updateProjectBoard } from '../projects'
import { closePort, listDevices, openPort, writePort, type DeviceInfo } from './serial'

const execFileAsync = promisify(execFile)

// Where PlatformIO's official installer puts its virtualenv
export const PLATFORMIO_BIN = join(
  homedir(),
  '.platformio',
  'penv',
  process.platform === 'win32' ? 'Scripts' : 'bin'
)
const INSTALLER_URL =
  'https://raw.githubusercontent.com/platformio/platformio-core-installer/master/get-platformio.py'

let window: WebContents | null = null
const send = (channel: string, payload?: unknown): void => {
  if (window && !window.isDestroyed()) window.send(channel, payload)
}

// Device watcher: polls every 2 s and pushes the list when it changes
let devices: DeviceInfo[] = []
let watcher: NodeJS.Timeout | undefined
function watchDevices(): void {
  if (watcher) return
  const poll = async (): Promise<void> => {
    try {
      const next = await listDevices()
      if (JSON.stringify(next) !== JSON.stringify(devices)) {
        devices = next
        send('devices:changed', devices)
      }
    } catch {
      // Enumeration can fail briefly while a device re-enumerates; try again next tick
    }
  }
  poll()
  watcher = setInterval(poll, 2000)
}

const terminals = new Map<string, IPty>()

async function platformioStatus(): Promise<{
  installed: boolean
  version?: string
  path?: string
}> {
  const pio = join(PLATFORMIO_BIN, process.platform === 'win32' ? 'pio.exe' : 'pio')
  if (!existsSync(pio)) return { installed: false }
  try {
    const { stdout } = await execFileAsync(pio, ['--version'], { timeout: 20000 })
    return { installed: true, version: /\d+\.\d+\.\d+/.exec(stdout)?.[0], path: pio }
  } catch {
    return { installed: false }
  }
}

// Runs PlatformIO's official installer, streaming its output to the window
async function installPlatformio(): Promise<{
  installed: boolean
  version?: string
  error?: string
}> {
  const log = (line: string): void => send('platformio:log', line)
  log('Downloading the PlatformIO installer…')
  const response = await fetch(INSTALLER_URL)
  if (!response.ok) return { installed: false, error: `Download failed (HTTP ${response.status})` }
  const script = join(tmpdir(), 'get-platformio.py')
  await writeFile(script, await response.text())

  const env = { ...process.env, PATH: (await getSearchPath()).join(delimiter) }
  // Prefer the user's python3; fall back to the system one on macOS
  for (const python of ['python3', '/usr/bin/python3', 'python']) {
    log(`Running the installer with ${python}…`)
    const code = await new Promise<number>((resolve) => {
      const child = spawn(python, [script], { env })
      const forward = (data: Buffer): void =>
        String(data)
          .split('\n')
          .filter(Boolean)
          .forEach((line) => log(line))
      child.stdout.on('data', forward)
      child.stderr.on('data', forward)
      child.on('error', () => resolve(-1))
      child.on('exit', (exitCode) => resolve(exitCode ?? -1))
    })
    if (code === 0) {
      const status = await platformioStatus()
      if (status.installed) {
        log(`PlatformIO ${status.version ?? ''} is ready.`)
        return status
      }
    }
    log(`That didn’t work (exit code ${code}).`)
  }
  return { installed: false, error: 'The PlatformIO installer failed; see the log above.' }
}

export function registerHardwareIpc(): void {
  ipcMain.handle('devices:list', (event) => {
    window = event.sender
    watchDevices()
    return listDevices()
  })

  ipcMain.handle('serial:open', (event, path: string, baudRate: number) => {
    window = event.sender
    return openPort(path, baudRate)
  })
  ipcMain.handle('serial:close', (_event, path: string) => closePort(path))
  ipcMain.handle('serial:write', (_event, path: string, data: string) => writePort(path, data))

  ipcMain.handle(
    'projects:set-board',
    async (event, projectId: string, board: Record<string, unknown>) => {
      const saved = await updateProjectBoard(projectId, board)
      event.sender.send('projects:changed')
      return saved
    }
  )

  ipcMain.handle('platformio:status', () => platformioStatus())
  ipcMain.handle('platformio:install', (event) => {
    window = event.sender
    return installPlatformio()
  })

  ipcMain.handle(
    'terminal:create',
    async (event, projectId: string, cols: number, rows: number) => {
      window = event.sender
      const project = await getProject(projectId)
      const id = crypto.randomUUID()
      const pty = spawnPty(
        process.env.SHELL || (process.platform === 'win32' ? 'powershell.exe' : '/bin/zsh'),
        [],
        {
          name: 'xterm-256color',
          cols,
          rows,
          cwd: project.path,
          env: {
            ...process.env,
            // PlatformIO first, so `pio` works in the terminal right after installing it
            PATH: [PLATFORMIO_BIN, ...(await getSearchPath())].join(delimiter)
          } as Record<string, string>
        }
      )
      terminals.set(id, pty)
      pty.onData((data) => send('terminal:data', { id, data }))
      pty.onExit(({ exitCode }) => {
        terminals.delete(id)
        send('terminal:exit', { id, exitCode })
      })
      return id
    }
  )
  ipcMain.handle('terminal:write', (_event, id: string, data: string) =>
    terminals.get(id)?.write(data)
  )
  ipcMain.handle('terminal:resize', (_event, id: string, cols: number, rows: number) =>
    terminals.get(id)?.resize(Math.max(2, cols), Math.max(2, rows))
  )
  ipcMain.handle('terminal:kill', (_event, id: string) => {
    terminals.get(id)?.kill()
    terminals.delete(id)
  })
}

export function closeAllTerminals(): void {
  for (const pty of terminals.values()) pty.kill()
  terminals.clear()
  clearInterval(watcher)
}
