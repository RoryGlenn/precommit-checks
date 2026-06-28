import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {
  cleanupTempRepo,
  createTempRepo,
  readFile,
  run,
  writeFile,
} from "./helpers/temp-repo.mjs";

function runFixStaged(tempDir) {
  return run(
    "node",
    [path.join(tempDir, "scripts", "fix-staged.mjs")],
    tempDir,
  );
}

test("shows info box when there are no staged fixable files", (t) => {
  const tempDir = createTempRepo();
  t.after(() => cleanupTempRepo(tempDir));

  const result = runFixStaged(tempDir);
  const output = `${result.stdout}${result.stderr}`;

  assert.equal(result.status, 0);
  assert.match(output, /No staged files to fix\./);
});

test("refuses to fix partially staged files", (t) => {
  const tempDir = createTempRepo();
  t.after(() => cleanupTempRepo(tempDir));

  writeFile(path.join(tempDir, "src", "partial.js"), 'console.log("x")\n');
  run("git", ["add", "src/partial.js"], tempDir);
  writeFile(
    path.join(tempDir, "src", "partial.js"),
    'console.log("x")\nconsole.log("y")\n',
  );

  const result = runFixStaged(tempDir);
  const output = `${result.stdout}${result.stderr}`;

  assert.equal(result.status, 1);
  assert.match(output, /Cannot safely fix partially staged files\./);
});

test("applies staged fixes successfully when all issues are auto-fixable", (t) => {
  const tempDir = createTempRepo();
  t.after(() => cleanupTempRepo(tempDir));

  writeFile(path.join(tempDir, "src", "success.js"), 'console.log("x")\n');
  run("git", ["add", "src/success.js"], tempDir);

  const result = runFixStaged(tempDir);
  const output = `${result.stdout}${result.stderr}`;

  assert.equal(result.status, 0);
  assert.match(output, /Staged fixes applied\./);
  assert.equal(readFile(tempDir, "src/success.js"), 'console.log("x");\n');
});

test("returns warning when fixes apply but lint issues remain", (t) => {
  const tempDir = createTempRepo();
  t.after(() => cleanupTempRepo(tempDir));

  writeFile(path.join(tempDir, "src", "warn.js"), "const value=1\n");
  run("git", ["add", "src/warn.js"], tempDir);

  const result = runFixStaged(tempDir);
  const output = `${result.stdout}${result.stderr}`;

  assert.equal(result.status, 1);
  assert.match(output, /Manual attention still needed\./);
  assert.equal(readFile(tempDir, "src/warn.js"), "const value = 1;\n");
});
