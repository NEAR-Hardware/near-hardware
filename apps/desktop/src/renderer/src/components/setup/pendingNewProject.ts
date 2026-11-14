// "Create your first project" with Move to Applications: the app relaunches,
// so the choice is kept until the relaunched app opens the New Project dialog
const KEY = 'near-hardware.pending-new-project'

export function rememberNewProject(pending: boolean): void {
  try {
    if (pending) localStorage.setItem(KEY, '1')
    else localStorage.removeItem(KEY)
  } catch {
    // Storage unavailable: the user opens New Project themselves
  }
}

export function takePendingNewProject(): boolean {
  try {
    const pending = localStorage.getItem(KEY) === '1'
    localStorage.removeItem(KEY)
    return pending
  } catch {
    return false
  }
}
