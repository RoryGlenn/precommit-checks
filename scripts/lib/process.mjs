import { spawnSync } from "node:child_process";

export const isWindows = process.platform === "win32";

// Default ceiling for any tool the hooks spawn, so a hung tool can never
// wedge a commit indefinitely.
export const TOOL_TIMEOUT_MS = 120000;

export function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: "utf8",
    shell: isWindows,
    ...options,
  });
}
