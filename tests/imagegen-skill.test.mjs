import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function skillFile(path) {
  return readFile(join(ROOT, "skills", "imagegen", path), "utf8");
}

test("imagegen contract keeps consultation compact and escape hatches first", async () => {
  const content = await skillFile("SKILL.md");
  const surprise = content.indexOf("surprise me");
  const immediate = content.indexOf("just generate it");
  const intake = content.indexOf("one compact round of 1–3 semantic questions total");
  assert.ok(surprise >= 0 && immediate >= 0 && intake >= 0);
  assert.ok(surprise < intake && immediate < intake, "escape hatches must be checked before intake");
  assert.match(content, /Do not hide a long checklist inside one question/i);
  assert.match(content, /at most one genuinely valuable confirmation/i);
  assert.match(content, /Do not start art-direction intake for education/i);
});

test("imagegen references cover state, edit isolation, exact text, diagnosis, and inspection honesty", async () => {
  const [conversation, editing, design, diagnosis, contract] = await Promise.all([
    skillFile("references/conversation-and-state.md"),
    skillFile("references/editing-and-references.md"),
    skillFile("references/design-illustration-typography.md"),
    skillFile("references/diagnosis-and-iteration.md"),
    skillFile("SKILL.md"),
  ]);
  assert.match(conversation, /Treat each revision as a delta/);
  assert.match(conversation, /one shared intake round/i);
  assert.match(editing, /MUTABLE:[\s\S]*IMMUTABLE \/ LOCKED:/);
  assert.match(editing, /Do not collapse multiple references into “use these as inspiration.”/);
  assert.match(design, /Preserve all characters, case, punctuation, diacritics, Unicode, whitespace, and line breaks/);
  for (const phrase of ["too AI", "too glossy", "too busy", "more premium"]) assert.match(diagnosis, new RegExp(phrase, "i"));
  assert.match(diagnosis, /Do not default to black-and-gold/);
  assert.match(contract, /Tool success proves file creation, not visual correctness/);
});

test("imagegen behavioral case matrix retains every acceptance class", async () => {
  const cases = await readFile(join(ROOT, "tests", "imagegen-cases.md"), "utf8");
  for (const heading of ["Vague generation", "Detailed generation", "Escape hatches", "Targeted edit", "Multiple references", "Exact text", "Feedback diagnosis", "State locking", "Inspection honesty", "Non-hijacking", "Suite gate"]) {
    assert.match(cases, new RegExp(`^## ${heading}$`, "m"));
  }
  assert.match(cases, /18\/20 or higher/);
  assert.match(cases, /no image operation occurs until roles are resolved/i);
});
