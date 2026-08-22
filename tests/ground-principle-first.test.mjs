import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKILL = join(ROOT, "commands", "ground", "SKILL.md");

test("ground keeps explanations principle-first and evidence-calibrated", async () => {
  const content = await readFile(SKILL, "utf8");
  assert.match(content, /## Principle-first explanations/i);
  assert.match(content, /fundamental principle or causal mechanism/i);
  assert.match(content, /decision rule/i);
  assert.match(content, /Name the boundary/i);
  assert.match(content, /Treat examples as evidence/i);
  assert.match(content, /direct evidence distinct from interpretation/i);
  assert.match(content, /tentative principle/i);
});
