// NEAR accounts the app holds keys for, on mainnet and testnet

export type NearNetwork = 'mainnet' | 'testnet'

export const NEAR_NETWORKS: NearNetwork[] = ['mainnet', 'testnet']

export const NETWORK_LABEL: Record<NearNetwork, string> = {
  mainnet: 'Mainnet',
  testnet: 'Testnet'
}

export type NearAccount = {
  accountId: string
  network: NearNetwork
  // The full-access key the app signs with
  publicKey: string
  // Made in the app with the testnet faucet, brought in from a wallet, or made
  // under another account (by an agent or the app)
  source: 'created' | 'imported' | 'subaccount'
  // For sub-accounts: the account that created it, e.g. alice.near for bot.alice.near
  parent?: string
  // The app's key for it can only call one contract (a function-call key)
  limited?: LimitedAccess
  // Saved with its recovery phrase (otherwise only its private key)
  hasPhrase: boolean
  addedAt: string
  // Which pixel avatar it shows; Shuffle Avatar bumps it
  avatarVariant?: number
}

// What a function-call key may do: call receiverId (only methodNames, or any
// method when empty), paying gas from allowance; it can't send NEAR or deploy
export type LimitedAccess = {
  receiverId: string
  methodNames: string[]
  // yoctoNEAR of gas fees it may spend; null for no cap
  allowance: string | null
}

export type NearAccounts = {
  accounts: NearAccount[]
  // Each network's primary account, which boards and agents use by default
  primary: Partial<Record<NearNetwork, string>>
  // Agents' testnet transactions go through without asking (mainnet always asks)
  autoApproveTestnet: boolean
}

export type NearBalance = {
  // In yoctoNEAR (10^-24 NEAR); '0' for an address nothing has been sent to yet
  total: string
  // What's left after the reserve the account keeps for its on-chain storage
  available: string
  exists: boolean
}

export type NameCheck =
  | { status: 'available'; accountId: string }
  | { status: 'taken' | 'invalid'; accountId: string; message: string }

// An account a recovery phrase or private key controls
export type ImportCandidate = {
  accountId: string
  network: NearNetwork
  // A hex address made from the key, rather than a name like alice.near
  implicit: boolean
  balance: NearBalance
  alreadyAdded: boolean
}

export type ImportLookup =
  { ok: true; publicKey: string; candidates: ImportCandidate[] } | { ok: false; message: string }

export type NearResult = { ok: true; account: NearAccount } | { ok: false; message: string }

// Revealed only after Touch ID or the Mac's password
export type NearSecret = { phrase?: string; privateKey: string }

const NEAR_NOMINATION = 24n

// "12.5 NEAR"-style amount, rounded down to `digits` decimals
export function formatNear(yocto: string, digits = 2): string {
  let value: bigint
  try {
    value = BigInt(yocto)
  } catch {
    return '—'
  }
  const whole = value / 10n ** NEAR_NOMINATION
  const fraction = (value % 10n ** NEAR_NOMINATION)
    .toString()
    .padStart(Number(NEAR_NOMINATION), '0')
    .slice(0, digits)
    .replace(/0+$/, '')
  const small = whole === 0n && !fraction && value > 0n
  return small
    ? `<0.${'0'.repeat(digits - 1)}1`
    : `${whole.toLocaleString()}${fraction ? `.${fraction}` : ''}`
}

// Hex addresses are 64 characters; show the ends
export function shortAccountId(accountId: string): string {
  return /^[0-9a-f]{64}$/.test(accountId)
    ? `${accountId.slice(0, 6)}…${accountId.slice(-6)}`
    : accountId
}

export const isImplicitAccount = (accountId: string): boolean => /^[0-9a-f]{64}$/.test(accountId)

// NEAR's account ID rules: 2–64 characters of a–z, 0–9 and - _ separators, in dot-separated parts
export function isValidAccountId(accountId: string): boolean {
  return (
    accountId.length >= 2 &&
    accountId.length <= 64 &&
    /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/.test(accountId)
  )
}

export function explorerUrl(network: NearNetwork, accountId: string): string {
  return `https://${network === 'testnet' ? 'testnet.' : ''}nearblocks.io/address/${accountId}`
}

export function transactionUrl(network: NearNetwork, hash: string): string {
  return `https://${network === 'testnet' ? 'testnet.' : ''}nearblocks.io/txns/${hash}`
}

// Meteor makes named mainnet accounts for free; their phrase then imports here
export const METEOR_WALLET_URL = 'https://wallet.meteorwallet.app'

export const accountKey = (network: NearNetwork, accountId: string): string =>
  `${network}:${accountId}`
