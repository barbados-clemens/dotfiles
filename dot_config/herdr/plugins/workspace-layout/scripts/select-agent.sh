#!/usr/bin/env bash

set -u

agents=("$@")
if (( ${#agents[@]} == 0 )); then
  agents=(claude codex opencode)
fi

while true; do
  printf '\nChoose an agent:\n'
  for index in "${!agents[@]}"; do
    printf '  %d) %s\n' "$((index + 1))" "${agents[$index]}"
  done
  printf '  q) shell\n\n> '

  if ! read -r selection; then
    exit 0
  fi

  if [[ "$selection" == "q" || "$selection" == "Q" ]]; then
    exit 0
  fi

  if [[ "$selection" =~ ^[0-9]+$ ]]; then
    index=$((selection - 1))
    if (( index >= 0 && index < ${#agents[@]} )); then
      agent="${agents[$index]}"
      if ! command -v "$agent" >/dev/null 2>&1; then
        printf '%s is not installed or not on PATH\n' "$agent" >&2
        continue
      fi

      printf 'Starting %s...\n\n' "$agent"
      exec "$agent"
    fi
  fi

  printf 'Choose a listed number or q\n' >&2
done
