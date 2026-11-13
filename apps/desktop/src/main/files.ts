import { watch, type FSWatcher } from 'node:fs'
import { readdir, realpath, stat } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import type { WebContents } from 'electron'
import type { FileEntry, FilesChangedEvent } from '../shared/projects'

// Hidden from the tree, matching VS Code's default files.exclude
const HIDDEN = new Set(['.git', '.svn', '.hg', 'CVS', '.DS_Store', 'Thumbs.db'])
// Changes under these are too noisy to forward (installs touch thousands of files)
const UNWATCHED_SEGMENTS = new Set(['.git', 'node_modules', '.pio'])

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

const toPosix = (path: string): string => path.split(sep).join('/')

// Resolves a project-relative path, refusing anything that ends up outside the
// project folder, including through symlinks
export async function resolveInProject(root: string, relativePath: string): Promise<string> {
  const realRoot = await realpath(root)
  const target = await realpath(resolve(realRoot, relativePath))
  if (target !== realRoot && !target.startsWith(realRoot + sep)) {
    throw new Error('Path is outside the project folder')
  }
  return target
}

export async function listDirectory(root: string, dir: string): Promise<FileEntry[]> {
  const absolute = await resolveInProject(root, dir)
  const entries = await readdir(absolute, { withFileTypes: true })
  const result: FileEntry[] = []
  for (const entry of entries) {
    if (HIDDEN.has(entry.name)) continue
    let isDirectory = entry.isDirectory()
    if (entry.isSymbolicLink()) {
      isDirectory = await stat(resolve(absolute, entry.name)).then(
        (s) => s.isDirectory(),
        () => false
      )
    }
    result.push({
      name: entry.name,
      path: dir ? `${dir}/${entry.name}` : entry.name,
      kind: isDirectory ? 'directory' : 'file'
    })
  }
  // Folders first, then files, in natural order (file2 before file10)
  return result.sort((a, b) =>
    a.kind === b.kind ? collator.compare(a.name, b.name) : a.kind === 'directory' ? -1 : 1
  )
}

let active: { projectId: string; watcher: FSWatcher } | null = null

export function stopWatching(): void {
  active?.watcher.close()
  active = null
}

// Forwards which directories changed so the renderer can re-list the ones it shows
export function watchProject(projectId: string, root: string, sender: WebContents): void {
  if (active?.projectId === projectId) return
  stopWatching()

  const changed = new Set<string>()
  let timer: NodeJS.Timeout | undefined
  const flush = (): void => {
    timer = undefined
    if (sender.isDestroyed()) return stopWatching()
    const event: FilesChangedEvent = { projectId, dirs: [...changed] }
    changed.clear()
    sender.send('files:changed', event)
  }

  try {
    const watcher = watch(root, { recursive: true }, (_event, filename) => {
      if (!filename) return
      const path = toPosix(filename.toString())
      if (path.split('/').some((segment) => UNWATCHED_SEGMENTS.has(segment))) return
      const parent = toPosix(dirname(path))
      changed.add(parent === '.' ? '' : parent)
      // Batch bursts (an agent writing many files) into one update
      timer ??= setTimeout(flush, 150)
    })
    watcher.on('error', stopWatching)
    active = { projectId, watcher }
  } catch {
    // Folder missing or unwatchable: the tree still works, just without live updates
  }
}
