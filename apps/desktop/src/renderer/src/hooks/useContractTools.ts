import { useCallback, useEffect, useRef, useState } from 'react'
import { CONTRACT_TOOLS_MIN_FREE, type ContractToolsStatus } from '../../../shared/setup'

export type InstallJob = { key: number; command: string }

// Rust, cargo-near and NEAR CLI: what's installed, and an install job for the
// missing ones that runs in a terminal (rustup and the NEAR installers print progress there)
export function useContractTools(): {
  status?: ContractToolsStatus
  checking: boolean
  refresh: () => void
  job?: InstallJob
  install: () => void
  finishJob: (exitCode: number) => void
  closeJob: () => void
  exitCode?: number
} {
  const [status, setStatus] = useState<ContractToolsStatus>()
  const [checking, setChecking] = useState(true)
  const [job, setJob] = useState<InstallJob>()
  const [exitCode, setExitCode] = useState<number>()
  const jobCount = useRef(0)

  const check = useCallback(
    () =>
      window.api.contractTools
        .status()
        .then(setStatus)
        .finally(() => setChecking(false)),
    []
  )

  // `checking` starts true, so the first check doesn't need to set it
  useEffect(() => {
    check()
  }, [check])

  const refresh = useCallback(() => {
    setChecking(true)
    check()
  }, [check])

  const install = (): void => {
    if (!status?.installCommand) return
    setExitCode(undefined)
    setJob({ key: ++jobCount.current, command: status.installCommand })
  }

  const finishJob = (code: number): void => {
    setExitCode(code)
    refresh()
  }

  return {
    status,
    checking,
    refresh,
    job,
    install,
    finishJob,
    closeJob: () => setJob(undefined),
    exitCode
  }
}

export const CONTRACT_TOOLS: {
  key: 'rust' | 'wasmTarget' | 'cargoNear' | 'nearCli'
  name: string
  about: string
}[] = [
  {
    key: 'rust',
    name: 'Rust',
    about: 'The language NEAR contracts are written in, from rustup.rs'
  },
  {
    key: 'wasmTarget',
    name: 'WebAssembly target',
    about: 'Lets Rust compile contracts to the .wasm files NEAR runs'
  },
  {
    key: 'cargoNear',
    name: 'cargo-near',
    about: 'NEAR’s tool to create, build and test contracts'
  },
  {
    key: 'nearCli',
    name: 'NEAR CLI',
    about: 'NEAR’s command line, for inspecting accounts and contracts'
  }
]

// Rust and contract builds take several GB; warn before the disk fills up
export const lowDisk = (status?: ContractToolsStatus): boolean =>
  status?.freeBytes != null && status.freeBytes < CONTRACT_TOOLS_MIN_FREE

export const formatGB = (bytes: number): string => `${(bytes / 1024 ** 3).toFixed(1)} GB`
