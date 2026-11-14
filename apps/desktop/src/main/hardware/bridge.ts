// Local bridge between the NEAR Hardware MCP server (spawned by each agent CLI)
// and the app. Bound to 127.0.0.1 with a random token so only our MCP server
// can call it. The MCP server lives in resources/near-hardware-mcp.mjs.
import { app } from 'electron'
import { randomBytes } from 'node:crypto'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import mcpScript from '../../../resources/near-hardware-mcp.mjs?asset'
import { readFile } from 'node:fs/promises'
import nearAccountsSkill from '../../../resources/skills/near-accounts/SKILL.md?asset'
import nearAgentMarketSkill from '../../../resources/skills/near-agent-market/SKILL.md?asset'
import nearAiSkill from '../../../resources/skills/near-ai/SKILL.md?asset'
import nearChainSignaturesSkill from '../../../resources/skills/near-chain-signatures/SKILL.md?asset'
import nearContractsSkill from '../../../resources/skills/near-contracts/SKILL.md?asset'
import nearDevicesSkill from '../../../resources/skills/near-devices/SKILL.md?asset'
import nearIntentsSkill from '../../../resources/skills/near-intents/SKILL.md?asset'
import nearIronclawSkill from '../../../resources/skills/near-ironclaw/SKILL.md?asset'
import nearSubaccountsSkill from '../../../resources/skills/near-subaccounts/SKILL.md?asset'
import nearWebAppsSkill from '../../../resources/skills/near-web-apps/SKILL.md?asset'
import { broadcast } from '../broadcast'
import { NEAR_TOOLS } from '../near/agentTools'
import { getProject, updateChat, updateProjectBoard } from '../projects'
import { sshCommand } from './pi'
import { closePort, listDevices, readPort, writePort } from './serial'

export type ToolContext = { projectId: string; chatId: string }
export type ToolDefinition = {
  name: string
  description: string
  inputSchema: object
  run: (args: Record<string, unknown>, context: ToolContext) => Promise<unknown>
}

const token = randomBytes(24).toString('hex')
let bridgeUrl: string | undefined
const LINE_ENDINGS: Record<string, string> = { none: '', lf: '\n', crlf: '\r\n', cr: '\r' }
const capped = (text: string, max = 8000): string =>
  text.length > max ? `${text.slice(-max)}\n(showing the last ${max} characters)` : text

// NEAR Hardware's skills: playbooks agents read with read_skill before the work
const SKILLS: Record<string, { file: string; about: string }> = {
  'near-accounts': {
    file: nearAccountsSkill,
    about: 'use the user’s NEAR accounts: balances, transfers, contract calls, approvals'
  },
  'near-subaccounts': {
    file: nearSubaccountsSkill,
    about: 'create sub.alice.near accounts with full access or limited to one contract'
  },
  'near-contracts': {
    file: nearContractsSkill,
    about: 'write, build and deploy a Rust contract, then test it'
  },
  'near-web-apps': {
    file: nearWebAppsSkill,
    about: 'a website for a contract: NEAR Connect wallet login, view and change calls, publishing'
  },
  'near-chain-signatures': {
    file: nearChainSignaturesSkill,
    about:
      'control Bitcoin, Ethereum and other chains’ addresses from a NEAR account with the MPC signer'
  },
  'near-intents': {
    file: nearIntentsSkill,
    about: 'cross-chain swaps and payments with NEAR Intents and the 1Click API (mainnet only)'
  },
  'near-ai': {
    file: nearAiSkill,
    about:
      'NEAR AI Cloud: private, verifiable AI inference (OpenAI-compatible API) for projects and boards'
  },
  'near-ironclaw': {
    file: nearIronclawSkill,
    about:
      'IronClaw: run an always-on agent in a secure enclave that keeps credentials from the model'
  },
  'near-agent-market': {
    file: nearAgentMarketSkill,
    about:
      'Agent Market: agents and boards sell work or data and get paid in USDC, or hire other agents'
  },
  'near-devices': {
    file: nearDevicesSkill,
    about: 'NEAR on a board: read the chain, on-chip keys, limited board accounts, avatars'
  }
}

const TOOLS: ToolDefinition[] = [
  {
    name: 'read_skill',
    description: `Read one of NEAR Hardware’s skills: step-by-step playbooks for NEAR work. Read the matching skill before doing that kind of task. ${Object.entries(
      SKILLS
    )
      .map(([name, { about }]) => `${name}: ${about}.`)
      .join(' ')}`,
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', enum: Object.keys(SKILLS) } },
      required: ['name']
    },
    run: async ({ name }) => {
      const skill = SKILLS[String(name)]
      if (!skill)
        throw new Error(`No skill named ${String(name)}. Skills: ${Object.keys(SKILLS).join(', ')}`)
      return readFile(skill.file.replace('app.asar', 'app.asar.unpacked'), 'utf8')
    }
  },
  {
    name: 'set_chat_title',
    description:
      'Name this chat in the NEAR Hardware sidebar. Call it after the user’s first message with a short, specific 3-6 word title, and again if the topic clearly changes.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '3-6 words, no quotes or trailing period' }
      },
      required: ['title']
    },
    run: async ({ title }, { projectId, chatId }) => {
      const clean = String(title)
        .trim()
        .replace(/^["']|["'.]$/g, '')
        .slice(0, 80)
      if (!clean) throw new Error('Title is empty')
      await updateChat(projectId, chatId, { title: clean })
      broadcast('projects:changed')
      return `Chat renamed to “${clean}”.`
    }
  },
  {
    name: 'list_devices',
    description:
      'List USB serial devices plugged into this computer (port path, USB vendor/product id, manufacturer, serial number, and a chip-maker hint from the vendor id). Use it to find the user’s board.',
    inputSchema: { type: 'object', properties: {} },
    run: () => listDevices()
  },
  {
    name: 'get_board',
    description:
      'Get this project’s board profile: the exact board name the user entered, the serial port, and anything saved with save_board_profile. For a Raspberry Pi it includes `ssh.command`, the exact ssh command (with NEAR Hardware’s key, no password) to run commands on the Pi.',
    inputSchema: { type: 'object', properties: {} },
    run: async (_args, { projectId }) => {
      const board = (await getProject(projectId)).board
      if (!board?.ssh) return board ?? null
      // A Pi: give the exact command that reaches it with the app's key
      return { ...board, ssh: { ...board.ssh, command: sshCommand(board.ssh) } }
    }
  },
  {
    name: 'save_board_profile',
    description:
      'Save what you learned about the board to the project (shown in the app). Call it at the end of board onboarding, and whenever you learn the board’s display details.',
    inputSchema: {
      type: 'object',
      properties: {
        manufacturer: { type: 'string' },
        chip: { type: 'string', description: 'e.g. ESP32-S3R8' },
        docsUrl: { type: 'string', description: 'Official wiki or product page' },
        platformioBoard: {
          type: 'string',
          description: 'PlatformIO board id used in platformio.ini'
        },
        framework: { type: 'string', description: 'e.g. arduino or espidf' },
        port: { type: 'string', description: 'Serial port the board is on' },
        summary: { type: 'string', description: 'One or two sentences about the board' },
        screen: {
          type: ['object', 'null'],
          description:
            'The board’s display, drawn by the app’s screen preview; null if the board has no display. Sizes in panel pixels, in the orientation the firmware uses.',
          properties: {
            width: { type: 'number' },
            height: { type: 'number' },
            shape: {
              type: 'string',
              enum: ['rect', 'rounded', 'circle'],
              description: 'rounded = rectangle with rounded corners, like most watch panels'
            },
            cornerRadius: {
              type: 'number',
              description: 'Corner radius in panel pixels, for shape "rounded"'
            },
            diagonal: { type: 'number', description: 'Diagonal in inches, e.g. 2.06' },
            panel: { type: 'string', description: 'e.g. AMOLED, IPS LCD, OLED, e-paper' },
            controller: { type: 'string', description: 'Display driver IC, e.g. CO5300' }
          },
          required: ['width', 'height', 'shape']
        }
      }
    },
    run: async (args, { projectId }) => {
      const board = await updateProjectBoard(projectId, args)
      broadcast('projects:changed')
      return board
    }
  },
  {
    name: 'serial_read',
    description:
      'Read a board’s serial output for a few seconds (opens the port if needed and keeps it open for the app’s serial monitor). Use after flashing to verify the firmware runs.',
    inputSchema: {
      type: 'object',
      properties: {
        port: { type: 'string', description: 'Defaults to the project board’s port' },
        baudRate: { type: 'number', description: 'Defaults to 115200' },
        durationMs: { type: 'number', description: 'How long to listen, 500-20000 (default 3000)' }
      }
    },
    run: async (args, { projectId }) => {
      const port = String(args.port ?? (await getProject(projectId)).board?.port ?? '')
      if (!port) throw new Error('No port given and the project has no board port yet')
      const duration = Math.min(20000, Math.max(500, Number(args.durationMs ?? 3000)))
      const output = await readPort(port, Number(args.baudRate ?? 115200), duration)
      return output ? capped(output) : `(no output from ${port} in ${duration} ms)`
    }
  },
  {
    name: 'serial_write',
    description: 'Send text to a board over serial.',
    inputSchema: {
      type: 'object',
      properties: {
        port: { type: 'string' },
        data: { type: 'string' },
        lineEnding: {
          type: 'string',
          enum: ['none', 'lf', 'crlf', 'cr'],
          description: 'Default lf'
        }
      },
      required: ['data']
    },
    run: async (args, { projectId }) => {
      const port = String(args.port ?? (await getProject(projectId)).board?.port ?? '')
      await writePort(
        port,
        String(args.data) + (LINE_ENDINGS[String(args.lineEnding ?? 'lf')] ?? '\n')
      )
      return `Sent to ${port}.`
    }
  },
  {
    name: 'serial_close',
    description:
      'Close a serial port held by the app (including its serial monitor). Call this before uploading firmware, or the upload fails with “port busy”.',
    inputSchema: { type: 'object', properties: { port: { type: 'string' } } },
    run: async (args, { projectId }) => {
      const port = String(args.port ?? (await getProject(projectId)).board?.port ?? '')
      closePort(port)
      return `Closed ${port}.`
    }
  },
  ...NEAR_TOOLS
]

export function startBridge(): Promise<void> {
  const server = createServer((request, response) => {
    const reply = (status: number, body: unknown): void => {
      response.writeHead(status, { 'content-type': 'application/json' })
      response.end(JSON.stringify(body))
    }
    if (request.headers.authorization !== `Bearer ${token}`)
      return reply(401, { error: 'unauthorized' })
    if (request.method === 'GET' && request.url === '/tools') {
      return reply(
        200,
        TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }))
      )
    }
    if (request.method === 'POST' && request.url === '/call') {
      let body = ''
      request.on('data', (chunk) => (body += chunk))
      request.on('end', async () => {
        try {
          const { name, args, projectId, chatId } = JSON.parse(body)
          const tool = TOOLS.find((t) => t.name === name)
          if (!tool) return reply(404, { error: `Unknown tool ${name}` })
          const result = await tool.run(args ?? {}, { projectId, chatId })
          reply(200, {
            result: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
          })
        } catch (error) {
          reply(200, { error: (error as Error).message })
        }
      })
      return
    }
    reply(404, { error: 'not found' })
  })
  return new Promise((resolve) =>
    server.listen(0, '127.0.0.1', () => {
      bridgeUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
      resolve()
    })
  )
}

// How an agent CLI should launch the MCP server for one chat
export function mcpServerLaunch(
  projectId: string,
  chatId: string
): {
  command: string
  args: string[]
  env: Record<string, string>
} {
  return {
    command: process.execPath,
    args: [mcpScript.replace('app.asar', 'app.asar.unpacked')],
    env: {
      // Runs Electron's binary as plain Node
      ELECTRON_RUN_AS_NODE: '1',
      NEAR_HARDWARE_BRIDGE: bridgeUrl ?? '',
      NEAR_HARDWARE_TOKEN: token,
      NEAR_HARDWARE_PROJECT: projectId,
      NEAR_HARDWARE_CHAT: chatId,
      NEAR_HARDWARE_VERSION: app.getVersion()
    }
  }
}
