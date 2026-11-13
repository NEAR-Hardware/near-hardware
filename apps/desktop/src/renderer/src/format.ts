const platform = (): string | undefined => document.documentElement.dataset.platform

// Compact age like Cursor's sidebar: "now", "5m", "3h", "2d", "4w", then a date
export function formatRelativeTime(iso: string, now: number): string {
  const seconds = Math.max(0, (now - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  if (seconds < 7 * 86400) return `${Math.floor(seconds / 86400)}d`
  if (seconds < 5 * 7 * 86400) return `${Math.floor(seconds / (7 * 86400))}w`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function revealLabel(): string {
  if (platform() === 'darwin') return 'Reveal in Finder'
  if (platform() === 'win32') return 'Reveal in File Explorer'
  return 'Open Containing Folder'
}

export const basename = (path: string): string => path.split(/[\\/]/).filter(Boolean).pop() ?? path

// Joins a project folder and a "/"-separated relative path using the OS separator
export function joinPath(root: string, relativePath: string): string {
  const separator = platform() === 'win32' ? '\\' : '/'
  return relativePath ? `${root}${separator}${relativePath.split('/').join(separator)}` : root
}
