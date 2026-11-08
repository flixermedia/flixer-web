#!/usr/bin/env bash
set -Eeuo pipefail

# Run INSIDE your Coder workspace, as the same user running VS Code.
# Connects Docker to a remote host through SSH.
# The MCP server runs in Coder; no MCP installation is required on the Mac.

REMOTE="${REMOTE:-}"
CONTEXT="${CONTEXT:-docker-remote}"
WORKSPACE="${WORKSPACE:-$PWD}"
MCP_FILE="${MCP_FILE:-$WORKSPACE/.vscode/mcp.json}"

say() { printf '\n==> %s\n' "$*"; }
fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
command -v ssh >/dev/null || fail 'OpenSSH client is required in Coder.'
command -v docker >/dev/null || fail 'Docker CLI is required in Coder (the daemon can be remote).'
command -v python3 >/dev/null || fail 'Python 3 is required to safely merge VS Code MCP settings.'
[ -n "$REMOTE" ] || fail 'Set REMOTE to the SSH user and host for the Docker machine.'

say "Checking SSH access to $REMOTE"
ssh -o BatchMode=yes -o ConnectTimeout=12 "$REMOTE" 'true' || fail 'SSH failed. Check connectivity and SSH authentication for the remote host.'

say 'Ensuring Docker CLI is visible to non-interactive SSH on macOS'
# Docker SSH transport invokes `docker system dial-stdio` directly. An SSH
# session may not source .zprofile or .zshrc, so fix the noninteractive PATH.
ssh -o BatchMode=yes "$REMOTE" 'zsh -s' <<'REMOTE_ZSH'
set -eu
if ! command -v docker >/dev/null 2>&1; then
  for candidate in \
    /Applications/Docker.app/Contents/Resources/bin/docker \
    "$HOME/.docker/bin/docker" \
    /opt/homebrew/bin/docker \
    /usr/local/bin/docker \
    /Applications/OrbStack.app/Contents/MacOS/xbin/docker \
    "$HOME/.colima/bin/docker"; do
    if [[ -x "$candidate" ]]; then
      # ~/.zshenv is sourced by noninteractive zsh, including SSH commands.
      # Only prepend a known CLI directory; preserve any existing contents.
      cli_dir="${candidate:h}"
      zenv="$HOME/.zshenv"
      marker='# docker-coder-ssh-path'
      if ! grep -Fq "$marker" "$zenv" 2>/dev/null; then
        printf '\n%s\nexport PATH="%s:$PATH"\n' "$marker" "$cli_dir" >> "$zenv"
      fi
      export PATH="$cli_dir:$PATH"
      break
    fi
  done
fi
command -v docker >/dev/null 2>&1 || { echo 'Docker CLI not found on Mac. Install Docker Desktop, OrbStack, or Colima.' >&2; exit 1; }
docker info --format '{{.Name}}' || { echo 'Docker CLI found, but daemon is not running or accessible.' >&2; exit 1; }
REMOTE_ZSH

say 'Verifying Docker CLI in the actual non-interactive SSH command environment'
ssh -o BatchMode=yes "$REMOTE" 'command -v docker && docker info --format "{{.Name}}"' || fail 'SSH still cannot find Docker. Inspect ~/.zshenv and the Docker installation on your Mac.'

say "Creating/updating Docker context: $CONTEXT"
if docker context inspect "$CONTEXT" >/dev/null 2>&1; then
  docker context update "$CONTEXT" --docker "host=ssh://$REMOTE" >/dev/null
else
  docker context create "$CONTEXT" --docker "host=ssh://$REMOTE" >/dev/null
fi

# Some macOS SSH sessions do not include Docker in PATH. Docker SSH transport
# needs remote `docker` available in the default noninteractive shell PATH.
say 'Testing Docker context (including remote docker system dial-stdio)'
if ! docker --context "$CONTEXT" ps >/dev/null; then
  fail 'Docker context could not reach the Mac. Ensure remote `docker` is in the SSH noninteractive PATH (ssh host "command -v docker") and Docker is running.'
fi

say 'Installing uvx locally in Coder if necessary'
if ! command -v uvx >/dev/null 2>&1; then
  if command -v uv >/dev/null 2>&1; then
    UVX_CMD="$(command -v uv)"
    UVX_ARGS=(tool run)
  else
    command -v curl >/dev/null || fail 'Install uv manually: https://docs.astral.sh/uv/getting-started/installation/'
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
    command -v uvx >/dev/null || fail 'uvx installation failed.'
  fi
fi
if command -v uvx >/dev/null 2>&1; then
  UVX_CMD="$(command -v uvx)"
  UVX_ARGS=()
fi

say "Merging Docker MCP server into $MCP_FILE"
mkdir -p "$(dirname "$MCP_FILE")"
export MCP_FILE REMOTE UVX_CMD
# Docker context selected explicitly. The MCP process runs in Coder.
python3 - "${UVX_ARGS[@]}" <<'PY'
import json, os, pathlib, sys
p = pathlib.Path(os.environ['MCP_FILE'])
if p.exists():
    try:
        obj = json.loads(p.read_text())
    except json.JSONDecodeError as e:
        raise SystemExit(f'Cannot edit invalid JSON in {p}: {e}')
else:
    obj = {}
if not isinstance(obj, dict):
    raise SystemExit('Existing mcp.json must be a JSON object.')
servers = obj.setdefault('servers', {})
if not isinstance(servers, dict):
    raise SystemExit('Existing mcp.json servers must be an object.')
servers['docker-remote'] = {
    'type': 'stdio',
    'command': os.environ['UVX_CMD'],
    'args': [*sys.argv[1:], 'docker-mcp-server'],
    'env': {
        'DOCKER_HOST': f"ssh://{os.environ['REMOTE']}",
        'DOCKER_MCP_SERVER_NO_DESTRUCTIVE': '1'
    }
}
# Preserve other VS Code MCP servers and unrelated settings.
p.write_text(json.dumps(obj, indent=2) + '\n')
PY

say 'Done'
printf 'Docker context: %s\nVS Code MCP config: %s\nRemote Docker: %s\n' "$CONTEXT" "$MCP_FILE" "$REMOTE"
printf '\nTry: docker --context %s ps\n' "$CONTEXT"
printf 'In VS Code, open the MCP servers view and start/restart "docker-remote".\n'
printf 'MCP is installed/launched in Coder via uvx; nothing is installed on the Mac.\n'
printf '\nNOTE: Docker grants host-level privileges. The MCP tool restriction is not a security boundary.\n'
