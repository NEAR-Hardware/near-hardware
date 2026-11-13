import type { EnvironmentId } from './environments'

// A conversation with one connected coding agent, run inside its project's folder
export type Chat = {
  id: string
  title: string
  environmentId: EnvironmentId
  createdAt: string
  updatedAt: string
}

// The hardware a project targets: what the user told us plus what the agent learned
export type BoardProfile = {
  // Exact name as the user entered it, ideally copied from the maker's site
  name: string
  port?: string
  vendorId?: string
  productId?: string
  manufacturer?: string
  chip?: string
  docsUrl?: string
  platformioBoard?: string
  framework?: string
  summary?: string
}

export type Project = {
  id: string
  name: string
  // Absolute path of the project's folder
  path: string
  createdAt: string
  chats: Chat[]
  board?: BoardProfile
}

export type CreateProjectResult = { ok: true; project: Project } | { ok: false; error: string }

export type FileEntry = {
  name: string
  // Relative to the project folder, "/"-separated; "" is the folder itself
  path: string
  kind: 'file' | 'directory'
}

export type FilesChangedEvent = {
  projectId: string
  // Directories whose listing changed, relative to the project folder
  dirs: string[]
}

export type MenuItemSpec = { id: string; label: string; enabled?: boolean } | { type: 'separator' }
