-- examples for your init.lua

-- disable netrw at the very start of your init.lua (strongly advised)
vim.g.loaded_netrw = 1
vim.g.loaded_netrwPlugin = 1


vim.keymap.set("n", "<leader>e", vim.cmd.NvimTreeToggle)

-- OR setup with some options
require("nvim-tree").setup({
    update_focused_file =  {
        enable = true
    },
    view = {
        adaptive_size = true,
        centralize_selection = true,
    },
    renderer = {
        highlight_opened_files = "all",
        highlight_git = true,
        group_empty = true,
    },
})
