// The NEAR tools agents get through the near-hardware MCP server. Agents use
// the user's accounts without ever seeing a key: the app signs here, after the
// user approves (see approval.ts), and sends the transaction to NEAR.
import { readFile, stat } from 'node:fs/promises'
import { AVATAR_SIZE, avatarSeed, generateAvatar } from '../../shared/avatar'
import { getEnvironment } from '../../shared/environments'
import {
  NEAR_NETWORKS,
  explorerUrl,
  formatNear,
  isValidAccountId,
  transactionUrl,
  type LimitedAccess,
  type NearNetwork
} from '../../shared/near'
import { resolveInProject } from '../files'
import type { ToolContext, ToolDefinition } from '../hardware/bridge'
import { getProject } from '../projects'
import { getSigner, listAccounts, recordSubaccount } from './accounts'
import { requestApproval } from './approval'
import { docsOverview, readDoc, searchDocs } from './docs'
import { generateKey } from './keys'
import { NO_CONTRACT, getBalance, viewAccessKeys, viewAccount, viewFunction } from './rpc'
import {
  TGAS,
  parseNear,
  signAndSend,
  type AccessKeyPermission,
  type Action,
  type TransactionResult
} from './transactions'

// NEAR's limit for one contract
const MAX_CONTRACT_BYTES = 4 * 1024 * 1024

const NETWORK_PARAM = {
  type: 'string',
  enum: ['testnet', 'mainnet'],
  description: 'Default testnet. Use mainnet only when the user asks for real NEAR.'
}

function network(args: Record<string, unknown>): NearNetwork {
  const value = args.network ?? 'testnet'
  if (value !== 'testnet' && value !== 'mainnet') {
    throw new Error('network must be "testnet" or "mainnet".')
  }
  return value
}

// The account to sign with: the one asked for, or the network's primary
async function signerId(net: NearNetwork, requested: unknown): Promise<string> {
  if (typeof requested === 'string' && requested.trim()) return requested.trim()
  const { primary } = await listAccounts()
  const id = primary[net]
  if (!id) {
    throw new Error(
      `The user has no ${net} account in NEAR Hardware yet. Ask them to add one from NEAR accounts at the bottom of the app’s sidebar (testnet accounts are free and take one click).`
    )
  }
  return id
}

function accountIdArg(value: unknown, what: string): string {
  const id = String(value ?? '')
    .trim()
    .toLowerCase()
  if (!isValidAccountId(id)) throw new Error(`${what} “${id}” isn’t a valid NEAR account ID.`)
  return id
}

// Who's asking, for the approval prompt
async function asker(context: ToolContext): Promise<{ agent: string; chat: string }> {
  try {
    const project = await getProject(context.projectId)
    const chat = project.chats.find((c) => c.id === context.chatId)
    return {
      agent: chat ? getEnvironment(chat.environmentId).name : 'An agent',
      chat: chat ? `${chat.title} (${project.name})` : project.name
    }
  } catch {
    return { agent: 'An agent', chat: 'unknown' }
  }
}

const near = (yocto: bigint): string => `${formatNear(yocto.toString(), 5)} NEAR`

function describeLimits(limits: LimitedAccess): string {
  const methods = limits.methodNames.length ? limits.methodNames.join(', ') : 'any method'
  const fees =
    limits.allowance === null ? 'no fee cap' : `up to ${near(BigInt(limits.allowance))} in fees`
  return `can only call ${methods} on ${limits.receiverId}, ${fees}; can’t send NEAR`
}

function limitedArgs(args: Record<string, unknown>): LimitedAccess {
  const receiverId = accountIdArg(args.contractId, 'contractId')
  const methodNames = Array.isArray(args.methodNames) ? args.methodNames.map(String) : []
  const allowance = args.allowance === null ? null : parseNear(args.allowance ?? '0.25').toString()
  return { receiverId, methodNames, allowance }
}

function report(net: NearNetwork, result: TransactionResult, extra: object = {}): object {
  return {
    ok: result.ok,
    network: net,
    transaction: result.hash,
    explorer: transactionUrl(net, result.hash),
    ...(result.result !== undefined ? { result: result.result } : {}),
    ...(result.logs.length ? { logs: result.logs } : {}),
    ...(result.failure ? { failure: result.failure } : {}),
    ...extra
  }
}

// Signs and sends after the user approves; a denial is an error the agent sees
async function approveAndSend(
  context: ToolContext,
  net: NearNetwork,
  signerAccountId: string,
  receiverId: string,
  actions: Action[],
  action: string,
  details: [string, string][]
): Promise<TransactionResult> {
  const signer = await getSigner(net, signerAccountId)
  const approved = await requestApproval({
    network: net,
    action,
    details: [['Signed by', signerAccountId], ...details],
    ...(await asker(context)),
    limited: Boolean(signer.account.limited)
  })
  if (!approved) throw new Error('The user denied this transaction in NEAR Hardware.')
  return signAndSend(net, signer, receiverId, actions)
}

export const NEAR_TOOLS: ToolDefinition[] = [
  {
    name: 'near_docs_search',
    description:
      'Search NEAR’s official documentation, bundled with NEAR Hardware: docs.near.org (protocol, smart contracts, web3 apps, multi-chain/chain signatures, tokens and primitives, data infrastructure, integrations, RPC API), NEAR Intents (1Click swap API), NEAR AI Cloud (private inference), IronClaw (secure agent runtime) and the NEAR Agent Market. Use it before writing NEAR code instead of guessing APIs. Returns pages with a snippet; read one with near_docs_read. Call with no query to list the sections.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Words to look for, e.g. "deploy contract init" or "1click quote"'
        },
        source: {
          type: 'string',
          description:
            'Only one doc set: "near" (docs.near.org), "intents" (NEAR Intents), "nearai" (NEAR AI Cloud), "ironclaw" (IronClaw), "market" (NEAR Agent Market); call with no query to list them'
        },
        section: {
          type: 'string',
          description:
            'Only one section, e.g. smart-contracts, web3-apps, chain-abstraction, primitives, api, integrations'
        },
        limit: { type: 'number', description: 'Results, default 8, max 20' }
      }
    },
    run: async (args) =>
      typeof args.query === 'string' && args.query.trim()
        ? searchDocs(args.query, {
            source: typeof args.source === 'string' ? args.source : undefined,
            section: typeof args.section === 'string' ? args.section : undefined,
            limit: typeof args.limit === 'number' ? args.limit : undefined
          })
        : docsOverview()
  },
  {
    name: 'near_docs_read',
    description:
      'Read one page of NEAR’s bundled documentation as Markdown (code samples included). `file` comes from near_docs_search, e.g. near/smart-contracts/quickstart.md. Long pages come in parts: pass the returned nextOffset to continue.',
    inputSchema: {
      type: 'object',
      properties: {
        file: { type: 'string' },
        offset: { type: 'number', description: 'Character offset, from a previous nextOffset' }
      },
      required: ['file']
    },
    run: async (args) => readDoc(String(args.file ?? ''), Number(args.offset ?? 0))
  },
  {
    name: 'near_accounts',
    description:
      'List the user’s NEAR accounts in NEAR Hardware: the primary mainnet and testnet account (the default signer for every near_* tool), every other account (including sub-accounts and their limits), balances in NEAR, which transactions need the user’s approval, and each account’s 16×16 pixel avatar (draw it on a board’s screen to show which account the board uses). Private keys never leave the app.',
    inputSchema: { type: 'object', properties: {} },
    run: async () => {
      const { accounts, primary, autoApproveTestnet } = await listAccounts()
      const withBalances = await Promise.all(
        accounts.map(async (account) => {
          const { accountId, network: net, publicKey, avatarVariant } = account
          const balance = await getBalance(net, accountId).catch(() => null)
          const { palette, pixels } = generateAvatar(avatarSeed(accountId, avatarVariant))
          return {
            accountId,
            network: net,
            publicKey,
            primary: primary[net] === accountId,
            ...(account.parent ? { parent: account.parent } : {}),
            access: account.limited ? describeLimits(account.limited) : 'full access',
            balance: balance ? Number(BigInt(balance.total) / 10n ** 20n) / 10_000 : null,
            existsOnChain: balance?.exists ?? null,
            explorer: explorerUrl(net, accountId),
            // Each row is a string of base-36 palette indices
            avatar: {
              size: AVATAR_SIZE,
              palette,
              rows: pixels.map((row) => row.map((i) => i.toString(36)).join(''))
            }
          }
        })
      )
      return {
        primary: Object.fromEntries(NEAR_NETWORKS.map((n) => [n, primary[n] ?? null])),
        accounts: withBalances,
        approval: {
          mainnet: 'the user approves every transaction',
          testnet: autoApproveTestnet
            ? 'automatic (the user turned off asking)'
            : 'the user approves every transaction',
          limitedKeys: 'automatic: NEAR only lets them do what the user approved'
        },
        ...(accounts.length
          ? {}
          : {
              note: 'No NEAR accounts yet. Ask the user to add one from NEAR accounts at the bottom of the app’s sidebar.'
            })
      }
    }
  },
  {
    name: 'near_account_info',
    description:
      'Look up any NEAR account: whether it exists, its balance, whether a contract is deployed on it, and its access keys (full access, or limited to calling one contract). Read-only.',
    inputSchema: {
      type: 'object',
      properties: { network: NETWORK_PARAM, accountId: { type: 'string' } },
      required: ['accountId']
    },
    run: async (args) => {
      const net = network(args)
      const accountId = accountIdArg(args.accountId, 'accountId')
      const account = await viewAccount(net, accountId)
      if (!account) return { accountId, network: net, exists: false }
      const keys = await viewAccessKeys(net, accountId)
      return {
        accountId,
        network: net,
        exists: true,
        balance: near(BigInt(account.amount)),
        storageBytes: account.storage_usage,
        hasContract: account.code_hash !== NO_CONTRACT,
        keys: keys.map(({ public_key, access_key }) =>
          access_key.permission === 'FullAccess'
            ? { publicKey: public_key, access: 'full' }
            : {
                publicKey: public_key,
                access: 'limited',
                contract: access_key.permission.FunctionCall.receiver_id,
                methods: access_key.permission.FunctionCall.method_names,
                feeAllowance:
                  access_key.permission.FunctionCall.allowance === null
                    ? null
                    : near(BigInt(access_key.permission.FunctionCall.allowance))
              }
        ),
        explorer: explorerUrl(net, accountId)
      }
    }
  },
  {
    name: 'near_view',
    description:
      'Call a contract’s view method (free, read-only, no signing or approval), e.g. get_greeting or ft_balance_of. Returns the parsed JSON result.',
    inputSchema: {
      type: 'object',
      properties: {
        network: NETWORK_PARAM,
        contractId: { type: 'string' },
        method: { type: 'string' },
        args: { type: 'object', description: 'JSON arguments, default {}' }
      },
      required: ['contractId', 'method']
    },
    run: async (args) =>
      viewFunction(
        network(args),
        accountIdArg(args.contractId, 'contractId'),
        String(args.method),
        args.args ?? {}
      )
  },
  {
    name: 'near_transfer',
    description:
      'Send NEAR from one of the user’s accounts (default: the network’s primary) to any account. The user approves it in NEAR Hardware first (mainnet always; testnet unless they turned asking off). Returns the transaction hash and explorer link.',
    inputSchema: {
      type: 'object',
      properties: {
        network: NETWORK_PARAM,
        from: { type: 'string', description: 'One of the user’s accounts; default the primary' },
        to: { type: 'string' },
        amount: { type: 'string', description: 'NEAR as a decimal string, e.g. "0.5"' }
      },
      required: ['to', 'amount']
    },
    run: async (args, context) => {
      const net = network(args)
      const from = await signerId(net, args.from)
      const to = accountIdArg(args.to, 'to')
      const amount = parseNear(args.amount)
      const result = await approveAndSend(
        context,
        net,
        from,
        to,
        [{ type: 'transfer', deposit: amount }],
        `send ${near(amount)} to ${to}`,
        [
          ['To', to],
          ['Amount', near(amount)]
        ]
      )
      return report(net, result)
    }
  },
  {
    name: 'near_call',
    description:
      'Call a contract method as one of the user’s accounts (a change call: it signs a transaction). Signs with the network’s primary account unless signerId is given; a limited sub-account can call the methods it was limited to without asking the user. The user approves full-access calls first. Returns the result, logs and explorer link.',
    inputSchema: {
      type: 'object',
      properties: {
        network: NETWORK_PARAM,
        signerId: {
          type: 'string',
          description: 'One of the user’s accounts (see near_accounts); default the primary'
        },
        contractId: { type: 'string' },
        method: { type: 'string' },
        args: { type: 'object', description: 'JSON arguments, default {}' },
        deposit: {
          type: 'string',
          description:
            'NEAR to attach, e.g. "0.01" for storage; default "0". Limited keys can’t attach any.'
        },
        gasTgas: { type: 'number', description: 'Gas in teragas, default 30, max 300' }
      },
      required: ['contractId', 'method']
    },
    run: async (args, context) => {
      const net = network(args)
      const signer = await signerId(net, args.signerId)
      const contractId = accountIdArg(args.contractId, 'contractId')
      const method = String(args.method)
      const deposit = parseNear(args.deposit ?? '0')
      const gas = BigInt(Math.min(300, Math.max(1, Math.round(Number(args.gasTgas ?? 30))))) * TGAS
      const json = JSON.stringify(args.args ?? {})
      const result = await approveAndSend(
        context,
        net,
        signer,
        contractId,
        [{ type: 'functionCall', method, args: Buffer.from(json), gas, deposit }],
        `call ${method} on ${contractId}`,
        [
          ['Contract', contractId],
          ['Method', method],
          ['Arguments', json.length > 300 ? `${json.slice(0, 300)}…` : json],
          ...(deposit > 0n ? [['Attached', near(deposit)] as [string, string]] : [])
        ]
      )
      return report(net, result)
    }
  },
  {
    name: 'near_deploy_contract',
    description:
      'Deploy a compiled contract (.wasm in this project, e.g. from `cargo near build`) to one of the user’s accounts, usually a sub-account made for it with near_create_subaccount. Optionally calls an init method in the same transaction. The user approves it first. Needs a full-access account with enough NEAR for storage (about 1 NEAR per 100 KB of contract).',
    inputSchema: {
      type: 'object',
      properties: {
        network: NETWORK_PARAM,
        accountId: {
          type: 'string',
          description: 'Where the contract goes; one of the user’s accounts'
        },
        wasmPath: {
          type: 'string',
          description: 'Path to the .wasm, relative to the project folder'
        },
        initMethod: { type: 'string', description: 'e.g. "new"; omit if the contract has none' },
        initArgs: { type: 'object' }
      },
      required: ['accountId', 'wasmPath']
    },
    run: async (args, context) => {
      const net = network(args)
      const accountId = accountIdArg(args.accountId, 'accountId')
      const project = await getProject(context.projectId)
      const path = await resolveInProject(project.path, String(args.wasmPath))
      const { size } = await stat(path)
      if (size > MAX_CONTRACT_BYTES) {
        throw new Error(`The contract is ${Math.round(size / 1024)} KB; NEAR’s limit is 4 MB.`)
      }
      const code = await readFile(path)
      const actions: Action[] = [{ type: 'deployContract', code }]
      if (typeof args.initMethod === 'string' && args.initMethod) {
        actions.push({
          type: 'functionCall',
          method: args.initMethod,
          args: Buffer.from(JSON.stringify(args.initArgs ?? {})),
          gas: 100n * TGAS,
          deposit: 0n
        })
      }
      const existing = await viewAccount(net, accountId)
      const result = await approveAndSend(
        context,
        net,
        accountId,
        accountId,
        actions,
        `deploy a contract to ${accountId}`,
        [
          ['Contract file', `${String(args.wasmPath)} (${Math.round(size / 1024)} KB)`],
          ...(existing && existing.code_hash !== NO_CONTRACT
            ? [['Replaces', 'the contract already on this account'] as [string, string]]
            : []),
          ...(typeof args.initMethod === 'string' && args.initMethod
            ? [['Then calls', args.initMethod] as [string, string]]
            : [])
        ]
      )
      return report(net, result, { contract: accountId })
    }
  },
  {
    name: 'near_create_subaccount',
    description:
      'Create a sub-account under one of the user’s accounts, e.g. counter.alice.testnet or watch.alice.near, funded from the parent. access "full": NEAR Hardware makes and keeps a full-access key (use it to deploy a contract there). access "limited": its only key can call one contract (optionally only some methods) and spend at most `allowance` NEAR on fees; it can’t send NEAR or deploy, so agents and boards can use it without the user approving each call. Pass publicKey to give the key to someone else instead, e.g. a board’s own on-chip key (then NEAR Hardware can’t sign for it). The user approves the creation.',
    inputSchema: {
      type: 'object',
      properties: {
        network: NETWORK_PARAM,
        name: {
          type: 'string',
          description: 'The new part, e.g. "counter" for counter.<parent>, or the full ID'
        },
        parentId: {
          type: 'string',
          description: 'One of the user’s full-access accounts; default the primary'
        },
        initialBalance: {
          type: 'string',
          description:
            'NEAR moved from the parent, default "0.1" (enough for an account and its key; a contract needs about 1 NEAR per 100 KB)'
        },
        access: { type: 'string', enum: ['full', 'limited'], description: 'Default "full"' },
        contractId: { type: 'string', description: 'limited only: the one contract it may call' },
        methodNames: {
          type: 'array',
          items: { type: 'string' },
          description: 'limited only: the methods it may call; omit for any method on that contract'
        },
        allowance: {
          type: ['string', 'null'],
          description:
            'limited only: NEAR it may spend on gas fees, default "0.25"; null for no cap'
        },
        publicKey: {
          type: 'string',
          description:
            'ed25519:… key held elsewhere (e.g. generated on a board); omit to let NEAR Hardware make and keep the key'
        }
      },
      required: ['name']
    },
    run: async (args, context) => {
      const net = network(args)
      const parent = await signerId(net, args.parentId)
      const name = String(args.name ?? '')
        .trim()
        .toLowerCase()
      const accountId = name.endsWith(`.${parent}`) ? name : `${name}.${parent}`
      if (!isValidAccountId(accountId) || accountId.slice(0, -parent.length - 1).includes('.')) {
        throw new Error(
          `“${accountId}” isn’t a valid sub-account of ${parent}. Use lowercase letters, digits, - and _ (64 characters at most in total).`
        )
      }
      if (await viewAccount(net, accountId)) throw new Error(`${accountId} already exists.`)
      const limited = args.access === 'limited' ? limitedArgs(args) : undefined
      const external = typeof args.publicKey === 'string' && args.publicKey.trim()
      if (external && !/^ed25519:[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(args.publicKey as string)) {
        throw new Error('publicKey must be an ed25519 public key like ed25519:8hSHprDq…')
      }
      if (external && !limited) {
        throw new Error(
          'A key held elsewhere can only get limited access. Pass access "limited" with a contractId, or omit publicKey.'
        )
      }
      const key = external ? undefined : generateKey()
      const publicKey = external ? (args.publicKey as string).trim() : key!.publicKey
      const balance = parseNear(args.initialBalance ?? '0.1')
      const permission: AccessKeyPermission = limited
        ? {
            kind: 'limited',
            receiverId: limited.receiverId,
            methodNames: limited.methodNames,
            allowance: limited.allowance === null ? null : BigInt(limited.allowance)
          }
        : { kind: 'full' }

      const result = await approveAndSend(
        context,
        net,
        parent,
        accountId,
        [
          { type: 'createAccount' },
          { type: 'transfer', deposit: balance },
          { type: 'addKey', publicKey, permission }
        ],
        `create the account ${accountId}`,
        [
          ['Paid by', `${parent} (${near(balance)} moves to the new account)`],
          ['Access', limited ? `Limited: ${describeLimits(limited)}` : 'Full access'],
          ['Key held by', external ? `someone else (${publicKey.slice(0, 20)}…)` : 'NEAR Hardware']
        ]
      )
      if (result.ok && key) {
        await recordSubaccount(
          { accountId, network: net, publicKey, parent, hasPhrase: true, limited },
          { phrase: key.phrase, privateKey: key.privateKey }
        )
      }
      return report(net, result, {
        accountId,
        access: limited ? describeLimits(limited) : 'full access',
        keyHeldBy: external ? 'the holder of publicKey' : 'NEAR Hardware (sign with signerId)',
        accountExplorer: explorerUrl(net, accountId)
      })
    }
  },
  {
    name: 'near_add_limited_key',
    description:
      'Give a key limited access to one of the user’s accounts: it may only call one contract (optionally only some methods) and spend at most `allowance` NEAR on fees. Use it to let a board’s own key or a script act for the account safely. Full-access keys can’t be added this way. The user approves it.',
    inputSchema: {
      type: 'object',
      properties: {
        network: NETWORK_PARAM,
        accountId: {
          type: 'string',
          description: 'One of the user’s accounts; default the primary'
        },
        publicKey: { type: 'string', description: 'ed25519:… the key to add' },
        contractId: { type: 'string' },
        methodNames: { type: 'array', items: { type: 'string' } },
        allowance: { type: ['string', 'null'], description: 'NEAR for gas fees, default "0.25"' }
      },
      required: ['publicKey', 'contractId']
    },
    run: async (args, context) => {
      const net = network(args)
      const accountId = await signerId(net, args.accountId)
      const publicKey = String(args.publicKey ?? '').trim()
      if (!/^ed25519:[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(publicKey)) {
        throw new Error('publicKey must be an ed25519 public key like ed25519:8hSHprDq…')
      }
      const limits = limitedArgs(args)
      const result = await approveAndSend(
        context,
        net,
        accountId,
        accountId,
        [
          {
            type: 'addKey',
            publicKey,
            permission: {
              kind: 'limited',
              receiverId: limits.receiverId,
              methodNames: limits.methodNames,
              allowance: limits.allowance === null ? null : BigInt(limits.allowance)
            }
          }
        ],
        `add a limited key to ${accountId}`,
        [
          ['Key', `${publicKey.slice(0, 24)}…`],
          ['It', describeLimits(limits)]
        ]
      )
      return report(net, result, { accountId, access: describeLimits(limits) })
    }
  }
]
