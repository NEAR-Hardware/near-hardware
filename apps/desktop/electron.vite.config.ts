import { existsSync } from 'fs'
import { createRequire } from 'module'
import { dirname, resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { productName } from './package.json'

// On macOS, launch the renamed Electron copy made by scripts/brand-dev-electron.mjs
// so the dock says the product name in dev instead of "Electron"
const brandedElectron = resolve(
  dirname(createRequire(import.meta.url).resolve('electron')),
  'dist',
  `${productName}.app/Contents/MacOS/Electron`
)
if (process.platform === 'darwin' && !process.env.ELECTRON_EXEC_PATH && existsSync(brandedElectron)) {
  process.env.ELECTRON_EXEC_PATH = brandedElectron
}

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
