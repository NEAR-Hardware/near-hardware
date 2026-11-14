// Owns every open chat: its agent session, its transcript (kept in memory and
// saved to disk) and forwarding events to the window
import { app, type WebContents } from 'electron'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { delimiter, join } from 'node:path'
import {
  applyChatEvent,
  EMPTY_CHAT_STATE,
  type ChatEvent,
  type ChatItem,
  type ChatState,
  type PermissionDecision,
  type SendMessageInput
} from '../../shared/chat'
import { getEnvironment } from '../../shared/environments'
import hardwareAgentGuide from '../../../resources/hardware-agent.md?asset'
import { broadcast } from '../broadcast'
import { getSearchPath } from '../environments'
import { mcpServerLaunch } from '../hardware/bridge'
import { getProject, updateChat } from '../projects'
import { readSettings } from '../settings'
import { AcpSession } from './acp'
import { ClaudeSession } from './claude'
import { CodexSession } from './codex'
import type { AgentSession } from './types'

type OpenChat = {
  projectId: string
  chatId: string
  state: ChatState
  session?: AgentSession
  starting?: Promise<AgentSession | undefined>
  saveTimer?: NodeJS.Timeout
  // Saves run one after another so two writes never race on the same file
  saving: Promise<void>
}

const chats = new Map<string, OpenChat>()
// In-flight loads, so two opens of the same chat share one OpenChat (and one CLI)
const loading = new Map<string, Promise<OpenChat>>()
let window: WebContents | null = null
let tempCounter = 0

const transcriptFile = (chatId: string): string =>
  join(app.getPath('userData'), 'chats', `${chatId}.json`)

// A saved transcript may have been cut off mid-turn; settle anything left open
function settle(state: ChatState): ChatState {
  const items = state.items.map((item): ChatItem => {
    if (item.kind === 'tool' && item.status === 'running') return { ...item, status: 'error' }
    if (item.kind === 'permission' && item.status === 'pending') {
      return { ...item, status: 'denied' }
    }
    return item
  })
  return { ...state, items, status: 'idle' }
}

async function loadTranscript(chatId: string): Promise<ChatState> {
  try {
    const saved = JSON.parse(await readFile(transcriptFile(chatId), 'utf8')) as ChatState
    return settle({ ...EMPTY_CHAT_STATE, ...saved })
  } catch {
    return EMPTY_CHAT_STATE
  }
}

function saveTranscript(chat: OpenChat): Promise<void> {
  chat.saving = chat.saving.then(async () => {
    const file = transcriptFile(chat.chatId)
    const temp = `${file}.${process.pid}.${++tempCounter}.tmp`
    await mkdir(join(app.getPath('userData'), 'chats'), { recursive: true })
    await writeFile(temp, JSON.stringify(chat.state))
    await rename(temp, file)
  })
  return chat.saving
}

function scheduleSave(chat: OpenChat): void {
  clearTimeout(chat.saveTimer)
  chat.saveTimer = setTimeout(() => saveTranscript(chat).catch(console.error), 400)
}

function emitter(chat: OpenChat): (event: ChatEvent) => void {
  return (event) => {
    chat.state = applyChatEvent(chat.state, event)
    if (window && !window.isDestroyed()) {
      window.send('chat:event', { chatId: chat.chatId, event })
    }
    scheduleSave(chat)
  }
}

async function createSession(chat: OpenChat): Promise<AgentSession | undefined> {
  const emit = emitter(chat)
  const notice = (text: string): void =>
    emit({ type: 'item', item: { kind: 'notice', id: randomUUID(), level: 'error', text } })

  const project = await getProject(chat.projectId)
  const record = project.chats.find((c) => c.id === chat.chatId)
  if (!record) throw new Error(`Unknown chat: ${chat.chatId}`)
  const environment = (await readSettings()).connectedEnvironments.find(
    (e) => e.id === record.environmentId
  )
  const name = getEnvironment(record.environmentId).name
  if (!environment) {
    notice(`${name} isn’t connected. Connect it in Environments to use this chat.`)
    return undefined
  }

  const context = {
    cwd: project.path,
    executablePath: environment.cliPath,
    resumeSessionId: chat.state.info.providerSessionId,
    model: chat.state.info.model,
    permissionMode: chat.state.info.permissionMode,
    env: { ...process.env, PATH: (await getSearchPath()).join(delimiter) },
    emit,
    mcp: mcpServerLaunch(project.id, chat.chatId),
    systemPrompt: await readFile(
      hardwareAgentGuide.replace('app.asar', 'app.asar.unpacked'),
      'utf8'
    )
  }

  switch (record.environmentId) {
    case 'claude-code':
      return new ClaudeSession(context, chat.state.usage.costUsd)
    case 'codex':
      return new CodexSession(context)
    case 'cursor':
      // Cursor's chat runs through its agent CLI, not the editor's `cursor` launcher
      if (!environment.agentCliPath) {
        notice(
          'Cursor chats need Cursor’s agent CLI. Install it from Environments, then reopen this chat.'
        )
        return undefined
      }
      return new AcpSession(
        { ...context, executablePath: environment.agentCliPath },
        {
          name: 'Cursor',
          args: ['acp'],
          loginHint: 'Run `agent login` in a terminal, then try again.'
        }
      )
    case 'opencode':
      // ACP works today; OpenCode's HTTP server would add token and cost detail
      return new AcpSession(context, {
        name: 'OpenCode',
        args: ['acp'],
        loginHint: 'Run `opencode auth login` in a terminal, then try again.'
      })
    default:
      notice(`Chatting with ${name} isn’t supported yet.`)
      return undefined
  }
}

async function ensureSession(chat: OpenChat): Promise<AgentSession | undefined> {
  if (chat.session) return chat.session
  chat.starting ??= createSession(chat).then((session) => {
    chat.session = session
    chat.starting = undefined
    return session
  })
  return chat.starting
}

function getChat(projectId: string, chatId: string): Promise<OpenChat> {
  const open = chats.get(chatId)
  if (open) return Promise.resolve(open)
  let load = loading.get(chatId)
  if (!load) {
    // Only chats that belong to the project; never create a transcript for a stray id
    load = getProject(projectId)
      .then((project) => {
        if (!project.chats.some((c) => c.id === chatId)) throw new Error('Chat not found')
        return loadTranscript(chatId)
      })
      .then((state) => {
        const chat: OpenChat = { projectId, chatId, state, saving: Promise.resolve() }
        chats.set(chatId, chat)
        loading.delete(chatId)
        return chat
      })
    load.catch(() => loading.delete(chatId))
    loading.set(chatId, load)
  }
  return load
}

export async function openChat(
  projectId: string,
  chatId: string,
  sender: WebContents
): Promise<ChatState> {
  window = sender
  const chat = await getChat(projectId, chatId)
  // Start the CLI in the background so slash commands and models are ready
  ensureSession(chat)
    .then((session) => session?.start())
    .catch((error) =>
      emitter(chat)({
        type: 'item',
        item: { kind: 'notice', id: randomUUID(), level: 'error', text: String(error) }
      })
    )
  return chat.state
}

export async function sendMessage(
  projectId: string,
  chatId: string,
  input: SendMessageInput
): Promise<void> {
  const chat = await getChat(projectId, chatId)
  const emit = emitter(chat)
  emit({ type: 'item', item: { kind: 'user', id: randomUUID(), ...input } })

  // The first message names the chat, like Cursor and Claude
  const isFirst = !chat.state.items.some(
    (item, i) => item.kind === 'user' && i < chat.state.items.length - 1
  )
  const firstLine = input.text.trim().split('\n')[0]
  await updateChat(projectId, chatId, {
    updatedAt: new Date().toISOString(),
    ...(isFirst &&
      firstLine && { title: firstLine.length > 60 ? `${firstLine.slice(0, 57)}…` : firstLine })
  })
  broadcast('projects:changed')

  const session = await ensureSession(chat)
  await session?.send(input)
}

const withSession = async (
  chatId: string,
  action: (session: AgentSession) => Promise<void> | void
): Promise<void> => {
  const session = chats.get(chatId)?.session
  if (session) await action(session)
}

export const interruptChat = (chatId: string): Promise<void> =>
  withSession(chatId, (session) => session.interrupt())

export const setChatModel = (chatId: string, model: string): Promise<void> =>
  withSession(chatId, (session) => session.setModel(model))

export const setChatPermissionMode = (chatId: string, mode: string): Promise<void> =>
  withSession(chatId, (session) => session.setPermissionMode(mode))

export const respondToPermission = (
  chatId: string,
  itemId: string,
  decision: PermissionDecision
): Promise<void> => withSession(chatId, (session) => session.respondToPermission(itemId, decision))

// Closes the chat's CLI and deletes its transcript
export async function disposeChat(chatId: string): Promise<void> {
  const chat = chats.get(chatId)
  if (chat) {
    clearTimeout(chat.saveTimer)
    chat.session?.close()
    chats.delete(chatId)
    // Let an in-flight save land first so it can't recreate the file
    await chat.saving.catch(() => undefined)
  }
  await rm(transcriptFile(chatId), { force: true })
}

export async function closeAllChats(): Promise<void> {
  await Promise.all(
    [...chats.values()].map(async (chat) => {
      clearTimeout(chat.saveTimer)
      chat.session?.close()
      await saveTranscript(chat).catch(() => undefined)
    })
  )
  chats.clear()
}
