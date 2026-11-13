import type {
  ConnectEnvironmentResult,
  ConnectedEnvironment,
  EnvironmentId,
  EnvironmentStatus
} from './environments'

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
}
