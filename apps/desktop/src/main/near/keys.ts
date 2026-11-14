// NEAR keys: 12-word recovery phrases and ed25519 key pairs in the format NEAR
// wallets use (BIP39, then SLIP-10 at m/44'/397'/0'), so a phrase from Meteor
// opens the same account here, and one made here opens in Meteor
import { base58 } from '@scure/base'
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english.js'
import { createHmac, createPrivateKey, createPublicKey, sign, type KeyObject } from 'node:crypto'

export type KeyPair = {
  publicKey: string
  // ed25519:<base58 of the 32-byte seed and 32-byte public key>, like NEAR CLI and wallets
  privateKey: string
  phrase?: string
}

const NEAR_PATH = [44, 397, 0]
const HARDENED = 0x80000000

// SLIP-10 ed25519 derivation (every step hardened)
function deriveSeed(seed: Uint8Array): Buffer {
  let digest = createHmac('sha512', 'ed25519 seed').update(seed).digest()
  for (const index of NEAR_PATH) {
    const data = Buffer.alloc(37)
    digest.copy(data, 1, 0, 32)
    data.writeUInt32BE(index + HARDENED, 33)
    digest = createHmac('sha512', digest.subarray(32)).update(data).digest()
  }
  return Buffer.from(digest.subarray(0, 32))
}

// Node takes raw ed25519 seeds wrapped in PKCS#8
const PKCS8_ED25519 = Buffer.from('302e020100300506032b657004220420', 'hex')

const nodeKey = (seed: Buffer): KeyObject =>
  createPrivateKey({ key: Buffer.concat([PKCS8_ED25519, seed]), format: 'der', type: 'pkcs8' })

function publicKeyBytes(seed: Buffer): Buffer {
  const der = createPublicKey(nodeKey(seed)).export({ format: 'der', type: 'spki' })
  return der.subarray(der.length - 32)
}

function fromSeed(seed: Buffer, phrase?: string): KeyPair {
  const publicKey = publicKeyBytes(seed)
  return {
    publicKey: `ed25519:${base58.encode(publicKey)}`,
    privateKey: `ed25519:${base58.encode(Buffer.concat([seed, publicKey]))}`,
    phrase
  }
}

const normalizePhrase = (phrase: string): string =>
  phrase.trim().toLowerCase().split(/\s+/).join(' ')

function keyFromPhrase(input: string): KeyPair {
  const phrase = normalizePhrase(input)
  return fromSeed(deriveSeed(mnemonicToSeedSync(phrase)), phrase)
}

function keyFromPrivateKey(input: string): KeyPair {
  let bytes: Uint8Array
  try {
    bytes = base58.decode(input.trim().replace(/^ed25519:/, ''))
  } catch {
    throw new Error('That private key isn’t valid. It should look like ed25519:3x7Kf…')
  }
  if (bytes.length !== 64) {
    throw new Error('That private key isn’t valid. It should look like ed25519:3x7Kf…')
  }
  const seed = Buffer.from(bytes.subarray(0, 32))
  const pair = fromSeed(seed)
  if (!publicKeyBytes(seed).equals(Buffer.from(bytes.subarray(32)))) {
    throw new Error('That private key is damaged. Copy it from your wallet again.')
  }
  return pair
}

// A new key with its own 12-word recovery phrase
export function generateKey(): KeyPair {
  return keyFromPhrase(generateMnemonic(wordlist, 128))
}

// A pasted recovery phrase or private key
export function parseSecret(input: string): KeyPair {
  const text = input.trim()
  if (!text) throw new Error('Paste your recovery phrase or private key.')
  // A private key is one word; a phrase is several
  if (!/\s/.test(text)) return keyFromPrivateKey(text)
  const phrase = normalizePhrase(text)
  const words = phrase.split(' ').length
  if (![12, 15, 18, 21, 24].includes(words)) {
    throw new Error(`A recovery phrase has 12 or 24 words; this has ${words}.`)
  }
  if (!validateMnemonic(phrase, wordlist)) {
    throw new Error('Some words don’t match. Check the spelling and order of your recovery phrase.')
  }
  return keyFromPhrase(phrase)
}

// The hex address an ed25519 key controls without registering a name
export function implicitAccountId(publicKey: string): string {
  return Buffer.from(base58.decode(publicKey.replace(/^ed25519:/, ''))).toString('hex')
}

export function signWith(privateKey: string, message: Uint8Array): Buffer {
  const seed = Buffer.from(base58.decode(privateKey.replace(/^ed25519:/, '')).subarray(0, 32))
  return sign(null, message, nodeKey(seed))
}
