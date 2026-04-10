# Global rules

- Push back on requests if there's a simpler or better approach. Ask clarifying questions when the intent is ambiguous.
- For non-trivial tasks, outline a plan before starting. Skip planning for simple lookups, reads, or single-step changes.
- After completing multi-step work, verify the result actually meets the original request (run tests, re-read changed files, etc.).
- After completing multi-step work from a plan, run `/simplify` to review changed code for reuse, quality, and efficiency.

## Secrets

- Pylon API key: retrieve via `op read "op://Private/Pylon API Key/password"` — never hardcode or store in plaintext.

## Tool preferences

- When running shell commands, use `rg` (ripgrep) instead of `grep` for searching file contents.
