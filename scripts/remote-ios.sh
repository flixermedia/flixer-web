#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Flixer - Remote iOS Development
# =============================================================================

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

# Remote macOS development environment
export MAC_HOST="ashley@ashleys-macbook-pro"
export MAC_DIR="Developer/flixer-web"

# Physical iOS device (iPhone 14 Pro Max)
export IOS_DEVICE_ID="${IOS_DEVICE_ID:-00008120-001E381A1403C01E}"

# Capacitor live reload URL
export LIVE_URL="${CAPACITOR_LIVE_URL:-https://web--my-flixer--realashleybailey-coder.gitcloud.org}"

# -----------------------------------------------------------------------------
# Startup Information
# -----------------------------------------------------------------------------

echo "======================================"
echo " Flixer Remote iOS Development"
echo "======================================"
echo "Mac:         $MAC_HOST"
echo "Device:      $IOS_DEVICE_ID"
echo "Live Reload: $LIVE_URL"
echo ""

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
  ./ "$MAC_HOST:$MAC_DIR/"

# -----------------------------------------------------------------------------
# Remote iOS Build and Deployment
# -----------------------------------------------------------------------------

echo "==> Starting remote iOS build..."

ssh -T "$MAC_HOST" /bin/bash -s -- \
  "$MAC_DIR" "$LIVE_URL" "$IOS_DEVICE_ID" <<'REMOTE'

set -euo pipefail

# -----------------------------------------------------------------------------
# Remote Configuration
# -----------------------------------------------------------------------------

MAC_DIR="$1"
LIVE_URL="$2"
IOS_DEVICE_ID="$3"

cd "$HOME/$MAC_DIR"

# -----------------------------------------------------------------------------
# Environment Setup
# -----------------------------------------------------------------------------

echo "==> Configuring Node.js environment..."

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
export NVM_DIR="$HOME/.nvm"

if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  source "$NVM_DIR/nvm.sh"
fi

# Select Xcode developer tools
export DEVELOPER_DIR="/Applications/Xcode.app/Contents/Developer"

# -----------------------------------------------------------------------------
# Apple Code Signing
# -----------------------------------------------------------------------------

echo "==> Unlocking macOS login Keychain..."

security unlock-keychain \
  "$HOME/Library/Keychains/login.keychain-db"

echo "==> Checking Apple signing identities..."

security find-identity -v -p codesigning

# -----------------------------------------------------------------------------
# iOS Device Verification
# -----------------------------------------------------------------------------

echo "==> Checking connected iOS devices..."

xcrun devicectl list devices

# -----------------------------------------------------------------------------
# Capacitor Configuration
# -----------------------------------------------------------------------------

echo "==> Configuring Capacitor live reload..."

export CAPACITOR_LIVE_URL="$LIVE_URL"

# -----------------------------------------------------------------------------
# Dependencies and Synchronization
# -----------------------------------------------------------------------------

echo "==> Installing npm dependencies..."

npm ci

echo "==> Synchronizing Capacitor iOS project..."

npx cap sync ios

# -----------------------------------------------------------------------------
# Build and Deployment
# -----------------------------------------------------------------------------

echo "==> Building and deploying to physical iPhone..."

npx cap run ios \
  --no-sync \
  --target "$IOS_DEVICE_ID"

# -----------------------------------------------------------------------------
# Completion
# -----------------------------------------------------------------------------

echo ""
echo "======================================"
echo " iOS Deployment Completed Successfully"
echo "======================================"

REMOTE