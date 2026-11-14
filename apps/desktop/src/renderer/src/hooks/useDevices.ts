import { useEffect, useState } from 'react'
import type { DeviceInfo } from '../../../shared/hardware'
import type { BoardProfile } from '../../../shared/projects'

// USB serial devices, kept live by the main process's device watcher
export function useDevices(): DeviceInfo[] {
  const [devices, setDevices] = useState<DeviceInfo[]>([])
  useEffect(() => {
    window.api.devices.list().then(setDevices)
    return window.api.devices.onChange(setDevices)
  }, [])
  return devices
}

// The plugged-in device that is this board: same serial number if we know it,
// else the saved port, else the same USB vendor and product id
export function findBoardDevice(
  board: BoardProfile | undefined,
  devices: DeviceInfo[]
): DeviceInfo | undefined {
  if (!board?.name) return undefined
  if (board.serialNumber) return devices.find((d) => d.serialNumber === board.serialNumber)
  return (
    devices.find((d) => d.path === board.port) ??
    (board.vendorId && board.productId
      ? devices.find((d) => d.vendorId === board.vendorId && d.productId === board.productId)
      : undefined)
  )
}

export const describeDevice = (device: DeviceInfo): string =>
  device.chipHint ?? device.manufacturer ?? 'USB serial device'
