import type { ChatEvent, PermissionDecision, SendMessageInput } from '../../shared/chat'

// What the chat manager gives an adapter when it starts a session
export type AdapterContext = {
  cwd: string
  // The connected CLI's executable path
  executablePath?: string
  // Session to resume, from a previous run of this chat
  resumeSessionId?: string
  model?: string
  permissionMode?: string
  // PATH from the user's login shell, so the CLI finds its own tools
  env: NodeJS.ProcessEnv
  emit: (event: ChatEvent) => void
}

// One running conversation with a coding agent's CLI
export interface AgentSession {
  // Starts the CLI ahead of the first message so commands and models load early
  start(): Promise<void>
  send(input: SendMessageInput): Promise<void>
  interrupt(): Promise<void>
  setModel(model: string): Promise<void>
  setPermissionMode(mode: string): Promise<void>
  // itemId is the permission item's id in the transcript
  respondToPermission(itemId: string, decision: PermissionDecision): void
  // Re-reads context usage and limits, e.g. after a turn
  refreshUsage(): Promise<void>
  close(): void
}
