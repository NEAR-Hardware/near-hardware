import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Plug, PlugZap, Send, Trash2 } from 'lucide-react'
import { BAUD_RATES } from '../../../../shared/hardware'
import { describeDevice, useDevices } from '../../hooks/useDevices'

const LINE_ENDINGS = { none: '', lf: '\n', crlf: '\r\n', cr: '\r' } as const
const MAX_CHARS = 200_000

function SerialMonitor({ defaultPort }: { defaultPort?: string }): React.JSX.Element {
  const devices = useDevices()
  const [port, setPort] = useState(defaultPort ?? '')
  const [baudRate, setBaudRate] = useState(115200)
  const [connected, setConnected] = useState(false)
  const [output, setOutput] = useState('')
  const [autoscroll, setAutoscroll] = useState(true)
  const [message, setMessage] = useState('')
  const [lineEnding, setLineEnding] = useState<keyof typeof LINE_ENDINGS>('lf')
  const [error, setError] = useState<string | null>(null)
  const outputRef = useRef<HTMLPreElement>(null)

  // Pick the first device automatically when nothing is selected
  const selected = port || devices[0]?.path || ''

  useEffect(() => {
    const offs = [
      window.api.serial.onData((event) => {
        if (event.path === selected)
          setOutput((current) => (current + event.data).slice(-MAX_CHARS))
      }),
      window.api.serial.onOpened((event) => {
        if (event.path === selected) setConnected(true)
      }),
      // The port can also close underneath us, e.g. an agent releasing it to flash firmware
      window.api.serial.onClosed((event) => {
        if (event.path === selected) setConnected(false)
      }),
      window.api.serial.onError((event) => {
        if (event.path === selected) setError(event.message)
      })
    ]
    return () => offs.forEach((off) => off())
  }, [selected])

  useLayoutEffect(() => {
    if (autoscroll && outputRef.current)
      outputRef.current.scrollTop = outputRef.current.scrollHeight
  }, [output, autoscroll])

  const toggle = async (): Promise<void> => {
    setError(null)
    try {
      if (connected) await window.api.serial.close(selected)
      else await window.api.serial.open(selected, baudRate)
    } catch (e) {
      setError(
        (e as Error).message.replace(/^Error invoking remote method '[^']+': (Error: )?/, '')
      )
    }
  }

  const sendMessage = async (): Promise<void> => {
    if (!connected) return
    await window.api.serial.write(selected, message + LINE_ENDINGS[lineEnding])
    setMessage('')
  }

  return (
    <div className="serial-monitor">
      <div className="serial-toolbar">
        <select
          className="panel-select"
          aria-label="Port"
          value={selected}
          disabled={connected}
          onChange={(event) => setPort(event.target.value)}
        >
          {devices.length === 0 && <option value="">No USB devices</option>}
          {devices.map((device) => (
            <option key={device.path} value={device.path}>
              {device.path.replace('/dev/', '')} · {describeDevice(device)}
            </option>
          ))}
        </select>
        <select
          className="panel-select"
          aria-label="Baud rate"
          value={baudRate}
          disabled={connected}
          onChange={(event) => setBaudRate(Number(event.target.value))}
        >
          {BAUD_RATES.map((rate) => (
            <option key={rate} value={rate}>
              {rate} baud
            </option>
          ))}
        </select>
        <button
          className={`btn small${connected ? '' : ' primary'}`}
          disabled={!selected}
          onClick={toggle}
        >
          {connected ? <Plug size={13} /> : <PlugZap size={13} />}
          {connected ? 'Disconnect' : 'Connect'}
        </button>
        <div className="panel-spacer" />
        <label className="panel-check">
          <input
            type="checkbox"
            checked={autoscroll}
            onChange={(e) => setAutoscroll(e.target.checked)}
          />
          Autoscroll
        </label>
        <button
          className="icon-button small"
          aria-label="Clear output"
          title="Clear output"
          onClick={() => setOutput('')}
        >
          <Trash2 size={13} strokeWidth={1.5} />
        </button>
      </div>
      {error && <p className="serial-error">{error}</p>}
      <pre ref={outputRef} className="serial-output">
        {output || (connected ? 'Waiting for data…' : 'Connect to see the board’s serial output.')}
      </pre>
      <form
        className="serial-input"
        onSubmit={(event) => {
          event.preventDefault()
          sendMessage()
        }}
      >
        <input
          value={message}
          placeholder={connected ? 'Send to the board…' : 'Connect first'}
          disabled={!connected}
          onChange={(event) => setMessage(event.target.value)}
        />
        <select
          className="panel-select"
          aria-label="Line ending"
          value={lineEnding}
          onChange={(event) => setLineEnding(event.target.value as keyof typeof LINE_ENDINGS)}
        >
          <option value="none">No line ending</option>
          <option value="lf">New line (LF)</option>
          <option value="crlf">CR + LF</option>
          <option value="cr">Carriage return</option>
        </select>
        <button className="icon-button" type="submit" aria-label="Send" disabled={!connected}>
          <Send size={14} strokeWidth={1.5} />
        </button>
      </form>
    </div>
  )
}

export default SerialMonitor
