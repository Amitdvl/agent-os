import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  compactDescription,
  parseFrontmatter,
  parseLiveSkillsPrompt,
  plainLogSkillReads,
  referencedSkillPaths,
  skillEntryIssues,
  usageEvidence,
} from "./skill-cleaner.ts";

test("parses folded and chomped YAML descriptions", (context) => {
  const root = mkdtempSync(join(tmpdir(), "skill-cleaner-frontmatter-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  const skill = join(root, "SKILL.md");
  writeFileSync(skill, "---\nname: folded\ndescription: >-\n  First line\n  second line\n---\nBody\n");
  assert.equal(parseFrontmatter(skill)?.description, "First line second line");
});

test("reports dangling and entrypoint-less skill symlinks", (context) => {
  const root = mkdtempSync(join(tmpdir(), "skill-cleaner-integrity-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  const valid = join(root, "valid-target");
  const empty = join(root, "empty-target");
  mkdirSync(valid);
  mkdirSync(empty);
  writeFileSync(join(valid, "SKILL.md"), "---\nname: valid\ndescription: fixture\n---\n");
  symlinkSync(valid, join(root, "valid-link"));
  symlinkSync(empty, join(root, "empty-link"));
  symlinkSync(join(root, "vanished-target"), join(root, "broken-link"));
  assert.deepEqual(skillEntryIssues([root]).map((issue) => [issue.status, issue.path.split("/").at(-1)]), [
    ["broken-target", "broken-link"],
    ["missing-entrypoint", "empty-link"],
  ]);
});

test("parses Codex skill roots and model-visible lines", () => {
  const raw = JSON.stringify([
    {
      role: "developer",
      content: [{
        type: "input_text",
        text: `<skills_instructions>
## Skills
### Skill roots
- \`r0\` = \`/tmp/skills\`
### Available skills
- demo: Demo work. (file: r0/demo/SKILL.md)
### How to use skills
</skills_instructions>`,
      }],
    },
  ]);

  const parsed = parseLiveSkillsPrompt(raw);
  assert.equal(parsed.roots.get("r0"), "/tmp/skills");
  assert.deepEqual(parsed.skillLines, [
    "- demo: Demo work. (file: r0/demo/SKILL.md)",
  ]);
});

test("compacts prose into a readable trigger phrase", () => {
  const compact = compactDescription(
    "Use this skill when the user wants to inspect calendars, compare availability, review conflicts, and schedule a meeting with timezone-aware details.",
    90,
  );
  assert.equal(
    compact,
    "inspect calendars, compare availability, review conflicts, and schedule a meeting with...",
  );
  assert.ok(compact.length <= 90);
  assert.doesNotMatch(compact, /audit, clean, verify/);
});

test("extracts user evidence without counting developer prompt listings", () => {
  assert.deepEqual(
    usageEvidence({ session_id: "abc", text: "use $skill-cleaner", ts: 123 }),
    { userText: "use $skill-cleaner" },
  );
  assert.deepEqual(
    usageEvidence({
      type: "response_item",
      payload: {
        type: "function_call",
        arguments: "{\"cmd\":\"cat /tmp/skills/demo/SKILL.md\"}",
      },
    }),
    { callArgs: "{\"cmd\":\"cat /tmp/skills/demo/SKILL.md\"}" },
  );
  assert.deepEqual(
    usageEvidence({
      type: "response_item",
      payload: { type: "message", role: "developer", content: ["$skill-cleaner"] },
    }),
    {},
  );
});

test("resolves relative skill reads from function-call workdirs", () => {
  assert.deepEqual(
    referencedSkillPaths(JSON.stringify({
      cmd: "cat skills/demo/SKILL.md",
      workdir: "/tmp/repo",
    })),
    [resolve("/tmp/repo", "skills/demo/SKILL.md")],
  );
});

test("counts command-like plain-log reads but ignores rendered listings", () => {
  assert.deepEqual(
    plainLogSkillReads([
      "cat skills/demo/SKILL.md",
      "- other: description (file: /tmp/skills/other/SKILL.md)",
    ].join("\n")),
    ["demo"],
  );
});
