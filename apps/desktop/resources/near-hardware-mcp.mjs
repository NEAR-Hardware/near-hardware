// NEAR Hardware MCP server (stdio). Each agent CLI launches one per chat; it
// forwards tool calls to the app's local bridge. No dependencies on purpose:
// Electron runs it as plain Node (ELECTRON_RUN_AS_NODE=1).
import { createInterface } from 'node:readline'

const { NEAR_HARDWARE_BRIDGE: bridge, NEAR_HARDWARE_TOKEN: token } = process.env
const context = { projectId: process.env.NEAR_HARDWARE_PROJECT, chatId: process.env.NEAR_HARDWARE_CHAT }
const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' }

const send = (message) => process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', ...message })}\n`)

async function handle(request) {
  switch (request.method) {
    case 'initialize':
      return {
        protocolVersion: request.params?.protocolVersion ?? '2025-06-18',
        capabilities: { tools: {} },
        serverInfo: { name: 'near-hardware', version: process.env.NEAR_HARDWARE_VERSION ?? '0.1.0' }
      }
    case 'ping':
      return {}
    case 'tools/list': {
      const response = await fetch(`${bridge}/tools`, { headers })
      return { tools: await response.json() }
    }
    case 'tools/call': {
      const response = await fetch(`${bridge}/call`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: request.params.name, args: request.params.arguments, ...context })
      })
      const { result, error } = await response.json()
      return error
        ? { content: [{ type: 'text', text: error }], isError: true }
        : { content: [{ type: 'text', text: result }] }
    }
    default:
      throw Object.assign(new Error(`Method not found: ${request.method}`), { code: -32601 })
  }
}

createInterface({ input: process.stdin }).on('line', async (line) => {
  let request
  try {
    request = JSON.parse(line)
  } catch {
    return
  }
  // Notifications (no id) need no reply
  if (request.id === undefined) return
  try {
    send({ id: request.id, result: await handle(request) })
  } catch (error) {
    send({ id: request.id, error: { code: error.code ?? -32603, message: error.message } })
  }
})
