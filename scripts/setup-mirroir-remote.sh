.#!/usr/bin/env bash
set -Eeuo pipefail

MAC_HOST="${MAC_HOST:-ashley@ashleys-macbook-pro}"
MAC_HOME="${MAC_HOME:-/Users/ashley}"
WORKSPACE="${WORKSPACE:-$PWD}"
CONFIG_PATH="${CONFIG_PATH:-$WORKSPACE/.vscode/mcp.json}"
SOCKET="$MAC_HOME/.mirroir-mcp/bridge.sock"
SSH_OPTS=(-T -o BatchMode=yes -o ConnectTimeout=10)

info(){ printf '\n==> %s\n' "$*"; }
fail(){ printf 'ERROR: %s\n' "$*" >&2; exit 1; }
command -v ssh >/dev/null || fail 'ssh is required'
command -v python3 >/dev/null || fail 'python3 is required'
info "Checking SSH to $MAC_HOST"
ssh "${SSH_OPTS[@]}" "$MAC_HOST" 'printf "SSH_OK\n"' | grep -qx SSH_OK || fail 'SSH connection failed'

info 'Checking Mac tools and preparing private socket directory'
ssh "${SSH_OPTS[@]}" "$MAC_HOST" 'bash -s' <<'REMOTE'
set -euo pipefail
MIRROIR=/opt/homebrew/bin/mirroir-mcp
SOCAT=/opt/homebrew/bin/socat
[ -x "$MIRROIR" ] || { echo 'Mirroir MCP not found; install it on Mac first' >&2; exit 1; }
if [ ! -x "$SOCAT" ]; then
  echo 'socat missing. Attempting brew install (may need local interaction)...' >&2
  /opt/homebrew/bin/brew install socat || { echo 'Install socat locally on Mac and retry' >&2; exit 1; }
fi
mkdir -p "$HOME/.mirroir-mcp"
chmod 700 "$HOME/.mirroir-mcp"
REMOTE

info 'Installing Mac bridge launcher (no automatic privacy bypass)'
ssh "${SSH_OPTS[@]}" "$MAC_HOST" 'bash -s' <<'REMOTE'
set -euo pipefail
cat > "$HOME/.mirroir-mcp/start-bridge.sh" <<'MACSCRIPT'
#!/bin/bash
set -euo pipefail
DIR="$HOME/.mirroir-mcp"
SOCKET="$DIR/bridge.sock"
mkdir -p "$DIR"
chmod 700 "$DIR"
if [ -S "$SOCKET" ]; then
  if /opt/homebrew/bin/socat -T 1 - UNIX-CONNECT:"$SOCKET" </dev/null >/dev/null 2>&1; then
    echo "Existing bridge appears reachable at $SOCKET; not replacing it." >&2
    exit 0
  fi
  rm -f "$SOCKET"
fi
exec /opt/homebrew/bin/socat UNIX-LISTEN:"$SOCKET",fork,mode=600 EXEC:/opt/homebrew/bin/mirroir-mcp
MACSCRIPT
chmod 700 "$HOME/.mirroir-mcp/start-bridge.sh"
REMOTE

info 'Starting bridge in Mac GUI user launchd domain (best effort)'
# GUI launchd domain may have different TCC identity from Terminal; test determines success.
ssh "${SSH_OPTS[@]}" "$MAC_HOST" 'bash -s' <<'REMOTE'
set -euo pipefail
UID_NUM=$(id -u)
PLIST="$HOME/Library/LaunchAgents/org.local.mirroir-bridge.plist"
mkdir -p "$HOME/Library/LaunchAgents"
cat > "$PLIST" <<'PLISTXML'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>org.local.mirroir-bridge</string>
  <key>ProgramArguments</key><array>
    <string>/bin/bash</string><string>-lc</string>
    <string>exec "$HOME/.mirroir-mcp/start-bridge.sh"</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/mirroir-bridge.stdout.log</string>
  <key>StandardErrorPath</key><string>/tmp/mirroir-bridge.stderr.log</string>
</dict></plist>
PLISTXML
if launchctl print "gui/$UID_NUM" >/dev/null 2>&1; then
  launchctl bootout "gui/$UID_NUM/org.local.mirroir-bridge" >/dev/null 2>&1 || true
  launchctl bootstrap "gui/$UID_NUM" "$PLIST" || true
  launchctl kickstart -k "gui/$UID_NUM/org.local.mirroir-bridge" || true
else
  echo 'No accessible logged-in GUI launchd domain; launch bridge locally from Terminal.' >&2
fi
REMOTE

info 'Writing VS Code MCP configuration (preserving other servers)'
mkdir -p "$(dirname "$CONFIG_PATH")"
MAC_HOST="$MAC_HOST" SOCKET="$SOCKET" CONFIG_PATH="$CONFIG_PATH" python3 - <<'PY'
import json, os, pathlib
path = pathlib.Path(os.environ['CONFIG_PATH'])
if path.exists():
    try:
        obj = json.loads(path.read_text())
    except json.JSONDecodeError as e:
        raise SystemExit(f'Existing {path} is not strict JSON ({e}); edit it manually (JSONC not supported).')
else:
    obj = {}
if not isinstance(obj, dict):
    raise SystemExit('MCP config must be a JSON object')
servers = obj.setdefault('servers', {})
if not isinstance(servers, dict):
    raise SystemExit('MCP servers must be a JSON object')
servers['mirroir'] = {
    'type':'stdio', 'command':'ssh',
    'args':['-T','-o','BatchMode=yes','-o','ConnectTimeout=10',
            os.environ['MAC_HOST'], '/opt/homebrew/bin/socat', '-',
            'UNIX-CONNECT:'+os.environ['SOCKET']]
}
if path.exists():
    backup = path.with_suffix(path.suffix + '.bak')
    backup.write_bytes(path.read_bytes())
    print('Backup:', backup)
path.write_text(json.dumps(obj, indent=2)+'\n')
print('Wrote:', path)
PY

info 'Testing MCP initialize and screenshot through socket'
MAC_HOST="$MAC_HOST" SOCKET="$SOCKET" python3 - <<'PY'
import json, os, subprocess, select, sys
cmd = ['ssh','-T','-o','BatchMode=yes','-o','ConnectTimeout=10',os.environ['MAC_HOST'],
       '/opt/homebrew/bin/socat','-','UNIX-CONNECT:'+os.environ['SOCKET']]
p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1)
def exchange(obj, timeout=20):
    p.stdin.write(json.dumps(obj)+'\n'); p.stdin.flush()
    readable,_,_ = select.select([p.stdout],[],[],timeout)
    if not readable: raise TimeoutError('Timed out waiting for MCP response')
    line=p.stdout.readline()
    if not line: raise RuntimeError('MCP bridge closed without response')
    return json.loads(line)
try:
    init=exchange({'jsonrpc':'2.0','id':1,'method':'initialize','params':{
      'protocolVersion':'2025-03-26','capabilities':{},
      'clientInfo':{'name':'linux-mirroir-setup','version':'1.0'}}})
    print('Server:',init.get('result',{}).get('serverInfo'))
    if init.get('error'): raise RuntimeError(str(init['error']))
    p.stdin.write(json.dumps({'jsonrpc':'2.0','method':'notifications/initialized'})+'\n');p.stdin.flush()
    result=exchange({'jsonrpc':'2.0','id':2,'method':'tools/call',
      'params':{'name':'screenshot','arguments':{}}},timeout=30)
    r=result.get('result',{})
    types=[x.get('type') for x in r.get('content',[])]
    print('Screenshot content types:',types)
    if result.get('error') or r.get('isError') or 'image' not in types:
        for x in r.get('content',[]):
            if x.get('type')=='text': print('Message:',x.get('text','')[:500])
        raise RuntimeError('Screenshot test failed')
    print('SUCCESS: remote screenshot works via bridge')
except Exception as exc:
    print('BRIDGE TEST FAILED:',exc, file=sys.stderr)
    print('On Mac, inspect: tail -50 /tmp/mirroir-bridge.stderr.log',file=sys.stderr)
    print('If permission fails, open Mac Terminal and run:',file=sys.stderr)
    print('  launchctl bootout gui/$(id -u)/org.local.mirroir-bridge',file=sys.stderr)
    print('  ~/.mirroir-mcp/start-bridge.sh',file=sys.stderr)
    print('Then rerun this script from Linux. Screen Recording cannot be granted via SSH.',file=sys.stderr)
    sys.exit(1)
finally:
    p.terminate()
PY
