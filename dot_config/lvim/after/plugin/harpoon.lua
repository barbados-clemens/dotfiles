local mark = require("harpoon.mark")
local ui = require("harpoon.ui")

vim.keymap.set("n", "<leader>a", mark.add_file, { desc = "Harpoon File" })
vim.keymap.set("n", "<C-e>", ui.toggle_quick_menu, { desc = "Harpoon Menu" })
