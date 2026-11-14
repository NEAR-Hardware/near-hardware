// Raspberry Pi (or any Linux board) over SSH. The app keeps its own SSH key;
// connecting installs it on the Pi with the password the user types, which is
// used once and never stored. After that, status checks and agents reach the
// Pi with the key alone.
import { app, ipcMain } from 'electron'
import { execFile, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import type { PiConnectResult, PiStatus, SshTarget } from '../../shared/projects'
import { broadcast } from '../broadcast'
import { getProject, updateProjectBoard } from '../projects'

const execFileAsync = promisify(execFile)

const sshDir = (): string => join(app.getPath('userData'), 'ssh')
export const sshKeyPath = (): string => join(sshDir(), 'near-hardware_ed25519')
// Separate from ~/.ssh/known_hosts so the app never edits the user's SSH setup
const knownHostsPath = (): string => join(sshDir(), 'known_hosts')

async function ensureKey(): Promise<string> {
  await mkdir(sshDir(), { recursive: true, mode: 0o700 })
  if (!existsSync(sshKeyPath())) {
    await execFileAsync('/usr/bin/ssh-keygen', [
      '-q',
      '-t',
      'ed25519',
      '-N',
      '',
      '-C',
      'near-hardware',
      '-f',
      sshKeyPath()
    ])
  }
  return (await readFile(`${sshKeyPath()}.pub`, 'utf8')).trim()
}

// "ssh -p 2222 pi@raspberrypi.local", "pi@raspberrypi.local:2222" or "pi@10.0.0.5"
export function parseTarget(input: string): SshTarget {
  let text = input.trim().replace(/^ssh\s+/, '')
  let port = 22
  const flag = /(?:^|\s)-p\s*(\d+)/.exec(text)
  if (flag) {
    port = Number(flag[1])
    text = text.replace(flag[0], ' ')
  }
  text = text.trim()
  const match = /^([a-z_][a-z0-9_.-]*)@([a-z0-9.-]+|\[[0-9a-f:]+\])(?::(\d+))?$/i.exec(text)
  if (!match) {
    throw new Error('Use the form user@host, for example pi@raspberrypi.local')
  }
  return { user: match[1], host: match[2], port: match[3] ? Number(match[3]) : port }
}

const commonOptions = (target: SshTarget): string[] => [
  '-p',
  String(target.port),
  '-o',
  'ConnectTimeout=6',
  '-o',
  'StrictHostKeyChecking=accept-new',
  '-o',
  `UserKnownHostsFile=${knownHostsPath()}`
]

// The command agents use to reach the Pi (the key needs no password)
export function sshCommand(target: SshTarget): string {
  return `ssh -i '${sshKeyPath()}' -o IdentitiesOnly=yes -o BatchMode=yes -o UserKnownHostsFile='${knownHostsPath()}' -p ${target.port} ${target.user}@${target.host}`
}

function run(
  args: string[],
  options: { input?: string; env?: NodeJS.ProcessEnv; timeout?: number } = {}
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn('/usr/bin/ssh', args, {
      env: options.env ?? process.env,
      stdio: ['pipe', 'pipe', 'pipe']
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => (stdout += chunk))
    child.stderr.on('data', (chunk) => (stderr += chunk))
    const timer = setTimeout(() => child.kill(), options.timeout ?? 20000)
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code: code ?? 1, stdout, stderr })
    })
    child.stdin.end(options.input ?? '')
  })
}

// Hostname, board model and OS; each part tolerates missing files, and it always exits 0
const PROBE =
  'hostname; (cat /proc/device-tree/model 2>/dev/null | tr -d \'\\000\'); echo; (. /etc/os-release 2>/dev/null && echo "$PRETTY_NAME"); true'

async function probe(target: SshTarget): Promise<PiStatus> {
  const { code, stdout, stderr } = await run(
    [
      '-i',
      sshKeyPath(),
      '-o',
      'IdentitiesOnly=yes',
      '-o',
      'BatchMode=yes',
      ...commonOptions(target),
      `${target.user}@${target.host}`,
      PROBE
    ],
    { timeout: 12000 }
  )
  if (code !== 0) return { connected: false, error: explain(stderr) }
  const [hostname, model, os] = stdout.split('\n').map((line) => line.trim())
  return { connected: true, hostname, model: model || undefined, os: os || undefined }
}

function explain(stderr: string): string {
  if (/Permission denied/i.test(stderr))
    return 'The Pi refused the login. Check the user name and password.'
  if (/Could not resolve hostname/i.test(stderr))
    return 'Couldn’t find that host. Check the name, and that the Pi is on the same network.'
  if (/timed out|No route to host|Network is unreachable|Connection refused/i.test(stderr))
    return 'Couldn’t reach the Pi. Is it powered on, on this network, with SSH enabled?'
  if (/REMOTE HOST IDENTIFICATION HAS CHANGED/i.test(stderr))
    return 'The Pi’s identity changed (was it reinstalled?). Remove its line from the app’s known_hosts and connect again.'
  return stderr.trim().split('\n').pop() || 'SSH failed.'
}

// Adds the app's public key to the Pi's authorized_keys, logging in once with the password
async function installKey(target: SshTarget, password: string, publicKey: string): Promise<void> {
  const askpass = join(sshDir(), 'askpass.sh')
  await writeFile(askpass, '#!/bin/sh\nprintf "%s\\n" "$NEAR_HARDWARE_SSH_PASSWORD"\n')
  await chmod(askpass, 0o700)
  const { code, stderr } = await run(
    [
      '-o',
      'PubkeyAuthentication=no',
      '-o',
      'PreferredAuthentications=password,keyboard-interactive',
      '-o',
      'NumberOfPasswordPrompts=1',
      ...commonOptions(target),
      `${target.user}@${target.host}`,
      'umask 077; mkdir -p ~/.ssh; k=$(cat); grep -qxF "$k" ~/.ssh/authorized_keys 2>/dev/null || printf "%s\\n" "$k" >> ~/.ssh/authorized_keys'
    ],
    {
      input: `${publicKey}\n`,
      env: {
        ...process.env,
        SSH_ASKPASS: askpass,
        SSH_ASKPASS_REQUIRE: 'force',
        DISPLAY: process.env.DISPLAY ?? ':0',
        NEAR_HARDWARE_SSH_PASSWORD: password
      }
    }
  )
  if (code !== 0) throw new Error(explain(stderr))
}

async function connect(
  projectId: string,
  input: { target?: unknown; password?: unknown }
): Promise<PiConnectResult> {
  try {
    const target = parseTarget(String(input.target ?? ''))
    const publicKey = await ensureKey()
    // The key may already be on the Pi (e.g. connected from another project)
    let status = await probe(target)
    if (!status.connected) {
      // Only a refused login is worth trying the password for
      if (!/refused the login/.test(status.error ?? '')) {
        return { ok: false, message: status.error ?? 'SSH failed.' }
      }
      const password = typeof input.password === 'string' ? input.password : ''
      if (!password) {
        return {
          ok: false,
          message: 'Enter the Pi’s password: NEAR Hardware needs it once to add its SSH key.'
        }
      }
      await installKey(target, password, publicKey)
      status = await probe(target)
      if (!status.connected) return { ok: false, message: status.error ?? 'SSH failed.' }
    }
    const board = await updateProjectBoard(
      projectId,
      {
        name: status.model || 'Raspberry Pi',
        ssh: { ...target, hostname: status.hostname, model: status.model, os: status.os },
        summary: `${status.model || 'Raspberry Pi'} at ${target.user}@${target.host}${status.os ? `, ${status.os}` : ''}`
      },
      true
    )
    if (!board) return { ok: false, message: 'Couldn’t save the board.' }
    broadcast('projects:changed')
    return { ok: true, board }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'SSH failed.' }
  }
}

// One check at a time per Pi; the chat header asks every few seconds
const checks = new Map<string, Promise<PiStatus>>()

async function status(projectId: string): Promise<PiStatus> {
  const target = (await getProject(projectId)).board?.ssh
  if (!target) return { connected: false, error: 'This project’s board isn’t a Pi.' }
  if (!existsSync(sshKeyPath())) return { connected: false, error: 'Not connected yet.' }
  const key = `${target.user}@${target.host}:${target.port}`
  let check = checks.get(key)
  if (!check) {
    check = probe(target).finally(() => checks.delete(key))
    checks.set(key, check)
  }
  return check
}

export function registerPiIpc(): void {
  ipcMain.handle('pi:connect', (_event, projectId: unknown, input: unknown) =>
    typeof projectId === 'string'
      ? connect(projectId, (input ?? {}) as { target?: unknown; password?: unknown })
      : { ok: false, message: 'No project' }
  )
  ipcMain.handle('pi:status', (_event, projectId: unknown) =>
    typeof projectId === 'string' ? status(projectId) : { connected: false }
  )
}
