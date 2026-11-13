import { useEffect, useLayoutEffect, useRef } from 'react'
import {
  Check,
  ChevronRight,
  CircleAlert,
  Info,
  LoaderCircle,
  ShieldQuestion,
  X
} from 'lucide-react'
import type { ChatItem, ChatStatus, PermissionDecision } from '../../../../shared/chat'
import Markdown from './Markdown'

// Some CLIs color their command output; the chat shows plain text
const stripAnsi = (text: string): string =>
  // eslint-disable-next-line no-control-regex
  text.replace(/\u001b\[[0-9;?]*[A-Za-z]/g, '')

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined

type MessageListProps = {
  items: ChatItem[]
  status: ChatStatus
  agentName: string
  onPermission: (itemId: string, decision: PermissionDecision) => void
}

function MessageList({
  items,
  status,
  agentName,
  onPermission
}: MessageListProps): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null)
  // Follow new output unless the person scrolled up to read
  const stickToBottom = useRef(true)

  const onScroll = (): void => {
    const el = scrollRef.current
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
  }

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight
  }, [items, status])

  // Opening a chat starts at the latest message
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  return (
    <div ref={scrollRef} className="chat-messages" onScroll={onScroll}>
      <div className="chat-messages-inner">
        {items.map((item) => (
          <Item key={item.id} item={item} onPermission={onPermission} />
        ))}
        {status !== 'idle' && (
          <div className="msg-working" role="status">
            <LoaderCircle size={14} className="spin" />
            {status === 'starting' ? `Starting ${agentName}…` : 'Working…'}
          </div>
        )}
      </div>
    </div>
  )
}

function Item({
  item,
  onPermission
}: {
  item: ChatItem
  onPermission: MessageListProps['onPermission']
}): React.JSX.Element | null {
  switch (item.kind) {
    case 'user':
      return (
        <div className="msg-user">
          <div className="msg-user-bubble">
            {item.images.length > 0 && (
              <div className="msg-images">
                {item.images.map((image) => (
                  <img
                    key={image.id}
                    src={`data:${image.mediaType};base64,${image.data}`}
                    alt={image.name ?? 'Attached image'}
                  />
                ))}
              </div>
            )}
            {item.text && <div className="msg-user-text">{item.text}</div>}
          </div>
        </div>
      )
    case 'assistant':
      return item.text ? <Markdown text={item.text} /> : null
    case 'thinking':
      return (
        <details className="msg-disclosure msg-thinking">
          <summary>
            <ChevronRight size={13} className="disclosure-chevron" /> Thinking
          </summary>
          <div className="msg-thinking-text">{item.text}</div>
        </details>
      )
    case 'tool':
      return <ToolRow item={item} />
    case 'permission':
      return <PermissionCard item={item} onPermission={onPermission} />
    case 'command-output':
      return <pre className="msg-command">{stripAnsi(item.text).trim()}</pre>
    case 'notice':
      return (
        <div className={`msg-notice ${item.level}`}>
          {item.level === 'error' ? <CircleAlert size={14} /> : <Info size={14} />}
          <span>{item.text}</span>
        </div>
      )
  }
}

function ToolStatusIcon({ status }: { status: 'running' | 'done' | 'error' }): React.JSX.Element {
  if (status === 'running') return <LoaderCircle size={13} className="spin tool-status running" />
  if (status === 'error') return <X size={13} className="tool-status error" />
  return <Check size={13} className="tool-status done" />
}

function ToolRow({ item }: { item: Extract<ChatItem, { kind: 'tool' }> }): React.JSX.Element {
  return (
    <details className="msg-disclosure msg-tool">
      <summary>
        <ToolStatusIcon status={item.status} />
        <span className="tool-name">{item.name.startsWith('mcp__') ? 'MCP' : item.name}</span>
        <span className="tool-title">{item.title}</span>
        <ChevronRight size={13} className="disclosure-chevron" />
      </summary>
      <div className="tool-body">
        <ToolInput name={item.name} input={item.input} />
        {item.output && <pre className="tool-output">{stripAnsi(item.output)}</pre>}
      </div>
    </details>
  )
}

// Edits read best as a diff; everything else as its raw input
function ToolInput({ name, input }: { name: string; input: unknown }): React.JSX.Element | null {
  const fields = (input ?? {}) as Record<string, unknown>
  const oldText = asString(fields.old_string)
  const newText = asString(fields.new_string)
  if (oldText !== undefined && newText !== undefined) {
    return (
      <pre className="tool-diff">
        {oldText.split('\n').map((line, i) => (
          <div key={`-${i}`} className="diff-removed">
            - {line}
          </div>
        ))}
        {newText.split('\n').map((line, i) => (
          <div key={`+${i}`} className="diff-added">
            + {line}
          </div>
        ))}
      </pre>
    )
  }
  // Unified diffs, e.g. Codex file changes
  const diff = asString(fields.diff)
  if (diff !== undefined) {
    return (
      <pre className="tool-diff">
        {diff.split('\n').map((line, i) => (
          <div
            key={i}
            className={
              line.startsWith('+') && !line.startsWith('+++')
                ? 'diff-added'
                : line.startsWith('-') && !line.startsWith('---')
                  ? 'diff-removed'
                  : undefined
            }
          >
            {line || ' '}
          </div>
        ))}
      </pre>
    )
  }
  // A new file is all additions
  const written = asString(fields.content)
  if (name === 'Write' && written !== undefined) {
    return (
      <pre className="tool-diff">
        {written.split('\n').map((line, i) => (
          <div key={i} className="diff-added">
            + {line}
          </div>
        ))}
      </pre>
    )
  }
  if (name === 'Bash' && asString(fields.command)) {
    return <pre className="tool-command">$ {asString(fields.command)}</pre>
  }
  if (Object.keys(fields).length === 0) return null
  return <pre className="tool-input">{JSON.stringify(fields, null, 2)}</pre>
}

function PermissionCard({
  item,
  onPermission
}: {
  item: Extract<ChatItem, { kind: 'permission' }>
  onPermission: MessageListProps['onPermission']
}): React.JSX.Element {
  const fields = (item.input ?? {}) as Record<string, unknown>
  const plan = item.toolName === 'ExitPlanMode' ? asString(fields.plan) : undefined
  return (
    <div className={`permission-card ${item.status}`}>
      <div className="permission-head">
        <ShieldQuestion size={16} strokeWidth={1.75} />
        <span className="permission-title">{item.title}</span>
      </div>
      {plan ? <Markdown text={plan} /> : <ToolInput name={item.toolName} input={item.input} />}
      {item.status === 'pending' ? (
        <div className="permission-actions">
          <button className="btn small primary" onClick={() => onPermission(item.id, 'allow')}>
            Allow
          </button>
          {item.canAlwaysAllow && (
            <button className="btn small" onClick={() => onPermission(item.id, 'allow-always')}>
              Always allow
            </button>
          )}
          <button className="btn small ghost" onClick={() => onPermission(item.id, 'deny')}>
            Deny
          </button>
        </div>
      ) : (
        <div className="permission-result">
          {item.status === 'allowed' ? <Check size={13} /> : <X size={13} />}
          {item.status === 'allowed' ? 'Allowed' : 'Denied'}
        </div>
      )}
    </div>
  )
}

export default MessageList
