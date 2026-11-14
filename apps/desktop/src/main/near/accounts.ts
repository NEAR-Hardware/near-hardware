// The NEAR accounts the app holds keys for. Names and public keys live in
// settings.json; private keys and recovery phrases live in near-keys.json,
// encrypted with a key from the macOS Keychain (Electron's safeStorage)
import { app, BrowserWindow, dialog, ipcMain, safeStorage, systemPreferences } from 'electron'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import {
  NETWORK_LABEL,
  accountKey,
  isImplicitAccount,
  isValidAccountId,
  shortAccountId,
  type ImportCandidate,
  type ImportLookup,
  type NameCheck,
  type NearAccount,
  type NearAccounts,
  type NearNetwork,
  type NearResult,
  type NearSecret
} from '../../shared/near'
import { broadcast } from '../broadcast'
import { readSettings, updateSettings } from '../settings'
import { generateKey, implicitAccountId, parseSecret } from './keys'
import type { Signer } from './transactions'
import {
  createTestnetAccount,
  findAccountsForKey,
  getBalance,
  viewAccessKey,
  viewAccount
} from './rpc'

const isNetwork = (value: unknown): value is NearNetwork =>
  value === 'mainnet' || value === 'testnet'

const message = (error: unknown): string =>
  error instanceof Error ? error.message : 'Something went wrong.'

// --- Encrypted keys ---

const keysFile = (): string => join(app.getPath('userData'), 'near-keys.json')

async function readKeys(): Promise<Record<string, string>> {
  try {
    return JSON.parse(await readFile(keysFile(), 'utf8'))
  } catch {
    return {}
  }
}

let pendingWrite: Promise<unknown> = Promise.resolve()

// One write at a time, written then renamed like settings.json
function updateKeys(
  update: (keys: Record<string, string>) => Record<string, string>
): Promise<void> {
  const run = pendingWrite.then(async () => {
    const next = update(await readKeys())
    const file = keysFile()
    await mkdir(dirname(file), { recursive: true })
    await writeFile(`${file}.tmp`, JSON.stringify(next, null, 2), { mode: 0o600 })
    await rename(`${file}.tmp`, file)
  })
  pendingWrite = run.catch(() => undefined)
  return run
}

function encrypt(secret: NearSecret): string {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error(
      'Your Mac’s Keychain isn’t available, so NEAR Hardware can’t store keys safely.'
    )
  }
  return safeStorage.encryptString(JSON.stringify(secret)).toString('base64')
}

async function readSecret(network: NearNetwork, accountId: string): Promise<NearSecret> {
  const stored = (await readKeys())[accountKey(network, accountId)]
  if (!stored) throw new Error(`NEAR Hardware doesn’t have a key for ${accountId}.`)
  return JSON.parse(safeStorage.decryptString(Buffer.from(stored, 'base64')))
}

// --- Accounts ---

export async function listAccounts(): Promise<NearAccounts> {
  const settings = await readSettings()
  return {
    accounts: settings.nearAccounts ?? [],
    primary: settings.nearPrimary ?? {},
    autoApproveTestnet: settings.nearAutoApproveTestnet ?? false
  }
}

export async function setAutoApproveTestnet(on: boolean): Promise<void> {
  await updateSettings((settings) => ({ ...settings, nearAutoApproveTestnet: on }))
  broadcast('near:changed')
}

// An account the app can sign for, with its key. Main process only: the key
// never goes to a renderer or an agent.
export async function getSigner(
  network: NearNetwork,
  accountId: string
): Promise<Signer & { account: NearAccount }> {
  const { accounts } = await listAccounts()
  const account = accounts.find((a) => a.network === network && a.accountId === accountId)
  if (!account) {
    throw new Error(
      `${accountId} isn’t one of the user’s ${NETWORK_LABEL[network].toLowerCase()} accounts in NEAR Hardware. Call near_accounts to see them.`
    )
  }
  const { privateKey } = await readSecret(network, accountId)
  return { account, accountId, publicKey: account.publicKey, privateKey }
}

// Saves a sub-account the app made a key for (it doesn't become primary)
export async function recordSubaccount(
  account: Omit<NearAccount, 'addedAt' | 'source'>,
  secret: NearSecret
): Promise<NearAccount> {
  return addAccount(
    { ...account, source: 'subaccount', addedAt: new Date().toISOString() },
    secret,
    false
  )
}

async function addAccount(
  account: NearAccount,
  secret: NearSecret,
  canBePrimary = true
): Promise<NearAccount> {
  const key = accountKey(account.network, account.accountId)
  const encrypted = encrypt(secret)
  await updateKeys((keys) => ({ ...keys, [key]: encrypted }))
  await updateSettings((settings) => {
    const others = (settings.nearAccounts ?? []).filter(
      (a) => accountKey(a.network, a.accountId) !== key
    )
    const primary = { ...settings.nearPrimary }
    // The first account on a network becomes its primary
    if (canBePrimary) primary[account.network] ??= account.accountId
    return { ...settings, nearAccounts: [...others, account], nearPrimary: primary }
  })
  broadcast('near:changed')
  return account
}

// "alice" or "alice.testnet" → alice.testnet; the faucet only makes direct sub-accounts of testnet
function testnetName(name: string): string {
  const trimmed = name.trim().toLowerCase()
  return trimmed.endsWith('.testnet') ? trimmed : `${trimmed}.testnet`
}

async function checkTestnetName(name: string): Promise<NameCheck> {
  const accountId = testnetName(name)
  const label = accountId.slice(0, -'.testnet'.length)
  if (label.length < 2 || !isValidAccountId(accountId) || label.includes('.')) {
    return {
      status: 'invalid',
      accountId,
      message: 'Use at least 2 lowercase letters or numbers, with - or _ between them.'
    }
  }
  if (await viewAccount('testnet', accountId)) {
    return { status: 'taken', accountId, message: `${accountId} is taken.` }
  }
  return { status: 'available', accountId }
}

async function createTestnet(name: string): Promise<NearResult> {
  try {
    const check = await checkTestnetName(name)
    if (check.status !== 'available') return { ok: false, message: check.message }
    const key = generateKey()
    await createTestnetAccount(check.accountId, key.publicKey)
    // The faucet answers before the account is final, and doesn't fail when
    // the name was taken in the meantime: wait for our key to show up
    for (let attempt = 0; attempt < 20; attempt++) {
      const access = await viewAccessKey('testnet', check.accountId, key.publicKey)
      if (access) {
        return {
          ok: true,
          account: await addAccount(
            {
              accountId: check.accountId,
              network: 'testnet',
              publicKey: key.publicKey,
              source: 'created',
              hasPhrase: true,
              addedAt: new Date().toISOString()
            },
            { phrase: key.phrase, privateKey: key.privateKey }
          )
        }
      }
      if (attempt > 2 && (await viewAccount('testnet', check.accountId))) {
        return { ok: false, message: `${check.accountId} was just taken. Try another name.` }
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    return { ok: false, message: 'The testnet faucet didn’t create the account. Try again.' }
  } catch (error) {
    return { ok: false, message: message(error) }
  }
}

// The accounts a pasted phrase or key controls, on both networks
async function lookupImport(secret: string): Promise<ImportLookup> {
  try {
    const key = parseSecret(secret)
    const { accounts } = await listAccounts()
    const implicit = implicitAccountId(key.publicKey)
    const perNetwork = await Promise.all(
      (['mainnet', 'testnet'] as const).map(async (network) => {
        const named = await findAccountsForKey(network, key.publicKey)
        const candidates = await Promise.all(
          [...new Set([...named, implicit])].map(
            async (accountId): Promise<ImportCandidate | null> => {
              const balance = await getBalance(network, accountId)
              // A hex address only counts once something has been sent to it
              if (accountId === implicit && !balance.exists) return null
              if (accountId !== implicit) {
                const access = await viewAccessKey(network, accountId, key.publicKey)
                if (access?.permission !== 'FullAccess') return null
              }
              return {
                accountId,
                network,
                implicit: accountId === implicit,
                balance,
                alreadyAdded: accounts.some(
                  (a) => a.network === network && a.accountId === accountId
                )
              }
            }
          )
        )
        return candidates.filter((c): c is ImportCandidate => c !== null)
      })
    )
    return { ok: true, publicKey: key.publicKey, candidates: perNetwork.flat() }
  } catch (error) {
    return { ok: false, message: message(error) }
  }
}

async function importAccount(input: {
  secret: string
  network: NearNetwork
  accountId: string
}): Promise<NearResult> {
  try {
    const key = parseSecret(input.secret)
    const accountId = input.accountId.trim().toLowerCase()
    const network = input.network
    if (!isValidAccountId(accountId)) {
      return { ok: false, message: `“${accountId}” isn’t a NEAR account name.` }
    }
    const ownAddress =
      isImplicitAccount(accountId) && accountId === implicitAccountId(key.publicKey)
    const access = await viewAccessKey(network, accountId, key.publicKey)
    if (!access && !ownAddress) {
      const exists = await viewAccount(network, accountId)
      return {
        ok: false,
        message: exists
          ? `This key doesn’t control ${shortAccountId(accountId)} on ${NETWORK_LABEL[network]}.`
          : `${shortAccountId(accountId)} doesn’t exist on ${NETWORK_LABEL[network]} yet.`
      }
    }
    if (access && access.permission !== 'FullAccess') {
      return {
        ok: false,
        message: `This key can only call certain contracts for ${shortAccountId(accountId)}. Import its recovery phrase or full-access key instead.`
      }
    }
    return {
      ok: true,
      account: await addAccount(
        {
          accountId,
          network,
          publicKey: key.publicKey,
          source: 'imported',
          hasPhrase: Boolean(key.phrase),
          addedAt: new Date().toISOString()
        },
        { phrase: key.phrase, privateKey: key.privateKey }
      )
    }
  } catch (error) {
    return { ok: false, message: message(error) }
  }
}

async function setPrimary(network: NearNetwork, accountId: string): Promise<void> {
  await updateSettings((settings) => {
    // Limited accounts can't be the default signer: they can't send NEAR
    const known = (settings.nearAccounts ?? []).some(
      (a) => a.network === network && a.accountId === accountId && !a.limited
    )
    return known
      ? { ...settings, nearPrimary: { ...settings.nearPrimary, [network]: accountId } }
      : settings
  })
  broadcast('near:changed')
}

// A different pixel avatar for the account
async function shuffleAvatar(network: NearNetwork, accountId: string): Promise<void> {
  await updateSettings((settings) => ({
    ...settings,
    nearAccounts: (settings.nearAccounts ?? []).map((a) =>
      a.network === network && a.accountId === accountId
        ? { ...a, avatarVariant: (a.avatarVariant ?? 0) + 1 }
        : a
    )
  }))
  broadcast('near:changed')
}

async function removeAccount(
  window: BrowserWindow | null,
  network: NearNetwork,
  accountId: string
): Promise<boolean> {
  const { accounts } = await listAccounts()
  const account = accounts.find((a) => a.network === network && a.accountId === accountId)
  if (!account) return false
  const options = {
    type: 'warning' as const,
    buttons: ['Remove', 'Cancel'],
    defaultId: 1,
    cancelId: 1,
    message: `Remove ${shortAccountId(accountId)} from NEAR Hardware?`,
    detail:
      account.source === 'created'
        ? 'This Mac has the only copy of its key unless you saved the recovery phrase. Without it, the account and its NEAR are gone for good.'
        : 'Its key is deleted from this Mac. The account stays on NEAR and in the wallet you imported it from.'
  }
  const { response } = window
    ? await dialog.showMessageBox(window, options)
    : await dialog.showMessageBox(options)
  if (response !== 0) return false

  const key = accountKey(network, accountId)
  await updateKeys((keys) => {
    const rest = { ...keys }
    delete rest[key]
    return rest
  })
  await updateSettings((settings) => {
    const remaining = (settings.nearAccounts ?? []).filter(
      (a) => accountKey(a.network, a.accountId) !== key
    )
    const primary = { ...settings.nearPrimary }
    // Another account on the same network takes over as primary
    if (primary[network] === accountId) {
      primary[network] = remaining.find((a) => a.network === network)?.accountId
    }
    return { ...settings, nearAccounts: remaining, nearPrimary: primary }
  })
  broadcast('near:changed')
  return true
}

// Touch ID (or a confirmation where there's no sensor) before showing a key
async function revealSecret(
  window: BrowserWindow | null,
  network: NearNetwork,
  accountId: string
): Promise<NearSecret | null> {
  const reason = `show the key for ${shortAccountId(accountId)}`
  if (process.platform === 'darwin' && systemPreferences.canPromptTouchID()) {
    try {
      await systemPreferences.promptTouchID(reason)
    } catch {
      return null
    }
  } else {
    const options = {
      type: 'warning' as const,
      buttons: ['Show', 'Cancel'],
      defaultId: 1,
      cancelId: 1,
      message: `Show the key for ${shortAccountId(accountId)}?`,
      detail:
        'Anyone who sees it can take everything in the account. Make sure nobody is watching your screen.'
    }
    const { response } = window
      ? await dialog.showMessageBox(window, options)
      : await dialog.showMessageBox(options)
    if (response !== 0) return null
  }
  return readSecret(network, accountId)
}

export function registerNearIpc(): void {
  ipcMain.handle('near:list', () => listAccounts())

  ipcMain.handle('near:check-name', async (_event, name: unknown): Promise<NameCheck> => {
    const text = typeof name === 'string' ? name : ''
    try {
      return await checkTestnetName(text)
    } catch (error) {
      return { status: 'invalid', accountId: testnetName(text), message: message(error) }
    }
  })

  ipcMain.handle('near:create-testnet', (_event, name: unknown) =>
    typeof name === 'string'
      ? createTestnet(name)
      : { ok: false, message: 'Choose a name for the account.' }
  )

  ipcMain.handle('near:lookup-import', (_event, secret: unknown) =>
    lookupImport(typeof secret === 'string' ? secret : '')
  )

  ipcMain.handle('near:import', (_event, input: unknown) => {
    const { secret, network, accountId } = (input ?? {}) as Record<string, unknown>
    if (typeof secret !== 'string' || typeof accountId !== 'string' || !isNetwork(network)) {
      return { ok: false, message: 'Paste a recovery phrase or private key and pick an account.' }
    }
    return importAccount({ secret, network, accountId })
  })

  ipcMain.handle('near:set-primary', async (_event, network: unknown, accountId: unknown) => {
    if (isNetwork(network) && typeof accountId === 'string') await setPrimary(network, accountId)
  })

  ipcMain.handle('near:set-auto-approve-testnet', (_event, on: unknown) =>
    setAutoApproveTestnet(on === true)
  )

  ipcMain.handle('near:shuffle-avatar', async (_event, network: unknown, accountId: unknown) => {
    if (isNetwork(network) && typeof accountId === 'string') await shuffleAvatar(network, accountId)
  })

  ipcMain.handle('near:remove', (event, network: unknown, accountId: unknown) => {
    if (!isNetwork(network) || typeof accountId !== 'string') return false
    return removeAccount(BrowserWindow.fromWebContents(event.sender), network, accountId)
  })

  ipcMain.handle('near:reveal', (event, network: unknown, accountId: unknown) => {
    if (!isNetwork(network) || typeof accountId !== 'string') return null
    return revealSecret(BrowserWindow.fromWebContents(event.sender), network, accountId)
  })

  ipcMain.handle('near:balance', (_event, network: unknown, accountId: unknown) => {
    if (!isNetwork(network) || typeof accountId !== 'string') return null
    return getBalance(network, accountId).catch(() => null)
  })
}
