// Claude Code adapter: drives the user's installed `claude` CLI through the
// Claude Agent SDK in streaming-input mode, so one CLI process holds the whole
// conversation (slash commands, model switching, permissions, interrupts).
import { randomUUID } from 'node:crypto'
import type {
  ModelInfo,
  PermissionResult,
  PermissionUpdate,
  Query,
  SDKMessage,
  SDKUserMessage,
  SlashCommand
} from '@anthropic-ai/claude-agent-sdk'
import type {
  ChatItem,
  ModelOption,
  PermissionDecision,
  PermissionModeOption,
  RateLimitWindow,
  SendMessageInput
} from '../../shared/chat'
import { describeTool, toolResultText } from './tools'
import type { AdapterContext, AgentSession } from './types'

const PERMISSION_MODES: PermissionModeOption[] = [
  { value: 'default', label: 'Ask', description: 'Ask before edits and commands' },
  { value: 'acceptEdits', label: 'Accept edits', description: 'Edit files without asking' },
  { value: 'plan', label: 'Plan', description: 'Plan first, change nothing' },
  { value: 'auto', label: 'Auto', description: 'A safety classifier approves actions' }
]

const RATE_LIMIT_LABELS: Record<string, string> = {
  five_hour: '5-hour limit',
  seven_day: 'Weekly limit',
  seven_day_opus: 'Weekly Opus limit',
  seven_day_sonnet: 'Weekly Sonnet limit',
  overage: 'Extra usage'
}

// Async iterable the SDK reads user messages from for the life of the session
class MessageQueue implements AsyncIterable<SDKUserMessage> {
  private buffer: SDKUserMessage[] = []
  private waiting?: (result: IteratorResult<SDKUserMessage>) => void
  private ended = false

  push(message: SDKUserMessage): void {
    if (this.waiting) {
      const resolve = this.waiting
      this.waiting = undefined
      resolve({ value: message, done: false })
    } else {
      this.buffer.push(message)
    }
  }

  end(): void {
    this.ended = true
    this.waiting?.({ value: undefined, done: true })
    this.waiting = undefined
  }

  [Symbol.asyncIterator](): AsyncIterator<SDKUserMessage> {
    return {
      next: () => {
        const message = this.buffer.shift()
        if (message) return Promise.resolve({ value: message, done: false })
        if (this.ended) return Promise.resolve({ value: undefined, done: true })
        return new Promise((resolve) => (this.waiting = resolve))
      }
    }
  }
}

type PendingPermission = {
  item: Extract<ChatItem, { kind: 'permission' }>
  input: Record<string, unknown>
  suggestions?: PermissionUpdate[]
  resolve: (result: PermissionResult) => void
}

const toModelOptions = (models: ModelInfo[]): ModelOption[] =>
  models.map((m) => ({
    value: m.value,
    label: m.displayName,
    description: m.description,
    resolvedModel: m.resolvedModel
  }))

const toCommandInfos = (
  commands: SlashCommand[]
): { name: string; description: string; argumentHint?: string }[] =>
  commands.map((c) => ({
    name: c.name,
    description: c.description,
    argumentHint: c.argumentHint || undefined
  }))

export class ClaudeSession implements AgentSession {
  private query?: Query
  // Shared by concurrent start() calls so they spawn one CLI, not several
  private starting?: Promise<void>
  private queue?: MessageQueue
  private sessionId?: string
  private model?: string
  private permissionMode: string
  private tools = new Map<string, Extract<ChatItem, { kind: 'tool' }>>()
  private permissions = new Map<string, PendingPermission>()
  private messageId = ''
  // Streamed block index → item id. Ids count blocks per type (text 0, text 1…)
  // because the final message can drop blocks the stream had, like an empty
  // thinking block, which shifts raw indexes
  private streamBlockIds = new Map<number, string>()
  private streamTypeCounts = { text: 0, thinking: 0 }
  private interrupted = false
  // Messages sent but not yet answered; the CLI queues them and runs one per turn,
  // so the chat only goes idle when the last one finishes
  private pendingTurns = 0
  // total_cost_usd is cumulative per CLI process; track it to add only new spend
  private lastProcessCost = 0
  private costUsd = 0

  constructor(
    private readonly context: AdapterContext,
    initialCostUsd = 0
  ) {
    this.sessionId = context.resumeSessionId
    this.model = context.model
    this.permissionMode = context.permissionMode ?? 'default'
    this.costUsd = initialCostUsd
    context.emit({ type: 'info', info: { permissionModes: PERMISSION_MODES } })
  }

  // Starts the CLI process if it isn't running; resumes the saved session if any
  start(): Promise<void> {
    this.starting ??= this.launch().catch((error) => {
      // Let the next message try again
      this.starting = undefined
      throw error
    })
    return this.starting
  }

  private async launch(): Promise<void> {
    const { query } = await import('@anthropic-ai/claude-agent-sdk')
    const { emit } = this.context
    emit({ type: 'status', status: 'starting' })

    this.queue = new MessageQueue()
    this.lastProcessCost = 0
    const q = query({
      prompt: this.queue,
      options: {
        cwd: this.context.cwd,
        pathToClaudeCodeExecutable: this.context.executablePath,
        env: this.context.env,
        resume: this.sessionId,
        model: this.model,
        permissionMode: this.permissionMode as never,
        includePartialMessages: true,
        // Load the user's and project's CLAUDE.md, settings and custom /commands
        settingSources: ['user', 'project', 'local'],
        systemPrompt: { type: 'preset', preset: 'claude_code', append: this.context.systemPrompt },
        mcpServers: { 'near-hardware': { type: 'stdio', ...this.context.mcp } },
        // Our own tools are safe to run without a prompt
        allowedTools: ['mcp__near-hardware'],
        canUseTool: (toolName, input, options) =>
          this.askPermission(toolName, input, options.suggestions, options.signal, options),
        stderr: (data) => console.error('[claude]', data.trimEnd())
      }
    })
    this.query = q
    this.consume(q)

    try {
      const init = await q.initializationResult()
      emit({
        type: 'info',
        info: {
          commands: toCommandInfos(init.commands),
          models: toModelOptions(init.models),
          permissionMode: this.permissionMode
        }
      })
    } catch (error) {
      this.notice('error', `Claude Code didn’t start: ${(error as Error).message}`)
    }
    emit({ type: 'status', status: 'idle' })
  }

  private async consume(q: Query): Promise<void> {
    try {
      for await (const message of q) this.handle(message)
    } catch (error) {
      this.notice('error', `Claude Code stopped: ${(error as Error).message}`)
    } finally {
      // The process ended; the next message starts a new one that resumes the session
      if (this.query === q) {
        this.query = undefined
        this.queue = undefined
        this.starting = undefined
      }
      this.pendingTurns = 0
      for (const pending of this.permissions.values()) {
        pending.resolve({ behavior: 'deny', message: 'Session ended' })
      }
      this.permissions.clear()
      this.context.emit({ type: 'status', status: 'idle' })
    }
  }

  private handle(message: SDKMessage): void {
    const { emit } = this.context
    // Sub-agent internals would flood the chat; their parent tool call shows the result
    if ('parent_tool_use_id' in message && message.parent_tool_use_id) return

    switch (message.type) {
      case 'system':
        if (message.subtype === 'init') {
          this.sessionId = message.session_id
          this.model = message.model
          emit({
            type: 'info',
            info: { providerSessionId: message.session_id, model: message.model }
          })
        } else if (message.subtype === 'commands_changed') {
          this.query
            ?.supportedCommands()
            .then((commands) =>
              emit({ type: 'info', info: { commands: toCommandInfos(commands) } })
            )
            .catch(() => undefined)
        } else if (message.subtype === 'local_command_output') {
          emit({
            type: 'item',
            item: { kind: 'command-output', id: message.uuid, text: message.content }
          })
        } else if (message.subtype === 'compact_boundary') {
          this.notice('info', 'Conversation compacted to free up context.')
        } else if (message.subtype === 'status' && message.permissionMode) {
          this.permissionMode = message.permissionMode
          emit({ type: 'info', info: { permissionMode: message.permissionMode } })
        }
        return

      case 'stream_event': {
        const event = message.event
        if (event.type === 'message_start') {
          this.messageId = event.message.id
          this.streamBlockIds.clear()
          this.streamTypeCounts = { text: 0, thinking: 0 }
        }
        if (
          event.type === 'content_block_start' &&
          (event.content_block.type === 'text' || event.content_block.type === 'thinking')
        ) {
          const type = event.content_block.type
          this.streamBlockIds.set(
            event.index,
            blockItemId(this.messageId, type, this.streamTypeCounts[type]++)
          )
        }
        if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
          this.upsertTool({
            kind: 'tool',
            id: event.content_block.id,
            name: event.content_block.name,
            title: describeTool(event.content_block.name, {}),
            input: {},
            status: 'running'
          })
        }
        if (event.type === 'content_block_delta') {
          const id = this.streamBlockIds.get(event.index)
          if (!id) return
          if (event.delta.type === 'text_delta') {
            emit({ type: 'delta', id, kind: 'assistant', text: event.delta.text })
          } else if (event.delta.type === 'thinking_delta' && event.delta.thinking) {
            emit({ type: 'delta', id, kind: 'thinking', text: event.delta.thinking })
          }
        }
        return
      }

      case 'assistant': {
        const { id, content } = message.message
        const counts = { text: 0, thinking: 0 }
        for (const block of content) {
          if (block.type === 'text') {
            const itemId = blockItemId(id, 'text', counts.text++)
            emit({ type: 'item', item: { kind: 'assistant', id: itemId, text: block.text } })
          } else if (block.type === 'thinking') {
            const itemId = blockItemId(id, 'thinking', counts.thinking++)
            if (block.thinking) {
              emit({ type: 'item', item: { kind: 'thinking', id: itemId, text: block.thinking } })
            }
          } else if (block.type === 'tool_use') {
            const input = block.input as Record<string, unknown>
            this.upsertTool({
              kind: 'tool',
              id: block.id,
              name: block.name,
              title: describeTool(block.name, input),
              input,
              status: this.tools.get(block.id)?.status ?? 'running'
            })
          }
        }
        if (message.error) this.notice('error', describeError(message.error))
        return
      }

      case 'user': {
        const content = message.message.content
        if (!Array.isArray(content)) return
        for (const block of content) {
          if (block.type !== 'tool_result') continue
          const tool = this.tools.get(block.tool_use_id)
          if (!tool) continue
          this.upsertTool({
            ...tool,
            status: block.is_error ? 'error' : 'done',
            output: toolResultText(block.content)
          })
        }
        return
      }

      case 'rate_limit_event':
        emit({ type: 'usage', usage: { rateLimits: rateLimitWindows(message.rate_limit_info) } })
        return

      case 'result': {
        const processCost = message.total_cost_usd ?? 0
        this.costUsd +=
          processCost >= this.lastProcessCost ? processCost - this.lastProcessCost : processCost
        this.lastProcessCost = processCost
        emit({
          type: 'usage',
          usage: {
            costUsd: this.costUsd,
            inputTokens: message.usage?.input_tokens,
            outputTokens: message.usage?.output_tokens
          }
        })
        if (this.interrupted) {
          // An interrupted turn ends with internal diagnostics; just say it stopped
          this.notice('info', 'Stopped.')
        } else if (message.subtype !== 'success') {
          const errors = 'errors' in message ? message.errors : []
          this.notice('error', errors?.join('\n') || `Turn ended: ${message.subtype}`)
        }
        this.interrupted = false
        this.pendingTurns = Math.max(0, this.pendingTurns - 1)
        if (this.pendingTurns === 0) emit({ type: 'status', status: 'idle' })
        this.refreshUsage()
        return
      }
    }
  }

  private upsertTool(item: Extract<ChatItem, { kind: 'tool' }>): void {
    this.tools.set(item.id, item)
    this.context.emit({ type: 'item', item })
  }

  private notice(level: 'info' | 'error', text: string): void {
    this.context.emit({ type: 'item', item: { kind: 'notice', id: randomUUID(), level, text } })
  }

  private askPermission(
    toolName: string,
    input: Record<string, unknown>,
    suggestions: PermissionUpdate[] | undefined,
    signal: AbortSignal,
    options: { title?: string; suppressAlwaysAllowRule?: boolean }
  ): Promise<PermissionResult> {
    // Questions are better answered in the chat itself than through a tool UI
    if (toolName === 'AskUserQuestion') {
      return Promise.resolve({
        behavior: 'deny',
        message: 'Ask the user this question as a normal chat message instead.'
      })
    }
    const requestId = randomUUID()
    const item: Extract<ChatItem, { kind: 'permission' }> = {
      kind: 'permission',
      id: `permission:${requestId}`,
      toolName,
      title: options.title || describeTool(toolName, input),
      input,
      status: 'pending',
      canAlwaysAllow: Boolean(suggestions?.length) && !options.suppressAlwaysAllowRule
    }
    this.context.emit({ type: 'item', item })

    return new Promise((resolve) => {
      this.permissions.set(item.id, { item, input, suggestions, resolve })
      signal.addEventListener('abort', () => this.respondToPermission(item.id, 'deny'), {
        once: true
      })
    })
  }

  respondToPermission(itemId: string, decision: PermissionDecision): void {
    const pending = this.permissions.get(itemId)
    if (!pending) return
    this.permissions.delete(itemId)
    const allowed = decision !== 'deny'
    this.context.emit({
      type: 'item',
      item: { ...pending.item, status: allowed ? 'allowed' : 'denied' }
    })
    pending.resolve(
      allowed
        ? {
            behavior: 'allow',
            updatedInput: pending.input,
            updatedPermissions: decision === 'allow-always' ? pending.suggestions : undefined
          }
        : { behavior: 'deny', message: 'The user declined this action.' }
    )
  }

  async send({ text, images }: SendMessageInput): Promise<void> {
    await this.start()
    this.pendingTurns++
    this.context.emit({ type: 'status', status: 'running' })
    this.queue?.push({
      type: 'user',
      session_id: this.sessionId ?? '',
      parent_tool_use_id: null,
      // Typed input from the person at the keyboard
      origin: { kind: 'human' },
      message: {
        role: 'user',
        content: [
          ...images.map((image) => ({
            type: 'image' as const,
            source: { type: 'base64' as const, media_type: image.mediaType, data: image.data }
          })),
          { type: 'text' as const, text }
        ]
      }
    })
  }

  async interrupt(): Promise<void> {
    if (!this.query) return
    this.interrupted = true
    await this.query.interrupt().catch(() => undefined)
  }

  async setModel(model: string): Promise<void> {
    this.model = model
    this.context.emit({ type: 'info', info: { model } })
    await this.query?.setModel(model)
    this.refreshUsage()
  }

  async setPermissionMode(mode: string): Promise<void> {
    this.permissionMode = mode
    this.context.emit({ type: 'info', info: { permissionMode: mode } })
    await this.query?.setPermissionMode(mode as never)
  }

  async refreshUsage(): Promise<void> {
    if (!this.query) return
    try {
      const context = await this.query.getContextUsage()
      this.context.emit({
        type: 'usage',
        usage: { contextTokens: context.totalTokens, contextWindow: context.maxTokens }
      })
    } catch {
      // Older CLIs lack this control request; the chat just shows less detail
    }
  }

  close(): void {
    this.queue?.end()
    this.query?.close()
    this.query = undefined
    this.queue = undefined
    this.starting = undefined
  }
}

const blockItemId = (messageId: string, type: 'text' | 'thinking', ordinal: number): string =>
  `${messageId}:${type}:${ordinal}`

function rateLimitWindows(info: {
  rateLimitType?: string
  utilization?: number
  resetsAt?: number
  status?: RateLimitWindow['status']
}): RateLimitWindow[] {
  // Newer CLIs report every plan window at once (not in the SDK's types yet)
  const unified = (
    info as { unifiedWindows?: Record<string, { utilization?: number; resetsAt?: number }> }
  ).unifiedWindows
  if (unified) {
    return Object.entries(unified).map(([key, window]) => ({
      label: RATE_LIMIT_LABELS[key] ?? key,
      utilization: window.utilization,
      resetsAt: window.resetsAt,
      status: key === info.rateLimitType ? info.status : undefined
    }))
  }
  if (!info.rateLimitType) return []
  return [
    {
      label: RATE_LIMIT_LABELS[info.rateLimitType] ?? info.rateLimitType,
      utilization: info.utilization,
      resetsAt: info.resetsAt,
      status: info.status
    }
  ]
}

function describeError(error: string): string {
  switch (error) {
    case 'authentication_failed':
      return 'Claude Code isn’t signed in. Run `claude` in a terminal and sign in, then try again.'
    case 'rate_limit':
      return 'You’ve hit your Claude usage limit. Try again after it resets.'
    case 'billing_error':
      return 'Claude reported a billing problem with your account.'
    default:
      return `Claude Code reported an error: ${error}`
  }
}
