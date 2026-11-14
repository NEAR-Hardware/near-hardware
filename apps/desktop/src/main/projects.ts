import { app } from 'electron'
import { randomUUID } from 'node:crypto'
import { mkdir, readdir, realpath, stat } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import type { EnvironmentId } from '../shared/environments'
import type { BoardProfile, Chat, CreateProjectResult, Project } from '../shared/projects'
import { sanitizeScreenSpec } from '../shared/screens'
import { readSettings, updateSettings, type Settings } from './settings'

export async function defaultProjectLocation(): Promise<string> {
  return (
    (await readSettings()).lastProjectLocation ?? join(app.getPath('documents'), 'NEAR Hardware')
  )
}

export async function getProject(projectId: string): Promise<Project> {
  const project = (await readSettings()).projects.find((p) => p.id === projectId)
  if (!project) throw new Error(`Unknown project: ${projectId}`)
  return project
}

// Returns a problem with the name, or null if it's a usable folder name
function validateFolderName(name: string): string | null {
  if (!name) return 'Give the project a name.'
  if (name.length > 100) return 'Keep the name under 100 characters.'
  if (name === '.' || name === '..') return 'That name is reserved.'
  if (/[/\\:*?"<>|]/.test(name)) return 'Names can’t contain / \\ : * ? " < > or |.'
  if ([...name].some((char) => char.charCodeAt(0) < 32))
    return 'Names can’t contain control characters.'
  if (name.startsWith('.')) return 'Names can’t start with a dot.'
  return null
}

async function addProject(path: string, name: string): Promise<Project> {
  let project: Project = {
    id: randomUUID(),
    name,
    path,
    createdAt: new Date().toISOString(),
    chats: []
  }
  await updateSettings((settings) => {
    // Opening the same folder twice reuses the existing project
    const existing = settings.projects.find((p) => p.path === path)
    if (existing) {
      project = existing
      return settings
    }
    return { ...settings, projects: [...settings.projects, project] }
  })
  return project
}

export async function createProject(input: unknown): Promise<CreateProjectResult> {
  const { name: rawName, location } = (input ?? {}) as { name?: unknown; location?: unknown }
  const name = typeof rawName === 'string' ? rawName.trim() : ''
  const problem = validateFolderName(name)
  if (problem) return { ok: false, error: problem }
  if (typeof location !== 'string' || !location) return { ok: false, error: 'Pick a location.' }

  const path = resolve(location, name)
  try {
    const existing = await stat(path)
    if (!existing.isDirectory() || (await readdir(path)).length > 0) {
      return {
        ok: false,
        error: `A folder named “${name}” already exists there. Open it as an existing folder instead.`
      }
    }
  } catch {
    // Doesn't exist yet, which is what we want
  }

  try {
    await mkdir(path, { recursive: true })
  } catch (error) {
    return { ok: false, error: `Couldn’t create the folder: ${(error as Error).message}` }
  }
  await updateSettings((settings) => ({ ...settings, lastProjectLocation: resolve(location) }))
  return { ok: true, project: await addProject(path, name) }
}

export async function addExistingFolder(path: string): Promise<CreateProjectResult> {
  try {
    if (!(await stat(path)).isDirectory()) return { ok: false, error: 'That isn’t a folder.' }
  } catch {
    return { ok: false, error: 'That folder no longer exists.' }
  }
  const resolved = await realpath(path)
  return { ok: true, project: await addProject(resolved, basename(resolved)) }
}

export async function removeProject(projectId: string): Promise<void> {
  await updateSettings((settings) => ({
    ...settings,
    projects: settings.projects.filter((p) => p.id !== projectId)
  }))
}

function updateProject(
  settings: Settings,
  projectId: string,
  update: (project: Project) => Project
): Settings {
  if (!settings.projects.some((p) => p.id === projectId)) {
    throw new Error(`Unknown project: ${projectId}`)
  }
  return {
    ...settings,
    projects: settings.projects.map((p) => (p.id === projectId ? update(p) : p))
  }
}

export async function createChat(projectId: string, environmentId: EnvironmentId): Promise<Chat> {
  const now = new Date().toISOString()
  const chat: Chat = {
    id: randomUUID(),
    title: 'New chat',
    environmentId,
    createdAt: now,
    updatedAt: now
  }
  await updateSettings((settings) => {
    if (!settings.connectedEnvironments.some((e) => e.id === environmentId)) {
      throw new Error(`Connect ${environmentId} in Environments before using it in a chat`)
    }
    return updateProject(settings, projectId, (p) => ({ ...p, chats: [...p.chats, chat] }))
  })
  return chat
}

// Merges fields into the project's board profile; only known string fields and a
// valid screen spec are kept.
// replace starts a fresh profile instead (the user switched boards).
export async function updateProjectBoard(
  projectId: string,
  patch: Record<string, unknown>,
  replace = false
): Promise<BoardProfile | undefined> {
  const fields: (keyof BoardProfile)[] = [
    'name',
    'port',
    'vendorId',
    'productId',
    'serialNumber',
    'manufacturer',
    'chip',
    'docsUrl',
    'platformioBoard',
    'framework',
    'summary'
  ]
  const clean = Object.fromEntries(
    fields
      .filter((key) => typeof patch[key] === 'string')
      .map((key) => [key, String(patch[key]).trim()])
  )
  const screen = sanitizeScreenSpec(patch.screen)
  let board: BoardProfile | undefined
  await updateSettings((settings) =>
    updateProject(settings, projectId, (p) => {
      board = {
        ...(replace ? {} : p.board),
        ...clean,
        ...(screen !== undefined && { screen }),
        name: String(clean.name ?? p.board?.name ?? '')
      }
      return { ...p, board }
    })
  )
  return board
}

export async function updateChat(
  projectId: string,
  chatId: string,
  patch: Partial<Pick<Chat, 'title' | 'updatedAt'>>
): Promise<void> {
  await updateSettings((settings) =>
    updateProject(settings, projectId, (p) => ({
      ...p,
      chats: p.chats.map((c) => (c.id === chatId ? { ...c, ...patch } : c))
    }))
  )
}

export async function deleteChat(projectId: string, chatId: string): Promise<void> {
  await updateSettings((settings) =>
    updateProject(settings, projectId, (p) => ({
      ...p,
      chats: p.chats.filter((c) => c.id !== chatId)
    }))
  )
}
