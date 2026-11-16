#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 <user@remote-host> [ssh-options...]"
    exit 1
fi

REMOTE="$1"
shift
SSH_OPTS=("$@")

# Make sure the remote shell can find adb even in non-interactive mode
REMOTE_PATH_SETUP='export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/Library/Android/sdk/platform-tools:$PATH"'

remote() {
    # Run the command with the forced PATH
    ssh "${SSH_OPTS[@]}" "$REMOTE" "$REMOTE_PATH_SETUP; $*"
}

echo "Where is the Android device physically plugged in?"
echo "  1) Local machine  (Control local device from remote server)"
echo "  2) Remote machine (Control remote device from local computer)"
read -rp "Select [1 or 2]: " MODE

if [ "$MODE" = "1" ]; then
    echo "Starting local ADB server..."
    adb start-server
    
    if ! adb devices | grep -q "device$"; then
        echo "Warning: No active local Android device detected. Check USB debugging."
    fi

    echo "Stopping any active ADB server on $REMOTE..."
    remote "adb kill-server" >/dev/null 2>&1 || true

    echo "Opening reverse SSH tunnel (Press Ctrl+D or type 'exit' to close)..."
    ssh -o ExitOnForwardFailure=yes -R 5037:localhost:5037 "${SSH_OPTS[@]}" "$REMOTE"

elif [ "$MODE" = "2" ]; then
    LOCAL_PORT=15037
    echo "Ensuring remote ADB server is running on $REMOTE..."
    remote "adb start-server"

    echo "Starting background SSH tunnel on local port $LOCAL_PORT..."
    ssh -f -N -o ExitOnForwardFailure=yes -L "${LOCAL_PORT}:127.0.0.1:5037" "${SSH_OPTS[@]}" "$REMOTE"

    # Find the background SSH process ID to clean it up later
    TUNNEL_PID=$(pgrep -f "ssh -f -N .* -L ${LOCAL_PORT}:127.0.0.1:5037 .* ${REMOTE}" || true)
    if [ -n "${TUNNEL_PID}" ]; then
        trap 'echo "Closing ADB tunnel..."; kill "$TUNNEL_PID" 2>/dev/null || true' EXIT
    else
        echo "Warning: could not find tunnel PID – you may need to kill it manually later."
    fi

    echo "Tunnel active! Opening local subshell configured for remote ADB..."
    echo "Run 'adb devices' now. Type 'exit' when finished."
    ADB_SERVER_SOCKET="tcp:127.0.0.1:${LOCAL_PORT}" "${SHELL:-/bin/bash}"

else
    echo "Invalid selection. Exiting."
    exit 1
fi