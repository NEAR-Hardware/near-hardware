import { useState } from 'react'
import { Cpu, LoaderCircle, Usb } from 'lucide-react'
import type { DeviceInfo } from '../../../../shared/hardware'
import type { Project } from '../../../../shared/projects'
import { describeDevice, useDevices } from '../../hooks/useDevices'

// Espressif's native USB comes first: most boards here are ESP32s
const rank = (device: DeviceInfo): number =>
  device.vendorId === '303a' ? 0 : device.chipHint ? 1 : 2

type BoardSetupCardProps = {
  project: Project
  agentName: string
  onStart: (kickoff: string) => void
}

// The first, required step of a hardware chat: which board is this, and where is it?
function BoardSetupCard({ project, agentName, onStart }: BoardSetupCardProps): React.JSX.Element {
  const devices = [...useDevices()].sort((a, b) => rank(a) - rank(b))
  const [name, setName] = useState('')
  const [port, setPort] = useState<string>()
  const [busy, setBusy] = useState(false)
  const device = devices.find((d) => d.path === (port ?? devices[0]?.path))

  const start = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    const boardName = name.trim()
    if (!boardName || busy) return
    setBusy(true)
    await window.api.projects.setBoard(project.id, {
      name: boardName,
      port: device?.path,
      vendorId: device?.vendorId,
      productId: device?.productId,
      manufacturer: device?.manufacturer
    })
    const where = device
      ? ` It’s connected at ${device.path} (USB ${device.vendorId}:${device.productId}, ${describeDevice(device)}).`
      : ' It isn’t connected yet.'
    onStart(
      `Set up my board: “${boardName}”.${where} Follow the board onboarding stages from the NEAR Hardware guide.`
    )
  }

  return (
    <form className="board-setup" onSubmit={start}>
      <div className="board-setup-head">
        <Cpu size={18} strokeWidth={1.75} />
        <h2>Which board are you building on?</h2>
      </div>
      <p>
        {agentName} will research your exact board, read its official docs and examples, and set up
        PlatformIO for it. Copy the{' '}
        <strong>full product name from the manufacturer’s website</strong> so it finds the right
        one.
      </p>
      <label className="field">
        <span>Exact board name (required)</span>
        <input
          value={name}
          autoFocus
          spellCheck={false}
          placeholder="e.g. ESP32-S3 2.06inch AMOLED Touch Watch Development Board"
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <div className="field">
        <span>Connected device</span>
        {devices.length === 0 ? (
          <p className="board-setup-empty">
            <Usb size={14} /> No USB device found. Plug the board in with a data cable; it shows up
            here automatically.
          </p>
        ) : (
          <div className="device-choices" role="radiogroup" aria-label="Connected device">
            {devices.map((d) => (
              <button
                type="button"
                key={d.path}
                role="radio"
                aria-checked={d.path === device?.path}
                className={`device-choice${d.path === device?.path ? ' checked' : ''}`}
                onClick={() => setPort(d.path)}
              >
                <Usb size={14} strokeWidth={1.75} />
                <span className="device-choice-name">{describeDevice(d)}</span>
                <code>{d.path.replace('/dev/', '')}</code>
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <button className="btn primary" type="submit" disabled={!name.trim() || busy}>
          {busy && <LoaderCircle size={13} className="spin" />}
          Start board setup
        </button>
      </div>
    </form>
  )
}

export default BoardSetupCard
