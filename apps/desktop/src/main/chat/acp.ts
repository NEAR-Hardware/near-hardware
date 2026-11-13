// Generic Agent Client Protocol (ACP) adapter: JSON-RPC 2.0 over stdio, spoken
// by Cursor's agent CLI (`agent acp`) and other ACP agents. One process per chat;
// the ACP session id is saved so chats resume with `session/load`.
import { spawn, type ChildProcess } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { createInterface } from 'node:readline'
import type {
  ChatItem,
  PermissionDecision,
  PermissionModeOption,
  SendMessageInput
} from '../../shared/chat'
import type { AdapterContext, AgentSession } from './types'

const REQUEST_TIMEOUT_MS = 60_000

export type AcpAgentConfig = {
  name: string
  args: string[]
  // Shown when the agent reports it isn't signed in
  loginHint: string
}

type RpcMessage = {
  jsonrpc?: '2.0'
  id?: number | string
  method?: string
  params?: Record<string, unknown>
  result?: unknown
  error?: { code: number; message: string; data?: { message?: string } }
}

type ContentBlock = { type: string; text?: string }

type ToolCallContent =
  | { type: 'content'; content: ContentBlock }
  | { type: 'diff'; path: string; oldText?: string | null; newText: string }
  | { type: 'terminal'; terminalId: string }

type ToolCall = {
  toolCallId: string
  title?: string
  kind?: string
  status?: 'pending' | 'in_progress' | 'completed' | 'failed'
  rawInput?: unknown
  content?: ToolCallContent[] | null
}

type PermissionOption = { optionId: string; name: string; kind: string }

const TOOL_NAMES: Record<string, string> = {
  read: 'Read',
  edit: 'Edit',
  delete: 'Delete',
  move: 'Move',
  search: 'Search',
  execute: 'Bash',
  think: 'Think',
  fetch: 'Fetch',
  switch_mode: 'Mode'
}

const PLAN_MARKS: Record<string, string> = { completed: '☑', in_progress: '◐', pending: '☐' }

// Shapes a tool call's input for the chat: diffs as old/new text, else raw input
function toolInput(call: ToolCall, previous: unknown): unknown {
  const diff = call.content?.find((c) => c.type === 'diff')
  if (diff && diff.type === 'diff') {
    return { file_path: diff.path, old_string: diff.oldText ?? '', new_string: diff.newText }
  }
  return call.rawInput ?? previous ?? {}
}

const toolOutput = (call: ToolCall): string | undefined => {
  const text = (call.content ?? [])
    .map((c) => (c.type === 'content' && c.content.type === 'text' ? (c.content.text ?? '') : ''))
    .filter(Boolean)
    .join('\n')
  return text || undefined
}

export class AcpSession implements AgentSession {
  private process?: ChildProcess
  private starting?: Promise<void>
  private nextId = 1
  private requests = new Map<
    number,
    { resolve: (value: unknown) => void; reject: (error: Error) => void; timer?: NodeJS.Timeout }
  >()
  private sessionId?: string
  private sessionReady?: Promise<string | undefined>
  // session/load replays history as updates; the chat already has its own transcript
  private replaying = false
  private pendingTurns = 0
  private turn = 0
  // Text and thinking stream into one item until a tool call splits them
  private textItemId?: string
  private thoughtItemId?: string
  private tools = new Map<string, Extract<ChatItem, { kind: 'tool' }>>()
  private approvals = new Map<
    string,
    {
      rpcId: number | string
      item: Extract<ChatItem, { kind: 'permission' }>
      options: PermissionOption[]
    }
  >()
  private model?: string
  private mode?: string

  constructor(
    private readonly context: AdapterContext,
    private readonly agent: AcpAgentConfig
  ) {
    this.sessionId = context.resumeSessionId
    this.model = context.model
    this.mode = context.permissionMode
  }

  start(): Promise<void> {
    this.starting ??= this.launch().catch((error) => {
      this.starting = undefined
      throw error
    })
    return this.starting
  }

  private async launch(): Promise<void> {
    const { emit } = this.context
    emit({ type: 'status', status: 'starting' })
    const child = spawn(this.context.executablePath!, this.agent.args, {
      cwd: this.context.cwd,
      env: this.context.env,
      stdio: ['pipe', 'pipe', 'pipe']
    })
    this.process = child
    createInterface({ input: child.stdout! }).on('line', (line) => this.onLine(line))
    child.stderr!.on('data', (data) =>
      console.error(`[${this.agent.name}]`, String(data).trimEnd())
    )
    child.on('exit', (code) => this.onExit(child, code))
    child.on('error', (error) =>
      this.notice('error', `Couldn’t start ${this.agent.name}: ${error.message}`)
    )

    try {
      await this.request('initialize', {
        protocolVersion: 1,
        clientCapabilities: { fs: { readTextFile: false, writeTextFile: false }, terminal: false },
        clientInfo: { name: 'near-hardware', title: 'NEAR Hardware', version: '0.1.0' }
      })
      // Resume right away so models, modes and commands show before the first message
      if (this.sessionId) await this.ensureSession()
    } finally {
      if (this.pendingTurns === 0) emit({ type: 'status', status: 'idle' })
    }
  }

  // Creates the session on the first message, or loads the saved one
  private ensureSession(): Promise<string | undefined> {
    this.sessionReady ??= this.openSession().then(
      (id) => id,
      (error: Error) => {
        this.sessionReady = undefined
        const auth = /auth/i.test(error.message)
        this.notice(
          'error',
          auth
            ? `${this.agent.name} isn’t signed in. ${this.agent.loginHint}`
            : `${this.agent.name} couldn’t open a session: ${error.message}`
        )
        return undefined
      }
    )
    return this.sessionReady
  }

  private async openSession(): Promise<string> {
    const params = { cwd: this.context.cwd, mcpServers: [] }
    let result: Record<string, unknown>
    if (this.sessionId) {
      this.replaying = true
      try {
        result = ((await this.request('session/load', { ...params, sessionId: this.sessionId })) ??
          {}) as Record<string, unknown>
      } catch (error) {
        this.notice('info', `Couldn’t resume the earlier session (${(error as Error).message}).`)
        this.sessionId = undefined
        result = (await this.request('session/new', params)) as Record<string, unknown>
      } finally {
        this.replaying = false
      }
    } else {
      result = (await this.request('session/new', params)) as Record<string, unknown>
    }
    this.sessionId = (result.sessionId as string | undefined) ?? this.sessionId!
    this.applySessionOptions(result)
    this.context.emit({ type: 'info', info: { providerSessionId: this.sessionId } })
    return this.sessionId
  }

  private applySessionOptions(result: Record<string, unknown>): void {
    const modes = result.modes as
      | {
          currentModeId: string
          availableModes: { id: string; name: string; description?: string }[]
        }
      | undefined
    const models = result.models as
      | {
          currentModelId: string
          availableModels: { modelId: string; name: string; description?: string }[]
        }
      | undefined
    const permissionModes: PermissionModeOption[] | undefined = modes?.availableModes.map((m) => ({
      value: m.id,
      label: m.name,
      description: m.description ?? m.name
    }))
    this.context.emit({
      type: 'info',
      info: {
        ...(permissionModes && {
          permissionModes,
          permissionMode: this.mode ?? modes!.currentModeId
        }),
        ...(models && {
          models: models.availableModels.map((m) => ({
            value: m.modelId,
            label: m.name,
            description: m.description
          })),
          model: this.model ?? models.currentModelId
        })
      }
    })
    // Re-apply choices made in an earlier run of this chat
    if (this.mode && modes && this.mode !== modes.currentModeId) this.setPermissionMode(this.mode)
    if (this.model && models && this.model !== models.currentModelId) this.setModel(this.model)
  }

  private onLine(line: string): void {
    if (!line.trim()) return
    let message: RpcMessage
    try {
      message = JSON.parse(line)
    } catch {
      return
    }
    if (message.id !== undefined && message.method) {
      this.onAgentRequest(message.id, message.method, message.params ?? {})
    } else if (message.id !== undefined) {
      const pending = this.requests.get(Number(message.id))
      if (!pending) return
      this.requests.delete(Number(message.id))
      clearTimeout(pending.timer)
      if (message.error) {
        pending.reject(new Error(message.error.data?.message ?? message.error.message))
      } else pending.resolve(message.result)
    } else if (message.method === 'session/update' && !this.replaying) {
      this.onUpdate((message.params?.update ?? {}) as Record<string, unknown>)
    }
  }

  private write(message: object): void {
    this.process?.stdin?.write(`${JSON.stringify({ jsonrpc: '2.0', ...message })}\n`)
  }

  // Prompts run as long as the turn does, so they get no timeout
  private request(method: string, params: object, timeout = true): Promise<unknown> {
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      const timer = timeout
        ? setTimeout(() => {
            this.requests.delete(id)
            reject(new Error(`${this.agent.name} didn’t answer ${method}`))
          }, REQUEST_TIMEOUT_MS)
        : undefined
      this.requests.set(id, { resolve, reject, timer })
      this.write({ id, method, params })
    })
  }

  private onUpdate(update: Record<string, unknown>): void {
    const { emit } = this.context
    switch (update.sessionUpdate) {
      case 'agent_message_chunk': {
        const content = update.content as ContentBlock
        if (content?.type !== 'text' || !content.text) return
        this.thoughtItemId = undefined
        this.textItemId ??= `acp:${this.turn}:text:${randomUUID()}`
        emit({ type: 'delta', id: this.textItemId, kind: 'assistant', text: content.text })
        return
      }
      case 'agent_thought_chunk': {
        const content = update.content as ContentBlock
        if (content?.type !== 'text' || !content.text) return
        this.thoughtItemId ??= `acp:${this.turn}:thought:${randomUUID()}`
        emit({ type: 'delta', id: this.thoughtItemId, kind: 'thinking', text: content.text })
        return
      }
      case 'tool_call':
      case 'tool_call_update': {
        const call = update as unknown as ToolCall
        this.textItemId = undefined
        this.thoughtItemId = undefined
        const previous = this.tools.get(call.toolCallId)
        const name = TOOL_NAMES[call.kind ?? ''] ?? previous?.name ?? 'Tool'
        this.upsertTool({
          kind: 'tool',
          id: call.toolCallId,
          name,
          title: call.title ?? previous?.title ?? name,
          input: toolInput(call, previous?.input),
          status:
            call.status === 'completed'
              ? 'done'
              : call.status === 'failed'
                ? 'error'
                : (previous?.status ?? 'running'),
          output: toolOutput(call) ?? previous?.output
        })
        return
      }
      case 'plan': {
        const entries = (update.entries ?? []) as { content: string; status: string }[]
        emit({
          type: 'item',
          item: {
            kind: 'command-output',
            id: `acp:${this.turn}:plan`,
            text: entries.map((e) => `${PLAN_MARKS[e.status] ?? '☐'} ${e.content}`).join('\n')
          }
        })
        return
      }
      case 'available_commands_update': {
        const commands = (update.availableCommands ?? []) as {
          name: string
          description: string
          input?: { hint?: string } | null
        }[]
        emit({
          type: 'info',
          info: {
            commands: commands.map((c) => ({
              name: c.name,
              description: c.description,
              argumentHint: c.input?.hint
            }))
          }
        })
        return
      }
      case 'current_mode_update':
        this.mode = String(update.currentModeId)
        emit({ type: 'info', info: { permissionMode: this.mode } })
        return
    }
  }

  private onAgentRequest(
    rpcId: number | string,
    method: string,
    params: Record<string, unknown>
  ): void {
    if (method === 'session/request_permission') {
      const call = params.toolCall as ToolCall
      const options = (params.options ?? []) as PermissionOption[]
      const previous = this.tools.get(call.toolCallId)
      const item: Extract<ChatItem, { kind: 'permission' }> = {
        kind: 'permission',
        id: `permission:${randomUUID()}`,
        toolName: TOOL_NAMES[call.kind ?? ''] ?? previous?.name ?? 'Tool',
        title: call.title ?? previous?.title ?? 'Allow this action?',
        input: toolInput(call, previous?.input),
        status: 'pending',
        canAlwaysAllow: options.some((o) => o.kind === 'allow_always')
      }
      this.approvals.set(item.id, { rpcId, item, options })
      this.context.emit({ type: 'item', item })
      return
    }
    // Cursor's plan approval: accept, like approving a plan in the agent's own UI
    if (method === 'cursor/create_plan') {
      this.write({ id: rpcId, result: { outcome: { outcome: 'accepted' } } })
      return
    }
    // Questions are skipped so the agent asks in plain chat text instead
    if (method === 'cursor/ask_question') {
      this.write({ id: rpcId, result: { outcome: { outcome: 'skipped' } } })
      return
    }
    this.write({ id: rpcId, error: { code: -32601, message: 'Not supported by NEAR Hardware' } })
  }

  respondToPermission(itemId: string, decision: PermissionDecision): void {
    const approval = this.approvals.get(itemId)
    if (!approval) return
    this.approvals.delete(itemId)
    const wanted =
      decision === 'allow-always'
        ? ['allow_always', 'allow_once']
        : decision === 'allow'
          ? ['allow_once', 'allow_always']
          : ['reject_once', 'reject_always']
    const option = wanted.map((kind) => approval.options.find((o) => o.kind === kind)).find(Boolean)
    this.write({
      id: approval.rpcId,
      result: {
        outcome: option
          ? { outcome: 'selected', optionId: option.optionId }
          : { outcome: 'cancelled' }
      }
    })
    this.context.emit({
      type: 'item',
      item: { ...approval.item, status: decision === 'deny' ? 'denied' : 'allowed' }
    })
  }

  async send({ text, images }: SendMessageInput): Promise<void> {
    await this.start()
    const sessionId = await this.ensureSession()
    if (!sessionId) return
    this.turn++
    this.textItemId = undefined
    this.thoughtItemId = undefined
    this.pendingTurns++
    this.context.emit({ type: 'status', status: 'running' })
    try {
      const result = (await this.request(
        'session/prompt',
        {
          sessionId,
          prompt: [
            { type: 'text', text },
            ...images.map((image) => ({
              type: 'image',
              data: image.data,
              mimeType: image.mediaType
            }))
          ]
        },
        false
      )) as { stopReason?: string }
      if (result?.stopReason === 'cancelled') this.notice('info', 'Stopped.')
      else if (result?.stopReason === 'refusal')
        this.notice('error', `${this.agent.name} declined this request.`)
    } catch (error) {
      this.notice('error', (error as Error).message)
    } finally {
      this.pendingTurns = Math.max(0, this.pendingTurns - 1)
      if (this.pendingTurns === 0) this.context.emit({ type: 'status', status: 'idle' })
    }
  }

  async interrupt(): Promise<void> {
    if (this.sessionId)
      this.write({ method: 'session/cancel', params: { sessionId: this.sessionId } })
    // Pending approvals are void once the turn is cancelled
    for (const itemId of [...this.approvals.keys()]) this.respondToPermission(itemId, 'deny')
  }

  async setModel(model: string): Promise<void> {
    this.model = model
    this.context.emit({ type: 'info', info: { model } })
    if (!this.sessionId) return
    try {
      await this.request('session/set_model', { sessionId: this.sessionId, modelId: model })
    } catch {
      // Agents without the (unstable) set_model method take it as a config option
      await this.request('session/set_config_option', {
        sessionId: this.sessionId,
        configId: 'model',
        value: model
      }).catch((error) =>
        this.notice('error', `Couldn’t switch model: ${(error as Error).message}`)
      )
    }
  }

  async setPermissionMode(mode: string): Promise<void> {
    this.mode = mode
    this.context.emit({ type: 'info', info: { permissionMode: mode } })
    if (!this.sessionId) return
    await this.request('session/set_mode', { sessionId: this.sessionId, modeId: mode }).catch(
      (error) => this.notice('error', `Couldn’t switch mode: ${(error as Error).message}`)
    )
  }

  // ACP has no usage reporting; the chat simply shows no context meter
  refreshUsage(): Promise<void> {
    return Promise.resolve()
  }

  private upsertTool(item: Extract<ChatItem, { kind: 'tool' }>): void {
    this.tools.set(item.id, item)
    this.context.emit({ type: 'item', item })
  }

  private notice(level: 'info' | 'error', text: string): void {
    this.context.emit({ type: 'item', item: { kind: 'notice', id: randomUUID(), level, text } })
  }

  private onExit(child: ChildProcess, code: number | null): void {
    if (this.process !== child) return
    this.process = undefined
    this.starting = undefined
    this.sessionReady = undefined
    for (const pending of this.requests.values()) {
      clearTimeout(pending.timer)
      pending.reject(new Error(`${this.agent.name} exited`))
    }
    this.requests.clear()
    for (const approval of this.approvals.values()) {
      this.context.emit({ type: 'item', item: { ...approval.item, status: 'denied' } })
    }
    this.approvals.clear()
    if (code !== 0 && code !== null) {
      this.notice('error', `${this.agent.name} stopped unexpectedly (exit code ${code}).`)
    }
    this.pendingTurns = 0
    this.context.emit({ type: 'status', status: 'idle' })
  }

  close(): void {
    const child = this.process
    this.process = undefined
    this.starting = undefined
    this.sessionReady = undefined
    if (child) {
      child.stdin?.end()
      // Closing stdin doesn't stop every ACP agent; SIGTERM does
      child.kill('SIGTERM')
    }
  }
}
