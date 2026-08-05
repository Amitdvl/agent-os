import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("Skill Cleaner names its bundled Agent OS root without changing legacy discovery", async () => {
  const source = await readFile(join(root, "skills/skill-cleaner/scripts/skill-cleaner.ts"), "utf8");
  assert.match(source, /const agentOsSkillRoot/);
  assert.doesNotMatch(source, /const bundledSkillRoot/);
});
