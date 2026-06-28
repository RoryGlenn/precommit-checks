import { spawnSync } from "node:child_process";

export const isWindows = process.platform === "win32";

export function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: "utf8",
    shell: isWindows,
    ...options,
  });
}
