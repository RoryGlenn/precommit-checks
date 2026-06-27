import { spawnSync } from "node:child_process";

console.log("Running pre-commit checks...");

const result = spawnSync("npx", ["lint-staged"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.status !== 0) {
  console.error("");
  console.error("Pre-commit checks failed.");
  console.error("Fix the errors above, stage your changes, then commit again.");
  process.exit(result.status ?? 1);
}

console.log("");
console.log("Pre-commit checks passed.");
