import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("trashness requires exact approval and completes deletion", async () => {
  const content = (await readFile(join(ROOT, "commands", "trashness", "SKILL.md"), "utf8")).toLowerCase();

  for (const phrase of [
    "must not stop after reporting once the user approves",
    "do not infer approval from invoking the command",
    "permanently remove each exact, quoted target without globs",
    "verify each approved target is absent",
    "every month requires fresh approval",
    "~/.config/trashness/protected-names",
    "do not use mole",
    "never empty trash wholesale",
  ]) {
    assert.ok(content.includes(phrase), `trashness command is missing safety contract: ${phrase}`);
  }
});

test("portable monthly trashness automation is paused and approval-gated", async () => {
  const content = await readFile(join(ROOT, "templates", "automations", "trashness-monthly", "automation.toml"), "utf8");

  assert.match(content, /status = "PAUSED"/);
  assert.match(content, /rrule = "\{\{rrule\}\}"/);
  assert.match(content, /After approval, continue/);
  assert.match(content, /If approval never arrives, delete nothing/);
  assert.match(content, /Enforce the machine-local Trashness protected-name list/);
  assert.doesNotMatch(content, /ideation\.mp4/i);
});
