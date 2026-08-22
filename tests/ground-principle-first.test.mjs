import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKILL = join(ROOT, "commands", "ground", "SKILL.md");

test("ground requires a short why-first causal explanation", async () => {
  const content = await readFile(SKILL, "utf8");
  assert.match(content, /## First-principles, why-first explanations/i);
  assert.match(content, /condition → mechanism → outcome/i);
  assert.match(content, /A named principle is not an explanation/i);
  assert.match(content, /\*\*Why:\*\*/i);
  assert.match(content, /decision rule/i);
  assert.match(content, /Boundary/i);
  assert.match(content, /examples as evidence or clarification/i);
  assert.match(content, /Match causal language to the evidence/i);
  assert.match(content, /\*\*Raw:\*\* describe only the observed pattern/i);
});
