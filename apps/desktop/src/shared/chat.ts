// Provider-neutral chat model. Each agent adapter (Claude Code, Codex, …)
// translates its CLI's output into ChatEvents; the same reducer builds the
// transcript in the main process (for saving) and in the renderer (for display).

export type ImageAttachment = {
  id: string
  mediaType: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'
  // Base64 without the data: prefix
  data: string
  name?: string
}

export type ToolStatus = 'running' | 'done' | 'error'

export type ChatItem =
  | { kind: 'user'; id: string; text: string; images: ImageAttachment[] }
  | { kind: 'assistant'; id: string; text: string }
  | { kind: 'thinking'; id: string; text: string }
  | {
      kind: 'tool'
      id: string
      name: string
      // One-line summary, e.g. the command or file path
      title: string
      input: unknown
      status: ToolStatus
      output?: string
    }
  | {
      kind: 'permission'
      id: string
      toolName: string
      title: string
      input: unknown
      status: 'pending' | 'allowed' | 'denied'
      // Whether "Always allow" can be offered
      canAlwaysAllow: boolean
    }
  // Output of a command the CLI runs locally, like /cost or /context
  | { kind: 'command-output'; id: string; text: string }
  | { kind: 'notice'; id: string; level: 'info' | 'error'; text: string }

export type SlashCommandInfo = {
  name: string
  description: string
  argumentHint?: string
}

export type ModelOption = {
  value: string
  label: string
  description?: string
  // Full model id an alias value resolves to (e.g. "haiku" → "claude-haiku-5-5")
  resolvedModel?: string
}

export type PermissionModeOption = {
  value: string
  label: string
  description: string
}

export type SessionInfo = {
  // The CLI's own session id, used to resume after a restart
  providerSessionId?: string
  model?: string
  models: ModelOption[]
  commands: SlashCommandInfo[]
  permissionMode?: string
  permissionModes: PermissionModeOption[]
}

export type RateLimitWindow = {
  label: string
  // 0..1
  utilization?: number
  // Unix seconds
  resetsAt?: number
  status?: 'allowed' | 'allowed_warning' | 'rejected'
}

export type UsageInfo = {
  contextTokens?: number
  contextWindow?: number
  // Total spend across this chat, in USD, when the CLI reports it
  costUsd?: number
  inputTokens?: number
  outputTokens?: number
  rateLimits?: RateLimitWindow[]
}

export type ChatStatus = 'idle' | 'starting' | 'running'

export type ChatState = {
  items: ChatItem[]
  info: SessionInfo
  usage: UsageInfo
  status: ChatStatus
}

export type ChatEvent =
  // Adds an item, or replaces the one with the same id
  | { type: 'item'; item: ChatItem }
  // Streams text into an assistant or thinking item, creating it if needed
  | { type: 'delta'; id: string; kind: 'assistant' | 'thinking'; text: string }
  | { type: 'info'; info: Partial<SessionInfo> }
  | { type: 'usage'; usage: Partial<UsageInfo> }
  | { type: 'status'; status: ChatStatus }

export type ChatEventMessage = {
  chatId: string
  event: ChatEvent
}

export type SendMessageInput = {
  text: string
  images: ImageAttachment[]
}

export type PermissionDecision = 'allow' | 'allow-always' | 'deny'

export const EMPTY_CHAT_STATE: ChatState = {
  items: [],
  info: { models: [], commands: [], permissionModes: [] },
  usage: {},
  status: 'idle'
}

export function applyChatEvent(state: ChatState, event: ChatEvent): ChatState {
  switch (event.type) {
    case 'item': {
      const index = state.items.findIndex((item) => item.id === event.item.id)
      const items =
        index === -1
          ? [...state.items, event.item]
          : state.items.map((item, i) => (i === index ? event.item : item))
      return { ...state, items }
    }
    case 'delta': {
      const index = state.items.findIndex((item) => item.id === event.id)
      if (index === -1) {
        const item: ChatItem = { kind: event.kind, id: event.id, text: event.text }
        return { ...state, items: [...state.items, item] }
      }
      const items = state.items.map((item, i) =>
        i === index && (item.kind === 'assistant' || item.kind === 'thinking')
          ? { ...item, text: item.text + event.text }
          : item
      )
      return { ...state, items }
    }
    case 'info':
      return { ...state, info: { ...state.info, ...event.info } }
    case 'usage':
      return { ...state, usage: { ...state.usage, ...event.usage } }
    case 'status':
      return { ...state, status: event.status }
  }
}
