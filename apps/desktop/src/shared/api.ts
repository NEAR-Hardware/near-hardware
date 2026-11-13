import type {
  EnvironmentId,
  EnvironmentStatus,
  SelectEnvironmentResult,
  SelectedEnvironment
} from './environments'

// What the preload script exposes to the renderer as `window.api`
export interface NearHardwareApi {
  environments: {
    detectAll(): Promise<EnvironmentStatus[]>
    detect(id: EnvironmentId): Promise<EnvironmentStatus>
    getSelected(): Promise<SelectedEnvironment | null>
    // Re-checks the agent and only selects it if it's installed
    select(id: EnvironmentId): Promise<SelectEnvironmentResult>
    clear(): Promise<void>
  }
}
