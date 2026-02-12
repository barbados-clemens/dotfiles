#!/bin/bash
# Sync last 3 months of zsh history into chezmoi (encrypted with age)
# Usage: ./scripts/sync-zsh-history.sh

set -euo pipefail

HISTORY_FILE="$HOME/.zsh_history"
MONTHS=3

if [ ! -f "$HISTORY_FILE" ]; then
  echo "Error: $HISTORY_FILE not found"
  exit 1
fi

cutoff=$(date -v-${MONTHS}m +%s)
total=$(wc -l < "$HISTORY_FILE")

tmpfile=$(mktemp)
trap 'rm -f "$tmpfile"' EXIT

awk -v cutoff="$cutoff" '/^: [0-9]+:/ { ts=$2+0; keep=(ts >= cutoff) } keep { print }' "$HISTORY_FILE" > "$tmpfile"
trimmed=$(wc -l < "$tmpfile")

# Swap in trimmed history, re-add, restore original
cp "$HISTORY_FILE" "${HISTORY_FILE}.bak"
cp "$tmpfile" "$HISTORY_FILE"
chezmoi add --encrypt "$HISTORY_FILE"
cp "${HISTORY_FILE}.bak" "$HISTORY_FILE"
rm "${HISTORY_FILE}.bak"

echo "Synced $trimmed/$total lines (last ${MONTHS} months)"
