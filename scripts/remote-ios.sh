
#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Flixer - Remote iOS Development
# =============================================================================

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

# Remote macOS environment
MAC_HOST="${MAC_HOST:-ashley@ashleys-macbook-pro}"
MAC_DIR="${MAC_DIR:-Developer/flixer-web}"

# Device configuration
# Leave IOS_DEVICE_ID empty to enable interactive selection.
IOS_DEVICE_ID="${IOS_DEVICE_ID:-}"
ALLOW_SELECTION_UI="${ALLOW_SELECTION_UI:-1}"

# Physical iPhone 14 Pro Max:
# IOS_DEVICE_ID="00008120-001E381A1403C01E"

# Capacitor live reload
LIVE_URL="${CAPACITOR_LIVE_URL:-https://web--my-flixer--realashleybailey-coder.gitcloud.org}"

# Remote runner filename
REMOTE_RUNNER=".flixer-remote-ios-runner.sh"

# -----------------------------------------------------------------------------
# Cleanup
# -----------------------------------------------------------------------------

RUNNER="$(mktemp)"

cleanup() {
  rm -f "$RUNNER"
}

trap cleanup EXIT

# -----------------------------------------------------------------------------
# Startup Information
# -----------------------------------------------------------------------------

echo "======================================"
echo " Flixer Remote iOS Development"
echo "======================================"
echo "Mac:         $MAC_HOST"
echo "Directory:   $MAC_DIR"
echo "Device:      ${IOS_DEVICE_ID:-Interactive selection}"
echo "Live Reload: $LIVE_URL"
echo ""

# -----------------------------------------------------------------------------
# Verify Local Dependencies
# -----------------------------------------------------------------------------

echo "==> Checking local dependencies..."

for cmd in ssh rsync; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERROR: Missing required command: $cmd"
    exit 1
  fi
done

# -----------------------------------------------------------------------------
# Synchronize Project
# -----------------------------------------------------------------------------

echo "==> Syncing project to Mac..."

rsync -az --delete \
  --exclude=".git/" \
  --exclude="node_modules/" \
  --exclude="ios/Pods/" \
  --exclude="ios/build/" \
  --exclude="ios/DerivedData/" \
  --exclude="dist/" \
  --exclude="$REMOTE_RUNNER" \
  ./ "$MAC_HOST:$MAC_DIR/"

echo "==> Project synchronization complete."

# =============================================================================
# Create Remote Build Runner
# =============================================================================

cat > "$RUNNER" <<'REMOTE'
#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Flixer - Remote macOS iOS Build Runner
# =============================================================================

# -----------------------------------------------------------------------------
# Remote Configuration
# -----------------------------------------------------------------------------

MAC_DIR="$1"
LIVE_URL="$2"
IOS_DEVICE_ID="$3"
ALLOW_SELECTION_UI="$4"

cd "$HOME/$MAC_DIR"

# Remove temporary runner when finished.
cleanup() {
  rm -f -- "$HOME/$MAC_DIR/.flixer-remote-ios-runner.sh"
}
trap cleanup EXIT

echo ""
echo "======================================"
echo " Flixer macOS Build Environment"
echo "======================================"

# -----------------------------------------------------------------------------
# Environment Setup
# -----------------------------------------------------------------------------

echo "==> Configuring Node.js environment..."

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
export NVM_DIR="$HOME/.nvm"

# Load NVM
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  source "$NVM_DIR/nvm.sh"
fi

# Configure Xcode
export DEVELOPER_DIR="/Applications/Xcode.app/Contents/Developer"

# Capacitor Live Reload
export CAPACITOR_LIVE_URL="$LIVE_URL"

# -----------------------------------------------------------------------------
# Verify Developer Tools
# -----------------------------------------------------------------------------

echo "==> Checking developer tools..."

for cmd in node npm npx xcrun xcodebuild security; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERROR: Missing required command: $cmd"
    exit 1
  fi
done

echo ""
echo "Node.js: $(node --version)"
echo "npm:     $(npm --version)"
echo "Xcode:   $(xcodebuild -version | head -n 1)"
echo ""

# -----------------------------------------------------------------------------
# Apple Code Signing
# -----------------------------------------------------------------------------

echo "==> Configuring Apple code signing..."

KEYCHAIN="$HOME/Library/Keychains/login.keychain-db"

if [[ ! -f "$KEYCHAIN" ]]; then
  echo "ERROR: Login Keychain not found."
  exit 1
fi

# Unlock the login Keychain when it is locked.
if ! security show-keychain-info "$KEYCHAIN" \
  >/dev/null 2>&1; then

  echo "==> Unlocking macOS login Keychain..."
  security unlock-keychain "$KEYCHAIN"

fi

echo "==> Available signing identities..."

security find-identity -v -p codesigning "$KEYCHAIN"

# -----------------------------------------------------------------------------
# iOS Device Discovery
# -----------------------------------------------------------------------------

echo ""
echo "==> Checking connected iOS devices..."

xcrun devicectl list devices

# -----------------------------------------------------------------------------
# Install Dependencies
# -----------------------------------------------------------------------------

echo ""
echo "==> Installing npm dependencies..."

npm ci

# -----------------------------------------------------------------------------
# Capacitor Live Reload
# -----------------------------------------------------------------------------

echo ""
echo "==> Configuring Capacitor live reload..."

echo "Live Reload URL: $CAPACITOR_LIVE_URL"

# The project's capacitor.config.ts must read
# process.env.CAPACITOR_LIVE_URL and configure server.url.

# -----------------------------------------------------------------------------
# Build Web Application
# -----------------------------------------------------------------------------

echo ""
echo "==> Building Flixer web application..."

npm run build

# -----------------------------------------------------------------------------
# Synchronize Capacitor
# -----------------------------------------------------------------------------

echo ""
echo "==> Synchronizing Capacitor iOS project..."

npx cap sync ios

# -----------------------------------------------------------------------------
# iOS Build and Deployment
# -----------------------------------------------------------------------------

echo ""
echo "======================================"
echo " Flixer iOS Deployment"
echo "======================================"

if [[ -n "$IOS_DEVICE_ID" ]]; then

  # ---------------------------------------------------------------------------
  # Deploy to specified device
  # ---------------------------------------------------------------------------

  echo "==> Deploying to device: $IOS_DEVICE_ID"

  npx cap run ios \
    --no-sync \
    --target "$IOS_DEVICE_ID"

elif [[ "$ALLOW_SELECTION_UI" == "1" ]]; then

  # ---------------------------------------------------------------------------
  # Interactive Device Selection
  # ---------------------------------------------------------------------------

  echo "==> Opening interactive device selector..."
  echo ""

  npx cap run ios --no-sync

else

  # ---------------------------------------------------------------------------
  # No Device Available
  # ---------------------------------------------------------------------------

  echo "ERROR: No device specified."
  echo "Set IOS_DEVICE_ID or enable ALLOW_SELECTION_UI."
  exit 1

fi

# -----------------------------------------------------------------------------
# Completion
# -----------------------------------------------------------------------------

echo ""
echo "======================================"
echo " iOS Deployment Completed Successfully"
echo "======================================"
echo ""
echo "Flixer has been deployed to the selected device."
echo "Live Reload: $CAPACITOR_LIVE_URL"
echo ""

REMOTE

# =============================================================================
# Upload Remote Runner
# =============================================================================

echo ""
echo "==> Uploading remote build runner..."

rsync -az "$RUNNER" \
  "$MAC_HOST:$MAC_DIR/$REMOTE_RUNNER"

# =============================================================================
# Execute Remote Build
# =============================================================================

echo ""
echo "==> Starting remote iOS build..."
echo ""

# SSH does not preserve empty positional arguments automatically.
# Shell-escape each argument to preserve its exact value.

printf -v REMOTE_COMMAND \
  'bash "$HOME"/%q/%q %q %q %q %q' \
  "$MAC_DIR" \
  "$REMOTE_RUNNER" \
  "$MAC_DIR" \
  "$LIVE_URL" \
  "$IOS_DEVICE_ID" \
  "$ALLOW_SELECTION_UI"

# Allocate a pseudo-terminal for:
# - Keychain password prompts
# - Capacitor interactive device selection
# - Xcode build output

ssh -tt "$MAC_HOST" "$REMOTE_COMMAND"

# =============================================================================
# Completion
# =============================================================================

echo ""
echo "======================================"
echo " Flixer Remote iOS Build Finished"
echo "======================================"
