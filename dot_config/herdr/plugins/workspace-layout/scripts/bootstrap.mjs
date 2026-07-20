#!/usr/bin/env node

import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const steps = [
  {
    name: "mise",
    files: ["mise.toml", ".mise.toml"],
    command: ["mise", "install"],
  },
  {
    name: "pnpm",
    files: ["pnpm-lock.yaml"],
    command: ["pnpm", "install", "--frozen-lockfile"],
    group: "javascript",
  },
  {
    name: "bun",
    files: ["bun.lock", "bun.lockb"],
    command: ["bun", "install", "--frozen-lockfile"],
    group: "javascript",
  },
  {
    name: "yarn",
    files: ["yarn.lock"],
    command: ["yarn", "install", "--frozen-lockfile"],
    group: "javascript",
  },
  {
    name: "npm",
    files: ["package-lock.json"],
    command: ["npm", "ci"],
    group: "javascript",
  },
  {
    name: "uv",
    files: ["uv.lock"],
    command: ["uv", "sync", "--frozen"],
  },
  {
    name: "cargo",
    files: ["Cargo.toml"],
    command: ["cargo", "install"],
    allowFailure: true,
  },
];

function failureMessage(step, result) {
  if (result.error) {
    return `unable to run ${step.name}: ${result.error.message}`;
  }
  if (result.signal) {
    return `${step.name} terminated by signal ${result.signal}`;
  }
  if (result.status !== 0) {
    return `${step.name} failed with exit code ${result.status}`;
  }
  return undefined;
}

export function runBootstrap({
  bootstrapSteps = steps,
  fileExists = existsSync,
  runCommand = spawnSync,
  stdout = process.stdout,
  stderr = process.stderr,
} = {}) {
  const completedGroups = new Set();
  let attempted = 0;
  let warnings = 0;

  for (const step of bootstrapSteps) {
    if (step.group && completedGroups.has(step.group)) {
      continue;
    }

    if (!step.files.some((file) => fileExists(file))) {
      continue;
    }

    if (step.group) {
      completedGroups.add(step.group);
    }
    attempted += 1;
    stdout.write(`\nworkspace setup: ${step.command.join(" ")}\n`);
    const result = runCommand(step.command[0], step.command.slice(1), {
      stdio: "inherit",
    });
    const failure = failureMessage(step, result);

    if (failure) {
      if (!step.allowFailure) {
        stderr.write(`workspace setup: ${failure}\n`);
        return {
          status: "failed",
          exitCode: result.status ?? 1,
          step: step.name,
          attempted,
          warnings,
        };
      }

      warnings += 1;
      stderr.write(`workspace setup: warning: ${failure}; continuing\n`);
      continue;
    }
  }

  if (attempted === 0) {
    stdout.write("workspace setup: no supported setup files found\n");
  } else if (warnings > 0) {
    stdout.write(
      `\nworkspace setup: complete with ${warnings} warning${warnings === 1 ? "" : "s"}\n`,
    );
  } else {
    stdout.write("\nworkspace setup: complete\n");
  }

  return {
    status: "complete",
    exitCode: 0,
    attempted,
    warnings,
  };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  process.exitCode = runBootstrap().exitCode;
}
