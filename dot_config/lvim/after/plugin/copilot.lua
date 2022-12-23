vim.g.copilot_no_tab_map = true
vim.g.copilot_assume_mapped = true
-- vim.g.copilot_tab_fallback = ""

-- -- Mapped to alt+\
-- vim.api.nvim_set_keymap("i", "<A-\\>", 'copilot#Accept("<CR>")', { silent = true, expr = true })
-- Ctrl+\
vim.keymap.set("i", "<C-n>", 'copilot#Accept("<CR>")', { silent = true, expr = true })
