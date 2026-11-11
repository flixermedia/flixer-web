#!/usr/bin/env bash
set -Eeuo pipefail

# Run this in your Coder Linux workspace, from your VS Code project directory.
# Chrome and mcp-chrome-bridge must already be running on your local Mac.
MAC_SSH_HOST="${MAC_SSH_HOST:-ashley@100.114.75.104}"
MAC_MCP_HOST="${MAC_MCP_HOST:-127.0.0.1}"
LOCAL_PORT="${LOCAL_PORT:-12306}"
REMOTE_PORT="${REMOTE_PORT:-12306}"
PROJECT_DIR="${PROJECT_DIR:-$PWD}"
MCP_CONFIG="${PROJECT_DIR}/.vscode/mcp.json"

log() { printf '\n==> %s\n' "$*"; }
fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

command -v ssh >/dev/null || fail 'ssh is required in the Coder workspace.'
command -v curl >/dev/null || fail 'curl is required in the Coder workspace.'
command -v python3 >/dev/null || fail 'python3 is required to merge the MCP JSON config.'
[[ "$LOCAL_PORT" =~ ^[0-9]+$ && "$REMOTE_PORT" =~ ^[0-9]+$ ]] || fail 'Ports must be numeric.'
[[ "$LOCAL_PORT" -ge 1 && "$LOCAL_PORT" -le 65535 && "$REMOTE_PORT" -ge 1 && "$REMOTE_PORT" -le 65535 ]] || fail 'Ports must be between 1 and 65535.'

ping_local() {
  curl -fsS --connect-timeout 2 --max-time 4 "http://127.0.0.1:${LOCAL_PORT}/ping" 2>/dev/null |
    python3 -c 'import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get("status")=="ok" else 1)' 2>/dev/null
}

log "Checking Chrome MCP on Coder port ${LOCAL_PORT}"
if ping_local; then
  echo 'Chrome MCP already responds on this port. Keeping the existing connection.'
else
  log "Opening SSH local forward: Coder 127.0.0.1:${LOCAL_PORT} -> ${MAC_SSH_HOST} -> Mac ${MAC_MCP_HOST}:${REMOTE_PORT}"
  echo 'SSH may request your Mac login password or key passphrase.'
  # A local forward (-L) is appropriate because this script runs on Coder and SSHes OUT to the Mac.
  # The tunnel lives as a background SSH process; ServerAlive options detect disconnects.
  ssh -f -N -T \
    -o ExitOnForwardFailure=yes \
    -o ServerAliveInterval=30 \
    -o ServerAliveCountMax=3 \
    -L "127.0.0.1:${LOCAL_PORT}:${MAC_MCP_HOST}:${REMOTE_PORT}" \
    "$MAC_SSH_HOST" || fail 'SSH tunnel failed. Check that Coder can SSH to your Mac and that the local port is unused.'

  for _ in 1 2 3 4 5; do
    if ping_local; then break; fi
    sleep 1
  done
  ping_local || fail "Tunnel started but Chrome MCP did not respond. On your Mac, open the extension, click Connect, and check curl http://127.0.0.1:${REMOTE_PORT}/ping."
  echo 'Chrome MCP is reachable through the SSH tunnel.'
fi

log "Configuring ${MCP_CONFIG}"
mkdir -p "$(dirname "$MCP_CONFIG")"
MCP_CONFIG="$MCP_CONFIG" LOCAL_PORT="$LOCAL_PORT" python3 - <<'PY'
import json, os, pathlib, shutil, sys
path = pathlib.Path(os.environ['MCP_CONFIG'])
port = os.environ['LOCAL_PORT']
if path.exists():
    try:
        config = json.loads(path.read_text())
    except json.JSONDecodeError as exc:
        sys.exit(f'ERROR: Existing {path} is not valid strict JSON ({exc}). Fix it manually; no changes made.')
    if not isinstance(config, dict):
        sys.exit('ERROR: Existing MCP config must be a JSON object.')
    backup = path.with_name(path.name + '.bak')
    shutil.copy2(path, backup)
    print(f'Backed up previous config: {backup}')
else:
    config = {}
servers = config.setdefault('servers', {})
if not isinstance(servers, dict):
    sys.exit('ERROR: Existing "servers" entry must be an object.')
servers['chrome'] = {
    'type': 'http',
    'url': f'http://127.0.0.1:{port}/mcp',
}
path.write_text(json.dumps(config, indent=2) + '\n')
print(f'Configured server "chrome" at http://127.0.0.1:{port}/mcp')
PY

log 'Done'
printf 'Chrome MCP ping: '
curl -fsS "http://127.0.0.1:${LOCAL_PORT}/ping"
printf '\n\nNext: In VS Code connected to Coder, run "MCP: List Servers" and start the chrome server.\n'
printf 'Project MCP config: %s\n' "$MCP_CONFIG"
printf 'Note: The tunnel needs re-establishing if the workspace or SSH process restarts.\n'
