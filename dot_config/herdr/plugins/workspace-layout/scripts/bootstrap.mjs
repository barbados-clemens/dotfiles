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
    trustConfigs: true,
    activatesMise: true,
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

function failureMessage(name, result) {
  if (result.error) {
    return `unable to run ${name}: ${result.error.message}`;
  }
  if (result.signal) {
    return `${name} terminated by signal ${result.signal}`;
  }
  if (result.status !== 0) {
    return `${name} failed with exit code ${result.status}`;
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
  let miseActive = false;
  let warnings = 0;

  const execute = ({ name, command, allowFailure = false }) => {
    stdout.write(`\nworkspace setup: ${command.join(" ")}\n`);
    const result = runCommand(command[0], command.slice(1), {
      stdio: "inherit",
    });
    const failure = failureMessage(name, result);
    if (!failure) {
      return { succeeded: true };
    }

    if (!allowFailure) {
      stderr.write(`workspace setup: ${failure}\n`);
      return {
        succeeded: false,
        exitCode: result.status ?? 1,
      };
    }

    warnings += 1;
    stderr.write(`workspace setup: warning: ${failure}; continuing\n`);
    return { succeeded: false };
  };

  for (const step of bootstrapSteps) {
    if (step.group && completedGroups.has(step.group)) {
      continue;
    }

    const detectedFiles = step.files.filter((file) => fileExists(file));
    if (detectedFiles.length === 0) {
      continue;
    }

    if (step.group) {
      completedGroups.add(step.group);
    }
    attempted += 1;

    if (step.trustConfigs) {
      for (const configFile of detectedFiles) {
        const trustResult = execute({
          name: `${step.name} trust`,
          command: ["mise", "trust", "--yes", configFile],
        });
        if (!trustResult.succeeded) {
          return {
            status: "failed",
            exitCode: trustResult.exitCode,
            step: step.name,
            attempted,
            warnings,
          };
        }
      }
    }

    const command =
      miseActive && !step.activatesMise
        ? ["mise", "exec", "--", ...step.command]
        : step.command;
    const stepResult = execute({
      name: step.name,
      command,
      allowFailure: step.allowFailure,
    });

    if (!stepResult.succeeded) {
      if (!step.allowFailure) {
        return {
          status: "failed",
          exitCode: stepResult.exitCode,
          step: step.name,
          attempted,
          warnings,
        };
      }
      continue;
    }

    if (step.activatesMise) {
      miseActive = true;
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
