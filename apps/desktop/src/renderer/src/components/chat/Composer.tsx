import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUp, ImagePlus, Square, X } from 'lucide-react'
import type {
  ChatStatus,
  ImageAttachment,
  SendMessageInput,
  SessionInfo,
  UsageInfo
} from '../../../../shared/chat'

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] as const
// Claude's per-image limit; the others are in the same range
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_IMAGES = 10

type ComposerProps = {
  agentName: string
  draft: string
  onDraftChange: (draft: string) => void
  info: SessionInfo
  usage: UsageInfo
  status: ChatStatus
  onSend: (input: SendMessageInput) => void
  onStop: () => void
  onModelChange: (model: string) => void
  onPermissionModeChange: (mode: string) => void
}

function readImage(file: File): Promise<ImageAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      resolve({
        id: crypto.randomUUID(),
        mediaType: file.type as ImageAttachment['mediaType'],
        // Drop the "data:image/png;base64," prefix
        data: String(reader.result).split(',')[1] ?? '',
        name: file.name || undefined
      })
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function Composer({
  agentName,
  draft,
  onDraftChange,
  info,
  usage,
  status,
  onSend,
  onStop,
  onModelChange,
  onPermissionModeChange
}: ComposerProps): React.JSX.Element {
  const [images, setImages] = useState<ImageAttachment[]>([])
  const [imageError, setImageError] = useState<string | null>(null)
  const [menuIndex, setMenuIndex] = useState(0)
  const [menuDismissed, setMenuDismissed] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Grow with the text, up to a cap set in CSS
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [draft])

  useEffect(() => textareaRef.current?.focus(), [])

  // The slash menu shows while typing a command name: "/" then no space yet
  const commandQuery = /^\/(\S*)$/.exec(draft)?.[1]?.toLowerCase()
  const commands = useMemo(() => {
    if (commandQuery === undefined) return []
    return info.commands
      .filter((command) => command.name.toLowerCase().includes(commandQuery))
      .sort(
        (a, b) =>
          Number(!a.name.toLowerCase().startsWith(commandQuery)) -
            Number(!b.name.toLowerCase().startsWith(commandQuery)) || a.name.localeCompare(b.name)
      )
  }, [info.commands, commandQuery])
  const menuOpen = commands.length > 0 && !menuDismissed
  const activeIndex = Math.min(menuIndex, Math.max(0, commands.length - 1))

  useEffect(() => {
    menuRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const updateDraft = (value: string): void => {
    onDraftChange(value)
    setMenuIndex(0)
    setMenuDismissed(false)
  }

  const addFiles = async (files: Iterable<File>): Promise<void> => {
    setImageError(null)
    const accepted: File[] = []
    for (const file of files) {
      if (!IMAGE_TYPES.includes(file.type as (typeof IMAGE_TYPES)[number])) {
        setImageError('Only PNG, JPEG, GIF and WebP images can be attached.')
      } else if (file.size > MAX_IMAGE_BYTES) {
        setImageError(`${file.name || 'That image'} is over 5 MB.`)
      } else {
        accepted.push(file)
      }
    }
    const read = await Promise.all(accepted.map(readImage))
    setImages((current) => {
      const next = [...current, ...read]
      if (next.length > MAX_IMAGES) setImageError(`Up to ${MAX_IMAGES} images per message.`)
      return next.slice(0, MAX_IMAGES)
    })
  }

  const submit = (): void => {
    const text = draft.trim()
    if (!text && images.length === 0) return
    onSend({ text, images })
    onDraftChange('')
    setImages([])
    setImageError(null)
  }

  const chooseCommand = (name: string): void => {
    updateDraft(`/${name} `)
    textareaRef.current?.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.nativeEvent.isComposing) return
    if (menuOpen) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const step = event.key === 'ArrowDown' ? 1 : -1
        setMenuIndex((activeIndex + step + commands.length) % commands.length)
        return
      }
      if (event.key === 'Tab' || (event.key === 'Enter' && !event.shiftKey)) {
        event.preventDefault()
        chooseCommand(commands[activeIndex].name)
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        setMenuDismissed(true)
        return
      }
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  const onPaste = (event: React.ClipboardEvent<HTMLTextAreaElement>): void => {
    const files = [...event.clipboardData.files].filter((file) => file.type.startsWith('image/'))
    if (files.length > 0) {
      event.preventDefault()
      addFiles(files)
    }
  }

  const running = status === 'running'
  const canSend = draft.trim().length > 0 || images.length > 0
  const currentModel = info.models.find(
    (m) => m.value === info.model || m.resolvedModel === info.model
  )

  return (
    <div
      className="composer-wrap"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        addFiles(event.dataTransfer.files)
      }}
    >
      {menuOpen && (
        <div ref={menuRef} className="slash-menu" role="listbox" aria-label="Commands">
          {commands.map((command, index) => (
            <button
              key={command.name}
              data-index={index}
              role="option"
              aria-selected={index === activeIndex}
              className={`slash-item${index === activeIndex ? ' active' : ''}`}
              onMouseEnter={() => setMenuIndex(index)}
              onMouseDown={(event) => {
                // Keep focus in the textarea
                event.preventDefault()
                chooseCommand(command.name)
              }}
            >
              <span className="slash-name">
                /{command.name}
                {command.argumentHint && (
                  <span className="slash-hint"> {command.argumentHint}</span>
                )}
              </span>
              <span className="slash-description">{command.description}</span>
            </button>
          ))}
        </div>
      )}

      <div className="composer">
        {images.length > 0 && (
          <div className="composer-images">
            {images.map((image) => (
              <div key={image.id} className="composer-image">
                <img src={`data:${image.mediaType};base64,${image.data}`} alt={image.name ?? ''} />
                <button
                  className="composer-image-remove"
                  aria-label="Remove image"
                  onClick={() => setImages((current) => current.filter((i) => i.id !== image.id))}
                >
                  <X size={11} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={draft}
          rows={1}
          placeholder={`Ask ${agentName}… (/ for commands, paste images)`}
          spellCheck={false}
          onChange={(event) => updateDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
        />
        {imageError && <p className="composer-error">{imageError}</p>}

        <div className="composer-footer">
          <button
            className="icon-button"
            aria-label="Attach images"
            title="Attach images"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus size={16} strokeWidth={1.5} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={IMAGE_TYPES.join(',')}
            multiple
            hidden
            onChange={(event) => {
              if (event.target.files) addFiles(event.target.files)
              event.target.value = ''
            }}
          />

          {info.models.length > 0 && (
            <select
              className="composer-select"
              aria-label="Model"
              title={currentModel?.description ?? 'Model'}
              value={currentModel?.value ?? info.model ?? ''}
              onChange={(event) => onModelChange(event.target.value)}
            >
              {!currentModel && info.model && <option value={info.model}>{info.model}</option>}
              {info.models.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          )}

          {info.permissionModes.length > 0 && (
            <select
              className="composer-select"
              aria-label="Permission mode"
              title={
                info.permissionModes.find((m) => m.value === info.permissionMode)?.description ??
                'Permission mode'
              }
              value={info.permissionMode ?? info.permissionModes[0].value}
              onChange={(event) => onPermissionModeChange(event.target.value)}
            >
              {info.permissionModes.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          )}

          <div className="composer-footer-spacer" />
          <ContextMeter usage={usage} />
          {usage.costUsd !== undefined && usage.costUsd > 0 && (
            <span className="composer-cost" title="Spent in this chat">
              ${usage.costUsd < 0.01 ? usage.costUsd.toFixed(4) : usage.costUsd.toFixed(2)}
            </span>
          )}

          {running && !canSend ? (
            <button className="send-button stop" aria-label="Stop" title="Stop" onClick={onStop}>
              <Square size={12} fill="currentColor" />
            </button>
          ) : (
            <button
              className="send-button"
              aria-label="Send"
              title={running ? 'Send (queued after the current turn)' : 'Send'}
              disabled={!canSend}
              onClick={submit}
            >
              <ArrowUp size={16} strokeWidth={2.25} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ContextMeter({ usage }: { usage: UsageInfo }): React.JSX.Element | null {
  const { contextTokens, contextWindow } = usage
  if (!contextTokens || !contextWindow) return null
  const fraction = Math.min(1, contextTokens / contextWindow)
  const radius = 7
  const circumference = 2 * Math.PI * radius
  const level = fraction > 0.85 ? 'high' : fraction > 0.6 ? 'medium' : 'low'
  return (
    <span
      className={`context-meter ${level}`}
      title={`Context: ${contextTokens.toLocaleString()} of ${contextWindow.toLocaleString()} tokens`}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <circle cx="9" cy="9" r={radius} className="context-track" />
        <circle
          cx="9"
          cy="9"
          r={radius}
          className="context-fill"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
        />
      </svg>
      {Math.round(fraction * 100)}%
    </span>
  )
}

export default Composer
