import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { BookOpen, ChevronRight, Code, ExternalLink, LoaderCircle } from 'lucide-react'
import type { Project } from '../../../../shared/projects'
import {
  documentStatus,
  documentsRevision,
  getViewState,
  keepMyVersion,
  openDocument,
  setViewState,
  subscribeDocuments,
  takeDiskVersion,
  type Loaded
} from '../../editor/documents'
import { monaco } from '../../editor/monaco'
import { basename, joinPath } from '../../format'
import Markdown from '../chat/Markdown'
import FileIcon from '../FileIcon'
import './Editor.css'

const EDITOR_FONT = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace"

const formatSize = (bytes: number): string =>
  bytes < 1024
    ? `${bytes} B`
    : bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`

const languageName = (id: string): string =>
  monaco.languages.getLanguages().find((language) => language.id === id)?.aliases?.[0] ?? id

type FileEditorProps = {
  project: Project
  // null while the chat tab is showing; the editor keeps its last file
  path: string | null
}

// The center area's file view: Monaco for text, a viewer for images
function FileEditor({ project, path }: FileEditorProps): React.JSX.Element {
  useSyncExternalStore(subscribeDocuments, documentsRevision)
  const hostRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>(null)
  const [loaded, setLoaded] = useState<{ path: string; value: Loaded } | null>(null)
  const [cursor, setCursor] = useState({ line: 1, column: 1 })
  const [previewing, setPreviewing] = useState<ReadonlySet<string>>(new Set())
  const [, setContentVersion] = useState(0)

  useEffect(() => {
    const editor = monaco.editor.create(hostRef.current!, {
      model: null,
      theme: 'near-dark',
      automaticLayout: true,
      fontFamily: EDITOR_FONT,
      fontSize: 13,
      lineHeight: 20,
      padding: { top: 8 },
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      cursorSmoothCaretAnimation: 'on',
      renderLineHighlight: 'all',
      bracketPairColorization: { enabled: true },
      guides: { bracketPairs: 'active' },
      stickyScroll: { enabled: true },
      fixedOverflowWidgets: true
    })
    editorRef.current = editor
    const cursorListener = editor.onDidChangeCursorPosition(({ position }) =>
      setCursor({ line: position.lineNumber, column: position.column })
    )
    return () => {
      cursorListener.dispose()
      editor.dispose()
      editorRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!path) return
    let cancelled = false
    openDocument(project.id, joinPath(project.path, path), path).then((value) => {
      if (!cancelled) setLoaded({ path, value })
    })
    return () => {
      cancelled = true
    }
  }, [project.id, project.path, path])

  // Shows the loaded model, restoring where you left off in it
  useEffect(() => {
    const editor = editorRef.current
    if (!editor || loaded?.value.kind !== 'text') return
    const { model } = loaded.value
    const shownPath = loaded.path
    editor.setModel(model)
    const state = getViewState(project.id, shownPath)
    if (state) editor.restoreViewState(state)
    const position = editor.getPosition()
    if (position) setCursor({ line: position.lineNumber, column: position.column })
    // Re-renders the Markdown preview as the file changes
    const contentListener = model.onDidChangeContent(() => setContentVersion((v) => v + 1))
    return () => {
      contentListener.dispose()
      if (!model.isDisposed()) setViewState(project.id, shownPath, editor.saveViewState())
    }
  }, [loaded, project.id])

  const ready = loaded && loaded.path === path ? loaded.value : null
  const shownPath = path ?? loaded?.path ?? ''
  const status = documentStatus(project.id, shownPath)
  const isMarkdown = /\.(md|markdown|mdx)$/i.test(shownPath)
  const previewOn = isMarkdown && previewing.has(shownPath)
  const model = ready?.kind === 'text' && !ready.model.isDisposed() ? ready.model : null

  const togglePreview = (): void =>
    setPreviewing((current) => {
      const next = new Set(current)
      if (next.has(shownPath)) next.delete(shownPath)
      else next.add(shownPath)
      return next
    })

  const segments = shownPath.split('/')

  return (
    <div className="file-editor">
      <div className="file-editor-bar">
        <nav className="breadcrumbs" aria-label="File path">
          {segments.map((segment, i) => (
            <span key={i} className="breadcrumb">
              {i > 0 && <ChevronRight size={12} className="breadcrumb-separator" />}
              {i === segments.length - 1 && <FileIcon name={segment} kind="file" />}
              {segment}
            </span>
          ))}
        </nav>
        <div className="panel-spacer" />
        {model && (
          <span className="file-editor-meta">
            {status.dirty ? 'Unsaved · ' : ''}
            {languageName(model.getLanguageId())} · Ln {cursor.line}, Col {cursor.column}
          </span>
        )}
        {model && isMarkdown && (
          <button
            className="icon-button small"
            aria-label={previewOn ? 'Show source' : 'Show preview'}
            title={previewOn ? 'Show source' : 'Show preview'}
            onClick={togglePreview}
          >
            {previewOn ? (
              <Code size={14} strokeWidth={1.5} />
            ) : (
              <BookOpen size={14} strokeWidth={1.5} />
            )}
          </button>
        )}
        <button
          className="icon-button small"
          aria-label="Open in default app"
          title="Open in default app"
          onClick={() => window.api.files.open(project.id, shownPath)}
        >
          <ExternalLink size={14} strokeWidth={1.5} />
        </button>
      </div>

      {status.conflict && (
        <div className="file-editor-banner" role="alert">
          <span>
            <strong>{basename(shownPath)}</strong> changed on disk while you had unsaved edits.
          </span>
          <button className="btn small" onClick={() => takeDiskVersion(project.id, shownPath)}>
            Use disk version
          </button>
          <button className="btn small" onClick={() => keepMyVersion(project.id, shownPath)}>
            Keep mine
          </button>
        </div>
      )}
      {status.deleted && !status.conflict && (
        <div className="file-editor-banner" role="alert">
          <span>This file was deleted on disk. Save (⌘S) to restore it.</span>
        </div>
      )}

      <div className="file-editor-body">
        <div ref={hostRef} className="monaco-host" hidden={!model || previewOn} />
        {model && previewOn && (
          <div className="markdown-preview">
            <Markdown text={model.getValue()} />
          </div>
        )}
        {!ready && path && (
          <div className="file-editor-message">
            <LoaderCircle size={16} className="spin" />
          </div>
        )}
        {ready?.kind === 'image' && <ImageView dataUrl={ready.dataUrl} size={ready.size} />}
        {ready &&
          (ready.kind === 'binary' || ready.kind === 'too-large' || ready.kind === 'error') && (
            <div className="file-editor-message">
              <p>
                {ready.kind === 'binary' && `This is a binary file (${formatSize(ready.size)}).`}
                {ready.kind === 'too-large' &&
                  `This file is too large to open here (${formatSize(ready.size)}).`}
                {ready.kind === 'error' && `Couldn’t open this file: ${ready.message}`}
              </p>
              {ready.kind !== 'error' && (
                <button
                  className="btn small"
                  onClick={() => window.api.files.open(project.id, shownPath)}
                >
                  <ExternalLink size={13} /> Open in default app
                </button>
              )}
            </div>
          )}
      </div>
    </div>
  )
}

function ImageView({ dataUrl, size }: { dataUrl: string; size: number }): React.JSX.Element {
  const [dimensions, setDimensions] = useState<string>()
  return (
    <div className="image-view">
      <img
        src={dataUrl}
        alt=""
        onLoad={(event) =>
          setDimensions(
            `${event.currentTarget.naturalWidth} × ${event.currentTarget.naturalHeight} · `
          )
        }
      />
      <p>
        {dimensions}
        {formatSize(size)}
      </p>
    </div>
  )
}

export default FileEditor
