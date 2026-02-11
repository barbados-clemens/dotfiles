#!/bin/bash
# Sync current macOS defaults into .chezmoidata/macos.yaml
# Usage: ./scripts/sync-macos-defaults.sh
#
# Reads the existing macos.yaml to know which domain/key/type entries to query,
# then writes updated values back. The key list is defined once in the YAML —
# this script just refreshes values from the current system.

set -euo pipefail

CHEZMOI_DIR="${CHEZMOI_SOURCE_DIR:-$(chezmoi source-path)}"
DATA_FILE="$CHEZMOI_DIR/.chezmoidata/macos.yaml"

if [ ! -f "$DATA_FILE" ]; then
  echo "Error: $DATA_FILE not found"
  exit 1
fi

normalize_bool() {
  case "$1" in
    1|true)  echo "true" ;;
    0|false) echo "false" ;;
    *)       echo "$1" ;;
  esac
}

tmpfile=$(mktemp)
trap 'rm -f "$tmpfile"' EXIT

# Write header
cat > "$tmpfile" <<'HEADER'
macos:
  defaults:
HEADER

section="defaults"
while IFS= read -r line; do
  # Detect section changes
  if [[ "$line" =~ ^[[:space:]]+sudo_defaults: ]]; then
    section="sudo_defaults"
    echo "  sudo_defaults:" >> "$tmpfile"
    continue
  elif [[ "$line" =~ ^[[:space:]]+post_commands: ]]; then
    section="post_commands"
    echo "  post_commands:" >> "$tmpfile"
    continue
  fi

  # Pass through comments and post_commands lines
  if [[ "$section" == "post_commands" ]]; then
    echo "$line" >> "$tmpfile"
    continue
  fi

  # Extract domain/key/type from YAML entry lines
  if [[ "$line" =~ ^[[:space:]]+#.* ]]; then
    echo "$line" >> "$tmpfile"
    continue
  fi

  if [[ ! "$line" =~ domain ]]; then
    continue
  fi

  domain=$(echo "$line" | sed -n 's/.*domain: *"\([^"]*\)".*/\1/p')
  key=$(echo "$line" | sed -n 's/.*key: *"\([^"]*\)".*/\1/p')
  type=$(echo "$line" | sed -n 's/.*type: *"\([^"]*\)".*/\1/p')

  if [ -z "$domain" ] || [ -z "$key" ] || [ -z "$type" ]; then
    continue
  fi

  # Read current value from system
  if [[ "$section" == "sudo_defaults" ]]; then
    current=$(sudo defaults read "$domain" "$key" 2>/dev/null) || current=""
  else
    current=$(defaults read "$domain" "$key" 2>/dev/null) || current=""
  fi

  if [ -z "$current" ]; then
    echo "    # WARNING: Could not read $domain $key — keeping original" >> "$tmpfile"
    echo "$line" >> "$tmpfile"
    continue
  fi

  # Normalize booleans
  if [ "$type" = "bool" ]; then
    current=$(normalize_bool "$current")
  fi

  echo "    - { domain: \"$domain\", key: \"$key\", type: \"$type\", value: \"$current\" }" >> "$tmpfile"
done < "$DATA_FILE"

cp "$tmpfile" "$DATA_FILE"
echo "Updated $DATA_FILE with current system values."
