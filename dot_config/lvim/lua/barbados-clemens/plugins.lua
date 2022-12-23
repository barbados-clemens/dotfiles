-- Additional Plugin
lvim.builtin.alpha.active = true
lvim.builtin.dap.active = true -- (default: false)
lvim.builtin.terminal.active = true
lvim.plugins = {
  { 'theprimeagen/harpoon' },
  { 'mbbill/undotree' },
  {
    "folke/todo-comments.nvim",
    requires = "nvim-lua/plenary.nvim",
    config = function()
      require("todo-comments").setup {
        -- your configuration comes here
      }
    end
  },
  { "github/copilot.vim" },

  {
    "folke/trouble.nvim",
    cmd = "TroubleToggle",
  },
}
