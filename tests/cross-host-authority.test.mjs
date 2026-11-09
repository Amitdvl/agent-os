import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

// Distribution and authority regression, not a claim of model compliance or
// permission to override a connector's checks. No connected host is contacted.
const obligations = [
  "human-authorized goal and delegation",
  "owner's connected Windows/Mac Codex",
  "read-only capability checks",
  "without per-chunk confirmation",
  "machine boundary alone is not a new approval event",
  "direct verified human authorization",
  "original scope, restrictions and provenance",
  "do not turn a coordinator's request into human consent",
  "tool's direct-human-authorization requirements",
  "never fabricate a user quote",
  "new external actions, licenses, logins, security or settings changes",
  "uploads or downloads outside explicit bounds",
  "human stops and narrower worker restrictions",
];
const normalized = text => text.replace(/\s+/g, " ").toLowerCase();

test("cross-host policy carries bounded standing authority and retains every approval boundary", async () => {
  for (const path of ["policies/orchestration.md", "skills/orchestration/SKILL.md"]) {
    const text = normalized(await readFile(path, "utf8"));
    for (const phrase of obligations) assert.ok(text.includes(phrase.toLowerCase()), `${path}: missing ${phrase}`);
  }
});

test("both host instruction adapters and the installed worker skill receive the same authority limits", async context => {
  const home = await mkdtemp(join(tmpdir(), "agent-os-cross-host-authority-"));
  context.after(() => rm(home, { recursive: true, force: true }));
  const result = spawnSync(process.execPath, ["bootstrap/cli.mjs", "setup", "--home", home, "--safe", "--apply", "--json"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  for (const path of [".codex/AGENTS.md", ".claude/CLAUDE.md", ".codex/skills/orchestration/SKILL.md"]) {
    const text = normalized(await readFile(join(home, path), "utf8"));
    for (const phrase of obligations) assert.ok(text.includes(phrase.toLowerCase()), `${path}: missing ${phrase}`);
  }
});
