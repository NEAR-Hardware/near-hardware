// Packages the macOS app. With a "Developer ID Application" certificate in the
// keychain electron-builder signs with it, and notarizes when APPLE_ID,
// APPLE_APP_SPECIFIC_PASSWORD and APPLE_TEAM_ID are set; then the app opens with
// no Gatekeeper warning. Without one the app is ad-hoc signed: it runs when
// installed with install.sh, but a browser-downloaded DMG gets Gatekeeper's warning.
import { execFileSync } from 'node:child_process'

const identities = execFileSync('security', ['find-identity', '-v', '-p', 'codesigning']).toString()
const developerId = identities.includes('Developer ID Application')
if (!developerId) console.log('No Developer ID certificate found: ad-hoc signing, no notarization')

execFileSync(
  'electron-builder',
  ['--mac', '--publish', 'never', ...(developerId ? [] : ['-c.mac.identity=-'])],
  { stdio: 'inherit' }
)
