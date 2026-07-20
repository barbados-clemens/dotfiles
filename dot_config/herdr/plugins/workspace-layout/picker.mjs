#!/usr/bin/env node

import { createInterface } from "node:readline/promises";

import {
  applyWorkspaceLayout,
  createHerdrRunner,
  loadSettings,
  workspaceIdFromEnv,
} from "./index.mjs";

const env = process.env;
const runHerdr = createHerdrRunner(env);
const workspaceId = workspaceIdFromEnv(env);

if (!workspaceId) {
  process.stderr.write("workspace layout: no active workspace\n");
  process.exit(1);
}

const panesResult = runHerdr(["pane", "list", "--workspace", workspaceId]);
const panes = panesResult.panes ?? [];
const pane =
  panes.find((candidate) => candidate.focused) ??
  panes.find((candidate) => candidate.pane_id === env.HERDR_PANE_ID) ??
  panes[0];
const workspaceCwd = pane?.foreground_cwd ?? pane?.cwd;

if (!workspaceCwd) {
  process.stderr.write("workspace layout: no active workspace directory\n");
  process.exit(1);
}

const { settings } = loadSettings({ env, workspaceCwd });
const layouts = Object.entries(settings.layouts);
const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

process.stdout.write("\nChoose a workspace layout:\n");
for (const [index, [layoutId, layout]] of layouts.entries()) {
  process.stdout.write(
    `  ${index + 1}) ${layout.label ?? layoutId}${
      layoutId === settings.defaultLayout ? " (default)" : ""
    }\n`,
  );
}
process.stdout.write("  q) cancel\n\n");

const answer = (await readline.question("> ")).trim();
readline.close();

if (answer.toLowerCase() === "q") {
  process.exit(0);
}

let layoutId = settings.defaultLayout;
if (answer.length > 0) {
  const selectedIndex = Number.parseInt(answer, 10) - 1;
  if (
    !Number.isInteger(selectedIndex) ||
    selectedIndex < 0 ||
    selectedIndex >= layouts.length
  ) {
    process.stderr.write("workspace layout: invalid selection\n");
    process.exit(1);
  }
  [layoutId] = layouts[selectedIndex];
}

const result = await applyWorkspaceLayout({
  env,
  runHerdr,
  layoutId,
  workspaceId,
});

if (result.status === "skipped") {
  process.stderr.write(`workspace layout: ${result.reason}\n`);
} else {
  process.stdout.write(`\nApplied ${settings.layouts[layoutId].label ?? layoutId}\n`);
}
