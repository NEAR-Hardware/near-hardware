import { useState } from 'react'
import { getEnvironment } from '../../../../shared/environments'
import type { RateLimitWindow, SendMessageInput } from '../../../../shared/chat'
import type { Chat, Project } from '../../../../shared/projects'
import { useChat } from '../../hooks/useChat'
import AgentIcon from '../AgentIcon'
import BoardSetupCard from './BoardSetupCard'
import Composer from './Composer'
import MessageList from './MessageList'
import './Chat.css'

const STARTER_PROMPTS = [
  'Explain what’s in this project',
  'Set up a PlatformIO project for an ESP32-S3 board',
  'Add a NEAR testnet account and send a test transaction'
]

const draftKey = (chatId: string): string => `near-hardware.draft.${chatId}`

function readDraft(chatId: string): string {
  try {
    return localStorage.getItem(draftKey(chatId)) ?? ''
  } catch {
    return ''
  }
}

function writeDraft(chatId: string, draft: string): void {
  try {
    if (draft) localStorage.setItem(draftKey(chatId), draft)
    else localStorage.removeItem(draftKey(chatId))
  } catch {
    // Drafts are a convenience; losing one is fine
  }
}

type ChatViewProps = {
  project: Project
  chat: Chat
}

function ChatView({ project, chat }: ChatViewProps): React.JSX.Element | null {
  const state = useChat(project.id, chat.id)
  const [draft, setDraft] = useState(() => readDraft(chat.id))
  const environment = getEnvironment(chat.environmentId)

  if (!state) return null

  const updateDraft = (value: string): void => {
    setDraft(value)
    writeDraft(chat.id, value)
  }

  const send = (input: SendMessageInput): void => {
    window.api.chat.send(project.id, chat.id, input)
  }

  return (
    <div className="chat-view">
      <header className="chat-header">
        <h1 title={chat.title}>{chat.title}</h1>
        <span className="agent-chip">
          <AgentIcon id={chat.environmentId} size={12} tile={false} />
          {environment.name}
        </span>
        <div className="chat-header-spacer" />
        <RateLimits windows={state.usage.rateLimits ?? []} />
      </header>

      {!project.board?.name ? (
        <BoardSetupCard
          project={project}
          agentName={environment.name}
          onStart={(text) => send({ text, images: [] })}
        />
      ) : state.items.length === 0 && state.status !== 'running' ? (
        <div className="chat-empty">
          <AgentIcon id={chat.environmentId} size={26} />
          <p>
            Ask <strong>{environment.name}</strong> to work in <code>{project.name}</code>.
          </p>
          <div className="starter-prompts">
            {STARTER_PROMPTS.map((prompt) => (
              <button key={prompt} className="starter-prompt" onClick={() => updateDraft(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <MessageList
          items={state.items}
          status={state.status}
          agentName={environment.name}
          onPermission={(itemId, decision) =>
            window.api.chat.respondToPermission(chat.id, itemId, decision)
          }
        />
      )}

      {/* The board name is required before anything else */}
      {project.board?.name && (
        <Composer
          agentName={environment.name}
          draft={draft}
          onDraftChange={updateDraft}
          info={state.info}
          usage={state.usage}
          status={state.status}
          onSend={send}
          onStop={() => window.api.chat.interrupt(chat.id)}
          onModelChange={(model) => window.api.chat.setModel(chat.id, model)}
          onPermissionModeChange={(mode) => window.api.chat.setPermissionMode(chat.id, mode)}
        />
      )}
    </div>
  )
}

// Plan usage windows like "5-hour limit 36%", with the reset time on hover
function RateLimits({ windows }: { windows: RateLimitWindow[] }): React.JSX.Element | null {
  const shown = windows.filter((w) => w.utilization !== undefined)
  if (shown.length === 0) return null
  return (
    <div className="rate-limits">
      {shown.map((window) => {
        const percent = Math.round((window.utilization ?? 0) * 100)
        const resets = window.resetsAt
          ? new Date(window.resetsAt * 1000).toLocaleString(undefined, {
              weekday: 'short',
              hour: 'numeric',
              minute: '2-digit'
            })
          : undefined
        return (
          <div
            key={window.label}
            className={`rate-limit${percent >= 90 ? ' high' : percent >= 70 ? ' medium' : ''}`}
            title={resets ? `${window.label}: ${percent}% used, resets ${resets}` : window.label}
          >
            <span className="rate-limit-label">{window.label}</span>
            <span className="rate-limit-bar">
              <span style={{ width: `${percent}%` }} />
            </span>
            <span className="rate-limit-value">{percent}%</span>
          </div>
        )
      })}
    </div>
  )
}

export default ChatView
