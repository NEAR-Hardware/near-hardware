import { ElectronAPI } from '@electron-toolkit/preload'
import type { NearHardwareApi } from '../shared/api'

declare global {
  interface Window {
    electron: ElectronAPI
    api: NearHardwareApi
  }
}
