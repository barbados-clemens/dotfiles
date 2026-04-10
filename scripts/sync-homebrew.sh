#!/bin/bash
# Sync currently installed Homebrew items into ~/Brewfile (managed by chezmoi)
# Usage: ./scripts/sync-homebrew.sh

set -euo pipefail

if ! command -v brew &>/dev/null; then
  echo "Error: brew not found"
  exit 1
fi

brew bundle dump --force --file "$HOME/Brewfile"
chezmoi add "$HOME/Brewfile"

echo "Synced Brewfile"
