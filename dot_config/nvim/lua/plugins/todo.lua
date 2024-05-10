-- FIX:  = {icon = " ", color = "error", alt = { "FIXME", "BUG", "FIXIT", "ISSUE" }, signs = false},
-- TODO: = { icon = " ", color = "info" },
-- HACK: = { icon = " ", color = "warning" },
-- WARN: = { icon = " ", color = "warning", alt = { "WARNING", "XXX" } },
-- PERF: = { icon = " ", alt = { "OPTIM", "PERFORMANCE", "OPTIMIZE" } },
-- NOTE: = { icon = " ", color = "hint", alt = { "INFO" } },
-- TEST: = { icon = "⏲ ", color = "test", alt = { "TESTING", "PASSED", "FAILED" } },

-- FIX(caleb):  = {icon = " ", color = "error", alt = { "FIXME", "BUG", "FIXIT", "ISSUE" }, signs = false},
-- TODO(caleb): = { icon = " ", color = "info" },
-- HACK(caleb): = { icon = " ", color = "warning" },
-- WARN(caleb): = { icon = " ", color = "warning", alt = { "WARNING", "XXX" } },
-- PERF(caleb): = { icon = " ", alt = { "OPTIM", "PERFORMANCE", "OPTIMIZE" } },
-- NOTE(caleb): = { icon = " ", color = "hint", alt = { "INFO" } },
-- TEST(caleb): = { icon = "⏲ ", color = "test", alt = { "TESTING", "PASSED", "FAILED" } },

return {
  "folke/todo-comments.nvim",
  dependencies = { "nvim-lua/plenary.nvim" },
  opts = {
    highlight = {
      before = "fg", -- "fg" or "bg" or empty
      keyword = "bg", -- "fg", "bg", "wide" or empty. (wide is the same as bg, but will also highlight surrounding characters)
      after = "bg", -- "fg" or "bg" or empty
      pattern = [[.*<(KEYWORDS)(\([^\)]*\))?:]],
      comments_only = true, -- uses treesitter to match keywords in comments only
      max_line_len = 400, -- ignore lines longer than this
      exclude = {}, -- list of file types to exclude highlighting
    },
    search = {
      command = "rg",
      args = {
        "--color=never",
        "--no-heading",
        "--with-filename",
        "--line-number",
        "--column",
      },
      pattern = [[\b(KEYWORDS)(\([^\)]*\))?:]],
    },
  },
}
