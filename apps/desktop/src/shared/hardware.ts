export type DeviceInfo = {
  path: string
  manufacturer?: string
  vendorId?: string
  productId?: string
  serialNumber?: string
  // Best guess from the USB vendor id, e.g. "Espressif (native USB)"
  chipHint?: string
}

export type PlatformioStatus = {
  installed: boolean
  version?: string
  path?: string
  error?: string
}

export const BAUD_RATES = [9600, 19200, 38400, 57600, 74880, 115200, 230400, 460800, 921600]
