import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import test from "node:test";

function run(args) {
  const result = spawnSync(process.execPath, ["bootstrap/cli.mjs", ...args], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

async function filesUnder(root, directory = root) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await filesUnder(root, path));
    else if (entry.isFile()) result.push(relative(root, path));
  }
  return result.sort();
}

test("core setup distributes the complete coverage package and exposes accurate installed command metadata", async (context) => {
  const temporary = await mkdtemp(join(tmpdir(), "agent-os-coverage-install-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const home = join(temporary, "user");
  const entry = (catalogue) => catalogue.classifiedCatalogue.filter((item) =>
    item.group === "personal-slash-commands" && item.id === "cover-project");

  assert.deepEqual(entry(run(["status", "--home", home, "--catalog", "--json"])), []);
  const preview = run(["setup", "--home", home, "--safe", "--json"]);
  assert.ok(preview.operations.some((item) => item.id === "codex:skill:cover-project:references/fault-checks.md"));
  run(["setup", "--home", home, "--safe", "--apply", "--json"]);

  const source = "skills/cover-project";
  const files = await filesUnder(source);
  for (const host of [".codex", ".claude"]) {
    const installed = join(home, host, "skills/cover-project");
    assert.deepEqual(await filesUnder(installed), files);
    for (const file of files) {
      assert.equal(await readFile(join(installed, file), "utf8"), await readFile(join(source, file), "utf8"));
    }
  }
  const [installed] = entry(run(["status", "--home", home, "--catalog", "--json"]));
  assert.ok(installed);
  assert.equal(installed.invocation, "$cover-project");
  assert.equal(installed.source, "manifest/skills.json");
  assert.equal(installed.sourcePath, "<CODEX_HOME>/skills/cover-project/SKILL.md");
  assert.equal(installed.status, "installed");
  assert.ok(installed.description.includes(installed.invocation));

  const repeat = run(["setup", "--home", home, "--safe", "--json"]);
  assert.equal(repeat.conflicts, 0);
  assert.ok(repeat.operations.filter((item) => item.path.includes("/skills/cover-project/")).every((item) => item.status === "unchanged"));

  await unlink(join(home, ".codex/skills/cover-project/SKILL.md"));
  assert.deepEqual(entry(run(["status", "--home", home, "--catalog", "--json"])), []);
});
