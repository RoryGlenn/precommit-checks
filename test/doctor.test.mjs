import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { cleanupTempRepo, createTempRepo, run } from "./helpers/temp-repo.mjs";

function runDoctor(tempDir) {
  return run("node", [path.join(tempDir, "scripts", "doctor.mjs")], tempDir);
}

function hooksPath(tempDir) {
  return run(
    "git",
    ["config", "--get", "core.hooksPath"],
    tempDir,
  ).stdout.trim();
}

test("doctor repairs a repo with no husky wiring", (t) => {
  const tempDir = createTempRepo();
  t.after(() => cleanupTempRepo(tempDir));

  const result = runDoctor(tempDir);
  const output = `${result.stdout}${result.stderr}`;

  assert.equal(result.status, 0);
  assert.match(output, /Repaired the git hook wiring/);
  assert.equal(hooksPath(tempDir), ".husky/_");
  assert.ok(fs.existsSync(path.join(tempDir, ".husky", "_", "pre-commit")));
  assert.ok(fs.existsSync(path.join(tempDir, ".husky", "pre-commit")));
  assert.ok(fs.existsSync(path.join(tempDir, ".husky", "pre-push")));
});

test("doctor reports healthy once everything is wired", (t) => {
  const tempDir = createTempRepo();
  t.after(() => cleanupTempRepo(tempDir));

  runDoctor(tempDir); // first run repairs
  const result = runDoctor(tempDir); // second run: nothing to fix
  const output = `${result.stdout}${result.stderr}`;

  assert.equal(result.status, 0);
  assert.match(output, /Git hooks are healthy/);
});

test("doctor restores wiring after .husky/_ is removed", (t) => {
  const tempDir = createTempRepo();
  t.after(() => cleanupTempRepo(tempDir));

  runDoctor(tempDir); // establish healthy wiring
  fs.rmSync(path.join(tempDir, ".husky", "_"), {
    recursive: true,
    force: true,
  });

  const result = runDoctor(tempDir);
  const output = `${result.stdout}${result.stderr}`;

  assert.equal(result.status, 0);
  assert.match(output, /Repaired the git hook wiring/);
  assert.ok(fs.existsSync(path.join(tempDir, ".husky", "_", "pre-push")));
});

test("doctor recreates a missing hook file", (t) => {
  const tempDir = createTempRepo();
  t.after(() => cleanupTempRepo(tempDir));

  runDoctor(tempDir); // establish healthy wiring + hook files
  fs.rmSync(path.join(tempDir, ".husky", "pre-push"), { force: true });

  const result = runDoctor(tempDir);
  const output = `${result.stdout}${result.stderr}`;

  assert.equal(result.status, 0);
  assert.match(output, /Repaired the git hook wiring/);
  assert.ok(fs.existsSync(path.join(tempDir, ".husky", "pre-push")));
});
