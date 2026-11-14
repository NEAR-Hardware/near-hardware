import { useState } from 'react'
import {
  Check,
  Copy,
  Ellipsis,
  ExternalLink,
  Plus,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  X
} from 'lucide-react'
import {
  METEOR_WALLET_URL,
  NETWORK_LABEL,
  NEAR_NETWORKS,
  accountKey,
  formatNear,
  isImplicitAccount,
  shortAccountId,
  type NearAccount,
  type NearNetwork,
  type NearSecret
} from '../../../../shared/near'
import { useNearAccounts, type Balances } from '../../hooks/useNearAccounts'
import AccountAvatar from './AccountAvatar'
import { showAccountMenu } from './accountMenu'
import CreateTestnetForm from './CreateTestnetForm'
import ImportAccountForm from './ImportAccountForm'
import NearMark from './NearMark'
import '../EnvironmentsView.css'
import './Near.css'

const NETWORK_DETAIL: Record<NearNetwork, string> = {
  mainnet: 'Real NEAR. Boards and agents pay and get paid here.',
  testnet: 'Free test NEAR, for trying things before they cost anything.'
}

export type Adding = { network: NearNetwork; mode: 'create' | 'import' }

// What the page opens with when the sidebar sends you here. `key` changes
// with every request, remounting the page so it starts from these.
export type AccountsIntent = {
  key: number
  add?: Adding
  // accountKey() of an account to scroll to and flash
  focus?: string
}

// Every NEAR account the app holds a key for, by network
function AccountsView({ intent }: { intent: AccountsIntent }): React.JSX.Element | null {
  const { data, balances, refreshBalances } = useNearAccounts()
  const [adding, setAdding] = useState<Adding | undefined>(intent.add)
  const [revealed, setRevealed] = useState<{ key: string; secret: NearSecret }>()

  if (!data) return null

  const total = data.accounts.length

  return (
    <div className="env-view near-view">
      <header className="env-header">
        <div>
          <h1>NEAR accounts</h1>
          <p>
            The accounts your boards and agents use on NEAR. The primary account on each network is
            the one they use unless you pick another. Keys are encrypted with your Mac&apos;s
            Keychain and never leave this Mac.
          </p>
        </div>
        <button
          className="icon-button"
          aria-label="Refresh balances"
          title="Refresh balances"
          disabled={total === 0}
          onClick={refreshBalances}
        >
          <RefreshCw size={16} strokeWidth={1.5} />
        </button>
      </header>

      <label className="near-policy">
        <ShieldCheck size={16} strokeWidth={1.75} />
        <span className="near-policy-text">
          <strong>Agent transactions</strong>
          <span>
            Agents use these accounts through NEAR Hardware and never see their keys. You approve
            every mainnet transaction. Accounts limited to one contract act without asking.
          </span>
        </span>
        <span className="near-policy-toggle">
          <input
            type="checkbox"
            checked={data.autoApproveTestnet}
            onChange={(event) => window.api.near.setAutoApproveTestnet(event.target.checked)}
          />
          Approve testnet without asking
        </span>
      </label>

      {NEAR_NETWORKS.map((network) => {
        const accounts = data.accounts
          .filter((a) => a.network === network)
          .sort((a, b) => {
            // Primary first, then oldest first
            const primary =
              Number(b.accountId === data.primary[network]) -
              Number(a.accountId === data.primary[network])
            return primary || a.addedAt.localeCompare(b.addedAt)
          })
        const open = adding?.network === network ? adding.mode : undefined
        return (
          <section key={network} className="near-section" aria-label={NETWORK_LABEL[network]}>
            <div className="near-section-header">
              <div>
                <h2>{NETWORK_LABEL[network]}</h2>
                <p>{NETWORK_DETAIL[network]}</p>
              </div>
              <div className="near-section-actions">
                {network === 'mainnet' ? (
                  <a
                    className="btn small"
                    href={METEOR_WALLET_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Free name in Meteor <ExternalLink size={12} />
                  </a>
                ) : (
                  <button
                    className="btn small"
                    onClick={() => setAdding({ network, mode: 'create' })}
                  >
                    <Plus size={12} /> Create
                  </button>
                )}
                <button
                  className="btn small"
                  onClick={() => setAdding({ network, mode: 'import' })}
                >
                  Import
                </button>
              </div>
            </div>

            {open && (
              <div className="near-panel">
                <div className="near-panel-title">
                  {open === 'create' ? 'Create a testnet account' : `Import a ${network} account`}
                  <button
                    className="icon-button small"
                    aria-label="Close"
                    title="Close"
                    onClick={() => setAdding(undefined)}
                  >
                    <X size={14} />
                  </button>
                </div>
                {open === 'create' ? (
                  <CreateTestnetForm autoFocus onCreated={() => setAdding(undefined)} />
                ) : (
                  <ImportAccountForm
                    network={network}
                    onImported={() => setAdding(undefined)}
                    onCancel={() => setAdding(undefined)}
                  />
                )}
              </div>
            )}

            {accounts.length > 0 ? (
              <div className="near-list">
                {accounts.map((account) => {
                  const key = accountKey(account.network, account.accountId)
                  return (
                    <AccountRow
                      key={key}
                      account={account}
                      focused={intent.focus === key}
                      primary={data.primary[network] === account.accountId}
                      balances={balances}
                      secret={revealed?.key === key ? revealed.secret : undefined}
                      onReveal={(secret) => setRevealed(secret ? { key, secret } : undefined)}
                    />
                  )
                })}
              </div>
            ) : (
              !open && (
                <EmptyNetwork network={network} onAdd={(mode) => setAdding({ network, mode })} />
              )
            )}
          </section>
        )
      })}
    </div>
  )
}

function EmptyNetwork({
  network,
  onAdd
}: {
  network: NearNetwork
  onAdd: (mode: Adding['mode']) => void
}): React.JSX.Element {
  if (network === 'testnet') {
    return (
      <div className="near-empty">
        <NearMark size={15} tile="testnet" />
        <div className="near-empty-text">
          <strong>No testnet account yet</strong>
          <span>Create one for free. It comes with 10 test NEAR.</span>
        </div>
        <button className="btn small primary" onClick={() => onAdd('create')}>
          Create testnet account
        </button>
      </div>
    )
  }
  return (
    <div className="near-empty">
      <NearMark size={15} tile="mainnet" />
      <div className="near-empty-text">
        <strong>No mainnet account yet</strong>
        <span>
          Make a free name like alice.near in Meteor Wallet, then import it with its recovery
          phrase. Use an account for hardware, not the one with your savings.
        </span>
      </div>
      <button className="btn small primary" onClick={() => onAdd('import')}>
        Import
      </button>
    </div>
  )
}

function describeSource(account: NearAccount): string {
  if (account.source === 'created') return 'Created in NEAR Hardware'
  if (account.source === 'imported') return 'Imported'
  const parent = account.parent ? `Sub-account of ${shortAccountId(account.parent)}` : 'Sub-account'
  if (!account.limited) return `${parent} · Full access`
  const { receiverId, methodNames, allowance } = account.limited
  const methods = methodNames.length ? methodNames.join(', ') : 'any method'
  const fees = allowance === null ? '' : ` · ${formatNear(allowance, 3)} NEAR for fees`
  return `${parent} · Limited to ${methods} on ${shortAccountId(receiverId)}${fees}`
}

type AccountRowProps = {
  account: NearAccount
  focused: boolean
  primary: boolean
  balances: Balances
  secret?: NearSecret
  onReveal: (secret: NearSecret | undefined) => void
}

function AccountRow({
  account,
  focused,
  primary,
  balances,
  secret,
  onReveal
}: AccountRowProps): React.JSX.Element {
  const { network, accountId } = account
  const balance = balances[accountKey(network, accountId)]
  const [copied, setCopied] = useState(false)

  const copy = async (text: string): Promise<void> => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const showMenu = async (): Promise<void> => {
    const choice = await showAccountMenu(account, primary, [
      {
        id: 'reveal',
        label: account.hasPhrase ? 'Show Recovery Phrase…' : 'Show Private Key…'
      },
      { type: 'separator' },
      { id: 'remove', label: 'Remove from NEAR Hardware…' }
    ])
    if (choice === 'reveal') {
      const shown = await window.api.near.reveal(network, accountId)
      if (shown) onReveal(shown)
    }
    if (choice === 'remove') await window.api.near.remove(network, accountId)
  }

  let amount: React.ReactNode
  if (balance === undefined) amount = <span className="near-row-balance muted">…</span>
  else if (balance === null) amount = <span className="near-row-balance muted">Offline</span>
  else
    amount = (
      <span
        className="near-row-balance"
        title={`${formatNear(balance.available, 5)} NEAR available after the storage reserve`}
      >
        {formatNear(balance.total)} NEAR
      </span>
    )

  return (
    <div
      className={`near-row-wrap${focused ? ' focused' : ''}`}
      // The account the sidebar sent you to
      ref={focused ? (node) => node?.scrollIntoView({ block: 'center' }) : undefined}
    >
      <div
        className="near-row"
        onContextMenu={(event) => {
          event.preventDefault()
          showMenu()
        }}
      >
        <AccountAvatar accountId={accountId} variant={account.avatarVariant} size={34} />
        <div className="near-row-text">
          <div className="near-row-title">
            <span className="near-row-name" title={accountId}>
              {shortAccountId(accountId)}
            </span>
            {primary && <span className="near-primary-badge">Primary</span>}
          </div>
          <div className="near-row-detail">
            {describeSource(account)}
            {balance &&
              !balance.exists &&
              (isImplicitAccount(accountId)
                ? ' · Not on NEAR until something is sent to it'
                : ' · Not found on NEAR')}
          </div>
        </div>
        {amount}
        {!primary && !account.limited && (
          <button
            className="btn small ghost"
            onClick={() => window.api.near.setPrimary(network, accountId)}
          >
            Make primary
          </button>
        )}
        <button
          className="icon-button"
          aria-label={`Copy ${accountId}`}
          title={copied ? 'Copied' : 'Copy account ID'}
          onClick={() => copy(accountId)}
        >
          {copied ? <Check size={14} /> : <Copy size={14} strokeWidth={1.5} />}
        </button>
        <button
          className="icon-button"
          aria-label={`More actions for ${accountId}`}
          title="More actions"
          onClick={showMenu}
        >
          <Ellipsis size={15} strokeWidth={1.5} />
        </button>
      </div>
      {secret && <SecretPanel secret={secret} onHide={() => onReveal(undefined)} />}
    </div>
  )
}

function SecretPanel({
  secret,
  onHide
}: {
  secret: NearSecret
  onHide: () => void
}): React.JSX.Element {
  const [copied, setCopied] = useState<'phrase' | 'key'>()

  const copy = async (what: 'phrase' | 'key', text: string): Promise<void> => {
    await navigator.clipboard.writeText(text)
    setCopied(what)
    setTimeout(() => setCopied(undefined), 1500)
  }

  return (
    <div className="near-secret-panel">
      <div className="near-secret-warning">
        <TriangleAlert size={14} />
        Anyone with this can take everything in the account. Write it down and keep it offline; it
        opens the account in any NEAR wallet, like Meteor.
      </div>
      {secret.phrase && (
        <ol className="near-words">
          {secret.phrase.split(' ').map((word, index) => (
            <li key={index}>
              <span>{index + 1}</span>
              {word}
            </li>
          ))}
        </ol>
      )}
      <div className="near-secret-actions">
        {secret.phrase && (
          <button className="btn small" onClick={() => copy('phrase', secret.phrase!)}>
            {copied === 'phrase' ? <Check size={12} /> : <Copy size={12} />} Copy phrase
          </button>
        )}
        <button className="btn small" onClick={() => copy('key', secret.privateKey)}>
          {copied === 'key' ? <Check size={12} /> : <Copy size={12} />} Copy private key
        </button>
        <span className="near-form-hint">
          Copied keys stay on the clipboard until you copy something else.
        </span>
        <button className="btn small primary" onClick={onHide}>
          Hide
        </button>
      </div>
    </div>
  )
}

export default AccountsView
