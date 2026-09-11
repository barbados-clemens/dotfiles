import assert from "node:assert/strict";
import test from "node:test";

import {
  applyWorkspaceLayout,
  expandCommand,
  mergeConfig,
  normalizeConfig,
  normalizeSettings,
  workspaceIdFromEnv,
} from "../index.mjs";

const baseConfig = {
  version: 1,
  autoApply: true,
  onlyIfPristine: true,
  focus: "agent",
  tabs: [
    {
      id: "agent",
      label: "agent",
      existing: true,
      panes: [
        {
          id: "agent",
          label: "agent",
          existing: true,
          command: "claude",
        },
      ],
    },
    {
      id: "terminal",
      label: "terminal",
      panes: [
        {
          id: "terminal",
          label: "terminal",
          existing: true,
          command: "setup {{workspace}}",
        },
      ],
    },
  ],
};

test("finds workspace ids in event payloads", () => {
  assert.equal(
    workspaceIdFromEnv({
      HERDR_PLUGIN_EVENT_JSON: JSON.stringify({
        event: "workspace_created",
        data: { workspace: { workspace_id: "w9" } },
      }),
    }),
    "w9",
  );
});

test("merges project settings while replacing arrays", () => {
  assert.deepEqual(
    mergeConfig(
      { version: 1, automatic: { enabled: true }, tabs: ["one"] },
      { automatic: { enabled: false }, tabs: ["two"] },
    ),
    { version: 1, automatic: { enabled: false }, tabs: ["two"] },
  );
});

test("normalizes named layouts", () => {
  const settings = normalizeSettings({
    version: 1,
    defaultLayout: "agent",
    layouts: {
      agent: {
        label: "Agent",
        tabs: [{ id: "agent" }],
      },
      terminal: {
        label: "Terminal",
        tabs: [{ id: "terminal" }],
      },
    },
  });

  assert.equal(settings.defaultLayout, "agent");
  assert.deepEqual(Object.keys(settings.layouts), ["agent", "terminal"]);
  assert.equal(settings.layouts.agent.tabs[0].existing, true);
});

test("validates split targets", () => {
  assert.throws(
    () =>
      normalizeConfig({
        version: 1,
        tabs: [
          {
            id: "agent",
            panes: [
              { id: "root", existing: true },
              { id: "logs", split: { target: "missing" } },
            ],
          },
        ],
      }),
    /targets unknown pane/,
  );
});

test("requires split targets to be created first", () => {
  assert.throws(
    () =>
      normalizeConfig({
        version: 1,
        tabs: [
          {
            id: "agent",
            panes: [
              { id: "root", existing: true },
              { id: "logs", split: { target: "server" } },
              { id: "server", split: { target: "root" } },
            ],
          },
        ],
      }),
    /must appear earlier/,
  );
});

test("expands command placeholders", () => {
  assert.equal(
    expandCommand("run {{workspace}} in {{pane_id}}", {
      workspace: "/tmp/project",
      pane_id: "w1:p2",
    }),
    "run /tmp/project in w1:p2",
  );
});

test("applies two configured tabs and startup commands", async () => {
  const calls = [];
  const runHerdr = (args) => {
    calls.push(args);
    const command = args.slice(0, 2).join(" ");

    if (command === "workspace get") {
      return {
        workspace: {
          workspace_id: "w1",
          active_tab_id: "w1:t1",
          focused: true,
          tab_count: 1,
          pane_count: 1,
        },
      };
    }
    if (command === "pane list") {
      return {
        panes: [
          {
            workspace_id: "w1",
            tab_id: "w1:t1",
            pane_id: "w1:p1",
            cwd: "/tmp/project",
          },
        ],
      };
    }
    if (command === "pane read") {
      return { type: "pane_text", text: "ready" };
    }
    if (command === "tab create") {
      return {
        type: "tab_created",
        tab: { tab_id: "w1:t2" },
        root_pane: { pane_id: "w1:p2", tab_id: "w1:t2" },
      };
    }
    return { type: "ok" };
  };

  const result = await applyWorkspaceLayout({
    env: {
      HERDR_PLUGIN_ROOT: "/tmp/plugin",
      HERDR_WORKSPACE_ID: "w1",
    },
    runHerdr,
    config: baseConfig,
    reuseInitialTab: true,
  });

  assert.equal(result.status, "applied");
  assert.deepEqual(result.tabs, {
    agent: "w1:t1",
    terminal: "w1:t2",
  });
  assert.deepEqual(
    calls.filter((args) => args[0] === "pane" && args[1] === "run"),
    [
      ["pane", "run", "w1:p1", "claude"],
      ["pane", "run", "w1:p2", "setup /tmp/project"],
    ],
  );
  assert.deepEqual(calls.at(-1), ["tab", "focus", "w1:t1"]);
});

test("automatic worktree layouts use the checkout path", async () => {
  const calls = [];
  const runHerdr = (args) => {
    calls.push(args);
    const command = args.slice(0, 2).join(" ");

    if (command === "workspace get") {
      return {
        workspace: {
          workspace_id: "w1",
          active_tab_id: "w1:t1",
          focused: true,
          tab_count: 1,
          pane_count: 1,
          worktree: {
            checkout_path: "/tmp/ocean-can-we-snapshot",
          },
        },
      };
    }
    if (command === "pane list") {
      return {
        panes: [
          {
            workspace_id: "w1",
            tab_id: "w1:t1",
            pane_id: "w1:p1",
            foreground_cwd: "/Users/caleb/.oh-my-zsh",
            cwd: "/Users/caleb/.oh-my-zsh",
          },
        ],
      };
    }
    if (command === "tab create") {
      return {
        type: "tab_created",
        tab: { tab_id: "w1:t2" },
        root_pane: { pane_id: "w1:p2", tab_id: "w1:t2" },
      };
    }
    return { type: "ok" };
  };

  const result = await applyWorkspaceLayout({
    env: {
      HERDR_WORKSPACE_ID: "w1",
      HERDR_PLUGIN_EVENT: "worktree.created",
    },
    runHerdr,
    reuseInitialTab: true,
    config: {
      version: 1,
      focus: "terminal",
      tabs: [
        {
          id: "agent",
          existing: true,
          panes: [{ id: "agent", existing: true }],
        },
        {
          id: "terminal",
          panes: [{ id: "terminal", existing: true }],
        },
      ],
    },
  });

  assert.equal(result.workspaceCwd, "/tmp/ocean-can-we-snapshot");
  assert.deepEqual(
    calls.find((args) => args[0] === "tab" && args[1] === "create"),
    [
      "tab",
      "create",
      "--workspace",
      "w1",
      "--cwd",
      "/tmp/ocean-can-we-snapshot",
      "--no-focus",
    ],
  );
});

test("manual layouts never run commands in the pre-existing pane", async () => {
  const calls = [];
  let createdTab = 1;
  const runHerdr = (args) => {
    calls.push(args);
    const command = args.slice(0, 2).join(" ");

    if (command === "workspace get") {
      return {
        workspace: {
          workspace_id: "w1",
          active_tab_id: "w1:t1",
          focused: true,
          tab_count: 1,
          pane_count: 1,
          worktree: {
            checkout_path: "/tmp/worktree",
          },
        },
      };
    }
    if (command === "pane list") {
      return {
        panes: [
          {
            workspace_id: "w1",
            tab_id: "w1:t1",
            pane_id: "w1:p1",
            foreground_cwd: "/tmp/project",
            cwd: "/tmp/project",
          },
        ],
      };
    }
    if (command === "pane read") {
      return { type: "pane_text", text: "ready" };
    }
    if (command === "tab create") {
      createdTab += 1;
      return {
        type: "tab_created",
        tab: { tab_id: `w1:t${createdTab}` },
        root_pane: {
          pane_id: `w1:p${createdTab}`,
          tab_id: `w1:t${createdTab}`,
        },
      };
    }
    return { type: "ok" };
  };

  const result = await applyWorkspaceLayout({
    env: {
      HERDR_PLUGIN_ROOT: "/tmp/plugin",
      HERDR_WORKSPACE_ID: "w1",
    },
    runHerdr,
    config: baseConfig,
  });

  assert.deepEqual(result.tabs, {
    agent: "w1:t2",
    terminal: "w1:t3",
  });
  assert.deepEqual(
    calls.filter((args) => args[0] === "pane" && args[1] === "run"),
    [
      ["pane", "run", "w1:p2", "claude"],
      ["pane", "run", "w1:p3", "setup /tmp/project"],
    ],
  );
  assert.equal(
    calls.some(
      (args) =>
        args[0] === "pane" &&
        args[1] === "run" &&
        args[2] === "w1:p1",
    ),
    false,
  );
  assert.deepEqual(calls.at(-1), ["tab", "focus", "w1:t2"]);
});

test("does not duplicate a layout in a non-pristine workspace", async () => {
  const runHerdr = (args) => {
    if (args[0] === "workspace") {
      return {
        workspace: {
          workspace_id: "w1",
          active_tab_id: "w1:t1",
          tab_count: 2,
          pane_count: 2,
        },
      };
    }
    return {
      panes: [
        {
          tab_id: "w1:t1",
          pane_id: "w1:p1",
          cwd: "/tmp/project",
        },
      ],
    };
  };

  const result = await applyWorkspaceLayout({
    env: { HERDR_WORKSPACE_ID: "w1" },
    runHerdr,
    config: baseConfig,
  });

  assert.deepEqual(result, {
    status: "skipped",
    reason: "workspace is not pristine",
  });
});

test("does not steal focus from a background workspace", async () => {
  const calls = [];
  const runHerdr = (args) => {
    calls.push(args);
    if (args[0] === "workspace") {
      return {
        workspace: {
          workspace_id: "w1",
          active_tab_id: "w1:t1",
          focused: false,
          tab_count: 1,
          pane_count: 1,
        },
      };
    }
    if (args[0] === "pane" && args[1] === "list") {
      return {
        panes: [
          {
            tab_id: "w1:t1",
            pane_id: "w1:p1",
            cwd: "/tmp/project",
          },
        ],
      };
    }
    return { type: "ok" };
  };

  await applyWorkspaceLayout({
    env: { HERDR_WORKSPACE_ID: "w1" },
    runHerdr,
    reuseInitialTab: true,
    config: {
      version: 1,
      tabs: [
        {
          id: "agent",
          existing: true,
          panes: [{ id: "agent", existing: true }],
        },
      ],
    },
  });

  assert.equal(
    calls.some((args) => args[0] === "tab" && args[1] === "focus"),
    false,
  );
});
