#!/usr/bin/env node

import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const moduleRoot = dirname(fileURLToPath(import.meta.url));
const delay = (milliseconds) =>
  new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function parseJson(value) {
  if (!value) {
    return undefined;
  }

  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

export function mergeConfig(base, override) {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return structuredClone(override);
  }

  const merged = structuredClone(base);
  for (const [key, value] of Object.entries(override)) {
    merged[key] =
      isPlainObject(value) && isPlainObject(merged[key])
        ? mergeConfig(merged[key], value)
        : structuredClone(value);
  }
  return merged;
}

function findWorkspaceId(value, seen = new Set()) {
  if (!isPlainObject(value) || seen.has(value)) {
    return undefined;
  }
  seen.add(value);

  if (typeof value.workspace_id === "string") {
    return value.workspace_id;
  }

  for (const nested of Object.values(value)) {
    if (isPlainObject(nested)) {
      const workspaceId = findWorkspaceId(nested, seen);
      if (workspaceId) {
        return workspaceId;
      }
    }
  }

  return undefined;
}

export function workspaceIdFromEnv(env) {
  if (env.HERDR_WORKSPACE_ID) {
    return env.HERDR_WORKSPACE_ID;
  }

  return (
    findWorkspaceId(parseJson(env.HERDR_PLUGIN_CONTEXT_JSON)) ??
    findWorkspaceId(parseJson(env.HERDR_PLUGIN_EVENT_JSON))
  );
}

function uniqueIds(items, kind) {
  const ids = new Set();
  for (const item of items) {
    if (typeof item.id !== "string" || item.id.length === 0) {
      throw new Error(`${kind} id must be a non-empty string`);
    }
    if (ids.has(item.id)) {
      throw new Error(`duplicate ${kind} id: ${item.id}`);
    }
    ids.add(item.id);
  }
  return ids;
}

export function normalizeConfig(input) {
  if (!isPlainObject(input) || input.version !== 1) {
    throw new Error("settings version must be 1");
  }
  if (!Array.isArray(input.tabs) || input.tabs.length === 0) {
    throw new Error("settings must contain at least one tab");
  }

  const config = structuredClone(input);
  config.onlyIfPristine ??= true;

  const tabIds = uniqueIds(config.tabs, "tab");
  const existingTabs = config.tabs.filter((tab) => tab.existing);
  if (existingTabs.length === 0) {
    config.tabs[0].existing = true;
  } else if (existingTabs.length > 1) {
    throw new Error("exactly one tab may use the existing workspace tab");
  }

  for (const tab of config.tabs) {
    tab.panes ??= [{ id: tab.id, existing: true }];
    if (!Array.isArray(tab.panes) || tab.panes.length === 0) {
      throw new Error(`tab ${tab.id} must contain at least one pane`);
    }

    const paneIds = uniqueIds(tab.panes, `pane in tab ${tab.id}`);
    const existingPanes = tab.panes.filter((pane) => pane.existing);
    if (existingPanes.length === 0) {
      tab.panes[0].existing = true;
    } else if (existingPanes.length > 1) {
      throw new Error(
        `exactly one pane in tab ${tab.id} may use the existing tab pane`,
      );
    }

    const rootPane = tab.panes.find((pane) => pane.existing);
    if (tab.panes[0] !== rootPane) {
      throw new Error(`the existing pane must be first in tab ${tab.id}`);
    }

    const availablePaneIds = new Set([rootPane.id]);
    for (const pane of tab.panes) {
      if (pane.existing) {
        continue;
      }

      pane.split ??= {};
      pane.split.direction ??= "right";
      pane.split.ratio ??= 0.5;
      pane.split.target ??= rootPane.id;

      if (!["right", "down"].includes(pane.split.direction)) {
        throw new Error(
          `pane ${pane.id} has unsupported split direction ${pane.split.direction}`,
        );
      }
      if (
        typeof pane.split.ratio !== "number" ||
        pane.split.ratio <= 0 ||
        pane.split.ratio >= 1
      ) {
        throw new Error(`pane ${pane.id} split ratio must be between 0 and 1`);
      }
      if (!paneIds.has(pane.split.target)) {
        throw new Error(
          `pane ${pane.id} targets unknown pane ${pane.split.target}`,
        );
      }
      if (!availablePaneIds.has(pane.split.target)) {
        throw new Error(
          `pane ${pane.id} split target ${pane.split.target} must appear earlier`,
        );
      }
      availablePaneIds.add(pane.id);
    }
  }

  config.focus ??= config.tabs[0].id;
  if (!tabIds.has(config.focus)) {
    throw new Error(`focus targets unknown tab ${config.focus}`);
  }

  return config;
}

export function normalizeSettings(input) {
  if (!isPlainObject(input) || input.version !== 1) {
    throw new Error("settings version must be 1");
  }

  if (!isPlainObject(input.layouts)) {
    return {
      version: 1,
      autoApplyWorktrees: input.autoApplyWorktrees ?? input.autoApply ?? true,
      defaultLayout: "default",
      layouts: {
        default: normalizeConfig(input),
      },
    };
  }

  const layoutEntries = Object.entries(input.layouts);
  if (layoutEntries.length === 0) {
    throw new Error("settings must contain at least one layout");
  }

  const defaultLayout = input.defaultLayout ?? layoutEntries[0][0];
  if (!Object.hasOwn(input.layouts, defaultLayout)) {
    throw new Error(`defaultLayout targets unknown layout ${defaultLayout}`);
  }

  const onlyIfPristine = input.onlyIfPristine ?? true;
  const layouts = {};
  for (const [layoutId, layout] of layoutEntries) {
    if (!isPlainObject(layout)) {
      throw new Error(`layout ${layoutId} must be an object`);
    }
    layouts[layoutId] = normalizeConfig({
      ...layout,
      version: 1,
      onlyIfPristine: layout.onlyIfPristine ?? onlyIfPristine,
    });
  }

  return {
    version: 1,
    autoApplyWorktrees: input.autoApplyWorktrees ?? true,
    defaultLayout,
    layouts,
  };
}

export function expandCommand(command, values) {
  return command.replace(
    /\{\{(workspace|workspace_id|plugin_root|config_dir|tab_id|pane_id)\}\}/g,
    (_, name) => values[name] ?? "",
  );
}

function parseCliResponse(stdout) {
  if (stdout.trim().length === 0) {
    return { type: "ok" };
  }

  const lines = stdout.trim().split(/\r?\n/).reverse();
  for (const line of lines) {
    try {
      const response = JSON.parse(line);
      if (response.error) {
        throw new Error(
          response.error.message ?? JSON.stringify(response.error),
        );
      }
      return response.result ?? response;
    } catch (error) {
      if (error instanceof SyntaxError) {
        continue;
      }
      throw error;
    }
  }
  throw new Error(`Herdr returned no JSON response: ${stdout.trim()}`);
}

export function createHerdrRunner(env) {
  const herdr = env.HERDR_BIN_PATH ?? "herdr";

  return (args) => {
    const result = spawnSync(herdr, args, {
      encoding: "utf8",
      env,
      timeout: 15_000,
    });

    if (result.error) {
      throw new Error(`unable to run Herdr: ${result.error.message}`);
    }
    if (result.status !== 0) {
      throw new Error(
        `Herdr ${args.join(" ")} failed: ${result.stderr.trim()}`,
      );
    }
    if (args[0] === "pane" && args[1] === "read") {
      return { type: "pane_text", text: result.stdout };
    }
    return parseCliResponse(result.stdout);
  };
}

function contextWorkspaceCwd(env) {
  const context = parseJson(env.HERDR_PLUGIN_CONTEXT_JSON);
  return typeof context?.workspace_cwd === "string"
    ? context.workspace_cwd
    : undefined;
}

function worktreeCheckoutPath(workspace) {
  const checkoutPath = workspace?.worktree?.checkout_path;
  return typeof checkoutPath === "string" && checkoutPath.length > 0
    ? checkoutPath
    : undefined;
}

export function loadSettings({ env, workspaceCwd, pluginRoot = moduleRoot }) {
  const configDir = env.HERDR_PLUGIN_CONFIG_DIR;
  const candidates = [
    join(pluginRoot, "settings.json"),
    configDir ? join(configDir, "settings.json") : undefined,
    workspaceCwd
      ? join(workspaceCwd, ".herdr", "workspace-layout.json")
      : undefined,
    env.HERDR_WORKSPACE_LAYOUT_CONFIG
      ? resolve(env.HERDR_WORKSPACE_LAYOUT_CONFIG)
      : undefined,
  ].filter(Boolean);

  let config = {};
  const sources = [];
  for (const path of [...new Set(candidates)]) {
    if (!existsSync(path)) {
      continue;
    }
    config = mergeConfig(config, readJson(path));
    sources.push(path);
  }

  if (sources.length === 0) {
    throw new Error("no workspace layout settings file found");
  }

  return { settings: normalizeSettings(config), sources };
}

function workspaceSnapshot(runHerdr, workspaceId) {
  const workspaceResult = runHerdr(["workspace", "get", workspaceId]);
  const panesResult = runHerdr([
    "pane",
    "list",
    "--workspace",
    workspaceId,
  ]);
  return {
    workspace: workspaceResult.workspace ?? workspaceResult,
    panes: panesResult.panes ?? [],
  };
}

function createdPane(result) {
  const pane = result.pane ?? result.root_pane ?? result.created_pane;
  if (!pane?.pane_id) {
    throw new Error(`Herdr did not return a created pane: ${JSON.stringify(result)}`);
  }
  return pane;
}

function createdTab(result) {
  const tab = result.tab ?? result.created_tab;
  if (!tab?.tab_id) {
    throw new Error(`Herdr did not return a created tab: ${JSON.stringify(result)}`);
  }
  return { tab, pane: createdPane(result) };
}

async function waitForPaneShells(runHerdr, paneIds) {
  const pending = new Set(paneIds);

  for (let attempt = 0; attempt < 50 && pending.size > 0; attempt += 1) {
    for (const paneId of pending) {
      const result = runHerdr([
        "pane",
        "read",
        paneId,
        "--source",
        "visible",
        "--lines",
        "5",
        "--format",
        "text",
      ]);
      if (result.text?.trim()) {
        pending.delete(paneId);
      }
    }

    if (pending.size > 0) {
      await delay(100);
    }
  }

  if (pending.size > 0) {
    throw new Error(
      `pane shells did not become ready: ${[...pending].join(", ")}`,
    );
  }
}

export async function applyWorkspaceLayout({
  env,
  runHerdr,
  config: suppliedConfig,
  layoutId: suppliedLayoutId,
  workspaceId: suppliedWorkspaceId,
  reuseInitialTab = false,
  log = () => {},
}) {
  const workspaceId = suppliedWorkspaceId ?? workspaceIdFromEnv(env);
  if (!workspaceId) {
    throw new Error("Herdr did not provide a workspace id");
  }

  let snapshot;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    snapshot = workspaceSnapshot(runHerdr, workspaceId);
    if (
      snapshot.workspace.active_tab_id &&
      snapshot.panes.some(
        (pane) => pane.tab_id === snapshot.workspace.active_tab_id,
      )
    ) {
      break;
    }
    await delay(100);
  }

  const initialTabId = snapshot.workspace.active_tab_id;
  const initialPane = snapshot.panes.find(
    (pane) => pane.tab_id === initialTabId,
  );
  if (!initialPane) {
    throw new Error("workspace has no initial pane");
  }

  const contextCwd = contextWorkspaceCwd(env);
  const checkoutPath = worktreeCheckoutPath(snapshot.workspace);
  const workspaceCwd =
    (env.HERDR_PLUGIN_EVENT ? checkoutPath ?? contextCwd : undefined) ??
    initialPane.foreground_cwd ??
    contextCwd ??
    checkoutPath ??
    initialPane.cwd;
  if (!workspaceCwd) {
    throw new Error("workspace has no working directory");
  }

  let config;
  let layoutId;
  let sources;
  if (suppliedConfig) {
    config = normalizeConfig(suppliedConfig);
    layoutId = suppliedLayoutId ?? "supplied";
    sources = ["supplied"];
  } else {
    const loaded = loadSettings({ env, workspaceCwd });
    if (env.HERDR_PLUGIN_EVENT && !loaded.settings.autoApplyWorktrees) {
      return {
        status: "skipped",
        reason: "automatic worktree layouts are disabled",
      };
    }

    layoutId = suppliedLayoutId ?? loaded.settings.defaultLayout;
    config = loaded.settings.layouts[layoutId];
    if (!config) {
      throw new Error(`unknown workspace layout: ${layoutId}`);
    }
    sources = loaded.sources;
  }

  if (
    config.onlyIfPristine &&
    (snapshot.workspace.tab_count !== 1 || snapshot.workspace.pane_count !== 1)
  ) {
    return {
      status: "skipped",
      reason: "workspace is not pristine",
    };
  }

  const tabs = new Map();
  const commands = [];

  for (const tabConfig of config.tabs) {
    let tabId;
    let rootPane;

    if (tabConfig.existing && reuseInitialTab) {
      tabId = initialTabId;
      rootPane = initialPane;
      if (tabConfig.label) {
        runHerdr(["tab", "rename", tabId, tabConfig.label]);
      }
    } else {
      const args = [
        "tab",
        "create",
        "--workspace",
        workspaceId,
        "--cwd",
        workspaceCwd,
        "--no-focus",
      ];
      if (tabConfig.label) {
        args.push("--label", tabConfig.label);
      }
      ({ tab: { tab_id: tabId }, pane: rootPane } = createdTab(
        runHerdr(args),
      ));
    }

    tabs.set(tabConfig.id, tabId);
    const panes = new Map();

    for (const paneConfig of tabConfig.panes) {
      let pane;
      if (paneConfig.existing) {
        pane = rootPane;
      } else {
        const target = panes.get(paneConfig.split.target);
        if (!target) {
          throw new Error(
            `pane ${paneConfig.id} targets a pane that has not been created yet`,
          );
        }
        pane = createdPane(
          runHerdr([
            "pane",
            "split",
            target.pane_id,
            "--direction",
            paneConfig.split.direction,
            "--ratio",
            String(paneConfig.split.ratio),
            "--cwd",
            workspaceCwd,
            "--no-focus",
          ]),
        );
      }

      panes.set(paneConfig.id, pane);
      if (paneConfig.label) {
        runHerdr(["pane", "rename", pane.pane_id, paneConfig.label]);
      }
      if (paneConfig.command) {
        commands.push({
          command: paneConfig.command,
          paneId: pane.pane_id,
          tabId,
        });
      }
    }
  }

  await waitForPaneShells(
    runHerdr,
    [...new Set(commands.map((entry) => entry.paneId))],
  );

  for (const entry of commands) {
    const command = expandCommand(entry.command, {
      workspace: workspaceCwd,
      workspace_id: workspaceId,
      plugin_root: env.HERDR_PLUGIN_ROOT ?? moduleRoot,
      config_dir: env.HERDR_PLUGIN_CONFIG_DIR ?? "",
      tab_id: entry.tabId,
      pane_id: entry.paneId,
    });
    runHerdr(["pane", "run", entry.paneId, command]);
  }

  if (snapshot.workspace.focused !== false) {
    runHerdr(["tab", "focus", tabs.get(config.focus)]);
  }
  log(`applied ${layoutId} from ${sources.join(", ")}`);

  return {
    status: "applied",
    layoutId,
    workspaceId,
    workspaceCwd,
    tabs: Object.fromEntries(tabs),
    sources,
  };
}

function acquireWorkspaceLock(env, workspaceId) {
  const stateDir = env.HERDR_PLUGIN_STATE_DIR;
  if (!stateDir) {
    return () => {};
  }

  mkdirSync(stateDir, { recursive: true });
  const lockPath = join(
    stateDir,
    `workspace-${workspaceId.replaceAll(/[^A-Za-z0-9_-]/g, "_")}.lock`,
  );

  const openLock = () => {
    const fd = openSync(lockPath, "wx");
    writeFileSync(fd, `${process.pid}\n`);
    closeSync(fd);
  };

  try {
    openLock();
  } catch (error) {
    if (error.code !== "EEXIST") {
      throw error;
    }

    const age = Date.now() - statSync(lockPath).mtimeMs;
    if (age <= 5 * 60_000) {
      return undefined;
    }
    rmSync(lockPath);
    openLock();
  }

  return () => rmSync(lockPath, { force: true });
}

async function main() {
  const env = process.env;
  const workspaceId = workspaceIdFromEnv(env);
  if (!workspaceId) {
    throw new Error("this action must run in a Herdr workspace");
  }

  const releaseLock = acquireWorkspaceLock(env, workspaceId);
  if (!releaseLock) {
    process.stdout.write(
      `${JSON.stringify({ status: "skipped", reason: "layout already running" })}\n`,
    );
    return;
  }

  try {
    const result = await applyWorkspaceLayout({
      env,
      runHerdr: createHerdrRunner(env),
      layoutId: process.argv[3],
      workspaceId,
      reuseInitialTab: process.argv[2] === "event",
      log: (message) => process.stderr.write(`workspace layout: ${message}\n`),
    });
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } finally {
    releaseLock();
  }
}

if (resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`workspace layout: ${error.message}\n`);
    process.exitCode = 1;
  });
}
