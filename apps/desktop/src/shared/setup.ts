// First-run setup: what the setup guide needs to know about this Mac

export type SetupState = {
  // The user finished or skipped the guide
  completed: boolean
  // Running from a packaged build (false in dev)
  packaged: boolean
  // macOS: the app is in /Applications or ~/Applications
  inApplications: boolean
  // macOS: Apple's Command Line Tools (git, python3) are installed
  devTools: boolean
}

// Creating the projects folder is when macOS asks for Documents access
export type PrepareFolderResult =
  { ok: true; path: string } | { ok: false; blocked: boolean; message: string }

export type ToolStatus = { installed: boolean; version?: string }

// Rust and NEAR's command-line tools, for building smart contracts
export type ContractToolsStatus = {
  rust: ToolStatus
  wasmTarget: ToolStatus
  cargoNear: ToolStatus
  nearCli: ToolStatus
  // The official installers for whatever is missing, as one shell command; null when all are there
  installCommand: string | null
  // Free space on the home folder's disk; null when unknown
  freeBytes: number | null
}

// The toolchain is ~1 GB, each contract's pinned Rust ~1 GB and its build ~1-2 GB
export const CONTRACT_TOOLS_MIN_FREE = 3 * 1024 ** 3
