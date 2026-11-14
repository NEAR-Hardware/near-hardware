import { useEffect, useState } from 'react'
import type { PlatformioStatus } from '../../../shared/hardware'

export type Platformio = {
  // undefined while the first check runs
  status?: PlatformioStatus
  installing: boolean
  // The installer's output, newest last
  log: string[]
  install: () => Promise<void>
}

// PlatformIO's install state, and its official installer with a live log
export function usePlatformio(): Platformio {
  const [status, setStatus] = useState<PlatformioStatus>()
  const [installing, setInstalling] = useState(false)
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    window.api.platformio.status().then(setStatus)
    return window.api.platformio.onLog((line) =>
      setLog((current) => [...current.slice(-300), line])
    )
  }, [])

  const install = async (): Promise<void> => {
    setInstalling(true)
    setLog([])
    try {
      setStatus(await window.api.platformio.install())
    } finally {
      setInstalling(false)
    }
  }

  return { status, installing, log, install }
}
