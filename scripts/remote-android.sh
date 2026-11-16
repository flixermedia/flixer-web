#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Flixer - Remote Android Development
# =============================================================================

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

MAC_HOST="${MAC_HOST:-ashley@ashleys-macbook-pro}"
MAC_DIR="${MAC_DIR:-Developer/flixer-web}"

# Leave empty for first available device / interactive
ANDROID_SERIAL="${ANDROID_SERIAL:-}"
ALLOW_SELECTION_UI="${ALLOW_SELECTION_UI:-1}"

# Capacitor live reload URL (served from your Gitpod / Coder workspace)
LIVE_URL="${CAPACITOR_LIVE_URL:-https://web--my-flixer--realashleybailey-coder.gitcloud.org}"

REMOTE_RUNNER=".flixer-remote-android-runner.sh"

# -----------------------------------------------------------------------------
# Cleanup
# -----------------------------------------------------------------------------

RUNNER="$(mktemp)"
cleanup() { rm -f "$RUNNER"; }
trap cleanup EXIT

# -----------------------------------------------------------------------------
# Startup
# -----------------------------------------------------------------------------

echo "======================================"
echo " Flixer Remote Android Development"
echo "======================================"
echo "Mac:         $MAC_HOST"
echo "Directory:   $MAC_DIR"
echo "Device:      ${ANDROID_SERIAL:-first available / interactive}"
echo "Live Reload: $LIVE_URL"
echo ""

# -----------------------------------------------------------------------------
# Local dependency check
# -----------------------------------------------------------------------------

echo "==> Checking local dependencies..."
for cmd in ssh rsync; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERROR: Missing required command: $cmd"
    exit 1
  fi
done

# -----------------------------------------------------------------------------
# Sync project to Mac
# -----------------------------------------------------------------------------

echo "==> Syncing project to Mac..."

rsync -azv --delete \
  --exclude=".git/" \
  --exclude="node_modules/" \
  --exclude="android/.gradle/" \
  --exclude="android/app/build/" \
  --exclude="android/build/" \
  --exclude="android/local.properties" \
  --exclude="ios/" \
  --exclude="dist/" \
  --exclude="$REMOTE_RUNNER" \
  ./ "$MAC_HOST:$MAC_DIR/"

echo "==> Project synchronization complete."

# =============================================================================
# Create remote runner
# =============================================================================

cat > "$RUNNER" <<'REMOTE'
#!/usr/bin/env bash
set -euo pipefail

MAC_DIR="$1"
LIVE_URL="$2"
ANDROID_SERIAL="$3"
ALLOW_SELECTION_UI="$4"

cd "$HOME/$MAC_DIR"

cleanup() {
  rm -f -- "$HOME/$MAC_DIR/.flixer-remote-android-runner.sh"
}
trap cleanup EXIT

echo ""
echo "======================================"
echo " Flixer macOS Android Build Environment"
echo "======================================"

# -----------------------------------------------------------------------------
# Environment
# -----------------------------------------------------------------------------

echo "==> Configuring environment..."

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

# Android SDK (Android Studio default location)
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/emulator:$PATH"

# Prefer Java 21, fall back to Android Studio JBR
find_java() {
  local candidates=(
    "/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home"
    "/Library/Java/JavaVirtualMachines/zulu-21.jdk/Contents/Home"
    "/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home"
    "/opt/homebrew/opt/openjdk@21"
    "/usr/local/opt/openjdk@21"
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home"
  )

  for candidate in "${candidates[@]}"; do
    if [[ -x "$candidate/bin/java" ]]; then
      version=$("$candidate/bin/java" -version 2>&1 | head -n 1 || true)
      if [[ "$version" == *"21"* ]]; then
        echo "$candidate"
        return 0
      fi
    fi
  done
  return 1
}

JAVA_HOME_FOUND=$(find_java || true)

if [[ -z "$JAVA_HOME_FOUND" ]]; then
  echo "ERROR: No Java 21 or 17 installation found on the Mac."
  echo ""
  echo "Install Java 21 (recommended):"
  echo "  brew install --cask temurin@21"
  exit 1
fi

export JAVA_HOME="$JAVA_HOME_FOUND"
export PATH="$JAVA_HOME/bin:$PATH"

# Node / NVM
export NVM_DIR="$HOME/.nvm"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  source "$NVM_DIR/nvm.sh"
fi

export CAPACITOR_LIVE_URL="$LIVE_URL"

# -----------------------------------------------------------------------------
# Tool checks
# -----------------------------------------------------------------------------

echo "==> Checking developer tools..."

for cmd in node npm npx adb java; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERROR: Missing required command: $cmd"
    exit 1
  fi
done

echo ""
echo "Node.js:       $(node --version)"
echo "npm:           $(npm --version)"
echo "adb:           $(adb version | head -n 1)"
echo "Java:          $(java -version 2>&1 | head -n 1)"
echo "JAVA_HOME:     $JAVA_HOME"
echo "ANDROID_HOME:  $ANDROID_HOME"
echo ""

# -----------------------------------------------------------------------------
# Device check
# -----------------------------------------------------------------------------

echo "==> Checking connected Android devices..."
adb start-server
adb devices -l

DEVICE_COUNT=$(adb devices | grep -c "device$" || true)
if [[ "$DEVICE_COUNT" -eq 0 ]]; then
  echo "ERROR: No Android devices detected on the Mac."
  echo "Make sure the phone is plugged in and USB debugging is authorized."
  exit 1
fi

# -----------------------------------------------------------------------------
# Install + build
# -----------------------------------------------------------------------------

echo ""
echo "==> Installing npm dependencies..."
npm ci

echo ""
echo "==> Configuring Capacitor live reload..."
echo "Live Reload URL: $CAPACITOR_LIVE_URL"

echo ""
echo "==> Building web application..."
npm run build

echo ""
echo "==> Synchronizing Capacitor Android project..."
npx cap sync android

# -----------------------------------------------------------------------------
# Deploy
# -----------------------------------------------------------------------------

echo ""
echo "======================================"
echo " Flixer Android Deployment"
echo "======================================"

if [[ -n "$ANDROID_SERIAL" ]]; then
  echo "==> Deploying to device: $ANDROID_SERIAL"
  export ANDROID_SERIAL
  npx cap run android --no-sync --target "$ANDROID_SERIAL"
elif [[ "$ALLOW_SELECTION_UI" == "1" ]]; then
  echo "==> Deploying (interactive / first available device)..."
  npx cap run android --no-sync
else
  echo "ERROR: No device specified and interactive selection is disabled."
  exit 1
fi

echo ""
echo "======================================"
echo " Android Deployment Completed"
echo "======================================"
echo "Live Reload: $CAPACITOR_LIVE_URL"
echo ""
REMOTE

# =============================================================================
# Upload + run remote runner
# =============================================================================

echo ""
echo "==> Uploading remote build runner..."
rsync -az "$RUNNER" "$MAC_HOST:$MAC_DIR/$REMOTE_RUNNER"

echo ""
echo "==> Starting remote Android build on $MAC_HOST..."
echo ""

printf -v REMOTE_COMMAND \
  'bash "$HOME"/%q/%q %q %q %q %q' \
  "$MAC_DIR" \
  "$REMOTE_RUNNER" \
  "$MAC_DIR" \
  "$LIVE_URL" \
  "$ANDROID_SERIAL" \
  "$ALLOW_SELECTION_UI"

# -tt gives a real TTY so Capacitor device selection + Gradle output work
ssh -tt "$MAC_HOST" "$REMOTE_COMMAND"

echo ""
echo "======================================"
echo " Flixer Remote Android Build Finished"
echo "======================================"