#!/usr/bin/env bash

set -u

agents=("$@")
if (( ${#agents[@]} == 0 )); then
  agents=(pi claude)
fi

resolve_agent() {
  local agent="$1"
  local executable

  executable="$(command -v "$agent" 2>/dev/null || true)"
  if [[ -n "$executable" ]]; then
    printf '%s\n' "$executable"
    return 0
  fi

  if [[ -n "${HOME:-}" ]] && command -v mise >/dev/null 2>&1; then
    executable="$(mise which -C "$HOME" "$agent" 2>/dev/null || true)"
    if [[ -n "$executable" && -x "$executable" ]]; then
      printf '%s\n' "$executable"
      return 0
    fi
  fi

  return 1
}

while true; do
  printf '\nChoose an agent:\n'
  for index in "${!agents[@]}"; do
    if (( index == 0 )); then
      printf '  %d) %s (default)\n' "$((index + 1))" "${agents[$index]}"
    else
      printf '  %d) %s\n' "$((index + 1))" "${agents[$index]}"
    fi
  done
  printf '  q) shell\n\n> '

  if ! read -r selection; then
    exit 0
  fi

  if [[ -z "$selection" ]]; then
    selection=1
  fi

  if [[ "$selection" == "q" || "$selection" == "Q" ]]; then
    exit 0
  fi

  if [[ "$selection" =~ ^[0-9]+$ ]]; then
    index=$((selection - 1))
    if (( index >= 0 && index < ${#agents[@]} )); then
      agent="${agents[$index]}"
      if ! executable="$(resolve_agent "$agent")"; then
        printf '%s is not installed or available through mise\n' "$agent" >&2
        continue
      fi

      printf 'Starting %s...\n\n' "$agent"
      exec "$executable"
    fi
  fi

  printf 'Choose a listed number or q\n' >&2
done
