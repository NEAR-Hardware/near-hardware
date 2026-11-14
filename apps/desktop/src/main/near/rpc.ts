// Reads from NEAR over JSON-RPC, finds the accounts a key controls, and asks
// the testnet faucet for new accounts
import type { NearBalance, NearNetwork } from '../../shared/near'

// FastNEAR's free RPC first; NEAR's own is rate-limited but a fine fallback
const RPC: Record<NearNetwork, string[]> = {
  mainnet: ['https://rpc.mainnet.fastnear.com', 'https://rpc.mainnet.near.org'],
  testnet: ['https://rpc.testnet.fastnear.com', 'https://rpc.testnet.near.org']
}

// Maps public keys to the accounts they hold a full-access key for
const KEY_LOOKUP: Record<NearNetwork, string> = {
  mainnet: 'https://api.fastnear.com/v0/public_key',
  testnet: 'https://test.api.fastnear.com/v0/public_key'
}

// The service behind `near account create-account sponsor-by-faucet-service`
const TESTNET_FAUCET = 'https://helper.nearprotocol.com/account'

// Storage costs 10^19 yoctoNEAR per byte, held as a reserve on the account
const STORAGE_PRICE_PER_BYTE = 10n ** 19n

type RpcError = {
  name?: string
  cause?: { name?: string; info?: unknown }
  message?: string
  // A string, or for rejected transactions the error as an object
  data?: unknown
}

export class NearRpcError extends Error {
  constructor(
    message: string,
    readonly kind?: string
  ) {
    super(message)
  }
}

async function call<T>(
  network: NearNetwork,
  method: string,
  params: unknown,
  timeout = 15_000
): Promise<T> {
  let lastError: unknown
  for (const url of RPC[network]) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 'near-hardware', method, params }),
        signal: AbortSignal.timeout(timeout)
      })
      if (!response.ok) throw new Error(`NEAR ${network} RPC answered ${response.status}`)
      const body = (await response.json()) as { result?: T; error?: RpcError }
      if (body.error) {
        // A real answer, like "no such account": don't try the next server
        const { data, cause } = body.error
        const detail =
          typeof data === 'string' ? data : JSON.stringify(data ?? cause?.info ?? cause)
        throw new NearRpcError(
          detail ?? body.error.message ?? 'NEAR RPC error',
          cause?.name ?? body.error.name
        )
      }
      return body.result as T
    } catch (error) {
      if (error instanceof NearRpcError) throw error
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Couldn’t reach NEAR ${network}`)
}

type ViewAccount = { amount: string; locked: string; storage_usage: number; code_hash: string }

export async function viewAccount(
  network: NearNetwork,
  accountId: string
): Promise<ViewAccount | null> {
  try {
    return await call<ViewAccount>(network, 'query', {
      request_type: 'view_account',
      finality: 'final',
      account_id: accountId
    })
  } catch (error) {
    if (error instanceof NearRpcError && error.kind === 'UNKNOWN_ACCOUNT') return null
    throw error
  }
}

export async function getBalance(network: NearNetwork, accountId: string): Promise<NearBalance> {
  const account = await viewAccount(network, accountId)
  if (!account) return { total: '0', available: '0', exists: false }
  const total = BigInt(account.amount)
  const reserve = BigInt(account.storage_usage) * STORAGE_PRICE_PER_BYTE
  const available = total > reserve ? total - reserve : 0n
  return { total: total.toString(), available: available.toString(), exists: true }
}

type AccessKey = { nonce: number; permission: 'FullAccess' | { FunctionCall: unknown } }

// The key's permission on the account, or null when the account doesn't have it
export async function viewAccessKey(
  network: NearNetwork,
  accountId: string,
  publicKey: string,
  // 'optimistic' sees changes from the last second or two, e.g. a key just added
  finality: 'final' | 'optimistic' = 'final'
): Promise<AccessKey | null> {
  try {
    // A missing key comes back as a result with an `error` string, not an RPC error
    const result = await call<Partial<AccessKey> & { error?: string }>(network, 'query', {
      request_type: 'view_access_key',
      finality,
      account_id: accountId,
      public_key: publicKey
    })
    return result.error || !result.permission ? null : (result as AccessKey)
  } catch (error) {
    if (
      error instanceof NearRpcError &&
      (error.kind === 'UNKNOWN_ACCESS_KEY' || error.kind === 'UNKNOWN_ACCOUNT')
    ) {
      return null
    }
    throw error
  }
}

// Named accounts that hold this key, from FastNEAR's index; empty if the
// index is unreachable (the user can still type the name)
export async function findAccountsForKey(
  network: NearNetwork,
  publicKey: string
): Promise<string[]> {
  try {
    const response = await fetch(`${KEY_LOOKUP[network]}/${publicKey}`, {
      signal: AbortSignal.timeout(10_000)
    })
    if (!response.ok) return []
    const body = (await response.json()) as { account_ids?: string[] }
    return body.account_ids ?? []
  } catch {
    return []
  }
}

// Asks NEAR's testnet faucet to create <name>.testnet with this key and some test NEAR
export async function createTestnetAccount(accountId: string, publicKey: string): Promise<void> {
  const response = await fetch(TESTNET_FAUCET, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ newAccountId: accountId, newAccountPublicKey: publicKey }),
    signal: AbortSignal.timeout(30_000)
  })
  if (!response.ok) {
    const text = (await response.text()).trim()
    throw new Error(
      response.status === 429
        ? 'The testnet faucet is busy. Wait a minute and try again.'
        : `The testnet faucet couldn’t create the account${text ? `: ${text}` : '.'}`
    )
  }
}

export async function latestBlockHash(network: NearNetwork): Promise<string> {
  const block = await call<{ header: { hash: string } }>(network, 'block', { finality: 'final' })
  return block.header.hash
}

export type ExecutionOutcome = {
  status: { SuccessValue?: string } | { Failure: unknown } | string
  transaction: { hash: string }
  transaction_outcome?: { outcome: { logs: string[] } }
  receipts_outcome?: { outcome: { logs: string[] } }[]
}

// Sends a signed transaction and waits until it has run (a few seconds)
export async function sendTransaction(
  network: NearNetwork,
  signedBase64: string
): Promise<ExecutionOutcome> {
  try {
    return await call<ExecutionOutcome>(
      network,
      'send_tx',
      { signed_tx_base64: signedBase64, wait_until: 'EXECUTED_OPTIMISTIC' },
      90_000
    )
  } catch (error) {
    // e.g. NotEnoughBalance or InvalidNonce, with NEAR's details
    if (error instanceof NearRpcError)
      throw new Error(`NEAR rejected the transaction: ${error.message}`, { cause: error })
    throw error
  }
}

// Calls a contract's view method (free, no signing); the result is parsed as JSON when it is JSON
export async function viewFunction(
  network: NearNetwork,
  contractId: string,
  method: string,
  args: unknown
): Promise<{ result: unknown; logs: string[] }> {
  const response = await call<{ result?: number[]; logs?: string[]; error?: string }>(
    network,
    'query',
    {
      request_type: 'call_function',
      finality: 'final',
      account_id: contractId,
      method_name: method,
      args_base64: Buffer.from(JSON.stringify(args ?? {})).toString('base64')
    }
  )
  if (response.error) throw new Error(response.error)
  const text = Buffer.from(response.result ?? []).toString('utf8')
  let result: unknown = text
  try {
    result = text ? JSON.parse(text) : null
  } catch {
    // Not JSON: return the text
  }
  return { result, logs: response.logs ?? [] }
}

export type AccessKeyInfo = {
  public_key: string
  access_key: {
    nonce: number
    permission:
      | 'FullAccess'
      | { FunctionCall: { allowance: string | null; receiver_id: string; method_names: string[] } }
  }
}

export async function viewAccessKeys(
  network: NearNetwork,
  accountId: string
): Promise<AccessKeyInfo[]> {
  const result = await call<{ keys?: AccessKeyInfo[] }>(network, 'query', {
    request_type: 'view_access_key_list',
    finality: 'final',
    account_id: accountId
  })
  return result.keys ?? []
}

// The code hash of an account with no contract
export const NO_CONTRACT = '11111111111111111111111111111111'
