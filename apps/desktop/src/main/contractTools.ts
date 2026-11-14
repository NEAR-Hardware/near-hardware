// Rust, its WebAssembly target, cargo-near and NEAR CLI: what agents need to
// write, build and test NEAR smart contracts. The app finds them on the login
// shell's PATH (plus ~/.cargo/bin) and installs missing ones with the official
// installers from rustup.rs and NEAR's GitHub releases.
import { ipcMain } from 'electron'
import { execFile } from 'node:child_process'
import { statfs } from 'node:fs/promises'
import { homedir } from 'node:os'
import { delimiter } from 'node:path'
import { promisify } from 'node:util'
import type { ContractToolsStatus, ToolStatus } from '../shared/setup'
import { findExecutable, getSearchPath, refreshSearchPath } from './environments'

const execFileAsync = promisify(execFile)

const INSTALL = {
  // The minimal profile skips ~600 MB of offline docs
  rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal && . "$HOME/.cargo/env"`,
  wasmTarget: 'rustup target add wasm32-unknown-unknown',
  cargoNear:
    "curl --proto '=https' --tlsv1.2 -LsSf https://github.com/near/cargo-near/releases/latest/download/cargo-near-installer.sh | sh",
  nearCli:
    "curl --proto '=https' --tlsv1.2 -LsSf https://github.com/near/near-cli-rs/releases/latest/download/near-cli-rs-installer.sh | sh"
}

async function run(file: string, args: string[], dirs: string[]): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync(file, args, {
      timeout: 15000,
      env: { ...process.env, PATH: dirs.join(delimiter) }
    })
    return stdout.trim()
  } catch {
    return undefined
  }
}

async function tool(name: string, dirs: string[]): Promise<ToolStatus> {
  const path = await findExecutable(name, dirs)
  if (!path) return { installed: false }
  // "rustc 1.92.0 (…)", "cargo-near 0.23.0", "near-cli-rs 0.31.1"
  const version = /\d+\.\d+\.\d+/.exec((await run(path, ['--version'], dirs)) ?? '')?.[0]
  return { installed: true, version }
}

export async function contractToolsStatus(): Promise<ContractToolsStatus> {
  // Pick up tools installed since the app started
  refreshSearchPath()
  const dirs = await getSearchPath()
  const [rust, cargoNear, nearCli, rustup] = await Promise.all([
    tool('rustc', dirs),
    tool('cargo-near', dirs),
    tool('near', dirs),
    findExecutable('rustup', dirs)
  ])
  const targets = rustup ? await run(rustup, ['target', 'list', '--installed'], dirs) : undefined
  const wasmTarget = { installed: Boolean(targets?.split('\n').includes('wasm32-unknown-unknown')) }

  const steps: string[] = []
  if (!rust.installed) steps.push(INSTALL.rust)
  if (!wasmTarget.installed) steps.push(INSTALL.wasmTarget)
  if (!cargoNear.installed) steps.push(INSTALL.cargoNear)
  if (!nearCli.installed) steps.push(INSTALL.nearCli)
  // Rust and every contract build live in the home folder's disk
  const disk = await statfs(homedir()).catch(() => undefined)
  return {
    rust,
    wasmTarget,
    cargoNear,
    nearCli,
    installCommand: steps.length ? steps.join(' && ') : null,
    freeBytes: disk ? disk.bavail * disk.bsize : null
  }
}

export function registerContractToolsIpc(): void {
  ipcMain.handle('contract-tools:status', () => contractToolsStatus())
}
