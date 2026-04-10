# Dotfiles

> Managed by [chezmoi](https://www.chezmoi.io/)

## Prerequisites (before `chezmoi apply`)

1. Install Xcode Command Line Tools: `xcode-select --install`
2. Sign into the Mac App Store (required for `mas` to install App Store apps)
3. Install and sign into [1Password](https://1password.com/downloads/mac/) — enable the SSH agent under Settings > Developer
4. Restore the age decryption key from 1Password to `~/.config/chezmoi/key.txt` (needed to decrypt fonts, AWS config, and shell history)
5. Run `gcloud auth login` if you need GCP access immediately

## Bootstrap

```sh
sh -c "$(curl -fsLS get.chezmoi.io)" -- init --apply barbados-clemens/dotfiles
```

## What it does

1. **01-install-homebrew** — Installs Homebrew (one-time)
2. **02-install-ohmyzsh** — Installs Oh-My-Zsh, plugins, and Powerlevel10k (one-time)
3. **03-install-packages** — `brew bundle` from `Brewfile` + `mise install` (re-runs on package changes)
4. **04-macos-defaults** — Applies macOS system preferences from `macos.yaml` (re-runs on settings changes)
5. **05-tool-defaults** — Sets npm config defaults (one-time)
6. **06-dock-layout** — Sets Dock apps from `dock.yaml` via dockutil (re-runs on dock changes)

Also restores: encrypted fonts to `~/Library/Fonts/`, 1Password CLI plugin configs, global gitignore, and all managed dotfiles.

## Post-install manual steps

- Sign into apps (Arc, Slack, Discord, Raycast, etc.)
- Raycast: restore settings via its built-in iCloud sync
- `gh auth login` (or let the 1Password CLI plugin handle it)

## Syncing current system state

```sh
./scripts/sync-homebrew.sh         # Dump Brewfile from installed packages
./scripts/sync-macos-defaults.sh   # Refresh macos.yaml from current defaults
./scripts/sync-dock.sh             # Capture current Dock layout
./scripts/sync-zsh-history.sh      # Archive recent zsh history (encrypted)
```

## Updating

```sh
# Re-add a file after local changes
chezmoi re-add ~/.zshrc

# Preview what would change
chezmoi diff

# Apply changes from repo
chezmoi apply
```

## Encryption

Sensitive files (AWS config, shell history, fonts) are encrypted with [age](https://github.com/FiloSottile/age). The age key must be at `~/.config/chezmoi/key.txt` before running `chezmoi apply`.
