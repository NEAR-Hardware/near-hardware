// Asks the user before an agent's transaction is signed. A native sheet on the
// main window, so a page can't fake or click it. Mainnet always asks; testnet
// asks until the user ticks "without asking"; keys limited to one contract
// never ask, since NEAR itself holds them to what the user approved.
import { app, BrowserWindow, dialog } from 'electron'
import { NETWORK_LABEL, type NearNetwork } from '../../shared/near'
import { listAccounts, setAutoApproveTestnet } from './accounts'

export type ApprovalRequest = {
  network: NearNetwork
  // What the agent wants, e.g. "send 0.5 NEAR to bob.testnet"
  action: string
  details: [label: string, value: string][]
  agent: string
  chat: string
  // Signed with a function-call key the user already limited
  limited?: boolean
}

// The app's main window (floating screen windows load #/screen)
const mainWindow = (): BrowserWindow | undefined =>
  BrowserWindow.getAllWindows().find(
    (w) => !w.isDestroyed() && !w.webContents.getURL().includes('#/screen')
  )

let queue: Promise<unknown> = Promise.resolve()

export async function requestApproval(request: ApprovalRequest): Promise<boolean> {
  if (request.limited) return true
  if (request.network === 'testnet' && (await listAccounts()).autoApproveTestnet) return true

  // One question at a time
  const run = queue.then(async () => {
    const window = mainWindow()
    if (!window) return false
    // Get the user's attention if they're in another app
    if (!window.isFocused()) app.dock?.bounce('critical')
    const mainnet = request.network === 'mainnet'
    const { response, checkboxChecked } = await dialog.showMessageBox(window, {
      type: mainnet ? 'warning' : 'question',
      buttons: ['Approve', 'Deny'],
      // Enter denies: approving always takes a click, even if the user was
      // typing when the prompt appeared
      defaultId: 1,
      cancelId: 1,
      message: `${request.agent} wants to ${request.action}`,
      detail: [
        `Network: ${NETWORK_LABEL[request.network]}${mainnet ? ' (real NEAR)' : ' (test NEAR)'}`,
        ...request.details.map(([label, value]) => `${label}: ${value}`),
        '',
        `Asked in the chat “${request.chat}”.`
      ].join('\n'),
      checkboxLabel: mainnet ? undefined : 'Approve testnet transactions without asking',
      checkboxChecked: false
    })
    if (response === 0 && checkboxChecked) await setAutoApproveTestnet(true)
    return response === 0
  })
  queue = run.catch(() => undefined)
  return run
}
