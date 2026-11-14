import { useEffect, useState } from 'react'
import type { PiStatus, SshTarget } from '../../../shared/projects'

const CHECK_EVERY_MS = 8000

// Whether a project's Pi answers over SSH, checked every few seconds; undefined until the first check
export function usePiStatus(projectId: string, target: SshTarget): PiStatus | undefined {
  const [status, setStatus] = useState<{ key: string; status: PiStatus }>()
  const key = `${projectId}:${target.user}@${target.host}:${target.port}`

  useEffect(() => {
    let cancelled = false
    const check = (): void => {
      window.api.pi.status(projectId).then((result) => {
        if (!cancelled) setStatus({ key, status: result })
      })
    }
    check()
    const timer = setInterval(check, CHECK_EVERY_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [projectId, key])

  // A different Pi starts unknown again
  return status?.key === key ? status.status : undefined
}
