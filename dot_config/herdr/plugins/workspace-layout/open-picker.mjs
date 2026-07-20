#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const env = process.env;
const herdr = env.HERDR_BIN_PATH ?? "herdr";
const pluginId = env.HERDR_PLUGIN_ID ?? "caleb.workspace-layout";
const result = spawnSync(
  herdr,
  [
    "plugin",
    "pane",
    "open",
    "--plugin",
    pluginId,
    "--entrypoint",
    "picker",
  ],
  {
    encoding: "utf8",
    env,
  },
);

if (result.error) {
  process.stderr.write(`workspace layout: ${result.error.message}\n`);
  process.exit(1);
}
if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

process.stdout.write(result.stdout);
