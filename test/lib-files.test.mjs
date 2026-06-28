import test from "node:test";
import assert from "node:assert/strict";
import { globToRegExp, isTestExemptFile } from "../scripts/lib/files.mjs";

// These are fast, pure unit tests (no child processes or temp repos).

test("isTestExemptFile recognizes files that don't need a unit test", () => {
  assert.equal(isTestExemptFile("src/foo.test.ts"), true);
  assert.equal(isTestExemptFile("test/helpers/util.mjs"), true);
  assert.equal(isTestExemptFile("eslint.config.js"), true);
  assert.equal(isTestExemptFile(".prettierrc.cjs"), true);
  assert.equal(isTestExemptFile("src/types.d.ts"), true);
  assert.equal(isTestExemptFile("src/Button.stories.tsx"), true);
  assert.equal(isTestExemptFile("src/api.generated.ts"), true);
  assert.equal(isTestExemptFile("src/generated/schema.ts"), true);
});

test("isTestExemptFile still requires tests for ordinary source files", () => {
  assert.equal(isTestExemptFile("src/widget.ts"), false);
  assert.equal(isTestExemptFile("src/lib/math.js"), false);
});

test("globToRegExp supports *, ** and ?", () => {
  assert.match("src/legacy/old.js", globToRegExp("src/legacy/**"));
  assert.match("Button.stories.tsx", globToRegExp("*.stories.tsx"));
  assert.doesNotMatch(
    "src/ui/Button.stories.tsx",
    globToRegExp("*.stories.tsx"),
  );
  assert.match("src/ui/Button.stories.tsx", globToRegExp("**/*.stories.tsx"));
  assert.match("a/b.ts", globToRegExp("a/?.ts"));
  assert.doesNotMatch("a/bc.ts", globToRegExp("a/?.ts"));
});
