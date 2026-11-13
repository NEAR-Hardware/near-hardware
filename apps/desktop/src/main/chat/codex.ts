// Codex adapter: drives the user's installed `codex` CLI through `codex app-server`,
// its JSON-RPC protocol over stdin/stdout (newline-delimited, no "jsonrpc" field).
// One process per chat; the Codex thread id is saved so chats resume after restarts.
import { spawn, type ChildProcess } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { createInterface } from 'node:readline'
import type {
  ChatItem,
  PermissionDecision,
  PermissionModeOption,
  RateLimitWindow,
  SendMessageInput,
  SlashCommandInfo
} from '../../shared/chat'
import type { AdapterContext, AgentSession } from './types'

const REQUEST_TIMEOUT_MS = 30_000

// Sandbox + approval policy pairs, matching Codex's own presets
const MODES: Record<string, { sandbox: string; sandboxPolicy: object; approvalPolicy: string }> = {
  agent: {
    sandbox: 'workspace-write',
    sandboxPolicy: { type: 'workspaceWrite', writableRoots: [], networkAccess: false },
    approvalPolicy: 'on-request'
  },
  ask: {
    sandbox: 'workspace-write',
    sandboxPolicy: { type: 'workspaceWrite', writableRoots: [], networkAccess: false },
    approvalPolicy: 'untrusted'
  },
  'read-only': {
    sandbox: 'read-only',
    sandboxPolicy: { type: 'readOnly', networkAccess: false },
    approvalPolicy: 'on-request'
  }
}

const PERMISSION_MODES: PermissionModeOption[] = [
  {
    value: 'agent',
    label: 'Agent',
    description: 'Edits and runs commands in the project, asks before anything outside it'
  },
  { value: 'ask', label: 'Ask every time', description: 'Asks before every command and edit' },
  { value: 'read-only', label: 'Read only', description: 'Reads files; asks before any change' }
]

const COMMANDS: SlashCommandInfo[] = [
  { name: 'compact', description: 'Summarize the conversation to free up context' },
  { name: 'init', description: 'Create an AGENTS.md guide for this project' },
  { name: 'review', description: 'Review the uncommitted changes in this project' },
  { name: 'status', description: 'Show the model, context and usage limits' }
]

const INIT_PROMPT =
  'Generate a file named AGENTS.md that serves as a contributor guide for this repository. ' +
  'Check whether AGENTS.md already exists first and improve it rather than replacing it. ' +
  'Title it "Repository Guidelines" and cover project structure, build/test/dev commands, ' +
  'coding style, testing guidelines and commit/PR conventions in 200-400 words, ' +
  'using concrete commands and paths from this repository.'

type RpcMessage = {
  id?: number | string
  method?: string
  params?: Record<string, unknown>
  result?: unknown
  error?: { code: number; message: string }
}

type CodexItem = {
  type: string
  id: string
  text?: string
  summary?: string[]
  command?: string
  commandActions?: { command?: string }[]
  aggregatedOutput?: string | null
  exitCode?: number | null
  status?: string
  changes?: { path: string; diff?: string }[]
  tool?: string
  server?: string
  query?: string
}

type RateLimitSnapshot = {
  primary?: { usedPercent?: number; resetsAt?: number; windowDurationMins?: number } | null
  secondary?: { usedPercent?: number; resetsAt?: number; windowDurationMins?: number } | null
}

const windowLabel = (minutes?: number): string =>
  minutes === 300 ? '5-hour limit' : minutes === 10080 ? 'Weekly limit' : 'Usage limit'

// Upstream errors arrive as JSON strings; dig out the human-readable message
function friendlyError(message: string): string {
  try {
    const parsed = JSON.parse(message)
    return parsed?.error?.message ?? parsed?.message ?? message
  } catch {
    return message
  }
}

const relativeTo = (cwd: string, path: string): string =>
  path.startsWith(`${cwd}/`) ? path.slice(cwd.length + 1) : path

export class CodexSession implements AgentSession {
  private process?: ChildProcess
  private starting?: Promise<void>
  private nextId = 1
  private requests = new Map<
    number,
    { resolve: (value: unknown) => void; reject: (error: Error) => void; timer: NodeJS.Timeout }
  >()
  private threadId?: string
  private turnId?: string
  private model?: string
  private mode: string
  private pendingTurns = 0
  private interrupted = false
  private items = new Map<string, Extract<ChatItem, { kind: 'tool' }>>()
  // Approval requests waiting on the user, keyed by their permission item id
  private approvals = new Map<
    string,
    {
      rpcId: number | string
      item: Extract<ChatItem, { kind: 'permission' }>
      decisions: unknown[]
      // MCP elicitations answer with an action instead of a decision
      elicitation?: boolean
    }
  >()
  private rateLimits: RateLimitSnapshot = {}

  constructor(private readonly context: AdapterContext) {
    this.threadId = context.resumeSessionId
    this.model = context.model
    this.mode =
      context.permissionMode && MODES[context.permissionMode] ? context.permissionMode : 'agent'
    context.emit({
      type: 'info',
      info: { permissionModes: PERMISSION_MODES, permissionMode: this.mode, commands: COMMANDS }
    })
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
    const { command, args, env } = this.context.mcp
    const toml = (value: string): string => JSON.stringify(value)
    const child = spawn(
      this.context.executablePath ?? 'codex',
      [
        'app-server',
        '-c',
        `mcp_servers.near_hardware.command=${toml(command)}`,
        '-c',
        `mcp_servers.near_hardware.args=[${args.map(toml).join(',')}]`,
        '-c',
        `mcp_servers.near_hardware.env={${Object.entries(env)
          .map(([key, value]) => `${key}=${toml(value)}`)
          .join(',')}}`
      ],
      {
        cwd: this.context.cwd,
        env: this.context.env,
        stdio: ['pipe', 'pipe', 'pipe']
      }
    )
    this.process = child
    createInterface({ input: child.stdout! }).on('line', (line) => this.onLine(line))
    child.stderr!.on('data', (data) => console.error('[codex]', String(data).trimEnd()))
    child.on('exit', (code) => this.onExit(child, code))
    child.on('error', (error) => this.notice('error', `Couldn’t start Codex: ${error.message}`))

    try {
      await this.request('initialize', {
        clientInfo: { name: 'near_hardware', title: 'NEAR Hardware', version: '0.1.0' },
        capabilities: null
      })
      this.notify('initialized')

      const [account, models] = await Promise.all([
        this.request('account/read', { refreshToken: false }) as Promise<{ account: unknown }>,
        this.request('model/list', {}) as Promise<{
          data: { id: string; displayName: string; description?: string }[]
        }>
      ])
      if (!account.account) {
        this.notice(
          'error',
          'Codex isn’t signed in. Run `codex login` in a terminal, then try again.'
        )
      }
      emit({
        type: 'info',
        info: {
          models: models.data.map((m) => ({
            value: m.id,
            label: m.displayName,
            description: m.description
          }))
        }
      })
      if (this.threadId) await this.resumeThread()
      this.refreshUsage()
    } finally {
      if (this.pendingTurns === 0) emit({ type: 'status', status: 'idle' })
    }
  }

  private async resumeThread(): Promise<void> {
    const mode = MODES[this.mode]
    try {
      const result = (await this.request('thread/resume', {
        threadId: this.threadId,
        excludeTurns: true,
        approvalPolicy: mode.approvalPolicy,
        sandbox: mode.sandbox
      })) as { model?: string }
      this.model ??= result.model
      this.context.emit({ type: 'info', info: { model: this.model } })
    } catch (error) {
      // The thread may have been deleted in Codex; start fresh on the next message
      this.notice(
        'info',
        `Couldn’t resume the earlier Codex session (${(error as Error).message}).`
      )
      this.threadId = undefined
    }
  }

  private async ensureThread(): Promise<string> {
    if (this.threadId) return this.threadId
    const mode = MODES[this.mode]
    const result = (await this.request('thread/start', {
      cwd: this.context.cwd,
      sandbox: mode.sandbox,
      approvalPolicy: mode.approvalPolicy,
      developerInstructions: this.context.systemPrompt,
      ...(this.model && { model: this.model })
    })) as { thread: { id: string }; model?: string }
    this.threadId = result.thread.id
    this.model ??= result.model
    this.context.emit({
      type: 'info',
      info: { providerSessionId: this.threadId, model: this.model }
    })
    return this.threadId
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
      this.onServerRequest(message.id, message.method, message.params ?? {})
    } else if (message.id !== undefined) {
      const pending = this.requests.get(Number(message.id))
      if (!pending) return
      this.requests.delete(Number(message.id))
      clearTimeout(pending.timer)
      if (message.error) pending.reject(new Error(message.error.message))
      else pending.resolve(message.result)
    } else if (message.method) {
      this.onNotification(message.method, message.params ?? {})
    }
  }

  private write(message: object): void {
    this.process?.stdin?.write(`${JSON.stringify(message)}\n`)
  }

  private request(method: string, params: object): Promise<unknown> {
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      // Unknown methods get no reply at all, so every request needs a timeout
      const timer = setTimeout(() => {
        this.requests.delete(id)
        reject(new Error(`Codex didn’t answer ${method}`))
      }, REQUEST_TIMEOUT_MS)
      this.requests.set(id, { resolve, reject, timer })
      this.write({ method, id, params })
    })
  }

  private notify(method: string, params?: object): void {
    this.write(params ? { method, params } : { method })
  }

  private onNotification(method: string, params: Record<string, unknown>): void {
    const { emit } = this.context
    if (typeof params.threadId === 'string' && params.threadId !== this.threadId) return

    switch (method) {
      case 'turn/started':
        this.turnId = (params.turn as { id: string }).id
        return
      case 'item/started':
      case 'item/completed':
        this.onItem(params.item as CodexItem, method === 'item/completed')
        return
      case 'item/agentMessage/delta':
        emit({
          type: 'delta',
          id: `codex:${params.itemId}`,
          kind: 'assistant',
          text: String(params.delta)
        })
        return
      case 'item/reasoning/summaryTextDelta':
        emit({
          type: 'delta',
          id: `codex:${params.itemId}`,
          kind: 'thinking',
          text: String(params.delta)
        })
        return
      case 'item/commandExecution/outputDelta': {
        const tool = this.items.get(String(params.itemId))
        if (tool) this.upsertTool({ ...tool, output: (tool.output ?? '') + String(params.delta) })
        return
      }
      case 'thread/tokenUsage/updated': {
        const usage = params.tokenUsage as {
          total: { inputTokens: number; outputTokens: number }
          last: { totalTokens: number }
          modelContextWindow: number | null
        }
        emit({
          type: 'usage',
          usage: {
            contextTokens: usage.last.totalTokens,
            contextWindow: usage.modelContextWindow ?? undefined,
            inputTokens: usage.total.inputTokens,
            outputTokens: usage.total.outputTokens
          }
        })
        return
      }
      case 'account/rateLimits/updated':
        this.mergeRateLimits(params.rateLimits as RateLimitSnapshot)
        return
      case 'error': {
        const error = params.error as { message: string }
        if (params.willRetry) this.notice('info', `Retrying: ${friendlyError(error.message)}`)
        else this.notice('error', friendlyError(error.message))
        return
      }
      case 'warning':
        this.notice('info', String(params.message))
        return
      case 'serverRequest/resolved': {
        // An approval was settled without us (e.g. the turn was interrupted)
        for (const [itemId, approval] of this.approvals) {
          if (approval.rpcId === params.requestId) {
            this.approvals.delete(itemId)
            emit({ type: 'item', item: { ...approval.item, status: 'denied' } })
          }
        }
        return
      }
      case 'turn/completed': {
        const turn = params.turn as { status: string; error?: { message: string } | null }
        if (turn.status === 'interrupted' || this.interrupted) this.notice('info', 'Stopped.')
        else if (turn.status === 'failed' && turn.error) {
          this.notice('error', friendlyError(turn.error.message))
        }
        this.interrupted = false
        this.turnId = undefined
        this.pendingTurns = Math.max(0, this.pendingTurns - 1)
        if (this.pendingTurns === 0) emit({ type: 'status', status: 'idle' })
        return
      }
    }
  }

  private onItem(item: CodexItem, completed: boolean): void {
    const { emit } = this.context
    const id = `codex:${item.id}`
    switch (item.type) {
      case 'agentMessage':
        if (completed && item.text)
          emit({ type: 'item', item: { kind: 'assistant', id, text: item.text } })
        return
      case 'reasoning':
        if (completed && item.summary?.length) {
          emit({ type: 'item', item: { kind: 'thinking', id, text: item.summary.join('\n\n') } })
        }
        return
      case 'commandExecution': {
        const command = item.commandActions?.[0]?.command ?? item.command ?? 'command'
        this.upsertTool({
          kind: 'tool',
          id: item.id,
          name: 'Bash',
          title: command,
          input: { command },
          status: !completed ? 'running' : item.exitCode === 0 ? 'done' : 'error',
          output: item.aggregatedOutput ?? this.items.get(item.id)?.output
        })
        return
      }
      case 'fileChange': {
        const paths = (item.changes ?? []).map((c) => relativeTo(this.context.cwd, c.path))
        const diff = (item.changes ?? []).map((c) => c.diff ?? '').join('\n')
        this.upsertTool({
          kind: 'tool',
          id: item.id,
          name: 'Edit',
          title: `Edit ${paths.join(', ')}`,
          input: { diff },
          status: !completed ? 'running' : item.status === 'completed' ? 'done' : 'error'
        })
        return
      }
      case 'mcpToolCall':
      case 'webSearch':
      case 'dynamicToolCall': {
        const name = item.type === 'webSearch' ? 'WebSearch' : (item.tool ?? item.type)
        this.upsertTool({
          kind: 'tool',
          id: item.id,
          name,
          title: item.query ?? [item.server, item.tool].filter(Boolean).join(' › ') ?? name,
          input: {},
          status: !completed ? 'running' : item.status === 'failed' ? 'error' : 'done'
        })
        return
      }
      case 'contextCompaction':
        if (completed) this.notice('info', 'Conversation compacted to free up context.')
        return
    }
  }

  private onServerRequest(
    rpcId: number | string,
    method: string,
    params: Record<string, unknown>
  ): void {
    if (
      method === 'item/commandExecution/requestApproval' ||
      method === 'item/fileChange/requestApproval'
    ) {
      const isCommand = method === 'item/commandExecution/requestApproval'
      const tool = this.items.get(String(params.itemId))
      const decisions = Array.isArray(params.availableDecisions) ? params.availableDecisions : []
      const item: Extract<ChatItem, { kind: 'permission' }> = {
        kind: 'permission',
        id: `permission:${randomUUID()}`,
        toolName: isCommand ? 'Bash' : 'Edit',
        title: isCommand
          ? String(params.command ?? tool?.title ?? 'Run a command')
          : (tool?.title ?? 'Edit files'),
        input: isCommand ? { command: params.command } : (tool?.input ?? {}),
        status: 'pending',
        // Without a decisions list, Codex accepts the documented defaults
        canAlwaysAllow: decisions.length === 0 || decisions.includes('acceptForSession')
      }
      this.approvals.set(item.id, { rpcId, item, decisions })
      this.context.emit({ type: 'item', item })
      return
    }
    if (method === 'mcpServer/elicitation/request') {
      // Our own tools are safe; approve them without bothering the user
      if (params.serverName === 'near_hardware') {
        this.write({ id: rpcId, result: { action: 'accept', content: {}, _meta: null } })
        return
      }
      const item: Extract<ChatItem, { kind: 'permission' }> = {
        kind: 'permission',
        id: `permission:${randomUUID()}`,
        toolName: 'MCP',
        title: String(params.message ?? `${params.serverName} wants to run a tool`),
        input: {},
        status: 'pending',
        canAlwaysAllow: false
      }
      this.approvals.set(item.id, { rpcId, item, decisions: [], elicitation: true })
      this.context.emit({ type: 'item', item })
      return
    }
    // Requests the chat can't present yet are declined so the turn never hangs
    this.write({
      id: rpcId,
      error: { code: -32601, message: 'Not supported by NEAR Hardware yet' }
    })
  }

  respondToPermission(itemId: string, decision: PermissionDecision): void {
    const approval = this.approvals.get(itemId)
    if (!approval) return
    this.approvals.delete(itemId)
    if (approval.elicitation) {
      const accepted = decision !== 'deny'
      this.write({
        id: approval.rpcId,
        result: {
          action: accepted ? 'accept' : 'decline',
          content: accepted ? {} : null,
          _meta: null
        }
      })
      this.context.emit({
        type: 'item',
        item: { ...approval.item, status: accepted ? 'allowed' : 'denied' }
      })
      return
    }
    const offers = (value: string): boolean =>
      approval.decisions.length === 0 || approval.decisions.includes(value)
    let answer: string
    if (decision === 'allow-always' && offers('acceptForSession')) answer = 'acceptForSession'
    else if (decision !== 'deny') answer = 'accept'
    else answer = offers('decline') ? 'decline' : 'cancel'
    this.write({ id: approval.rpcId, result: { decision: answer } })
    this.context.emit({
      type: 'item',
      item: { ...approval.item, status: decision === 'deny' ? 'denied' : 'allowed' }
    })
  }

  async send({ text, images }: SendMessageInput): Promise<void> {
    await this.start()
    const command = /^\/(\w+)\s*(.*)$/s.exec(text.trim())
    if (command && (await this.runCommand(command[1], command[2]))) return

    const threadId = await this.ensureThread()
    const mode = MODES[this.mode]
    this.pendingTurns++
    this.context.emit({ type: 'status', status: 'running' })
    try {
      const result = (await this.request('turn/start', {
        threadId,
        input: [
          { type: 'text', text, text_elements: [] },
          ...images.map((image) => ({
            type: 'image',
            url: `data:${image.mediaType};base64,${image.data}`
          }))
        ],
        approvalPolicy: mode.approvalPolicy,
        sandboxPolicy: mode.sandboxPolicy,
        ...(this.model && { model: this.model })
      })) as { turn: { id: string } }
      this.turnId = result.turn.id
    } catch (error) {
      this.pendingTurns = Math.max(0, this.pendingTurns - 1)
      if (this.pendingTurns === 0) this.context.emit({ type: 'status', status: 'idle' })
      this.notice('error', `Codex couldn’t start the turn: ${(error as Error).message}`)
    }
  }

  // Returns true when the slash command was handled here instead of sent as text
  private async runCommand(name: string, args: string): Promise<boolean> {
    switch (name) {
      case 'compact': {
        const threadId = await this.ensureThread()
        this.pendingTurns++
        this.context.emit({ type: 'status', status: 'running' })
        await this.request('thread/compact/start', { threadId })
        return true
      }
      case 'review': {
        const threadId = await this.ensureThread()
        this.pendingTurns++
        this.context.emit({ type: 'status', status: 'running' })
        await this.request('review/start', {
          threadId,
          target: args.trim()
            ? { type: 'custom', instructions: args.trim() }
            : { type: 'uncommittedChanges' },
          delivery: 'inline'
        })
        return true
      }
      case 'init':
        await this.send({ text: INIT_PROMPT, images: [] })
        return true
      case 'status':
        await this.refreshUsage()
        this.context.emit({
          type: 'item',
          item: { kind: 'command-output', id: randomUUID(), text: this.statusText() }
        })
        return true
      default:
        return false
    }
  }

  private statusText(): string {
    const lines = [`Model: ${this.model ?? 'default'}`, `Mode: ${this.mode}`]
    for (const window of [this.rateLimits.primary, this.rateLimits.secondary]) {
      if (!window || window.usedPercent === undefined) continue
      const resets = window.resetsAt ? new Date(window.resetsAt * 1000).toLocaleString() : 'unknown'
      lines.push(
        `${windowLabel(window.windowDurationMins)}: ${window.usedPercent}% used, resets ${resets}`
      )
    }
    return lines.join('\n')
  }

  private mergeRateLimits(update: RateLimitSnapshot): void {
    // Updates are sparse: keep earlier values where the update has none
    this.rateLimits = {
      primary: update.primary ?? this.rateLimits.primary,
      secondary: update.secondary ?? this.rateLimits.secondary
    }
    const windows: RateLimitWindow[] = []
    for (const window of [this.rateLimits.primary, this.rateLimits.secondary]) {
      if (!window || window.usedPercent === undefined) continue
      windows.push({
        label: windowLabel(window.windowDurationMins),
        utilization: window.usedPercent / 100,
        resetsAt: window.resetsAt
      })
    }
    this.context.emit({ type: 'usage', usage: { rateLimits: windows } })
  }

  async interrupt(): Promise<void> {
    if (!this.threadId || !this.turnId) return
    this.interrupted = true
    await this.request('turn/interrupt', { threadId: this.threadId, turnId: this.turnId }).catch(
      () => undefined
    )
  }

  async setModel(model: string): Promise<void> {
    // Applied on the next turn, and sticky from then on
    this.model = model
    this.context.emit({ type: 'info', info: { model } })
  }

  async setPermissionMode(mode: string): Promise<void> {
    if (!MODES[mode]) return
    this.mode = mode
    this.context.emit({ type: 'info', info: { permissionMode: mode } })
  }

  async refreshUsage(): Promise<void> {
    if (!this.process) return
    try {
      const result = (await this.request('account/rateLimits/read', {})) as {
        rateLimits?: RateLimitSnapshot
      }
      if (result.rateLimits) this.mergeRateLimits(result.rateLimits)
    } catch {
      // Not available for API-key logins; the chat just shows less detail
    }
  }

  private upsertTool(item: Extract<ChatItem, { kind: 'tool' }>): void {
    this.items.set(item.id, item)
    this.context.emit({ type: 'item', item })
  }

  private notice(level: 'info' | 'error', text: string): void {
    this.context.emit({ type: 'item', item: { kind: 'notice', id: randomUUID(), level, text } })
  }

  private onExit(child: ChildProcess, code: number | null): void {
    if (this.process !== child) return
    this.process = undefined
    this.starting = undefined
    for (const pending of this.requests.values()) {
      clearTimeout(pending.timer)
      pending.reject(new Error('Codex exited'))
    }
    this.requests.clear()
    for (const approval of this.approvals.values()) {
      this.context.emit({ type: 'item', item: { ...approval.item, status: 'denied' } })
    }
    this.approvals.clear()
    if (code !== 0 && code !== null)
      this.notice('error', `Codex stopped unexpectedly (exit code ${code}).`)
    this.pendingTurns = 0
    this.context.emit({ type: 'status', status: 'idle' })
  }

  close(): void {
    const child = this.process
    this.process = undefined
    this.starting = undefined
    if (child) {
      child.stdin?.end()
      child.kill('SIGTERM')
    }
  }
}
