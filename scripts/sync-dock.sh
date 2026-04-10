#!/bin/bash
# Sync current Dock layout into .chezmoidata/dock.yaml
# Usage: ./scripts/sync-dock.sh

set -euo pipefail

if ! command -v dockutil &>/dev/null; then
  echo "Error: dockutil not found (brew install dockutil)"
  exit 1
fi

CHEZMOI_DIR="${CHEZMOI_SOURCE_DIR:-$(chezmoi source-path)}"
DATA_FILE="$CHEZMOI_DIR/.chezmoidata/dock.yaml"

{
  echo "dock:"
  echo "  apps:"
  dockutil --list | while IFS=$'\t' read -r name path rest; do
    # Extract the file:// path and convert to local path
    app_path=$(echo "$path" | sed 's|file://||' | python3 -c "import sys, urllib.parse; print(urllib.parse.unquote(sys.stdin.read().strip()))")
    echo "    - $app_path"
  done
} > "$DATA_FILE"

echo "Updated $DATA_FILE"
