import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

function setup(home, apply = false) {
  const result = spawnSync(process.execPath, ["bootstrap/cli.mjs", "setup", "--home", home, "--safe", "--json", ...(apply ? ["--apply"] : [])], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

test("Pamphlet installs one canonical Codex entry and a complete package on both hosts", async (context) => {
  const temporary = await mkdtemp(join(tmpdir(), "agent-os-pamphlet-install-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const home = join(temporary, "user");
  const preview = setup(home);
  const entries = preview.operations.filter((item) => item.path.endsWith(".codex/skills/pamphlet/SKILL.md"));
  assert.equal(entries.length, 1, "command and skill must not write the same Codex file twice");
  assert.ok(preview.operations.some((item) => item.path.endsWith(".claude/commands/pamphlet.md")));
  setup(home, true);
  const canonical = await readFile("skills/pamphlet/SKILL.md", "utf8");
  for (const host of [".codex", ".claude"]) {
    const root = join(home, host, "skills", "pamphlet");
    assert.equal(await readFile(join(root, "SKILL.md"), "utf8"), canonical);
    for (const relative of ["scripts/build_pamphlet.py", "references/delivery.md", "agents/openai.yaml", "tests/test_build_pamphlet.py"]) {
      assert.equal(await readFile(join(root, relative), "utf8"), await readFile(join("skills/pamphlet", relative), "utf8"));
    }
  }
  assert.equal(await readFile(join(home, ".claude/commands/pamphlet.md"), "utf8"), canonical);
  const repeat = setup(home);
  assert.equal(repeat.conflicts, 0);
  assert.ok(repeat.operations.filter((item) => item.path.includes("pamphlet")).every((item) => item.status === "unchanged"));
});
