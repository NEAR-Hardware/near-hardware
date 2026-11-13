import { useCallback, useEffect, useState } from 'react'
import { Check, Copy, ExternalLink, Info, LoaderCircle, RefreshCw, TriangleAlert } from 'lucide-react'
import {
  ENVIRONMENTS,
  getEnvironment,
  type ConnectedEnvironment,
  type EnvironmentDefinition,
  type EnvironmentId,
  type EnvironmentStatus
} from '../../../shared/environments'
import AgentIcon from './AgentIcon'
import './EnvironmentsView.css'

type Statuses = Partial<Record<EnvironmentId, EnvironmentStatus>>

const isWindows = (): boolean => document.documentElement.dataset.platform === 'win32'

function upsert(list: ConnectedEnvironment[], environment: ConnectedEnvironment): ConnectedEnvironment[] {
  return list.some((e) => e.id === environment.id)
    ? list.map((e) => (e.id === environment.id ? environment : e))
    : [...list, environment]
}

function EnvironmentsView(): React.JSX.Element | null {
  // undefined while the saved connections are still loading
  const [connected, setConnected] = useState<ConnectedEnvironment[]>()
  const [statuses, setStatuses] = useState<Statuses>({})
  const [scanning, setScanning] = useState(true)
  const [pending, setPending] = useState<ReadonlySet<EnvironmentId>>(new Set())
  const [missing, setMissing] = useState<EnvironmentId | null>(null)

  const scan = useCallback(async () => {
    setScanning(true)
    try {
      const results = await window.api.environments.detectAll()
      setStatuses(Object.fromEntries(results.map((status) => [status.id, status])))
    } finally {
      setScanning(false)
    }
  }, [])

  useEffect(() => {
    window.api.environments.listConnected().then(setConnected)
    scan()
  }, [scan])

  const setPendingFor = (id: EnvironmentId, isPending: boolean): void =>
    setPending((current) => {
      const next = new Set(current)
      if (isPending) next.add(id)
      else next.delete(id)
      return next
    })

  const connect = async (id: EnvironmentId): Promise<void> => {
    setPendingFor(id, true)
    setMissing((current) => (current === id ? null : current))
    try {
      const result = await window.api.environments.connect(id)
      setStatuses((current) => ({ ...current, [id]: result.ok ? result.environment : result.status }))
      if (result.ok) setConnected((list) => upsert(list ?? [], result.environment))
      else setMissing(id)
    } finally {
      setPendingFor(id, false)
    }
  }

  const disconnect = async (id: EnvironmentId): Promise<void> => {
    setPendingFor(id, true)
    try {
      await window.api.environments.disconnect(id)
      setConnected((list) => list?.filter((e) => e.id !== id))
    } finally {
      setPendingFor(id, false)
    }
  }

  if (connected === undefined) return null

  const isConnected = (id: EnvironmentId): boolean => connected.some((e) => e.id === id)
  const installed = ENVIRONMENTS.filter((d) => statuses[d.id]?.installed)
  const connectable = installed.filter((d) => !isConnected(d.id) && !pending.has(d.id))
  const cursor = connected.find((e) => e.id === 'cursor')
  const cursorStatus = statuses.cursor
  const cursorNeedsAgentCli = cursor && cursorStatus?.installed && !cursorStatus.agentCliPath

  return (
    <div className="env-view">
      <header className="env-header">
        <div>
          <h1>Environments</h1>
          <p>
            Connect the coding agents on this computer. When you start a project, you&apos;ll pick
            which connected agent builds it.
          </p>
        </div>
        <button
          className="icon-button"
          aria-label="Rescan installed agents"
          title="Rescan installed agents"
          disabled={scanning}
          onClick={scan}
        >
          <RefreshCw size={16} strokeWidth={1.5} className={scanning ? 'spin' : undefined} />
        </button>
      </header>

      <div className="env-toolbar">
        <span>
          {connected.length} connected
          {!scanning && ` · ${installed.length} of ${ENVIRONMENTS.length} installed`}
        </span>
        {!scanning && connectable.length > 0 && (
          <button
            className="env-button small"
            onClick={() => connectable.forEach((d) => connect(d.id))}
          >
            Connect all installed ({connectable.length})
          </button>
        )}
      </div>

      <div className="env-grid">
        {ENVIRONMENTS.map((definition) => (
          <EnvironmentCard
            key={definition.id}
            definition={definition}
            status={statuses[definition.id]}
            connected={connected.find((e) => e.id === definition.id)}
            scanning={scanning}
            pending={pending.has(definition.id)}
            onConnect={() => connect(definition.id)}
            onDisconnect={() => disconnect(definition.id)}
            onInstall={() => setMissing(definition.id)}
          />
        ))}
      </div>

      {missing && (
        <InstallHelp
          definition={getEnvironment(missing)}
          retrying={pending.has(missing)}
          onRetry={() => connect(missing)}
          onDismiss={() => setMissing(null)}
        />
      )}

      {cursorNeedsAgentCli && (
        <div className="env-panel">
          <div className="env-panel-title">
            <Info size={16} strokeWidth={1.75} />
            Cursor&apos;s agent CLI isn&apos;t installed
          </div>
          <p>
            NEAR Hardware runs Cursor through its agent CLI so it can work in the background.
            Install it, then check again.
          </p>
          {!isWindows() && <CommandBox command={getEnvironment('cursor').installCommand} />}
          <div className="env-actions">
            <button
              className="env-button"
              onClick={() => connect('cursor')}
              disabled={pending.has('cursor')}
            >
              {pending.has('cursor') && <LoaderCircle size={13} className="spin" />}
              Check again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

type EnvironmentCardProps = {
  definition: EnvironmentDefinition
  status?: EnvironmentStatus
  connected?: ConnectedEnvironment
  scanning: boolean
  pending: boolean
  onConnect: () => void
  onDisconnect: () => void
  onInstall: () => void
}

function EnvironmentCard({
  definition,
  status,
  connected,
  scanning,
  pending,
  onConnect,
  onDisconnect,
  onInstall
}: EnvironmentCardProps): React.JSX.Element {
  // Prefer this session's scan; the saved connection may be stale
  const live = status ?? connected
  const location = live?.cliPath ?? live?.appPath

  let action: React.JSX.Element | null = null
  if (pending) {
    action = (
      <button className="env-button small" disabled>
        <LoaderCircle size={12} className="spin" /> {connected ? 'Disconnecting' : 'Connecting'}
      </button>
    )
  } else if (connected) {
    action = (
      <button className="env-button small ghost" onClick={onDisconnect}>
        Disconnect
      </button>
    )
  } else if (status?.installed) {
    action = (
      <button className="env-button small primary" onClick={onConnect}>
        Connect
      </button>
    )
  } else if (status) {
    action = (
      <button className="env-button small" onClick={onInstall}>
        Install
      </button>
    )
  }

  return (
    <div className={`env-card${connected ? ' connected' : ''}`}>
      <div className="env-card-top">
        <AgentIcon id={definition.id} />
        <div className="env-card-title">
          <div className="env-card-name">{definition.name}</div>
          <div className="env-card-vendor">{definition.vendor}</div>
        </div>
        {connected && (
          <span className="env-badge ready">
            <Check size={12} /> Connected
          </span>
        )}
      </div>
      <p className="env-card-description">{definition.description}</p>
      {connected && location && (
        <code className="env-card-path" title={location}>
          {location}
        </code>
      )}
      <div className="env-card-footer">
        <StatusLine
          status={status}
          checking={scanning && !status}
          gone={Boolean(connected && status && !status.installed)}
        />
        {action}
      </div>
    </div>
  )
}

type StatusLineProps = {
  status?: EnvironmentStatus
  checking: boolean
  // Connected earlier but no longer found on this computer
  gone: boolean
}

function StatusLine({ status, checking, gone }: StatusLineProps): React.JSX.Element {
  if (checking) {
    return (
      <span className="env-status">
        <LoaderCircle size={12} className="spin" /> Checking…
      </span>
    )
  }
  if (gone) {
    return (
      <span className="env-status warning">
        <TriangleAlert size={12} /> No longer found
      </span>
    )
  }
  if (status?.installed) {
    return (
      <span className="env-status installed">
        <span className="env-dot" /> Installed{status.version ? ` · v${status.version}` : ''}
      </span>
    )
  }
  return (
    <span className="env-status">
      <span className="env-dot" /> Not installed
    </span>
  )
}

type InstallHelpProps = {
  definition: EnvironmentDefinition
  retrying: boolean
  onRetry: () => void
  onDismiss: () => void
}

function InstallHelp({
  definition,
  retrying,
  onRetry,
  onDismiss
}: InstallHelpProps): React.JSX.Element {
  return (
    <div className="env-panel warning" role="status">
      <div className="env-panel-title">
        <TriangleAlert size={16} strokeWidth={1.75} />
        {definition.name} isn&apos;t installed on this computer
      </div>
      <p>Install it, then check again. NEAR Hardware will connect it once it&apos;s found.</p>
      {!isWindows() && <CommandBox command={definition.installCommand} />}
      <div className="env-actions">
        <a className="env-button" href={definition.installUrl} target="_blank" rel="noreferrer">
          Install guide <ExternalLink size={13} />
        </a>
        <button className="env-button primary" onClick={onRetry} disabled={retrying}>
          {retrying && <LoaderCircle size={13} className="spin" />}
          Check again
        </button>
        <button className="env-button ghost" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  )
}

function CommandBox({ command }: { command: string }): React.JSX.Element {
  const [copied, setCopied] = useState(false)

  const copy = async (): Promise<void> => {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="env-command">
      <code>{command}</code>
      <button
        className="icon-button"
        aria-label="Copy command"
        title={copied ? 'Copied' : 'Copy command'}
        onClick={copy}
      >
        {copied ? <Check size={14} /> : <Copy size={14} strokeWidth={1.5} />}
      </button>
    </div>
  )
}

export default EnvironmentsView
