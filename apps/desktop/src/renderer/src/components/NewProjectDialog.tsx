import { useEffect, useRef, useState } from 'react'
import { FolderOpen, LoaderCircle } from 'lucide-react'
import type { Project } from '../../../shared/projects'
import { joinPath } from '../format'
import './NewProjectDialog.css'

type NewProjectDialogProps = {
  onClose: () => void
  onCreated: (project: Project) => void
}

function NewProjectDialog({ onClose, onCreated }: NewProjectDialogProps): React.JSX.Element {
  const [name, setName] = useState('')
  const [location, setLocation] = useState<string>()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.api.projects.defaultLocation().then(setLocation)
    nameRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const create = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    if (!location || busy) return
    setBusy(true)
    setError(null)
    try {
      const result = await window.api.projects.create({ name, location })
      if (result.ok) onCreated(result.project)
      else setError(result.error)
    } finally {
      setBusy(false)
    }
  }

  const chooseLocation = async (): Promise<void> => {
    const chosen = await window.api.projects.chooseLocation(location)
    if (chosen) setLocation(chosen)
  }

  const openExisting = async (): Promise<void> => {
    const result = await window.api.projects.openExisting()
    if (!result) return
    if (result.ok) onCreated(result.project)
    else setError(result.error)
  }

  const trimmed = name.trim()

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <form
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-project-title"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={create}
      >
        <h2 id="new-project-title">New project</h2>
        <p className="dialog-subtitle">
          NEAR Hardware creates a folder for the project. Its files and chats live there.
        </p>

        <label className="field">
          <span>Project name</span>
          <input
            ref={nameRef}
            value={name}
            placeholder="watch-wallet"
            spellCheck={false}
            onChange={(event) => {
              setName(event.target.value)
              setError(null)
            }}
          />
        </label>

        <div className="field">
          <span>Location</span>
          <div className="location-row">
            <code className="location-path" title={location}>
              {location ?? '…'}
            </code>
            <button type="button" className="btn small" onClick={chooseLocation}>
              Change…
            </button>
          </div>
        </div>

        {location && trimmed && !error && (
          <p className="dialog-hint">
            Creates <code>{joinPath(location, trimmed)}</code>
          </p>
        )}
        {error && (
          <p className="dialog-error" role="alert">
            {error}
          </p>
        )}

        <div className="dialog-footer">
          <button type="button" className="btn ghost" onClick={openExisting}>
            <FolderOpen size={14} strokeWidth={1.5} /> Open existing folder…
          </button>
          <div className="dialog-footer-spacer" />
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={!trimmed || !location || busy}>
            {busy && <LoaderCircle size={13} className="spin" />}
            Create project
          </button>
        </div>
      </form>
    </div>
  )
}

export default NewProjectDialog
