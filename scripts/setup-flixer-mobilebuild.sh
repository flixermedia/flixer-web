#!/usr/bin/env bash
# Configure a GUI-session MobileBuildMCP bridge on a remote Mac, from Linux.
# No signing private keys or keychain passwords are copied or stored.
set -Eeuo pipefail

MAC_HOST="${MAC_HOST:-ashley@ashleys-macbook-pro}"
WORKSPACE="${WORKSPACE:-$PWD}"
MAC_PROJECT="${MAC_PROJECT:-/Users/ashley/Developer/flixer-web}"
SIGN_IDENTITY="${SIGN_IDENTITY:-}"
SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=10)

printf 'Remote Mac: %s\nLinux workspace: %s\nMac project: %s\n\n' "$MAC_HOST" "$WORKSPACE" "$MAC_PROJECT"
command -v ssh >/dev/null || { echo 'ERROR: ssh is required' >&2; exit 1; }
command -v python3 >/dev/null || { echo 'ERROR: python3 is required on Linux' >&2; exit 1; }
[ -d "$WORKSPACE" ] || { echo 'ERROR: Linux workspace not found' >&2; exit 1; }
ssh "${SSH_OPTS[@]}" "$MAC_HOST" 'true' || { echo 'ERROR: passwordless SSH failed' >&2; exit 1; }

echo 'Setting up Mac-side bridge and signing check...'
# Env values passed as positional args (paths cannot contain single quotes). Avoid shell interpolation inside remote script.
ssh "${SSH_OPTS[@]}" "$MAC_HOST" /bin/bash -s -- "$MAC_PROJECT" "$SIGN_IDENTITY" <<'MAC_SETUP'
set -Eeuo pipefail
PROJECT="$1"
SIGN_IDENTITY="$2"
BASE="$HOME/.local/share/flixer-mobilebuild"
SOCKET="$BASE/mobilebuild.sock"
LABEL="org.flixer.mobilebuild.bridge"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
KEYCHAIN="$HOME/Library/Keychains/login.keychain-db"
mkdir -p "$BASE" "$HOME/Library/LaunchAgents"
chmod 700 "$BASE"
SOCAT="$(command -v socat || true)"
MOBILE="$(command -v mobilebuildmcp || true)"
if [ -z "$SOCAT" ] && [ -x /opt/homebrew/bin/socat ]; then SOCAT=/opt/homebrew/bin/socat; fi
if [ -z "$MOBILE" ] && [ -x /opt/homebrew/bin/mobilebuildmcp ]; then MOBILE=/opt/homebrew/bin/mobilebuildmcp; fi
if [ -z "$SOCAT" ]; then echo 'ERROR: Install socat on Mac: brew install socat' >&2; exit 2; fi
if [ -z "$MOBILE" ]; then echo 'ERROR: Install mobilebuildmcp on Mac first' >&2; exit 2; fi
if [ ! -d "$PROJECT" ]; then echo "ERROR: Project directory not found on Mac: $PROJECT" >&2; exit 2; fi

# Create helper with quoted heredoc, so it is editable without embedding passwords.
cat > "$BASE/run-bridge.sh" <<'BRIDGE'
#!/bin/bash
set -Eeuo pipefail
umask 077
BASE="$HOME/.local/share/flixer-mobilebuild"
SOCKET="$BASE/mobilebuild.sock"
KEYCHAIN="$HOME/Library/Keychains/login.keychain-db"
# Use the installed absolute paths, as launchd PATH is minimal.
SOCAT="/opt/homebrew/bin/socat"
if [ ! -x "$SOCAT" ]; then SOCAT="$(command -v socat)"; fi
mkdir -p "$BASE"
chmod 700 "$BASE"
# The socket is owned by this LaunchAgent. Don't remove one held by a live listener.
if [ -S "$SOCKET" ]; then
  if "$SOCAT" -u /dev/null "UNIX-CONNECT:$SOCKET" >/dev/null 2>&1; then
    echo 'Another bridge is listening; refusing to replace its socket.' >&2
    exit 1
  fi
  rm -f "$SOCKET"
fi
# This signing test runs in the SAME launchd GUI session that hosts the MCP children.
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cp /usr/bin/true "$TMP/sign-test"
if /usr/bin/codesign --force --sign "$FLIXER_SIGN_IDENTITY" --keychain "$KEYCHAIN" \
    --timestamp=none "$TMP/sign-test" >/dev/null 2>"$BASE/signing-error.log" && \
   /usr/bin/codesign --verify "$TMP/sign-test" >/dev/null 2>&1; then
  printf 'SUCCESS: GUI-session code signing passed.\n' > "$BASE/signing-status.txt"
  : > "$BASE/signing-error.log"
else
  printf 'FAILED: GUI-session signing test failed; see signing-error.log\n' > "$BASE/signing-status.txt"
  cat "$BASE/signing-error.log" >&2
  # Continue serving for simulator workflows; do not report signing as successful.
fi
rm -rf "$TMP"
trap - EXIT
export MOBILEBUILDMCP_ENABLED_WORKFLOWS="simulator,device,project-discovery,utilities"
# Child process inherits the GUI-session environment and permissions of the agent.
exec "$SOCAT" "UNIX-LISTEN:$SOCKET,fork,mode=600" "EXEC:$BASE/run-mcp.sh"
BRIDGE

cat > "$BASE/run-mcp.sh" <<'MCP'
#!/bin/bash
set -Eeuo pipefail
export MOBILEBUILDMCP_ENABLED_WORKFLOWS="simulator,device,project-discovery,utilities"
cd "$FLIXER_MAC_PROJECT"
exec /opt/homebrew/bin/mobilebuildmcp mcp
MCP

chmod 700 "$BASE/run-bridge.sh" "$BASE/run-mcp.sh"
# Shell-escape macOS values as XML using Python to avoid constructing unsafe plist markup.
/usr/bin/python3 - "$PLIST" "$BASE/run-bridge.sh" "$PROJECT" "$SIGN_IDENTITY" "$LABEL" <<'PY'
import plistlib, sys
path, run, project, identity, label = sys.argv[1:]
config = {
    'Label': label,
    'ProgramArguments': ['/bin/bash', run],
    'EnvironmentVariables': {'FLIXER_MAC_PROJECT': project, 'FLIXER_SIGN_IDENTITY': identity},
    'RunAtLoad': True,
    'KeepAlive': {'SuccessfulExit': False},
    'StandardOutPath': run.rsplit('/', 1)[0] + '/bridge.stdout.log',
    'StandardErrorPath': run.rsplit('/', 1)[0] + '/bridge.stderr.log',
}
with open(path, 'wb') as f:
    plistlib.dump(config, f)
PY
chmod 600 "$PLIST"
UID_NUM="$(id -u)"
if ! launchctl print "gui/$UID_NUM" >/dev/null 2>&1; then
  echo "WARNING: Mac graphical login session gui/$UID_NUM isn't available." >&2
  echo "Log in to the Mac desktop, then run: launchctl bootstrap gui/$UID_NUM '$PLIST'" >&2
  exit 3
fi
rm -f "$BASE/signing-status.txt"
launchctl bootout "gui/$UID_NUM/$LABEL" >/dev/null 2>&1 || true
if ! launchctl bootstrap "gui/$UID_NUM" "$PLIST"; then
  echo 'ERROR: Could not bootstrap LaunchAgent from SSH.' >&2
  echo "On Mac Terminal: launchctl bootstrap gui/$UID_NUM '$PLIST'" >&2
  exit 4
fi
launchctl kickstart -k "gui/$UID_NUM/$LABEL"
printf 'MAC_BASE=%s\nMAC_SOCKET=%s\n' "$BASE" "$SOCKET"
MAC_SETUP

echo 'Updating VS Code MCP configuration on Linux...'
mkdir -p "$WORKSPACE/.vscode"
export WORKSPACE MAC_HOST
python3 - <<'PY'
import json, os, pathlib, shutil
workspace = pathlib.Path(os.environ['WORKSPACE'])
mac = os.environ['MAC_HOST']
path = workspace / '.vscode' / 'mcp.json'
if path.exists():
    try:
        config = json.loads(path.read_text())
    except json.JSONDecodeError as exc:
        raise SystemExit(f'ERROR: Invalid existing {path}: {exc}. Not overwriting.')
    shutil.copy2(path, str(path) + '.bak')
else:
    config = {}
servers = config.setdefault('servers', {})
if not isinstance(servers, dict):
    raise SystemExit('ERROR: existing MCP servers entry must be an object')
servers['mobilebuild'] = {
    'type': 'stdio',
    'command': 'ssh',
    'args': [
        '-T', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10',
        mac, '/opt/homebrew/bin/socat', '-',
        'UNIX-CONNECT:/Users/ashley/.local/share/flixer-mobilebuild/mobilebuild.sock'
    ]
}
path.write_text(json.dumps(config, indent=2) + '\n')
print(f'Updated: {path}')
PY

echo 'Checking GUI-session signing status...'
ssh "${SSH_OPTS[@]}" "$MAC_HOST" \
  'cat "$HOME/.local/share/flixer-mobilebuild/signing-status.txt" 2>/dev/null || echo "NOT READY: signing self-test not yet run"'

echo 'Testing remote MCP handshake...'
export MAC_HOST
python3 - <<'PY'
import json, os, subprocess, sys, time, select
cmd = [
    'ssh','-T','-o','BatchMode=yes','-o','ConnectTimeout=10',
    os.environ['MAC_HOST'], '/opt/homebrew/bin/socat','-',
    'UNIX-CONNECT:/Users/ashley/.local/share/flixer-mobilebuild/mobilebuild.sock'
]
p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1)
try:
    request = {
      'jsonrpc':'2.0','id':1,'method':'initialize',
      'params': {'protocolVersion':'2025-03-26', 'capabilities': {},
                 'clientInfo': {'name':'flixer-remote-setup','version':'1.0'}}
    }
    p.stdin.write(json.dumps(request)+'\n'); p.stdin.flush()
    readable, _, _ = select.select([p.stdout], [], [], 15)
    if not readable:
        print('WARNING: MCP initialization timed out. Check Mac bridge.stderr.log')
        sys.exit(0)
    line = p.stdout.readline()
    if not line:
        print('WARNING: MCP bridge closed:', p.stderr.read()[:400])
    else:
        response = json.loads(line)
        print('MCP server:', response.get('result',{}).get('serverInfo', response.get('error')))
finally:
    p.terminate()
    try: p.wait(timeout=2)
    except subprocess.TimeoutExpired: p.kill()
PY

cat <<'OUT'

Setup completed. Restart MobileBuildMCP in VS Code (MCP: List Servers).

If signing-status.txt says FAILED:
  - Log in to the Mac graphical desktop and unlock the login keychain.
  - From Mac Terminal, inspect:
      cat ~/.local/share/flixer-mobilebuild/signing-error.log
      cat ~/.local/share/flixer-mobilebuild/bridge.stderr.log
  - Re-test after login by restarting the LaunchAgent:
      launchctl kickstart -k gui/$(id -u)/org.flixer.mobilebuild.bridge

This setup stores no keychain password and never exports your private key.
It cannot guarantee unattended signing when macOS re-locks the login keychain.
OUT
