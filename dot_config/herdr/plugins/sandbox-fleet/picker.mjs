#!/usr/bin/env node
// Sandbox fleet popup: list/dispatch/join/delete workdir microVM sandboxes.
// Joining creates a workspace in the CURRENT herdr session whose pane plain-
// SSHes into the guest (no nested herdr — Caleb prefers chrome-free panes).

import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { homedir } from "node:os";

const env = {
  ...process.env,
  PATH: `/opt/homebrew/bin:${process.env.PATH ?? ""}`,
};
const herdrBin = env.HERDR_BIN_PATH ?? "herdr";
const sbxBin = env.SBX_BIN ?? `${homedir()}/Personal/workdir-unraid-poc/sbx`;
// Panes talk straight to the fleet gateway — nothing client-specific inside.
const tower = env.SBX_TOWER ?? "root@tower.local";
const sbxd = env.SBX_SBXD ?? "/mnt/cache/appdata/workdir-dispatch/sbxd";

function herdr(args) {
  const result = spawnSync(herdrBin, args, { encoding: "utf8", env, timeout: 15_000 });
  if (result.error) throw new Error(`herdr: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`herdr ${args.join(" ")}: ${result.stderr.trim()}`);
  try {
    const parsed = JSON.parse(result.stdout);
    return parsed.result ?? parsed;
  } catch {
    return { raw: result.stdout };
  }
}

// Streams output into the popup so dispatch/teardown progress is visible.
function sbx(args) {
  const result = spawnSync(sbxBin, args, { stdio: "inherit", env });
  return result.status === 0;
}

function sbxJson(args) {
  const result = spawnSync(sbxBin, args, { encoding: "utf8", env });
  if (result.status !== 0) throw new Error(`sbx ${args.join(" ")}: ${result.stderr.trim()}`);
  return JSON.parse(result.stdout);
}

function findValue(value, key, seen = new Set()) {
  if (value === null || typeof value !== "object" || seen.has(value)) return undefined;
  seen.add(value);
  if (typeof value[key] === "string") return value[key];
  for (const nested of Object.values(value)) {
    const found = findValue(nested, key, seen);
    if (found) return found;
  }
  return undefined;
}

function fleetWorkspaces() {
  const list = herdr(["workspace", "list"]);
  const workspaces = list.workspaces ?? [];
  return new Map(
    workspaces
      .filter((ws) => (ws.label ?? "").startsWith("sbx-"))
      .map((ws) => [ws.label.slice(4), ws.workspace_id]),
  );
}

function loadTasks() {
  const tasks = sbxJson(["list", "--json"]);
  const joined = fleetWorkspaces();
  return tasks.map((task) => ({
    ...task,
    workspaceId: joined.get(task.task),
  }));
}

function render(tasks) {
  process.stdout.write("\x1b[2J\x1b[H"); // clear popup
  process.stdout.write("sandbox fleet\n\n");
  if (tasks.length === 0) {
    process.stdout.write("  (no sandboxes)\n");
  }
  for (const [index, task] of tasks.entries()) {
    const state = task.state ?? "?";
    const up = task.uptime_seconds ? ` ${Math.round(task.uptime_seconds / 60)}m` : "";
    const joined = task.workspaceId ? " *" : "";
    process.stdout.write(
      `  ${index + 1}) ${task.task.padEnd(12)} ${state}${up}${joined}\n`,
    );
  }
  process.stdout.write("\n  n) new       j #) join\n");
  process.stdout.write("  d #) delete  r #) resume\n");
  process.stdout.write("  q) quit      (* = joined)\n\n");
}

function joinTask(task) {
  if (task.workspaceId) {
    herdr(["workspace", "focus", task.workspaceId]);
    return;
  }
  const created = herdr([
    "workspace", "create",
    "--cwd", homedir(),
    "--label", `sbx-${task.task}`,
    "--focus",
  ]);
  const workspaceId = findValue(created, "workspace_id");
  if (!workspaceId) throw new Error("workspace create returned no workspace_id");
  const panes = herdr(["pane", "list", "--workspace", workspaceId]).panes ?? [];
  const pane = panes[0];
  if (!pane) throw new Error("new workspace has no pane");
  if (task.prompt) {
    // Headless task: stream the agent log (agent-watch in the guest, via the
    // gateway) — drops to a sandbox shell when the agent exits.
    herdr(["pane", "run", pane.pane_id, `exec ssh -t ${tower} ${sbxd} watch ${task.task}`]);
  } else {
    herdr(["pane", "run", pane.pane_id, `exec ssh -t ${tower} ${sbxd} shell ${task.task}`]);
  }
}

const readline = createInterface({ input: process.stdin, output: process.stdout });

async function confirm(question) {
  const answer = (await readline.question(`${question} [y/N] `)).trim().toLowerCase();
  return answer === "y" || answer === "yes";
}

function pickIndex(tasks, argument) {
  const index = Number.parseInt(argument, 10) - 1;
  if (Number.isNaN(index) || index < 0 || index >= tasks.length) return undefined;
  return tasks[index];
}

let running = true;
while (running) {
  let tasks;
  try {
    tasks = loadTasks();
  } catch (error) {
    process.stderr.write(`sandbox fleet: ${error.message}\n`);
    process.exit(1);
  }
  render(tasks);

  const answer = (await readline.question("> ")).trim();
  const [command, argument] = answer.split(/\s+/);

  try {
    switch (command) {
      case "q":
      case "":
        running = false;
        break;
      case "n": {
        const name = (await readline.question("task name (slug): ")).trim();
        if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
          process.stdout.write("  name must be a lowercase slug\n");
          await readline.question("(enter to continue)");
          break;
        }
        const prompt = (
          await readline.question("claude prompt (empty = interactive): ")
        ).trim();
        const args = ["dispatch", name];
        if (prompt) args.push("--prompt", prompt);
        process.stdout.write(`\ndispatching '${name}'...\n`);
        if (sbx(args)) {
          joinTask({ task: name, prompt });
          running = false;
        } else {
          await readline.question("dispatch failed (enter to continue)");
        }
        break;
      }
      case "j": {
        const task = pickIndex(tasks, argument);
        if (!task) break;
        joinTask(task);
        running = false;
        break;
      }
      case "d": {
        const task = pickIndex(tasks, argument);
        if (!task) break;
        if (!(await confirm(`teardown '${task.task}' (${task.id})?`))) break;
        if (task.workspaceId) {
          try { herdr(["workspace", "close", task.workspaceId]); } catch {}
        }
        sbx(["teardown", task.task]);
        await readline.question("(enter to continue)");
        break;
      }
      case "r": {
        const task = pickIndex(tasks, argument);
        if (!task) break;
        sbx(["resume", task.task]);
        await readline.question("(enter to continue)");
        break;
      }
      default:
        break;
    }
  } catch (error) {
    process.stderr.write(`sandbox fleet: ${error.message}\n`);
    await readline.question("(enter to continue)");
  }
}

readline.close();
