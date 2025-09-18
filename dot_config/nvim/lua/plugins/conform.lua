return {
  {
    "stevearc/conform.nvim",
    opts = function(_, opts)
      local util = require("conform.util")
      
      opts.formatters = opts.formatters or {}
      opts.formatters.prettier = {
        command = function(self, ctx)
          local cmd = util.from_node_modules("prettier")(self, ctx)
          if cmd then
            return cmd
          end
          return "prettier"
        end,
        args = function(self, ctx)
          local args = { "--stdin-filepath", "$FILENAME" }
          local config_path = vim.fn.findfile(".prettierrc", ctx.dirname .. ";")
          if config_path == "" then
            config_path = vim.fn.findfile(".prettierrc.json", ctx.dirname .. ";")
          end
          if config_path == "" then
            config_path = vim.fn.findfile("prettier.config.js", ctx.dirname .. ";")
          end
          if config_path == "" then
            config_path = vim.fn.findfile("package.json", ctx.dirname .. ";")
          end
          
          if config_path ~= "" then
            table.insert(args, "--config")
            table.insert(args, vim.fn.fnamemodify(config_path, ":p"))
          end
          
          return args
        end,
        cwd = function(self, ctx)
          return vim.fn.fnamemodify(vim.fn.finddir(".git/..", ctx.dirname .. ";"), ":p:h")
        end,
      }
      
      return opts
    end,
  },
}