if true then
  return {}
end
return {
  "nvim-neotest/neotest",
  dependencies = {
    "nvim-neotest/neotest-jest",
    "marilari88/neotest-vitest",
  },
  opts = {
    adapters = { ["neotest-jest"] = {}, ["neotest-vitest"] = {} },
  },
}
