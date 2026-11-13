// In dev, macOS labels the dock icon and app switcher with the running bundle's
// folder name ("Electron.app"). Make a renamed copy, "<productName>.app", next to
// it; electron.vite.config.ts launches that copy in dev. The original stays
// untouched so Electron's installer still sees a valid install.
// Packaged apps get their name from electron-builder instead.
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

if (process.platform !== 'darwin') process.exit(0)

const require = createRequire(import.meta.url)
const pkg = JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../package.json'), 'utf8'))
const name = pkg.productName

// require('electron') returns the path to .../dist/Electron.app/Contents/MacOS/Electron
const original = resolve(require('electron'), '../../..')
const branded = resolve(original, '..', `${name}.app`)
const plistValue = (bundle, key) =>
  execFileSync('plutil', ['-extract', key, 'raw', `${bundle}/Contents/Info.plist`]).toString().trim()

// Up to date unless Electron was upgraded since the copy was made
if (
  existsSync(branded) &&
  plistValue(branded, 'CFBundleVersion') === plistValue(original, 'CFBundleVersion')
) {
  process.exit(0)
}

rmSync(branded, { recursive: true, force: true })
try {
  // Copy-on-write clone: instant and takes no extra space on APFS
  execFileSync('cp', ['-cR', original, branded])
} catch {
  execFileSync('cp', ['-R', original, branded])
}
for (const key of ['CFBundleName', 'CFBundleDisplayName']) {
  execFileSync('plutil', ['-replace', key, '-string', name, `${branded}/Contents/Info.plist`])
}
// Editing Info.plist invalidates the bundle's ad-hoc signature, so re-sign it
execFileSync('codesign', ['--force', '--sign', '-', branded])
// Make Launch Services pick up the new name instead of a cached one
execFileSync(
  '/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister',
  ['-f', branded]
)
console.log(`Created dev app bundle "${name}.app"`)
