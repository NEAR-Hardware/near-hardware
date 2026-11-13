// Owns every open serial port, so the serial monitor panel and agent tools
// share one connection instead of fighting over the device
import { SerialPort } from 'serialport'

export type DeviceInfo = {
  path: string
  manufacturer?: string
  vendorId?: string
  productId?: string
  serialNumber?: string
  // Best guess from the USB vendor id, e.g. "Espressif (native USB)"
  chipHint?: string
}

// Common USB-serial vendors on dev boards
const VENDORS: Record<string, string> = {
  '303a': 'Espressif (native USB: ESP32-S2/S3/C3/C6/H2)',
  '10c4': 'Silicon Labs CP210x USB-UART bridge',
  '1a86': 'WCH CH340/CH343 USB-UART bridge',
  '0403': 'FTDI USB-UART bridge',
  '2e8a': 'Raspberry Pi (RP2040/RP2350)',
  '2341': 'Arduino',
  '239a': 'Adafruit',
  '1915': 'Nordic Semiconductor',
  '0483': 'STMicroelectronics'
}

const MAX_BUFFER = 64 * 1024

type OpenPort = {
  port: SerialPort
  baudRate: number
  buffer: string
  listeners: Set<(data: string) => void>
}

const ports = new Map<string, OpenPort>()
let onEvent: (channel: string, payload: unknown) => void = () => undefined

// The window that receives serial data and close events
export function setSerialEventSink(sink: (channel: string, payload: unknown) => void): void {
  onEvent = sink
}

export async function listDevices(): Promise<DeviceInfo[]> {
  const list = await SerialPort.list()
  return (
    list
      // USB devices only; skips Bluetooth and debug pseudo-ports
      .filter((p) => p.vendorId)
      .map((p) => ({
        path: p.path,
        manufacturer: p.manufacturer,
        vendorId: p.vendorId?.toLowerCase(),
        productId: p.productId?.toLowerCase(),
        serialNumber: p.serialNumber,
        chipHint: VENDORS[p.vendorId?.toLowerCase() ?? '']
      }))
  )
}

export function openPort(path: string, baudRate: number): Promise<void> {
  const existing = ports.get(path)
  if (existing && existing.baudRate === baudRate) return Promise.resolve()
  if (existing) closePort(path)
  return new Promise((resolve, reject) => {
    const port = new SerialPort({ path, baudRate, autoOpen: false })
    const entry: OpenPort = { port, baudRate, buffer: '', listeners: new Set() }
    port.open((error) => {
      if (error) return reject(error)
      ports.set(path, entry)
      onEvent('serial:opened', { path, baudRate })
      resolve()
    })
    port.on('data', (chunk: Buffer) => {
      const text = chunk.toString('utf8')
      entry.buffer = (entry.buffer + text).slice(-MAX_BUFFER)
      entry.listeners.forEach((listener) => listener(text))
      onEvent('serial:data', { path, data: text })
    })
    port.on('close', () => {
      if (ports.get(path) === entry) ports.delete(path)
      onEvent('serial:closed', { path })
    })
    port.on('error', (error) => onEvent('serial:error', { path, message: error.message }))
  })
}

export function closePort(path: string): void {
  const entry = ports.get(path)
  if (!entry) return
  ports.delete(path)
  if (entry.port.isOpen) entry.port.close()
}

export function closeAllPorts(): void {
  for (const path of [...ports.keys()]) closePort(path)
}

export function isOpen(path: string): { baudRate: number } | undefined {
  const entry = ports.get(path)
  return entry && { baudRate: entry.baudRate }
}

export async function writePort(path: string, data: string): Promise<void> {
  const entry = ports.get(path)
  if (!entry) throw new Error(`${path} isn’t open`)
  await new Promise<void>((resolve, reject) =>
    entry.port.write(data, (error) => (error ? reject(error) : entry.port.drain(() => resolve())))
  )
}

// Collects output for a while; opens the port if needed and leaves it open
export async function readPort(
  path: string,
  baudRate: number,
  durationMs: number
): Promise<string> {
  await openPort(path, baudRate)
  const entry = ports.get(path)!
  let collected = ''
  const listener = (data: string): void => {
    collected += data
  }
  entry.listeners.add(listener)
  await new Promise((resolve) => setTimeout(resolve, durationMs))
  entry.listeners.delete(listener)
  return collected
}
