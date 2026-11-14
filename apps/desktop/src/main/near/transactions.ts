// Builds, signs and sends NEAR transactions. Transactions are Borsh-encoded by
// hand for the handful of actions the app uses; the hash of the encoding is
// signed with the account's ed25519 key, which never leaves the main process.
import { base58 } from '@scure/base'
import { createHash } from 'node:crypto'
import type { NearNetwork } from '../../shared/near'
import { signWith } from './keys'
import { latestBlockHash, sendTransaction, viewAccessKey, type ExecutionOutcome } from './rpc'

export type AccessKeyPermission =
  | { kind: 'full' }
  // Can only call `receiverId` (any method when methodNames is empty), paying
  // gas from `allowance` yoctoNEAR (null: no cap); can't send NEAR or deploy
  | { kind: 'limited'; receiverId: string; methodNames: string[]; allowance: bigint | null }

export type Action =
  | { type: 'createAccount' }
  | { type: 'deployContract'; code: Uint8Array }
  | { type: 'functionCall'; method: string; args: Uint8Array; gas: bigint; deposit: bigint }
  | { type: 'transfer'; deposit: bigint }
  | { type: 'addKey'; publicKey: string; permission: AccessKeyPermission }
  | { type: 'deleteKey'; publicKey: string }

// Borsh writer: little-endian integers, u32-length-prefixed strings and vectors
class Writer {
  private chunks: Buffer[] = []

  u8(value: number): this {
    this.chunks.push(Buffer.from([value]))
    return this
  }

  u32(value: number): this {
    const buffer = Buffer.alloc(4)
    buffer.writeUInt32LE(value)
    this.chunks.push(buffer)
    return this
  }

  u64(value: bigint): this {
    const buffer = Buffer.alloc(8)
    buffer.writeBigUInt64LE(value)
    this.chunks.push(buffer)
    return this
  }

  u128(value: bigint): this {
    const buffer = Buffer.alloc(16)
    buffer.writeBigUInt64LE(value & 0xffffffffffffffffn)
    buffer.writeBigUInt64LE(value >> 64n, 8)
    this.chunks.push(buffer)
    return this
  }

  fixed(bytes: Uint8Array): this {
    this.chunks.push(Buffer.from(bytes))
    return this
  }

  bytes(bytes: Uint8Array): this {
    return this.u32(bytes.length).fixed(bytes)
  }

  string(value: string): this {
    return this.bytes(Buffer.from(value, 'utf8'))
  }

  // ed25519 public key: key type 0, then its 32 bytes
  publicKey(key: string): this {
    return this.u8(0).fixed(base58.decode(key.replace(/^ed25519:/, '')))
  }

  done(): Buffer {
    return Buffer.concat(this.chunks)
  }
}

// Action variant numbers from nearcore's Action enum
function writeAction(writer: Writer, action: Action): void {
  switch (action.type) {
    case 'createAccount':
      writer.u8(0)
      break
    case 'deployContract':
      writer.u8(1).bytes(action.code)
      break
    case 'functionCall':
      writer.u8(2).string(action.method).bytes(action.args).u64(action.gas).u128(action.deposit)
      break
    case 'transfer':
      writer.u8(3).u128(action.deposit)
      break
    case 'addKey': {
      // AccessKey { nonce: u64, permission: FunctionCall (0) | FullAccess (1) }
      writer.u8(5).publicKey(action.publicKey).u64(0n)
      const { permission } = action
      if (permission.kind === 'full') {
        writer.u8(1)
      } else {
        writer.u8(0)
        if (permission.allowance === null) writer.u8(0)
        else writer.u8(1).u128(permission.allowance)
        writer.string(permission.receiverId).u32(permission.methodNames.length)
        for (const method of permission.methodNames) writer.string(method)
      }
      break
    }
    case 'deleteKey':
      writer.u8(6).publicKey(action.publicKey)
      break
  }
}

export type Signer = { accountId: string; publicKey: string; privateKey: string }

export type TransactionResult = {
  ok: boolean
  hash: string
  // The last receipt's return value, parsed as JSON when it is JSON
  result?: unknown
  logs: string[]
  // What went wrong, as NEAR reported it
  failure?: unknown
}

// One transaction at a time per key, so nonces never collide
const queues = new Map<string, Promise<unknown>>()
// The last nonce sent with each key: RPC's finalized view of a key lags a
// second or two behind a transaction that just went through
const lastNonces = new Map<string, bigint>()

export function signAndSend(
  network: NearNetwork,
  signer: Signer,
  receiverId: string,
  actions: Action[]
): Promise<TransactionResult> {
  const queueKey = `${network}:${signer.accountId}:${signer.publicKey}`
  const run = (queues.get(queueKey) ?? Promise.resolve()).then(async () => {
    // A key added moments ago (e.g. an account just created) can take a
    // couple of seconds to show up, even in the latest state
    let accessKey = await viewAccessKey(network, signer.accountId, signer.publicKey, 'optimistic')
    for (let attempt = 0; !accessKey && attempt < 6; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      accessKey = await viewAccessKey(network, signer.accountId, signer.publicKey, 'optimistic')
    }
    if (!accessKey) {
      throw new Error(`${signer.accountId} doesn’t have the key NEAR Hardware signs with.`)
    }
    const blockHash = await latestBlockHash(network)
    const onChain = BigInt(accessKey.nonce)
    const sent = lastNonces.get(queueKey) ?? 0n
    const nonce = (onChain > sent ? onChain : sent) + 1n
    lastNonces.set(queueKey, nonce)

    const writer = new Writer()
      .string(signer.accountId)
      .publicKey(signer.publicKey)
      .u64(nonce)
      .string(receiverId)
      .fixed(base58.decode(blockHash))
      .u32(actions.length)
    for (const action of actions) writeAction(writer, action)
    const transaction = writer.done()

    const hash = createHash('sha256').update(transaction).digest()
    const signature = signWith(signer.privateKey, hash)
    const signed = Buffer.concat([transaction, Buffer.from([0]), signature])
    return describeOutcome(await sendTransaction(network, signed.toString('base64')))
  })
  queues.set(
    queueKey,
    run.catch(() => undefined)
  )
  return run
}

function decodeValue(base64: string): unknown {
  if (!base64) return undefined
  const text = Buffer.from(base64, 'base64').toString('utf8')
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function describeOutcome(outcome: ExecutionOutcome): TransactionResult {
  const logs = [
    ...(outcome.transaction_outcome?.outcome.logs ?? []),
    ...(outcome.receipts_outcome ?? []).flatMap((receipt) => receipt.outcome.logs)
  ]
  const status = outcome.status
  if (typeof status === 'object' && status && 'Failure' in status) {
    return { ok: false, hash: outcome.transaction.hash, logs, failure: status.Failure }
  }
  const value =
    typeof status === 'object' && status && 'SuccessValue' in status
      ? decodeValue(String(status.SuccessValue ?? ''))
      : undefined
  return { ok: true, hash: outcome.transaction.hash, result: value, logs }
}

// "1.5" NEAR → yoctoNEAR
export function parseNear(amount: unknown): bigint {
  const text = String(amount ?? '').trim()
  if (!/^\d+(\.\d{1,24})?$/.test(text)) {
    throw new Error(`“${text}” isn’t an amount of NEAR. Use a decimal string like "0.5".`)
  }
  const [whole, fraction = ''] = text.split('.')
  return BigInt(whole) * 10n ** 24n + BigInt(fraction.padEnd(24, '0'))
}

export const TGAS = 10n ** 12n
