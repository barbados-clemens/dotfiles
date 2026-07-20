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
