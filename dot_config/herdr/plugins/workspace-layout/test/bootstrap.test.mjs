import assert from "node:assert/strict";
import test from "node:test";

import { runBootstrap } from "../scripts/bootstrap.mjs";

function outputBuffer() {
  let value = "";
  return {
    stream: {
      write(chunk) {
        value += chunk;
      },
    },
    value() {
      return value;
    },
  };
}

test("continues after an allowed step failure and exits successfully", () => {
  const stdout = outputBuffer();
  const stderr = outputBuffer();
  const commands = [];
  const result = runBootstrap({
    bootstrapSteps: [
      {
        name: "cargo",
        files: ["Cargo.toml"],
        command: ["cargo", "install"],
        allowFailure: true,
      },
      {
        name: "mise",
        files: ["mise.toml"],
        command: ["mise", "install"],
      },
    ],
    fileExists: () => true,
    runCommand(command) {
      commands.push(command);
      return { status: command === "cargo" ? 101 : 0 };
    },
    stdout: stdout.stream,
    stderr: stderr.stream,
  });

  assert.deepEqual(commands, ["cargo", "mise"]);
  assert.deepEqual(result, {
    status: "complete",
    exitCode: 0,
    attempted: 2,
    warnings: 1,
  });
  assert.match(
    stderr.value(),
    /warning: cargo failed with exit code 101; continuing/,
  );
  assert.match(stdout.value(), /complete with 1 warning/);
});

test("stops after a required step failure", () => {
  const stdout = outputBuffer();
  const stderr = outputBuffer();
  const commands = [];
  const result = runBootstrap({
    bootstrapSteps: [
      {
        name: "pnpm",
        files: ["pnpm-lock.yaml"],
        command: ["pnpm", "install"],
      },
      {
        name: "cargo",
        files: ["Cargo.toml"],
        command: ["cargo", "install"],
        allowFailure: true,
      },
    ],
    fileExists: () => true,
    runCommand(command) {
      commands.push(command);
      return { status: 1 };
    },
    stdout: stdout.stream,
    stderr: stderr.stream,
  });

  assert.deepEqual(commands, ["pnpm"]);
  assert.deepEqual(result, {
    status: "failed",
    exitCode: 1,
    step: "pnpm",
    attempted: 1,
    warnings: 0,
  });
  assert.match(stderr.value(), /pnpm failed with exit code 1/);
  assert.doesNotMatch(stderr.value(), /warning:/);
});

test("treats an allowed spawn error as a warning", () => {
  const stdout = outputBuffer();
  const stderr = outputBuffer();
  const result = runBootstrap({
    bootstrapSteps: [
      {
        name: "optional",
        files: ["optional.lock"],
        command: ["optional", "install"],
        allowFailure: true,
      },
    ],
    fileExists: () => true,
    runCommand() {
      return { error: new Error("command not found"), status: null };
    },
    stdout: stdout.stream,
    stderr: stderr.stream,
  });

  assert.equal(result.exitCode, 0);
  assert.equal(result.warnings, 1);
  assert.match(
    stderr.value(),
    /warning: unable to run optional: command not found; continuing/,
  );
});

test("does not fall through to another step in the same group", () => {
  const commands = [];
  const result = runBootstrap({
    bootstrapSteps: [
      {
        name: "first",
        files: ["first.lock"],
        command: ["first", "install"],
        group: "manager",
        allowFailure: true,
      },
      {
        name: "second",
        files: ["second.lock"],
        command: ["second", "install"],
        group: "manager",
      },
    ],
    fileExists: () => true,
    runCommand(command) {
      commands.push(command);
      return { status: 1 };
    },
    stdout: outputBuffer().stream,
    stderr: outputBuffer().stream,
  });

  assert.deepEqual(commands, ["first"]);
  assert.equal(result.exitCode, 0);
  assert.equal(result.warnings, 1);
});

test("trusts exact mise configs and runs later steps through mise exec", () => {
  const commands = [];
  const result = runBootstrap({
    bootstrapSteps: [
      {
        name: "mise",
        files: ["mise.toml", ".mise.toml"],
        command: ["mise", "install"],
        trustConfigs: true,
        activatesMise: true,
      },
      {
        name: "pnpm",
        files: ["pnpm-lock.yaml"],
        command: ["pnpm", "install", "--frozen-lockfile"],
      },
    ],
    fileExists: (file) => file !== ".mise.toml",
    runCommand(command, args) {
      commands.push([command, ...args]);
      return { status: 0 };
    },
    stdout: outputBuffer().stream,
    stderr: outputBuffer().stream,
  });

  assert.deepEqual(commands, [
    ["mise", "trust", "--yes", "mise.toml"],
    ["mise", "install"],
    ["mise", "exec", "--", "pnpm", "install", "--frozen-lockfile"],
  ]);
  assert.equal(result.exitCode, 0);
  assert.equal(result.attempted, 2);
});

test("stops setup when trusting a mise config fails", () => {
  const commands = [];
  const stderr = outputBuffer();
  const result = runBootstrap({
    bootstrapSteps: [
      {
        name: "mise",
        files: ["mise.toml"],
        command: ["mise", "install"],
        trustConfigs: true,
        activatesMise: true,
      },
      {
        name: "pnpm",
        files: ["pnpm-lock.yaml"],
        command: ["pnpm", "install"],
      },
    ],
    fileExists: () => true,
    runCommand(command, args) {
      commands.push([command, ...args]);
      return { status: 1 };
    },
    stdout: outputBuffer().stream,
    stderr: stderr.stream,
  });

  assert.deepEqual(commands, [
    ["mise", "trust", "--yes", "mise.toml"],
  ]);
  assert.deepEqual(result, {
    status: "failed",
    exitCode: 1,
    step: "mise",
    attempted: 1,
    warnings: 0,
  });
  assert.match(stderr.value(), /mise trust failed with exit code 1/);
});

test("keeps allowed failures optional when run through mise", () => {
  const commands = [];
  const stderr = outputBuffer();
  const result = runBootstrap({
    bootstrapSteps: [
      {
        name: "mise",
        files: ["mise.toml"],
        command: ["mise", "install"],
        trustConfigs: true,
        activatesMise: true,
      },
      {
        name: "cargo",
        files: ["Cargo.toml"],
        command: ["cargo", "install"],
        allowFailure: true,
      },
    ],
    fileExists: () => true,
    runCommand(command, args) {
      const invocation = [command, ...args];
      commands.push(invocation);
      return {
        status:
          invocation.join(" ") === "mise exec -- cargo install" ? 101 : 0,
      };
    },
    stdout: outputBuffer().stream,
    stderr: stderr.stream,
  });

  assert.deepEqual(commands.at(-1), [
    "mise",
    "exec",
    "--",
    "cargo",
    "install",
  ]);
  assert.equal(result.exitCode, 0);
  assert.equal(result.warnings, 1);
  assert.match(
    stderr.value(),
    /warning: cargo failed with exit code 101; continuing/,
  );
});
