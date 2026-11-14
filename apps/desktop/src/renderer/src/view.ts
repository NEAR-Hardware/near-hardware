// What the main area shows
export type View =
  | { kind: 'environments' }
  // Every NEAR account, opened from the sidebar's primary accounts
  | { kind: 'accounts' }
  // A project's home, or one of its chats when chatId is set
  | { kind: 'project'; projectId: string; chatId?: string }

const STORAGE_KEY = 'near-hardware.view'

export function loadView(): View {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (saved?.kind === 'accounts') return { kind: 'accounts' }
    if (saved?.kind === 'project' && typeof saved.projectId === 'string') {
      return {
        kind: 'project',
        projectId: saved.projectId,
        chatId: typeof saved.chatId === 'string' ? saved.chatId : undefined
      }
    }
  } catch {
    // Fall through to the default
  }
  return { kind: 'environments' }
}

export const sameView = (a: View, b: View): boolean => JSON.stringify(a) === JSON.stringify(b)

export function saveView(view: View): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(view))
  } catch {
    // Storage unavailable: the app just opens on Environments next time
  }
}
