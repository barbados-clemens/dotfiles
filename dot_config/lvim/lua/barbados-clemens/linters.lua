-- each linter accepts a list of options identical to https://github.com/jose-elias-alvarez/null-ls.nvim/blob/main/doc/BUILTINS.md#Configuration
local linters = require "lvim.lsp.null-ls.linters"
linters.setup {
  { command = "eslint" },
  -- {
  --   command = "shellcheck",
  --   extra_args = { "--severity", "warning" },
  -- },
  -- {
  --   command = "codespell",
  --   filetypes = { "javascript", "python", "typescript", "typescriptreact" },
  -- },
}
