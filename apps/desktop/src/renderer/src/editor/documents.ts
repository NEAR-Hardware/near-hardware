import type { FileContent } from '../../../shared/projects'
import { monaco } from './monaco'

// What an editor tab shows: an editable model, or a viewer for other files
export type Loaded =
  | { kind: 'text'; model: monaco.editor.ITextModel }
  | Exclude<FileContent, { kind: 'text' }>
  | { kind: 'error'; message: string }

// One open file. Models outlive the editor widget, so each tab keeps its own
// undo history, scroll position and unsaved edits, like VS Code.
type Document = {
  projectId: string
  path: string
  loaded: Promise<Loaded>
  model?: monaco.editor.ITextModel
  savedVersion: number
  // Last text known to be on disk, to tell our own saves from outside edits
  diskText?: string
  dirty: boolean
  // Changed on disk while it had unsaved edits
  conflict: boolean
  deleted: boolean
  viewState: monaco.editor.ICodeEditorViewState | null
}

const documents = new Map<string, Document>()
const listeners = new Set<() => void>()
let revision = 0

export const documentKey = (projectId: string, path: string): string => `${projectId}\n${path}`

// Fires when a document turns dirty or clean, or hits a conflict, not on every keystroke
export function subscribeDocuments(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const documentsRevision = (): number => revision

function notify(): void {
  revision++
  listeners.forEach((listener) => listener())
}

const errorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message.replace(/^Error invoking remote method '[^']+': (Error: )?/, '')
    : String(error)

function updateDirty(doc: Document): void {
  const dirty = !!doc.model && doc.model.getAlternativeVersionId() !== doc.savedVersion
  if (dirty !== doc.dirty) {
    doc.dirty = dirty
    notify()
  }
}

export function openDocument(
  projectId: string,
  absolutePath: string,
  path: string
): Promise<Loaded> {
  const key = documentKey(projectId, path)
  const existing = documents.get(key)
  if (existing) return existing.loaded
  watchForChanges()

  const doc: Document = {
    projectId,
    path,
    loaded: Promise.resolve({ kind: 'error', message: '' }),
    savedVersion: 0,
    dirty: false,
    conflict: false,
    deleted: false,
    viewState: null
  }
  doc.loaded = window.api.files.read(projectId, path).then(
    (content): Loaded => {
      if (content.kind !== 'text') return content
      // Closed before it finished loading
      if (documents.get(key) !== doc) return { kind: 'error', message: 'Closed' }
      const uri = monaco.Uri.file(absolutePath)
      monaco.editor.getModel(uri)?.dispose()
      // The language comes from the file name, e.g. platformio.ini → ini
      const model = monaco.editor.createModel(content.text, undefined, uri)
      doc.model = model
      doc.savedVersion = model.getAlternativeVersionId()
      doc.diskText = content.text
      model.onDidChangeContent(() => updateDirty(doc))
      return { kind: 'text', model }
    },
    (error): Loaded => ({ kind: 'error', message: errorMessage(error) })
  )
  documents.set(key, doc)
  return doc.loaded
}

const find = (projectId: string, path: string): Document | undefined =>
  documents.get(documentKey(projectId, path))

export const isDirty = (projectId: string, path: string): boolean =>
  find(projectId, path)?.dirty ?? false

export function documentStatus(
  projectId: string,
  path: string
): { dirty: boolean; conflict: boolean; deleted: boolean } {
  const doc = find(projectId, path)
  return { dirty: !!doc?.dirty, conflict: !!doc?.conflict, deleted: !!doc?.deleted }
}

export async function saveDocument(projectId: string, path: string): Promise<void> {
  const doc = find(projectId, path)
  if (!doc?.model) return
  const version = doc.model.getAlternativeVersionId()
  const text = doc.model.getValue()
  await window.api.files.write(projectId, path, text)
  doc.diskText = text
  doc.savedVersion = version
  doc.conflict = false
  doc.deleted = false
  updateDirty(doc)
  notify()
}

export const getViewState = (projectId: string, path: string): Document['viewState'] =>
  find(projectId, path)?.viewState ?? null

export function setViewState(projectId: string, path: string, state: Document['viewState']): void {
  const doc = find(projectId, path)
  if (doc) doc.viewState = state
}

// Disposes documents whose tabs have closed
export function retainDocuments(keys: ReadonlySet<string>): void {
  for (const [key, doc] of documents) {
    if (keys.has(key)) continue
    doc.model?.dispose()
    documents.delete(key)
  }
}

// Replaces only the changed span, so the cursor and undo history survive an
// agent editing the file underneath you
function replaceText(model: monaco.editor.ITextModel, text: string): void {
  const current = model.getValue()
  if (current === text) return
  let start = 0
  const max = Math.min(current.length, text.length)
  while (start < max && current[start] === text[start]) start++
  let end = 0
  while (end < max - start && current[current.length - 1 - end] === text[text.length - 1 - end]) {
    end++
  }
  const range = monaco.Range.fromPositions(
    model.getPositionAt(start),
    model.getPositionAt(current.length - end)
  )
  model.pushEditOperations([], [{ range, text: text.slice(start, text.length - end) }], () => null)
}

function acceptDiskText(doc: Document, text: string): void {
  if (!doc.model) return
  replaceText(doc.model, text)
  doc.diskText = text
  doc.savedVersion = doc.model.getAlternativeVersionId()
  doc.conflict = false
  updateDirty(doc)
  notify()
}

// Conflict choices: take the version on disk, or keep editing yours
export function takeDiskVersion(projectId: string, path: string): void {
  const doc = find(projectId, path)
  if (doc?.diskText !== undefined) acceptDiskText(doc, doc.diskText)
}

export function keepMyVersion(projectId: string, path: string): void {
  const doc = find(projectId, path)
  if (!doc) return
  doc.conflict = false
  notify()
}

async function refresh(doc: Document): Promise<void> {
  if (!doc.model) return
  let content: FileContent
  try {
    content = await window.api.files.read(doc.projectId, doc.path)
  } catch {
    if (!doc.deleted) {
      doc.deleted = true
      notify()
    }
    return
  }
  if (content.kind !== 'text') return
  const wasDeleted = doc.deleted
  doc.deleted = false
  if (content.text === doc.diskText) {
    if (wasDeleted) notify()
    return
  }
  if (doc.dirty) {
    doc.diskText = content.text
    doc.conflict = true
    notify()
    return
  }
  acceptDiskText(doc, content.text)
}

let watching = false

function watchForChanges(): void {
  if (watching) return
  watching = true
  window.api.files.onChange((event) => {
    for (const path of event.paths) {
      const doc = find(event.projectId, path)
      if (doc) refresh(doc)
    }
  })
}
