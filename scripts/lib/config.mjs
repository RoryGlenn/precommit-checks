import fs from "node:fs";

// Reads the optional `precommitChecks` object from package.json (cwd).
export function loadPrecommitConfig() {
  try {
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
    return (pkg && pkg.precommitChecks) || {};
  } catch {
    return {};
  }
}
