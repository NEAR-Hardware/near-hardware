// Detects which coding agents are installed. Plain Node (no Electron imports)
// so it can be exercised outside the app.
import { execFile } from 'node:child_process'
import { access, constants, realpath, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { delimiter, join } from 'node:path'
import { promisify } from 'node:util'
import type { EnvironmentId, EnvironmentStatus } from '../shared/environments'

const execFileAsync = promisify(execFile)

type Probe = {
  commands: string[]
  // macOS app bundle names
  apps: string[]
  // Cursor's headless agent CLI; it was renamed from cursor-agent to agent
  agentCommands?: string[]
}

const PROBES: Record<EnvironmentId, Probe> = {
  'claude-code': { commands: ['claude'], apps: [] },
  codex: { commands: ['codex'], apps: ['Codex'] },
  cursor: { commands: ['cursor'], apps: ['Cursor'], agentCommands: ['cursor-agent', 'agent'] },
  opencode: { commands: ['opencode'], apps: ['OpenCode'] }
}

let searchPath: Promise<string[]> | undefined

// Apps launched from the Dock or Finder only get a minimal PATH without
// Homebrew, npm or ~/.local/bin, so ask the user's login shell for the real one.
export function getSearchPath(): Promise<string[]> {
  searchPath ??= resolveSearchPath()
  return searchPath
}

async function resolveSearchPath(): Promise<string[]> {
  const dirs = new Set<string>()
  const add = (value?: string): void => {
    value?.split(delimiter).forEach((dir) => dir && dirs.add(dir))
  }
  if (process.platform !== 'win32') add(await readLoginShellPath())
  add(process.env.PATH)
  const home = homedir()
  for (const dir of [
    '/opt/homebrew/bin',
    '/usr/local/bin',
    join(home, '.local/bin'),
    join(home, '.npm-global/bin'),
    join(home, '.bun/bin'),
    join(home, '.claude/local'),
    join(home, '.opencode/bin')
  ]) {
    dirs.add(dir)
  }
  return [...dirs]
}

async function readLoginShellPath(): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync(
      process.env.SHELL || '/bin/zsh',
      ['-ilc', 'printf "__PATH__%s__PATH__" "$PATH"'],
      { timeout: 5000 }
    )
    // Markers skip anything shell startup files print
    return /__PATH__(.*)__PATH__/.exec(stdout)?.[1]
  } catch {
    return undefined
  }
}

async function findExecutable(name: string, dirs: string[]): Promise<string | undefined> {
  const extensions =
    process.platform === 'win32' ? (process.env.PATHEXT ?? '.EXE;.CMD;.BAT').split(';') : ['']
  for (const dir of dirs) {
    for (const extension of extensions) {
      const candidate = join(dir, name + extension)
      try {
        await access(candidate, constants.X_OK)
        if ((await stat(candidate)).isFile()) return candidate
      } catch {
        // Not here, keep looking
      }
    }
  }
  return undefined
}

async function firstExecutable(names: string[], dirs: string[]): Promise<string | undefined> {
  for (const name of names) {
    const found = await findExecutable(name, dirs)
    if (found) return found
  }
  return undefined
}

async function findCursorAgent(names: string[], dirs: string[]): Promise<string | undefined> {
  for (const name of names) {
    const found = await findExecutable(name, dirs)
    if (!found) continue
    // "agent" is a generic name, so only trust it if it resolves into a Cursor install
    if (name === 'agent' && !/cursor/i.test(await realpath(found).catch(() => found))) continue
    return found
  }
  return undefined
}

async function findApp(names: string[]): Promise<string | undefined> {
  if (process.platform !== 'darwin') return undefined
  for (const name of names) {
    for (const dir of ['/Applications', join(homedir(), 'Applications')]) {
      const candidate = join(dir, `${name}.app`)
      try {
        if ((await stat(candidate)).isDirectory()) return candidate
      } catch {
        // Not here, keep looking
      }
    }
  }
  return undefined
}

const VERSION_PATTERN = /\d+\.\d+\.\d+(?:-[\w.]+)?/

async function readCliVersion(path: string, dirs: string[]): Promise<string | undefined> {
  try {
    const isWindowsScript = /\.(cmd|bat)$/i.test(path)
    const { stdout } = await execFileAsync(isWindowsScript ? `"${path}"` : path, ['--version'], {
      timeout: 8000,
      shell: isWindowsScript,
      env: { ...process.env, PATH: dirs.join(delimiter) }
    })
    return VERSION_PATTERN.exec(stdout)?.[0]
  } catch {
    return undefined
  }
}

async function readAppVersion(appPath: string): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync('plutil', [
      '-extract',
      'CFBundleShortVersionString',
      'raw',
      join(appPath, 'Contents/Info.plist')
    ])
    return stdout.trim() || undefined
  } catch {
    return undefined
  }
}

export async function detectEnvironment(id: EnvironmentId): Promise<EnvironmentStatus> {
  const probe = PROBES[id]
  const dirs = await getSearchPath()
  const [cliPath, appPath, agentCliPath] = await Promise.all([
    firstExecutable(probe.commands, dirs),
    findApp(probe.apps),
    probe.agentCommands ? findCursorAgent(probe.agentCommands, dirs) : undefined
  ])
  const version =
    (cliPath && (await readCliVersion(cliPath, dirs))) ||
    (appPath && (await readAppVersion(appPath))) ||
    undefined
  return { id, installed: Boolean(cliPath || appPath), version, cliPath, appPath, agentCliPath }
}
