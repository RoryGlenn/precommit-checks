#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import pc from "picocolors";
import { errorBox, successBox, warningBox } from "./lib/ui.mjs";
import { run } from "./lib/process.mjs";

// Diagnose and self-heal the Husky hook wiring. Both hooks run through the
// gitignored `.husky/_` wrappers and git's `core.hooksPath` — neither of which
// is committed — so a `git clean -fdx`, a stale checkout, or a reinstall that
// skipped `prepare` can silently switch off ALL hooks at once. This restores
// them without clobbering anything, and is safe to run anytime.

const HOOKS_PATH = ".husky/_";
const HOOK_BODIES = {
  ".husky/pre-commit": "node scripts/precommit-unified.mjs\n",
  ".husky/pre-push": "node scripts/prepush.mjs\n",
};

if (!fs.existsSync("package.json")) {
  errorBox([
    pc.bold("No package.json found."),
    "",
    pc.dim("Run this from your project root."),
  ]);
  process.exit(1);
}

const insideRepo = run("git", ["rev-parse", "--is-inside-work-tree"]);
if (insideRepo.error || insideRepo.status !== 0) {
  errorBox([
    pc.bold("Not a git repository."),
    "",
    pc.dim("Run this from inside your git project."),
  ]);
  process.exit(1);
}

function currentHooksPath() {
  const result = run("git", ["config", "--get", "core.hooksPath"]);
  return (result.stdout || "").trim();
}

// The per-hook wrappers git actually executes live under `.husky/_`; if they are
// gone (or hooksPath is unset), git runs nothing and both hooks go silent.
function wiringIntact() {
  return (
    currentHooksPath() === HOOKS_PATH &&
    fs.existsSync(path.join(HOOKS_PATH, "pre-commit")) &&
    fs.existsSync(path.join(HOOKS_PATH, "pre-push"))
  );
}

const problems = [];
if (currentHooksPath() !== HOOKS_PATH) {
  problems.push("git core.hooksPath is not set to .husky/_");
}
if (
  !fs.existsSync(path.join(HOOKS_PATH, "pre-commit")) ||
  !fs.existsSync(path.join(HOOKS_PATH, "pre-push"))
) {
  problems.push(".husky/_ hook wrappers are missing");
}
const missingHooks = Object.keys(HOOK_BODIES).filter(
  (hookPath) => !fs.existsSync(hookPath),
);
if (missingHooks.length > 0) {
  problems.push(`missing hook file(s): ${missingHooks.join(", ")}`);
}

if (problems.length === 0) {
  successBox([
    pc.bold("Git hooks are healthy."),
    "",
    pc.dim("core.hooksPath → .husky/_"),
    pc.dim("pre-commit and pre-push are wired up and active."),
  ]);
  process.exit(0);
}

// --- Repair ---
const repaired = [];

// Rebuild Husky's wiring (core.hooksPath + the gitignored `.husky/_` wrappers).
if (!wiringIntact()) {
  const husky = run("npx", ["husky"]);
  if (husky.error || (husky.status || 0) !== 0) {
    errorBox([
      pc.bold("Could not repair the Husky wiring."),
      "",
      pc.dim("Check that husky is installed (npm install), then retry."),
    ]);
    process.exit(1);
  }
  repaired.push("husky wiring (core.hooksPath + .husky/_)");
}

// Recreate any missing hook files (never overwrite an existing one).
fs.mkdirSync(".husky", { recursive: true });
for (const [hookPath, body] of Object.entries(HOOK_BODIES)) {
  if (!fs.existsSync(hookPath)) {
    fs.writeFileSync(hookPath, body);
    fs.chmodSync(hookPath, 0o755);
    repaired.push(hookPath);
  }
}

if (
  !wiringIntact() ||
  missingHooks.some((hookPath) => !fs.existsSync(hookPath))
) {
  errorBox([
    pc.bold("Hook wiring still looks broken after repair."),
    "",
    pc.dim("Try running: npx husky"),
    pc.dim(`Then confirm: git config --get core.hooksPath → ${HOOKS_PATH}`),
  ]);
  process.exit(1);
}

warningBox([
  pc.bold("Repaired the git hook wiring."),
  "",
  pc.dim(`Was broken: ${problems.join("; ")}.`),
  pc.dim(`Fixed: ${repaired.join(", ")}.`),
  "",
  pc.dim("pre-commit and pre-push are active again."),
]);

process.exit(0);
