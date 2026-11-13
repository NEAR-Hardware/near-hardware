import { useCallback, useEffect, useState } from 'react'
import { Check, Copy, ExternalLink, LoaderCircle, RefreshCw, TriangleAlert } from 'lucide-react'
import {
  ENVIRONMENTS,
  getEnvironment,
  type EnvironmentDefinition,
  type EnvironmentId,
  type EnvironmentStatus,
  type SelectedEnvironment
} from '../../../shared/environments'
import AgentIcon from './AgentIcon'
import './EnvironmentsView.css'

type Statuses = Partial<Record<EnvironmentId, EnvironmentStatus>>

const isWindows = (): boolean => document.documentElement.dataset.platform === 'win32'

function EnvironmentsView(): React.JSX.Element | null {
  // undefined while the saved selection is still loading
  const [selected, setSelected] = useState<SelectedEnvironment | null>()
  const [statuses, setStatuses] = useState<Statuses>({})
  const [scanning, setScanning] = useState(true)
  const [pending, setPending] = useState<EnvironmentId | null>(null)
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
    window.api.environments.getSelected().then(setSelected)
    scan()
  }, [scan])

  const choose = async (id: EnvironmentId): Promise<void> => {
    if (pending) return
    setPending(id)
    setMissing(null)
    try {
      const result = await window.api.environments.select(id)
      setStatuses((current) => ({ ...current, [id]: result.ok ? result.environment : result.status }))
      if (result.ok) setSelected(result.environment)
      else setMissing(id)
    } finally {
      setPending(null)
    }
  }

  const change = async (): Promise<void> => {
    await window.api.environments.clear()
    setSelected(null)
    setMissing(null)
  }

  if (selected === undefined) return null

  return (
    <div className="env-view">
      <header className="env-header">
        <div>
          <h1>Environments</h1>
          <p>
            Choose the coding agent NEAR Hardware hands your projects to. It runs on this computer
            with your own account.
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

      {selected ? (
        <CurrentEnvironment
          selected={selected}
          status={statuses[selected.id]}
          scanning={scanning}
          onChange={change}
        />
      ) : (
        <>
          <div className="env-grid">
            {ENVIRONMENTS.map((definition) => (
              <EnvironmentCard
                key={definition.id}
                definition={definition}
                status={statuses[definition.id]}
                scanning={scanning}
                pending={pending === definition.id}
                onSelect={() => choose(definition.id)}
              />
            ))}
          </div>
          {missing && (
            <InstallHelp
              definition={getEnvironment(missing)}
              retrying={pending === missing}
              onRetry={() => choose(missing)}
            />
          )}
        </>
      )}
    </div>
  )
}

type EnvironmentCardProps = {
  definition: EnvironmentDefinition
  status?: EnvironmentStatus
  scanning: boolean
  pending: boolean
  onSelect: () => void
}

function EnvironmentCard({
  definition,
  status,
  scanning,
  pending,
  onSelect
}: EnvironmentCardProps): React.JSX.Element {
  return (
    <button className="env-card" onClick={onSelect} disabled={pending}>
      <div className="env-card-top">
        <AgentIcon id={definition.id} />
        <div>
          <div className="env-card-name">{definition.name}</div>
          <div className="env-card-vendor">{definition.vendor}</div>
        </div>
      </div>
      <p className="env-card-description">{definition.description}</p>
      <StatusLine status={status} checking={pending || (scanning && !status)} />
    </button>
  )
}

function StatusLine({
  status,
  checking
}: {
  status?: EnvironmentStatus
  checking: boolean
}): React.JSX.Element {
  if (checking) {
    return (
      <span className="env-status">
        <LoaderCircle size={12} className="spin" /> Checking…
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
}

function InstallHelp({ definition, retrying, onRetry }: InstallHelpProps): React.JSX.Element {
  return (
    <div className="env-panel warning" role="status">
      <div className="env-panel-title">
        <TriangleAlert size={16} strokeWidth={1.75} />
        {definition.name} isn&apos;t installed on this computer
      </div>
      <p>Install it, then check again. NEAR Hardware will select it once it&apos;s found.</p>
      {!isWindows() && <CommandBox command={definition.installCommand} />}
      <div className="env-actions">
        <a className="env-button" href={definition.installUrl} target="_blank" rel="noreferrer">
          Install guide <ExternalLink size={13} />
        </a>
        <button className="env-button primary" onClick={onRetry} disabled={retrying}>
          {retrying && <LoaderCircle size={13} className="spin" />}
          Check again
        </button>
      </div>
    </div>
  )
}

type CurrentEnvironmentProps = {
  selected: SelectedEnvironment
  // Fresh result from this session's scan; the saved selection may be stale
  status?: EnvironmentStatus
  scanning: boolean
  onChange: () => void
}

function CurrentEnvironment({
  selected,
  status,
  scanning,
  onChange
}: CurrentEnvironmentProps): React.JSX.Element {
  const definition = getEnvironment(selected.id)
  const live = status ?? selected
  const gone = !scanning && status !== undefined && !status.installed

  return (
    <div className={`env-panel${gone ? ' warning' : ''}`}>
      <div className="env-current-head">
        <AgentIcon id={selected.id} size={22} />
        <div className="env-current-title">
          <span className="env-current-label">Current environment</span>
          <span className="env-current-name">{definition.name}</span>
        </div>
        {gone ? (
          <span className="env-badge warning">
            <TriangleAlert size={12} /> Not found
          </span>
        ) : (
          <span className="env-badge ready">
            <Check size={12} /> Ready
          </span>
        )}
      </div>

      {gone ? (
        <p>
          {definition.name} is no longer installed on this computer. Reinstall it or pick another
          environment.
        </p>
      ) : (
        <p>New projects you start in NEAR Hardware will open with {definition.name}.</p>
      )}

      <dl className="env-details">
        <dt>Version</dt>
        <dd>{live.version ? `v${live.version}` : 'Unknown'}</dd>
        {live.cliPath && (
          <>
            <dt>Command</dt>
            <dd>
              <code>{live.cliPath}</code>
            </dd>
          </>
        )}
        {live.appPath && (
          <>
            <dt>App</dt>
            <dd>
              <code>{live.appPath}</code>
            </dd>
          </>
        )}
        {selected.id === 'cursor' && (
          <>
            <dt>Agent CLI</dt>
            <dd>
              {live.agentCliPath ? (
                <code>{live.agentCliPath}</code>
              ) : (
                <span className="env-muted">
                  Not installed. NEAR Hardware needs it to run Cursor in the background.
                </span>
              )}
            </dd>
          </>
        )}
      </dl>

      {selected.id === 'cursor' && !live.agentCliPath && !isWindows() && (
        <CommandBox command={definition.installCommand} />
      )}

      <div className="env-actions">
        <button className="env-button" onClick={onChange}>
          Change environment
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
