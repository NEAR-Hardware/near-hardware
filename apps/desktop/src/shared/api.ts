import type { ChatEventMessage, ChatState, PermissionDecision, SendMessageInput } from './chat'
import type {
  ConnectEnvironmentResult,
  ConnectedEnvironment,
  EnvironmentId,
  EnvironmentStatus
} from './environments'
import type { DeviceInfo, PlatformioStatus } from './hardware'
import type {
  BoardProfile,
  Chat,
  CreateProjectResult,
  FileEntry,
  FilesChangedEvent,
  MenuItemSpec,
  Project
} from './projects'

// What the preload script exposes to the renderer as `window.api`
export interface NearHardwareApi {
  environments: {
    detectAll(): Promise<EnvironmentStatus[]>
    detect(id: EnvironmentId): Promise<EnvironmentStatus>
    listConnected(): Promise<ConnectedEnvironment[]>
    // Re-checks the agent and only connects it if it's installed
    connect(id: EnvironmentId): Promise<ConnectEnvironmentResult>
    disconnect(id: EnvironmentId): Promise<void>
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
    setBoard(projectId: string, board: Partial<BoardProfile>): Promise<BoardProfile | undefined>
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
    respondToPermission(chatId: string, itemId: string, decision: PermissionDecision): Promise<void>
    onEvent(listener: (message: ChatEventMessage) => void): () => void
  }
  files: {
    list(projectId: string, dir: string): Promise<FileEntry[]>
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
    create(projectId: string, cols: number, rows: number): Promise<string>
    write(id: string, data: string): Promise<void>
    resize(id: string, cols: number, rows: number): Promise<void>
    kill(id: string): Promise<void>
    onData(listener: (event: { id: string; data: string }) => void): () => void
    onExit(listener: (event: { id: string; exitCode: number }) => void): () => void
  }
  platformio: {
    status(): Promise<PlatformioStatus>
    install(): Promise<PlatformioStatus>
    onLog(listener: (line: string) => void): () => void
  }
  // Native context menu; resolves to the chosen item's id, or null if dismissed
  showMenu(items: MenuItemSpec[]): Promise<string | null>
}
