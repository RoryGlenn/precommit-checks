import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {
  cleanupTempRepo,
  createTempRepo,
  readHeadFile,
  run,
  writeFile,
} from "./helpers/temp-repo.mjs";

function runCommitFix(tempDir) {
  return run(
    "node",
    [path.join(tempDir, "scripts", "commit-fix.mjs")],
    tempDir,
  );
}

test("refuses to amend when tracked worktree changes exist", (t) => {
  const tempDir = createTempRepo();
  t.after(() => cleanupTempRepo(tempDir));

  writeFile(path.join(tempDir, "README.md"), "dirty\n");

  const result = runCommitFix(tempDir);
  const output = `${result.stdout}${result.stderr}`;

  assert.equal(result.status, 1);
  assert.match(output, /Cannot safely amend the latest commit\./);
});

test("shows info when the latest commit has no fixable files", (t) => {
  const tempDir = createTempRepo();
  t.after(() => cleanupTempRepo(tempDir));

  writeFile(path.join(tempDir, "notes.txt"), "hello\n");
  run("git", ["add", "notes.txt"], tempDir);
  run("git", ["commit", "-m", "notes"], tempDir);

  const result = runCommitFix(tempDir);
  const output = `${result.stdout}${result.stderr}`;

  assert.equal(result.status, 0);
  assert.match(output, /No fixable files in the latest commit\./);
});

test("amends the latest commit when all fixes are automatic", (t) => {
  const tempDir = createTempRepo();
  t.after(() => cleanupTempRepo(tempDir));

  writeFile(path.join(tempDir, "src", "amend.json"), '{"alpha":1}\n');
  run("git", ["add", "src/amend.json"], tempDir);
  run("git", ["commit", "-m", "amend"], tempDir);

  const result = runCommitFix(tempDir);
  const output = `${result.stdout}${result.stderr}`;

  assert.equal(result.status, 0);
  assert.match(output, /Latest commit amended with automatic fixes\./);
  assert.equal(readHeadFile(tempDir, "src/amend.json"), '{ "alpha": 1 }\n');
});

test("amends the latest commit and warns when lint issues remain", (t) => {
  const tempDir = createTempRepo();
  t.after(() => cleanupTempRepo(tempDir));

  writeFile(path.join(tempDir, "src", "warn.js"), "const value=1\n");
  run("git", ["add", "src/warn.js"], tempDir);
  run("git", ["commit", "-m", "warn"], tempDir);

  const result = runCommitFix(tempDir);
  const output = `${result.stdout}${result.stderr}`;

  assert.equal(result.status, 1);
  assert.match(output, /Latest commit amended with available fixes\./);
  assert.equal(readHeadFile(tempDir, "src/warn.js"), "const value = 1;\n");
});
