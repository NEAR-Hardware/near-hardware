import { useEffect, useState } from 'react'
import { Check, LoaderCircle, TriangleAlert } from 'lucide-react'
import type { NameCheck, NearAccount } from '../../../../shared/near'

type CreateTestnetFormProps = {
  onCreated: (account: NearAccount) => void
  autoFocus?: boolean
}

// Picks a free name.testnet and creates it with the testnet faucet
function CreateTestnetForm({ onCreated, autoFocus }: CreateTestnetFormProps): React.JSX.Element {
  const [name, setName] = useState('')
  // The check for the name as typed; stale ones are ignored
  const [check, setCheck] = useState<{ name: string; result: NameCheck }>()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string>()

  const label = name
    .trim()
    .toLowerCase()
    .replace(/\.testnet$/, '')

  // Checks the name a moment after typing stops
  useEffect(() => {
    if (label.length < 2) return
    const timer = setTimeout(() => {
      window.api.near.checkName(label).then((result) => setCheck({ name: label, result }))
    }, 350)
    return () => clearTimeout(timer)
  }, [label])

  const current = check?.name === label ? check.result : undefined
  const available = current?.status === 'available'

  const create = async (): Promise<void> => {
    if (!available || creating) return
    setCreating(true)
    setError(undefined)
    try {
      const result = await window.api.near.createTestnet(label)
      if (result.ok) {
        setName('')
        onCreated(result.account)
      } else {
        setError(result.message)
        // The name may have been taken meanwhile; check it again
        setCheck(undefined)
        window.api.near.checkName(label).then((again) => setCheck({ name: label, result: again }))
      }
    } finally {
      setCreating(false)
    }
  }

  let status: React.ReactNode = null
  if (label.length >= 2) {
    if (!current) {
      status = (
        <span className="near-name-status">
          <LoaderCircle size={12} className="spin" /> Checking…
        </span>
      )
    } else if (available) {
      status = (
        <span className="near-name-status ok">
          <Check size={12} strokeWidth={2.5} /> Available
        </span>
      )
    } else {
      status = (
        <span className="near-name-status bad">
          <TriangleAlert size={12} /> {current.status === 'taken' ? 'Taken' : 'Not allowed'}
        </span>
      )
    }
  }

  return (
    <form
      className="near-form"
      onSubmit={(event) => {
        event.preventDefault()
        create()
      }}
    >
      <div className="near-name-row">
        <label className="near-name-input">
          <input
            value={name}
            placeholder="your-name"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoFocus={autoFocus}
            aria-label="Testnet account name"
            disabled={creating}
            onChange={(event) => {
              setName(event.target.value)
              setError(undefined)
            }}
          />
          <span className="near-name-suffix">.testnet</span>
        </label>
        <button type="submit" className="btn primary" disabled={!available || creating}>
          {creating && <LoaderCircle size={13} className="spin" />}
          {creating ? 'Creating…' : 'Create'}
        </button>
      </div>
      <div className="near-form-meta">
        {status}
        <span className="near-form-hint">
          {current && current.status !== 'available'
            ? current.message
            : 'Free, with 10 test NEAR from the testnet faucet.'}
        </span>
      </div>
      {error && <p className="near-form-error">{error}</p>}
    </form>
  )
}

export default CreateTestnetForm
