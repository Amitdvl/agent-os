import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

function run(args) {
  const result = spawnSync(process.execPath, ["bootstrap/cli.mjs", ...args], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

test("core setup installs Sire's explicit-only package and accurate Commands metadata idempotently", async (context) => {
  const temporary = await mkdtemp(join(tmpdir(), "agent-os-sire-install-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const home = join(temporary, "user");
  const entry = (catalogue) => catalogue.classifiedCatalogue.filter((item) =>
    item.group === "personal-slash-commands" && item.id === "sire");
  assert.deepEqual(entry(run(["status", "--home", home, "--catalog", "--json"])), []);

  const preview = run(["setup", "--home", home, "--safe", "--json"]);
  assert.ok(preview.operations.some((item) => item.path.endsWith(".codex/skills/sire/agents/openai.yaml")));
  assert.equal(preview.operations.some((item) => item.path.endsWith(".claude/commands/sire.md")), false);
  run(["setup", "--home", home, "--safe", "--apply", "--json"]);
  for (const host of [".codex", ".claude"]) {
    for (const relative of ["SKILL.md", "agents/openai.yaml"]) {
      assert.equal(await readFile(join(home, host, "skills/sire", relative), "utf8"),
        await readFile(join("skills/sire", relative), "utf8"));
    }
  }

  const [installed] = entry(run(["status", "--home", home, "--catalog", "--json"]));
  assert.ok(installed);
  assert.equal(installed.invocation, "$sire");
  assert.equal(installed.source, "manifest/skills.json");
  assert.equal(installed.sourcePath, "<CODEX_HOME>/skills/sire/SKILL.md");
  assert.equal(installed.status, "installed");
  assert.ok(installed.description.includes(installed.invocation));
  const repeat = run(["setup", "--home", home, "--safe", "--json"]);
  assert.equal(repeat.conflicts, 0);
  assert.ok(repeat.operations.filter((item) => item.path.includes("/skills/sire/")).every((item) => item.status === "unchanged"));
});
