import { useState } from 'react'
import { Eye, EyeOff, LoaderCircle, Search } from 'lucide-react'
import {
  NETWORK_LABEL,
  NEAR_NETWORKS,
  formatNear,
  shortAccountId,
  type ImportCandidate,
  type NearAccount,
  type NearNetwork
} from '../../../../shared/near'
import AccountAvatar from './AccountAvatar'

type ImportAccountFormProps = {
  // Only accounts on this network; otherwise both
  network?: NearNetwork
  onImported: (account: NearAccount) => void
  onCancel?: () => void
}

// The value of the "type a name" choice in the candidate list
const OTHER = 'other'

// Paste a recovery phrase or private key, pick one of the accounts it
// controls (or type a name the index hasn't caught up with), then import it
function ImportAccountForm({
  network,
  onImported,
  onCancel
}: ImportAccountFormProps): React.JSX.Element {
  const [secret, setSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [looking, setLooking] = useState(false)
  // undefined until the first lookup
  const [candidates, setCandidates] = useState<ImportCandidate[]>()
  const [choice, setChoice] = useState<string>(OTHER)
  const [manualId, setManualId] = useState('')
  const [manualNetwork, setManualNetwork] = useState<NearNetwork>(network ?? 'mainnet')
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string>()

  const lookup = async (): Promise<void> => {
    if (!secret.trim() || looking) return
    setLooking(true)
    setError(undefined)
    try {
      const result = await window.api.near.lookupImport(secret)
      if (!result.ok) {
        setCandidates(undefined)
        setError(result.message)
        return
      }
      const found = result.candidates.filter((c) => !network || c.network === network)
      setCandidates(found)
      const first = found.find((c) => !c.alreadyAdded)
      setChoice(first ? `${first.network}:${first.accountId}` : OTHER)
    } finally {
      setLooking(false)
    }
  }

  const target =
    choice === OTHER
      ? { network: manualNetwork, accountId: manualId.trim().toLowerCase() }
      : candidates
          ?.map((c) => ({ network: c.network, accountId: c.accountId }))
          .find((c) => `${c.network}:${c.accountId}` === choice)

  const submit = async (): Promise<void> => {
    if (!target?.accountId || importing) return
    setImporting(true)
    setError(undefined)
    try {
      const result = await window.api.near.import({ secret, ...target })
      if (result.ok) {
        setSecret('')
        setCandidates(undefined)
        onImported(result.account)
      } else {
        setError(result.message)
      }
    } finally {
      setImporting(false)
    }
  }

  // Pasting something new starts over
  const editSecret = (value: string): void => {
    setSecret(value)
    setCandidates(undefined)
    setError(undefined)
  }

  return (
    <form
      className="near-form"
      onSubmit={(event) => {
        event.preventDefault()
        if (candidates) submit()
        else lookup()
      }}
    >
      <div className="near-secret">
        <textarea
          className={showSecret ? undefined : 'masked'}
          value={secret}
          rows={3}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          placeholder="12-word recovery phrase, or a private key (ed25519:…)"
          aria-label="Recovery phrase or private key"
          onChange={(event) => editSecret(event.target.value)}
          onKeyDown={(event) => {
            // Enter looks up; a phrase never needs a line break
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              event.currentTarget.form?.requestSubmit()
            }
          }}
        />
        <button
          type="button"
          className="icon-button"
          aria-label={showSecret ? 'Hide' : 'Show'}
          title={showSecret ? 'Hide' : 'Show'}
          onClick={() => setShowSecret((s) => !s)}
        >
          {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      {candidates && (
        <div className="near-candidates" role="radiogroup" aria-label="Account to import">
          {candidates.length === 0 && (
            <p className="near-form-hint">
              No {network ? `${NETWORK_LABEL[network].toLowerCase()} ` : ''}accounts found for this
              key yet. A brand-new account can take a minute to show up; type its name instead.
            </p>
          )}
          {candidates.map((candidate) => {
            const value = `${candidate.network}:${candidate.accountId}`
            return (
              <label
                key={value}
                className={`near-candidate${candidate.alreadyAdded ? ' disabled' : ''}`}
                title={candidate.accountId}
              >
                <input
                  type="radio"
                  name="near-import"
                  value={value}
                  checked={choice === value}
                  disabled={candidate.alreadyAdded}
                  onChange={() => setChoice(value)}
                />
                <AccountAvatar accountId={candidate.accountId} size={24} />
                <span className="near-candidate-name">{shortAccountId(candidate.accountId)}</span>
                <span className={`near-network-tag ${candidate.network}`}>
                  {NETWORK_LABEL[candidate.network]}
                </span>
                <span className="near-candidate-meta">
                  {candidate.alreadyAdded
                    ? 'Already added'
                    : `${formatNear(candidate.balance.total)} NEAR`}
                </span>
              </label>
            )
          })}
          <label className="near-candidate">
            <input
              type="radio"
              name="near-import"
              value={OTHER}
              checked={choice === OTHER}
              onChange={() => setChoice(OTHER)}
            />
            <span className="near-candidate-name muted">
              {candidates.length ? 'Another account…' : 'Account name'}
            </span>
          </label>
          {choice === OTHER && (
            <div className="near-manual">
              <input
                value={manualId}
                placeholder={network === 'testnet' ? 'alice.testnet' : 'alice.near'}
                spellCheck={false}
                autoCapitalize="off"
                autoFocus
                aria-label="Account name"
                onChange={(event) => setManualId(event.target.value)}
              />
              {!network && (
                <select
                  value={manualNetwork}
                  aria-label="Network"
                  onChange={(event) => setManualNetwork(event.target.value as NearNetwork)}
                >
                  {NEAR_NETWORKS.map((n) => (
                    <option key={n} value={n}>
                      {NETWORK_LABEL[n]}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="near-form-error">{error}</p>}

      <div className="near-form-actions">
        <span className="near-form-hint">
          Stored encrypted with your Mac&apos;s Keychain. It never leaves this Mac.
        </span>
        {onCancel && (
          <button type="button" className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        {candidates ? (
          <button type="submit" className="btn primary" disabled={!target?.accountId || importing}>
            {importing && <LoaderCircle size={13} className="spin" />}
            Import
          </button>
        ) : (
          <button type="submit" className="btn primary" disabled={!secret.trim() || looking}>
            {looking ? <LoaderCircle size={13} className="spin" /> : <Search size={13} />}
            Find accounts
          </button>
        )}
      </div>
    </form>
  )
}

export default ImportAccountForm
