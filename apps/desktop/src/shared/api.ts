import type { ChatEventMessage, ChatState, PermissionDecision, SendMessageInput } from './chat'
import type {
  AuthStatus,
  ConnectEnvironmentResult,
  ConnectedEnvironment,
  EnvironmentId,
  EnvironmentStatus
} from './environments'
import type { DeviceInfo, PlatformioStatus } from './hardware'
import type {
  ImportLookup,
  NameCheck,
  NearAccounts,
  NearBalance,
  NearNetwork,
  NearResult,
  NearSecret
} from './near'
import type { ContractToolsStatus, PrepareFolderResult, SetupState } from './setup'
import type {
  BoardProfile,
  Chat,
  CreateProjectResult,
  FileContent,
  FileEntry,
  FilesChangedEvent,
  MenuItemSpec,
  PiConnectResult,
  PiStatus,
  Project
} from './projects'

// Sent by the app menu (File → Save, Close Tab, Help → Setup Guide)
export type MenuCommand = 'save' | 'close-tab' | 'setup-guide'

// What the preload script exposes to the renderer as `window.api`
export interface NearHardwareApi {
  environments: {
    detectAll(): Promise<EnvironmentStatus[]>
    detect(id: EnvironmentId): Promise<EnvironmentStatus>
    listConnected(): Promise<ConnectedEnvironment[]>
    // Re-checks the agent and only connects it if it's installed
    connect(id: EnvironmentId): Promise<ConnectEnvironmentResult>
    disconnect(id: EnvironmentId): Promise<void>
    authStatus(id: EnvironmentId): Promise<AuthStatus>
  }
  // The first-run setup guide
  setup: {
    state(): Promise<SetupState>
    complete(): Promise<void>
    // Opens Apple's installer for the Command Line Tools
    installDevTools(): Promise<void>
    // Relaunches from /Applications; false if it wasn't moved
    moveToApplications(): Promise<boolean>
    // Creates the folder and makes it the default for new projects
    prepareProjectsFolder(path: string): Promise<PrepareFolderResult>
    openPrivacySettings(): Promise<void>
  }
  // NEAR accounts; private keys stay in the main process
  near: {
    list(): Promise<NearAccounts>
    // Whether <name>.testnet can be created
    checkName(name: string): Promise<NameCheck>
    // Creates <name>.testnet with the testnet faucet and a new recovery phrase
    createTestnet(name: string): Promise<NearResult>
    // The accounts a recovery phrase or private key controls, on both networks
    lookupImport(secret: string): Promise<ImportLookup>
    import(input: { secret: string; network: NearNetwork; accountId: string }): Promise<NearResult>
    setPrimary(network: NearNetwork, accountId: string): Promise<void>
    // Agents' testnet transactions go through without asking (mainnet always asks)
    setAutoApproveTestnet(on: boolean): Promise<void>
    // Picks a different pixel avatar for the account
    shuffleAvatar(network: NearNetwork, accountId: string): Promise<void>
    // Asks first; false if the user cancelled
    remove(network: NearNetwork, accountId: string): Promise<boolean>
    // After Touch ID; null if the user cancelled
    reveal(network: NearNetwork, accountId: string): Promise<NearSecret | null>
    // null when NEAR couldn't be reached
    balance(network: NearNetwork, accountId: string): Promise<NearBalance | null>
    onChange(listener: () => void): () => void
  }
  projects: {
    list(): Promise<Project[]>
    defaultLocation(): Promise<string>
    // Native folder picker; null when cancelled
    chooseLocation(current?: string): Promise<string | null>
    // Creates <location>/<name> and adds it as a project
    create(input: { name: string; location: string }): Promise<CreateProjectResult>
    // Native folder picker for an existing folder; null when cancelled
    openExisting(): Promise<CreateProjectResult | null>
    // Removes the project from NEAR Hardware; its folder stays on disk
    remove(projectId: string): Promise<void>
    reveal(projectId: string): Promise<void>
    // Only connected environments can be used
    createChat(projectId: string, environmentId: EnvironmentId): Promise<Chat>
    deleteChat(projectId: string, chatId: string): Promise<void>
    // Merges into the saved board; replace starts a fresh profile for a different board
    setBoard(
      projectId: string,
      board: Partial<BoardProfile>,
      replace?: boolean
    ): Promise<BoardProfile | undefined>
    // Fires when the main process changes projects, e.g. naming a chat
    onChange(listener: () => void): () => void
  }
  chat: {
    // Returns the transcript so far and starts the agent's CLI in the background
    open(projectId: string, chatId: string): Promise<ChatState>
    send(projectId: string, chatId: string, input: SendMessageInput): Promise<void>
    interrupt(chatId: string): Promise<void>
    setModel(chatId: string, model: string): Promise<void>
    setPermissionMode(chatId: string, mode: string): Promise<void>
    // Warns before YOLO mode; dontAskAgain when the user ticked the box
    confirmYolo(agentName: string): Promise<{ confirmed: boolean; dontAskAgain: boolean }>
    respondToPermission(chatId: string, itemId: string, decision: PermissionDecision): Promise<void>
    onEvent(listener: (message: ChatEventMessage) => void): () => void
  }
  files: {
    // optional: a missing folder lists as empty instead of failing
    list(projectId: string, dir: string, options?: { optional?: boolean }): Promise<FileEntry[]>
    read(projectId: string, path: string): Promise<FileContent>
    write(projectId: string, path: string, text: string): Promise<void>
    // Asks whether to save an edited file before its tab closes
    confirmClose(name: string): Promise<'save' | 'discard' | 'cancel'>
    // Opens in the system's default app
    open(projectId: string, path: string): Promise<void>
    reveal(projectId: string, path: string): Promise<void>
    // Watches one project at a time; null stops watching
    watch(projectId: string | null): Promise<void>
    onChange(listener: (event: FilesChangedEvent) => void): () => void
  }
  devices: {
    // Also starts the background watcher that fires onChange
    list(): Promise<DeviceInfo[]>
    onChange(listener: (devices: DeviceInfo[]) => void): () => void
  }
  serial: {
    open(path: string, baudRate: number): Promise<void>
    close(path: string): Promise<void>
    write(path: string, data: string): Promise<void>
    onData(listener: (event: { path: string; data: string }) => void): () => void
    onOpened(listener: (event: { path: string; baudRate: number }) => void): () => void
    onClosed(listener: (event: { path: string }) => void): () => void
    onError(listener: (event: { path: string; message: string }) => void): () => void
  }
  terminal: {
    // projectId null runs `command` in the home folder instead of a project shell
    create(projectId: string | null, cols: number, rows: number, command?: string): Promise<string>
    write(id: string, data: string): Promise<void>
    resize(id: string, cols: number, rows: number): Promise<void>
    kill(id: string): Promise<void>
    onData(listener: (event: { id: string; data: string }) => void): () => void
    onExit(listener: (event: { id: string; exitCode: number }) => void): () => void
  }
  // Raspberry Pi over SSH: connect installs the app's key with the password (not stored)
  pi: {
    connect(
      projectId: string,
      input: { target: string; password: string }
    ): Promise<PiConnectResult>
    status(projectId: string): Promise<PiStatus>
  }
  // Rust, cargo-near and NEAR CLI for smart contracts; install runs in a terminal
  contractTools: {
    status(): Promise<ContractToolsStatus>
  }
  platformio: {
    status(): Promise<PlatformioStatus>
    install(): Promise<PlatformioStatus>
    onLog(listener: (line: string) => void): () => void
  }
  // The board's screen preview in its own floating window
  screen: {
    popOut(projectId: string): Promise<void>
    dock(projectId: string): Promise<void>
    // Projects whose screen is floating right now
    floating(): Promise<string[]>
    onFloatingChange(listener: (projectIds: string[]) => void): () => void
    // Called by a floating window to match the device's width / height
    fit(aspect: number): Promise<void>
  }
  // Native context menu; resolves to the chosen item's id, or null if dismissed
  showMenu(items: MenuItemSpec[]): Promise<string | null>
  onMenuCommand(listener: (command: MenuCommand) => void): () => void
  // "An agent needs you": bounce the dock if the app is in the background
  requestAttention(): Promise<void>
  // The main process asks the window to play its attention chime (e.g. a NEAR approval)
  onChime(listener: () => void): () => void
}
