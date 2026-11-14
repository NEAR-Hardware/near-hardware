#!/bin/bash
# Installs NEAR Hardware on a Mac:
#
#   curl -fsSL https://raw.githubusercontent.com/NEAR-Hardware/near-hardware/main/install.sh | bash
#
# Downloads the latest release with curl and puts it in Applications. Files
# downloaded by curl aren't quarantined, so macOS opens the app without the
# "Apple could not verify…" warning a browser download gets until the build is
# notarized. The app's setup guide then installs PlatformIO and helps connect an agent.
set -euo pipefail

APP="NEAR Hardware.app"
URL="${NEAR_HARDWARE_URL:-https://github.com/NEAR-Hardware/near-hardware/releases/latest/download/NEAR-Hardware-mac-arm64.zip}"

if [ "$(uname -s)" != Darwin ]; then
  echo "NEAR Hardware supports macOS only for now." >&2
  exit 1
fi
if [ "$(uname -m)" != arm64 ]; then
  echo "NEAR Hardware needs a Mac with Apple silicon (M1 or later) for now." >&2
  exit 1
fi

# /Applications when it's writable, otherwise ~/Applications
DEST="${NEAR_HARDWARE_INSTALL_DIR:-/Applications}"
if [ ! -w "$DEST" ]; then
  DEST="$HOME/Applications"
  mkdir -p "$DEST"
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Downloading NEAR Hardware…"
curl -fL --progress-bar "$URL" -o "$TMP/NEAR-Hardware.zip"
ditto -x -k "$TMP/NEAR-Hardware.zip" "$TMP"
if [ ! -d "$TMP/$APP" ]; then
  echo "The download didn't contain $APP." >&2
  exit 1
fi

# Replace a running copy
if pgrep -xq "NEAR Hardware"; then
  echo "Quitting NEAR Hardware…"
  osascript -e 'quit app "NEAR Hardware"' >/dev/null 2>&1 || true
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    pgrep -xq "NEAR Hardware" || break
    sleep 1
  done
fi

rm -rf "${DEST:?}/$APP"
mv "$TMP/$APP" "$DEST/"
echo "Installed $DEST/$APP"

if [ -z "${NEAR_HARDWARE_NO_OPEN:-}" ]; then
  open "$DEST/$APP"
fi
