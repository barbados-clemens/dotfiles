# Dotfiles

> Managed by [chezmoi](https://www.chezmoi.io/)

## Prerequisites

1. Install Xcode Command Line Tools: `xcode-select --install`
2. Restore age key to `~/.config/chezmoi/key.txt` (from 1Password or backup)

## Bootstrap

```sh
sh -c "$(curl -fsLS get.chezmoi.io)" -- init --apply barbados-clemens/dotfiles
```

## What it does

1. **01-install-homebrew** — Installs Homebrew (one-time)
2. **02-install-ohmyzsh** — Installs Oh-My-Zsh, plugins, and Powerlevel10k (one-time)
3. **03-install-packages** — `brew bundle` from `packages.yaml` + `mise install` (re-runs on package changes)
4. **04-macos-defaults** — Applies macOS system preferences from `macos.yaml` (re-runs on settings changes)

## Post-install manual steps

- Sign into 1Password and enable SSH agent
- `gh auth login`
- `npm login`
- Sign into apps (Arc, Slack, Discord, etc.)

## Updating

```sh
# Re-add a file after local changes
chezmoi re-add ~/.zshrc

# Preview what would change
chezmoi diff

# Apply changes from repo
chezmoi apply

# Sync macOS defaults after changing System Settings
./scripts/sync-macos-defaults.sh
```

## Encryption

Sensitive files (AWS config, shell history) are encrypted with [age](https://github.com/FiloSottile/age). The age key must be at `~/.config/chezmoi/key.txt` before running `chezmoi apply`.
