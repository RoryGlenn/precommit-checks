import { spawnSync } from "node:child_process";

console.log("Running pre-commit checks as non-blocking suggestions...");

const result = spawnSync("npx", ["lint-staged"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

console.log("");

if (result.status !== 0) {
  console.warn("Pre-commit suggestions found.");
  console.warn("Commit will continue anyway. Review the warnings above when you have time.");
  process.exit(0);
}

console.log("Pre-commit checks passed. Commit will continue.");