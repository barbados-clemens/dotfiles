# Herdr workspace layout

This local Herdr plugin automatically applies a configurable layout to new Git
worktrees. Ordinary workspaces are left alone until a layout is selected from
the popup picker.

Press `prefix+shift+l` to open the picker. It applies the selected layout using
the focused pane's current directory, so it is safe to `cd` before choosing.
Manually selected layouts are created in new tabs and never send commands to
pre-existing panes. Automatic worktree layouts reuse the worktree's initial
shell.

The default [settings.json](./settings.json) provides:

- `Agent + terminal` — agent picker plus a setup terminal
- `Agent only` — one tab with the agent picker
- `Terminal only` — one normal terminal tab

New worktrees automatically use `defaultLayout`.

The setup script currently handles:

- `mise.toml` or `.mise.toml`: `mise install`
- `pnpm-lock.yaml`: `pnpm install --frozen-lockfile`
- `bun.lock` or `bun.lockb`: `bun install --frozen-lockfile`
- `yarn.lock`: `yarn install --frozen-lockfile`
- `package-lock.json`: `npm ci`
- `uv.lock`: `uv sync --frozen`
- `Cargo.toml`: `cargo install` (warning only if it fails)

Only one JavaScript package manager runs when multiple lockfiles exist.
Bootstrap steps marked with `allowFailure: true` report a warning and allow the
remaining setup steps to continue. Unmarked steps remain required.

## Settings

The bundled `settings.json` is the global default. Override it with either:

- `.herdr/workspace-layout.json` in a project
- `$HERDR_PLUGIN_CONFIG_DIR/settings.json`
- a file named by `HERDR_WORKSPACE_LAYOUT_CONFIG`

Objects are merged and arrays are replaced, so a project can replace one named
layout's `tabs` array while inheriting the global settings.

Each tab contains one existing root pane and may add splits:

```json
{
  "version": 1,
  "defaultLayout": "development",
  "layouts": {
    "development": {
      "label": "Agent + server",
      "tabs": [
        {
          "id": "agent",
          "existing": true,
          "panes": [
            {
              "id": "agent",
              "existing": true,
              "command": "codex"
            },
            {
              "id": "server",
              "command": "pnpm dev",
              "split": {
                "target": "agent",
                "direction": "right",
                "ratio": 0.4
              }
            }
          ]
        }
      ]
    }
  }
}
```

Commands support these placeholders:

- `{{workspace}}`
- `{{workspace_id}}`
- `{{plugin_root}}`
- `{{config_dir}}`
- `{{tab_id}}`
- `{{pane_id}}`

The agent picker choices are arguments to `scripts/select-agent.sh`. For
example:

```json
{
  "command": "bash \"{{plugin_root}}/scripts/select-agent.sh\" codex opencode claude"
}
```

Set `autoApplyWorktrees` to `false` to disable the automatic worktree layout.
With `onlyIfPristine` enabled, the plugin will not add duplicate tabs or panes
to an already-configured workspace.

## Development

```sh
node --test
herdr plugin link ~/.config/herdr/plugins/workspace-layout
herdr plugin log list --plugin caleb.workspace-layout
```
