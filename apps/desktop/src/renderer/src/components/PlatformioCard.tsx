import { useEffect, useRef } from 'react'
import { Check, Download, LoaderCircle } from 'lucide-react'
import { usePlatformio } from '../hooks/usePlatformio'

// PlatformIO builds and flashes firmware; agents use it through their shell
function PlatformioCard(): React.JSX.Element {
  const { status, installing, log, install } = usePlatformio()
  const logRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [log])

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
