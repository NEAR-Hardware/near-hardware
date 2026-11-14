import { useEffect, useRef, useState } from 'react'
import { Check, ShieldQuestion, X } from 'lucide-react'
import { getEnvironment } from '../../../shared/environments'
import type { Project } from '../../../shared/projects'
import { playChime } from '../attention/chime'
import type { View } from '../view'
import AgentIcon from './AgentIcon'
import './AttentionToasts.css'

type Toast = {
  id: string
  kind: 'permission' | 'done'
  projectId: string
  chatId: string
  environmentId: Parameters<typeof AgentIcon>[0]['id']
  heading: string
  detail?: string
  where: string
}

// Finished-turn popups go away on their own; permission ones wait for an answer
const DONE_TIMEOUT_MS = 15000

type AttentionToastsProps = {
  projects: Project[]
  view: View
  onOpen: (projectId: string, chatId: string) => void
}

// Pops up with a chime when an agent needs you: it asks permission, or it
// finished and is waiting for your reply. Not for the chat you're looking at.
function AttentionToasts({ projects, view, onOpen }: AttentionToastsProps): React.JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([])
  const context = useRef({ projects, view })
  const statuses = useRef(new Map<string, string>())

  useEffect(() => {
    context.current = { projects, view }
  })

  useEffect(() => {
    const offChime = window.api.onChime(playChime)
    const offChat = window.api.chat.onEvent(({ chatId, event }) => {
      const { projects: list, view: current } = context.current
      const project = list.find((p) => p.chats.some((c) => c.id === chatId))
      const chat = project?.chats.find((c) => c.id === chatId)
      if (!project || !chat) return
      const watching =
        document.hasFocus() &&
        current.kind === 'project' &&
        current.projectId === project.id &&
        current.chatId === chatId
      const agent = getEnvironment(chat.environmentId).name
      const base = {
        projectId: project.id,
        chatId,
        environmentId: chat.environmentId,
        where: `${chat.title} · ${project.name}`
      }

      const add = (toast: Toast): void => {
        setToasts((list) => [...list.filter((t) => t.id !== toast.id), toast].slice(-4))
        playChime()
        window.api.requestAttention()
      }

      if (event.type === 'item' && event.item.kind === 'permission') {
        const { item } = event
        if (item.status !== 'pending') {
          // Answered (here or in the chat): its popup is done
          setToasts((list) => list.filter((t) => t.id !== item.id))
        } else if (!watching) {
          add({
            ...base,
            id: item.id,
            kind: 'permission',
            heading: `${agent} needs your OK`,
            detail: item.title
          })
        }
      }

      if (event.type === 'status') {
        const before = statuses.current.get(chatId)
        statuses.current.set(chatId, event.status)
        if (before === 'running' && event.status === 'idle' && !watching) {
          add({ ...base, id: `done:${chatId}`, kind: 'done', heading: `${agent} finished` })
        }
      }
    })
    return () => {
      offChime()
      offChat()
    }
  }, [])

  // Finished-turn popups leave after a while
  useEffect(() => {
    const done = toasts.filter((t) => t.kind === 'done')
    if (!done.length) return
    const timer = setTimeout(
      () => setToasts((list) => list.filter((t) => !done.includes(t))),
      DONE_TIMEOUT_MS
    )
    return () => clearTimeout(timer)
  }, [toasts])

  const dismiss = (id: string): void => setToasts((list) => list.filter((t) => t.id !== id))

  return (
    <div className="attention-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`attention-toast ${toast.kind}`}>
          <div className="attention-icon">
            {toast.kind === 'permission' ? (
              <ShieldQuestion size={15} strokeWidth={1.75} />
            ) : (
              <Check size={15} strokeWidth={2} />
            )}
          </div>
          <div className="attention-text">
            <div className="attention-heading">
              <AgentIcon id={toast.environmentId} size={11} tile={false} />
              {toast.heading}
            </div>
            {toast.detail && <div className="attention-detail">{toast.detail}</div>}
            <div className="attention-where">{toast.where}</div>
          </div>
          <div className="attention-actions">
            <button
              className="btn small primary"
              onClick={() => {
                dismiss(toast.id)
                onOpen(toast.projectId, toast.chatId)
              }}
            >
              Open
            </button>
            <button
              className="icon-button small"
              aria-label="Dismiss"
              title="Dismiss"
              onClick={() => dismiss(toast.id)}
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default AttentionToasts
