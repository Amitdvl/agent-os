import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(ROOT, "bootstrap", "cli.mjs");
const IDS = ["justification-audit", "production-algorithm"];

async function filesUnder(root, directory = root) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(root, path));
    else if (entry.isFile()) files.push(relative(root, path));
  }
  return files.sort();
}

function run(args) {
  const result = spawnSync(process.execPath, [CLI, ...args], { cwd: ROOT, encoding: "utf8" });
  assert.equal(result.status, 0, `${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

function skillEntries(catalogue) {
  return catalogue.classifiedCatalogue.filter((item) =>
    item.group === "personal-slash-commands" && IDS.includes(item.id));
}

test("fresh core installs both review packages and registers only installed skills with accurate invocation metadata", async (context) => {
  const temporary = await mkdtemp(join(tmpdir(), "agent-os-justification-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const home = join(temporary, "user");

  const before = run(["status", "--home", home, "--catalog", "--json"]);
  assert.deepEqual(skillEntries(before), [], "an uninstalled skill must not appear ready in the HUD catalog");

  const preview = run(["setup", "--home", home, "--safe", "--json"]);
  for (const id of IDS) {
    assert.ok(preview.operations.some((item) => item.id === `codex:skill:${id}:references/sources.md`));
  }
  run(["setup", "--home", home, "--safe", "--apply", "--json"]);

  for (const host of [".codex", ".claude"]) {
    for (const id of IDS) {
      const sourceRoot = join(ROOT, "skills", id);
      const targetRoot = join(home, host, "skills", id);
      const files = await filesUnder(sourceRoot);
      assert.deepEqual(await filesUnder(targetRoot), files, `${host}/${id} package is incomplete`);
      for (const file of files) {
        assert.equal(await readFile(join(targetRoot, file), "utf8"), await readFile(join(sourceRoot, file), "utf8"));
      }
    }
  }

  const catalogue = run(["status", "--home", home, "--catalog", "--json"]);
  const entries = skillEntries(catalogue);
  assert.equal(entries.length, 2);
  for (const id of IDS) {
    const entry = entries.find((item) => item.id === id);
    assert.equal(entry.invocation, `$${id}`);
    assert.equal(entry.source, "manifest/skills.json");
    assert.equal(entry.sourcePath, `<CODEX_HOME>/skills/${id}/SKILL.md`);
    assert.equal(entry.status, "installed");
    assert.ok(entry.description.includes(entry.invocation));
  }

  await unlink(join(home, ".codex", "skills", "justification-audit", "SKILL.md"));
  const after = run(["status", "--home", home, "--catalog", "--json"]);
  assert.deepEqual(skillEntries(after).map((item) => item.id), ["production-algorithm"],
    "a missing Codex skill must disappear even when its Claude copy is still installed");
});
