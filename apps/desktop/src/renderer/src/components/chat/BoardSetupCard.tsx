import { useState } from 'react'
import { Cpu, LoaderCircle, TriangleAlert, Usb } from 'lucide-react'
import type { DeviceInfo } from '../../../../shared/hardware'
import type { Project } from '../../../../shared/projects'
import { describeDevice, findBoardDevice, useDevices } from '../../hooks/useDevices'

// Espressif's native USB comes first: most boards here are ESP32s
const rank = (device: DeviceInfo): number =>
  device.vendorId === '303a' ? 0 : device.chipHint ? 1 : 2

// "ESP32" or "my watch" won't find the right docs; a product name has a few words
const looksVague = (name: string): boolean =>
  name.length > 0 && (name.length < 12 || name.split(/\s+/).length < 2)

type BoardSetupCardProps = {
  project: Project
  agentName: string
  // A new or different board: save it and send the onboarding kickoff
  onStart: (kickoff: string) => void
  // Same board as the project already has: just open the composer
  onContinue: () => void
}

// The first, required step of every new chat: which board is this, and where is it?
function BoardSetupCard({
  project,
  agentName,
  onStart,
  onContinue
}: BoardSetupCardProps): React.JSX.Element {
  const saved = project.board?.name ? project.board : undefined
  const devices = [...useDevices()].sort((a, b) => rank(a) - rank(b))
  const [name, setName] = useState(saved?.name ?? '')
  const [port, setPort] = useState<string>()
  const [busy, setBusy] = useState(false)
  const device =
    devices.find((d) => d.path === port) ?? findBoardDevice(saved, devices) ?? devices[0]
  const boardName = name.trim()
  const sameBoard = !!saved && boardName === saved.name

  const start = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    if (!boardName || busy) return
    setBusy(true)
    const connection = {
      port: device?.path,
      vendorId: device?.vendorId,
      productId: device?.productId,
      serialNumber: device?.serialNumber,
      manufacturer: device?.manufacturer
    }
    if (sameBoard) {
      // Keeps what the agent learned; only refreshes where it's plugged in
      if (device) await window.api.projects.setBoard(project.id, connection)
      onContinue()
      return
    }
    await window.api.projects.setBoard(project.id, { name: boardName, ...connection }, true)
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
        Paste the board’s{' '}
        <strong>exact product name from the manufacturer’s official website</strong> or store page.{' '}
        {agentName} uses it to find the official docs and examples, so a chip name like “ESP32” or a
        nickname isn’t enough.
      </p>
      <label className="field">
        <span>Exact board name (required)</span>
        <input
          value={name}
          required
          autoFocus
          spellCheck={false}
          placeholder="e.g. ESP32-S3 2.06inch AMOLED Touch Watch Development Board"
          onChange={(event) => setName(event.target.value)}
        />
        {saved && (
          <span className="field-hint">
            {sameBoard
              ? 'Saved for this project. Keep it, or change it if you’ve switched boards.'
              : `This replaces “${saved.name}” and starts a fresh board setup.`}
          </span>
        )}
        {!saved && looksVague(boardName) && (
          <span className="field-hint warning">
            <TriangleAlert size={12} /> That looks like a chip or a nickname. Use the full product
            name from the maker’s site.
          </span>
        )}
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
        <button className="btn primary" type="submit" disabled={!boardName || busy}>
          {busy && <LoaderCircle size={13} className="spin" />}
          {sameBoard ? 'Continue with this board' : 'Start board setup'}
        </button>
      </div>
    </form>
  )
}

export default BoardSetupCard
