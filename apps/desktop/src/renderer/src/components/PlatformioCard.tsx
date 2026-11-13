import { useEffect, useRef, useState } from 'react'
import { Check, Download, LoaderCircle } from 'lucide-react'
import type { PlatformioStatus } from '../../../shared/hardware'

// PlatformIO builds and flashes firmware; agents use it through their shell
function PlatformioCard(): React.JSX.Element {
  const [status, setStatus] = useState<PlatformioStatus>()
  const [installing, setInstalling] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const logRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    window.api.platformio.status().then(setStatus)
    return window.api.platformio.onLog((line) =>
      setLog((current) => [...current.slice(-300), line])
    )
  }, [])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [log])

  const install = async (): Promise<void> => {
    setInstalling(true)
    setLog([])
    try {
      setStatus(await window.api.platformio.install())
    } finally {
      setInstalling(false)
    }
  }

  return (
    <section className="env-panel">
      <div className="env-panel-title">Hardware toolchain</div>
      <div className="toolchain-row">
        <div>
          <div className="toolchain-name">PlatformIO</div>
          <div className="env-card-vendor">
            Builds, flashes and monitors firmware for ESP32 and 1,500+ boards
          </div>
        </div>
        {status?.installed ? (
          <span className="env-badge ready">
            <Check size={12} /> Installed{status.version ? ` · v${status.version}` : ''}
          </span>
        ) : (
          <button className="btn small primary" onClick={install} disabled={installing || !status}>
            {installing ? <LoaderCircle size={12} className="spin" /> : <Download size={12} />}
            {installing ? 'Installing…' : 'Install'}
          </button>
        )}
      </div>
      {status?.error && <p className="dialog-error">{status.error}</p>}
      {log.length > 0 && (
        <pre ref={logRef} className="toolchain-log">
          {log.join('\n')}
        </pre>
      )}
    </section>
  )
}

export default PlatformioCard
