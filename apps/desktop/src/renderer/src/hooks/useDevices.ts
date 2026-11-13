import { useEffect, useState } from 'react'
import type { DeviceInfo } from '../../../shared/hardware'

// USB serial devices, kept live by the main process's device watcher
export function useDevices(): DeviceInfo[] {
  const [devices, setDevices] = useState<DeviceInfo[]>([])
  useEffect(() => {
    window.api.devices.list().then(setDevices)
    return window.api.devices.onChange(setDevices)
  }, [])
  return devices
}

export const describeDevice = (device: DeviceInfo): string =>
  device.chipHint ?? device.manufacturer ?? 'USB serial device'
