import { Check, Download, LoaderCircle, RefreshCw, SquareTerminal, X } from 'lucide-react'
import { CONTRACT_TOOLS, formatGB, lowDisk, useContractTools } from '../hooks/useContractTools'
import TerminalView from './bottom/TerminalView'
import './setup/Setup.css'

// Rust, cargo-near and NEAR CLI, which agents use to build NEAR smart contracts
function ContractToolsCard(): React.JSX.Element {
  const { status, checking, refresh, job, install, finishJob, closeJob, exitCode } =
    useContractTools()

  return (
    <section className="env-panel">
      <div className="toolchain-row">
        <div className="env-panel-title">Smart contract tools</div>
        <button
          className="icon-button"
          aria-label="Check again"
          title="Check again"
          disabled={checking}
          onClick={refresh}
        >
          <RefreshCw size={14} strokeWidth={1.5} className={checking ? 'spin' : undefined} />
        </button>
      </div>
      {CONTRACT_TOOLS.map(({ key, name, about }) => {
        const tool = status?.[key]
        return (
          <div key={key} className="toolchain-row">
            <div>
              <div className="toolchain-name">{name}</div>
              <div className="env-card-vendor">{about}</div>
            </div>
            {!tool ? (
              <LoaderCircle size={14} className="spin" />
            ) : tool.installed ? (
              <span className="env-badge ready">
                <Check size={12} /> Installed{tool.version ? ` · v${tool.version}` : ''}
              </span>
            ) : (
              <span className="env-status">Not installed</span>
            )}
          </div>
        )
      })}
      {lowDisk(status) && (
        <p className="dialog-error">
          Only {formatGB(status!.freeBytes!)} free on this Mac. Rust and contract builds need 3 GB
          or more.
        </p>
      )}
      {status?.installCommand && !job && (
        <div className="env-actions">
          <button className="btn small primary" onClick={install}>
            <Download size={12} /> Install missing tools
          </button>
        </div>
      )}
      {job && (
        <div className="setup-terminal">
          <div className="setup-terminal-header">
            <SquareTerminal size={14} />
            <span className="setup-terminal-title">Installing NEAR contract tools</span>
            {exitCode === undefined ? (
              <span className="setup-status">
                <LoaderCircle size={12} className="spin" /> Running
              </span>
            ) : (
              <span className={`setup-status${exitCode === 0 ? ' ok' : ' failed'}`}>
                {exitCode === 0 ? 'Finished' : `Stopped (exit code ${exitCode})`}
              </span>
            )}
            <button
              className="icon-button"
              aria-label="Close terminal"
              title="Close"
              onClick={closeJob}
            >
              <X size={14} />
            </button>
          </div>
          <div className="setup-terminal-body">
            <TerminalView
              key={job.key}
              projectId={null}
              command={job.command}
              visible
              onExit={finishJob}
            />
          </div>
        </div>
      )}
    </section>
  )
}

export default ContractToolsCard
