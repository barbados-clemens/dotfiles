if true then
  return {}
end
return {
  {
    "neovim/nvim-lspconfig",
    opts = {
      inlay_hints = { enabled = false },
    },
  },
  { "rcarriga/nvim-notify", enabled = false },
  {
    "L3MON4D3/LuaSnip",
    keys = function()
      return {}
    end,
  },
}
