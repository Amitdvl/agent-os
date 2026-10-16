import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, realpath, rm, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import test from "node:test";

function run(args) {
  const result = spawnSync(process.execPath, ["bootstrap/cli.mjs", ...args], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

async function packageFiles(root, directory = root) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory() && entry.name !== "__pycache__") result.push(...await packageFiles(root, path));
    else if (entry.isFile() && !entry.name.endsWith(".pyc")) result.push(relative(root, path));
  }
  return result.sort();
}

test("continuation consent, budgets, persistence and concurrency contracts", { skip: process.platform === "win32" ? "POSIX guard explicitly unsupported on Windows" : false }, () => {
  const result = spawnSync("python3", ["-B", "-m", "unittest", "discover", "-s", "skills/approved-continuation/tests", "-p", "test_*.py"], {
    encoding: "utf8", env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  });
  assert.equal(result.status, 0, result.stderr || result.stdout || String(result.error));
});

test("safe setup distributes continuation package and truthful command metadata in a temporary home", async (context) => {
  const temporary = await realpath(await mkdtemp(join(tmpdir(), "agent-os-continuation-install-")));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const home = join(temporary, "user");
  const entry = (catalogue) => catalogue.classifiedCatalogue.filter((item) =>
    item.group === "personal-slash-commands" && item.id === "approved-continuation");
  assert.deepEqual(entry(run(["status", "--home", home, "--catalog", "--json"])), []);
  const preview = run(["setup", "--home", home, "--safe", "--json"]);
  for (const relativePath of ["SKILL.md", "references/protocol.md", "scripts/continuation_guard.py"]) {
    assert.ok(preview.operations.some((item) => item.id === `codex:skill:approved-continuation:${relativePath}`));
  }
  run(["setup", "--home", home, "--safe", "--apply", "--json"]);
  const source = "skills/approved-continuation";
  const files = await packageFiles(source);
  for (const host of [".codex", ".claude"]) {
    const installed = join(home, host, "skills/approved-continuation");
    assert.deepEqual(await packageFiles(installed), files);
    for (const file of files) {
      assert.equal(await readFile(join(installed, file), "utf8"), await readFile(join(source, file), "utf8"));
    }
  }
  const [installed] = entry(run(["status", "--home", home, "--catalog", "--json"]));
  assert.ok(installed);
  assert.equal(installed.invocation, "$approved-continuation");
  assert.equal(installed.source, "manifest/skills.json");
  assert.equal(installed.sourcePath, "<CODEX_HOME>/skills/approved-continuation/SKILL.md");
  assert.equal(installed.status, "installed");
  assert.ok(installed.description.includes(installed.invocation));
  const repeat = run(["setup", "--home", home, "--safe", "--json"]);
  assert.equal(repeat.conflicts, 0);
  assert.ok(repeat.operations.filter((item) => item.path.includes("/skills/approved-continuation/")).every((item) => item.status === "unchanged"));
  await unlink(join(home, ".codex/skills/approved-continuation/SKILL.md"));
  assert.deepEqual(entry(run(["status", "--home", home, "--catalog", "--json"])), []);
});
