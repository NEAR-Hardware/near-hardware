import { useState } from 'react'
import { Cpu, LoaderCircle, TriangleAlert, Usb } from 'lucide-react'
import type { DeviceInfo } from '../../../../shared/hardware'
import type { Project } from '../../../../shared/projects'
import { describeDevice, findBoardDevice, useDevices } from '../../hooks/useDevices'
import RaspberryPiIcon from '../RaspberryPiIcon'

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
  // Same board as the project already has, or no board for now: just open the composer
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
  // A USB board, or a Raspberry Pi reached over SSH
  const [kind, setKind] = useState<'usb' | 'pi'>(saved?.ssh ? 'pi' : 'usb')
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
      `Set up my board: “${boardName}”.${where} Follow the board onboarding stages from the NEAR Hardware guide: identify, research, understand, screen, PlatformIO, then flash and verify.`
    )
  }

  const kindChoice = (
    <div className="board-kind" role="radiogroup" aria-label="Kind of board">
      <button
        type="button"
        role="radio"
        aria-checked={kind === 'usb'}
        className={kind === 'usb' ? 'checked' : undefined}
        onClick={() => setKind('usb')}
      >
        <Usb size={14} strokeWidth={1.75} /> USB board
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={kind === 'pi'}
        className={kind === 'pi' ? 'checked' : undefined}
        onClick={() => setKind('pi')}
      >
        <RaspberryPiIcon size={14} brand /> Raspberry Pi
      </button>
    </div>
  )

  if (kind === 'pi') {
    return (
      <PiSetup project={project} choice={kindChoice} onStart={onStart} onContinue={onContinue} />
    )
  }

  return (
    <form className="board-setup" onSubmit={start}>
      <div className="board-setup-head">
        <Cpu size={18} strokeWidth={1.75} />
        <h2>Which board are you building on?</h2>
      </div>
      {kindChoice}
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
      <div className="board-setup-actions">
        <button className="btn primary" type="submit" disabled={!boardName || busy}>
          {busy && <LoaderCircle size={13} className="spin" />}
          {sameBoard ? 'Continue with this board' : 'Start board setup'}
        </button>
        {!saved && (
          <button className="btn board-setup-skip" type="button" onClick={onContinue}>
            Continue without a board
          </button>
        )}
      </div>
      {!saved && (
        <p className="board-setup-note">
          Not sure which board yet? Talk through ideas, parts and wiring first, and add the board
          when you’re ready.
        </p>
      )}
    </form>
  )
}

type PiSetupProps = {
  project: Project
  choice: React.ReactNode
  onStart: (kickoff: string) => void
  onContinue: () => void
}

// A Raspberry Pi on the network: its SSH address and password, used once to
// add NEAR Hardware's SSH key to the Pi (the password isn't saved)
function PiSetup({ project, choice, onStart, onContinue }: PiSetupProps): React.JSX.Element {
  const saved = project.board?.ssh
  const savedTarget = saved
    ? `${saved.user}@${saved.host}${saved.port !== 22 ? `:${saved.port}` : ''}`
    : ''
  const [target, setTarget] = useState(savedTarget)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const samePi = !!saved && target.trim() === savedTarget

  const connect = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    if (!target.trim() || busy) return
    setBusy(true)
    setError(undefined)
    try {
      const result = await window.api.pi.connect(project.id, { target, password })
      setPassword('')
      if (!result.ok) {
        setError(result.message)
        return
      }
      if (samePi) {
        onContinue()
        return
      }
      const ssh = result.board.ssh!
      onStart(
        `Set up my Raspberry Pi: “${result.board.name}”${ssh.os ? ` running ${ssh.os}` : ''}, at ${ssh.user}@${ssh.host}. It's on the network, not USB: use get_board for the exact ssh command that reaches it. Check what it has (OS, Python, GPIO libraries, free space), save what you learn with save_board_profile, then tell me it's ready and what we could build on it.`
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="board-setup" onSubmit={connect}>
      <div className="board-setup-head">
        <RaspberryPiIcon size={18} brand />
        <h2>Connect your Raspberry Pi</h2>
      </div>
      {choice}
      <p>
        The Pi needs to be on the same network as this Mac, with SSH turned on (Raspberry Pi
        Imager’s settings, or <code>sudo raspi-config</code> › Interface Options › SSH).
      </p>
      <label className="field">
        <span>SSH address</span>
        <input
          value={target}
          required
          autoFocus
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          placeholder="rythmn@raspberrypi.local"
          onChange={(event) => {
            setTarget(event.target.value)
            setError(undefined)
          }}
        />
        <span className="field-hint">
          <span>
            What you’d type after <code>ssh</code>: the user, an @, and the Pi’s name or IP address.
            Add <code>:port</code> if it isn’t 22.
          </span>
        </span>
      </label>
      <label className="field">
        <span>Password{samePi ? ' (only if NEAR Hardware asks again)' : ''}</span>
        <input
          type="password"
          value={password}
          autoComplete="off"
          placeholder="The Pi user’s password"
          onChange={(event) => {
            setPassword(event.target.value)
            setError(undefined)
          }}
        />
        <span className="field-hint">
          Used once to add NEAR Hardware’s SSH key to the Pi, so you and your agent connect without
          it afterwards. It isn’t saved.
        </span>
      </label>
      {error && (
        <p className="field-hint board-setup-error">
          <TriangleAlert size={12} /> {error}
        </p>
      )}
      <div className="board-setup-actions">
        <button className="btn primary" type="submit" disabled={!target.trim() || busy}>
          {busy && <LoaderCircle size={13} className="spin" />}
          {busy ? 'Connecting…' : samePi ? 'Continue with this Pi' : 'Connect'}
        </button>
        {!project.board?.name && (
          <button className="btn board-setup-skip" type="button" onClick={onContinue}>
            Continue without a board
          </button>
        )}
      </div>
    </form>
  )
}

export default BoardSetupCard
