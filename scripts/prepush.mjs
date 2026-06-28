import { spawnSync } from "node:child_process";
import pc from "picocolors";
import { errorBox, successBox } from "./lib/ui.mjs";
import { isWindows, TOOL_TIMEOUT_MS } from "./lib/process.mjs";
import { loadPrecommitConfig } from "./lib/config.mjs";

const config = loadPrecommitConfig();

// Opt-in only: stay completely silent and allow the push unless the repo has
// explicitly enabled the gate. This preserves the tool's non-blocking default
// at commit time while letting teams enforce a green suite before sharing code.
if (!config.blockPushOnTestFailure) {
  process.exit(0);
}

const pushTestCommand =
  Array.isArray(config.pushTestCommand) && config.pushTestCommand.length > 0
    ? config.pushTestCommand
    : ["npm", "test"];

console.log("");
console.log(pc.dim(`Running tests before push: ${pushTestCommand.join(" ")}`));
console.log("");

// Avoid leaking this process's test-runner context into the spawned suite.
const env = { ...process.env };
delete env.NODE_TEST_CONTEXT;

const result = spawnSync(pushTestCommand[0], pushTestCommand.slice(1), {
  stdio: "inherit",
  shell: isWindows,
  env,
  timeout: TOOL_TIMEOUT_MS,
});

console.log("");

if (result.error || result.signal) {
  errorBox([
    pc.bold("Push blocked: could not run tests"),
    "",
    pc.dim(
      result.signal
        ? `The test command timed out after ${TOOL_TIMEOUT_MS / 1000}s.`
        : "Check precommitChecks.pushTestCommand in package.json.",
    ),
  ]);
  process.exit(1);
}

if ((result.status || 0) !== 0) {
  errorBox([
    pc.bold("Push blocked: tests failed"),
    "",
    pc.dim("Fix the failing tests above, then push again."),
    pc.dim("To bypass this gate once: git push --no-verify"),
  ]);
  process.exit(1);
}

successBox([pc.bold("All tests passed"), "", pc.dim("Push allowed.")]);

process.exit(0);
