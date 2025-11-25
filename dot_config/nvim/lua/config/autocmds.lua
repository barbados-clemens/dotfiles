-- Autocmds are automatically loaded on the VeryLazy event
-- Default autocmds that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/autocmds.lua
--
-- Add any additional autocmds here
-- with `vim.api.nvim_create_autocmd`
--
-- Or remove existing autocmds by their group name (which is prefixed with `lazyvim_` for the defaults)
-- e.g. vim.api.nvim_del_augroup_by_name("lazyvim_wrap_spell")
--
--
vim.api.nvim_create_autocmd("FileType", {
  pattern = { "markdown" },
  callback = function()
    vim.b.autoformat = false
  end,
})

-- Associate .mdoc files with markdown filetype
vim.api.nvim_create_autocmd({ "BufRead", "BufNewFile" }, {
  pattern = "*.mdoc",
  callback = function()
    vim.bo.filetype = "markdown"
  end,
  desc = "Set .mdoc files as markdown",
})

-- Associate .jsonc files with jsonc filetype
vim.api.nvim_create_autocmd({ "BufRead", "BufNewFile" }, {
  pattern = "*.jsonc",
  callback = function()
    vim.bo.filetype = "jsonc"
  end,
  desc = "Set jsonc files as jsonc",
})
