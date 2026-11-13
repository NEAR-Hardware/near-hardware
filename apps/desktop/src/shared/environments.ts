// Coding agents NEAR Hardware can hand projects to. Shared by the main process
// (detection) and the renderer (UI).

export type EnvironmentId = 'claude-code' | 'codex' | 'cursor' | 'opencode'

export type EnvironmentDefinition = {
  id: EnvironmentId
  name: string
  vendor: string
  description: string
  // Official macOS/Linux install commands from each tool's docs (checked Nov 2026)
  installCommand: string
  installUrl: string
}

export const ENVIRONMENTS: readonly EnvironmentDefinition[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    vendor: 'Anthropic',
    description: "Anthropic's agentic coding tool for the terminal.",
    installCommand: 'curl -fsSL https://claude.ai/install.sh | bash',
    installUrl: 'https://code.claude.com/docs/en/setup'
  },
  {
    id: 'codex',
    name: 'Codex',
    vendor: 'OpenAI',
    description: "OpenAI's coding agent for the terminal and desktop.",
    installCommand: 'curl -fsSL https://chatgpt.com/codex/install.sh | sh',
    installUrl: 'https://learn.chatgpt.com/docs/codex/cli'
  },
  {
    id: 'cursor',
    name: 'Cursor',
    vendor: 'Anysphere',
    description: 'AI code editor, with an agent CLI for headless runs.',
    installCommand: 'curl https://cursor.com/install -fsS | bash',
    installUrl: 'https://cursor.com/download'
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    vendor: 'Open source',
    description: 'Open-source coding agent that works with any model.',
    installCommand: 'curl -fsSL https://opencode.ai/v2/install | bash',
    installUrl: 'https://opencode.ai/docs'
  }
]

export function isEnvironmentId(value: unknown): value is EnvironmentId {
  return ENVIRONMENTS.some((environment) => environment.id === value)
}

export function getEnvironment(id: EnvironmentId): EnvironmentDefinition {
  return ENVIRONMENTS.find((environment) => environment.id === id)!
}

export type EnvironmentStatus = {
  id: EnvironmentId
  installed: boolean
  version?: string
  cliPath?: string
  appPath?: string
  // Cursor only: its headless agent CLI, which is what NEAR Hardware drives
  agentCliPath?: string
}

// Several agents can be connected; each project picks one of them
export type ConnectedEnvironment = EnvironmentStatus & {
  connectedAt: string
}

export type ConnectEnvironmentResult =
  | { ok: true; environment: ConnectedEnvironment }
  | { ok: false; status: EnvironmentStatus }
