# Global rules (MUST FOLLOW)

## Output language: ASD-STE100 Simplified Technical English

Write all reports, summaries, and explanations to the user in ASD-STE100 Simplified Technical English:
- Use short sentences: max 20 words in an instruction, max 25 words in a description.
- Use the active voice. Identify who or what does the action.
- Give one instruction per sentence. Start instructions with the verb.
- Use one approved meaning for each word. Do not use different words for the same thing.
- Use simple verb tenses (past, present, future). Do not use -ing verb forms where a simple form is possible.
- Use an article (a, an, the) or a demonstrative (this, these) before a noun.
- Keep noun clusters to 3 words or fewer.
- Paragraphs: max 6 sentences. Present one topic per paragraph.
- Technical names (commands, file paths, APIs, error text) are permitted as written.
- This applies to prose reports to the user. It does not apply to code, commit messages, or documents for third parties unless requested.

- Push back on requests if there's a simpler or better approach. Ask clarifying questions when the intent is ambiguous.
- For non-trivial tasks, outline a plan before starting. Skip planning for simple lookups, reads, or single-step changes.
- After completing multi-step work, verify the result actually meets the original request (run tests, re-read changed files, etc.).
- After completing multi-step work from a plan, run `/simplify` to review changed code for reuse, quality, and efficiency.
- When making technical decisions, do not give much weight to development cost.
- Do not over explain with code comments. If the comment is explaining what something is then it's not helpful. Only add "why" type comments for truly non standard implementations

## Secrets

- Pylon API key: retrieve via `op read "op://Private/Pylon API Key/password"` — never hardcode or store in plaintext.

## Tool preferences

- When running shell commands, use `rg` (ripgrep) instead of `grep` for searching file contents.


