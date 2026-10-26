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
  for (const reference of ["fault-checks.md", "agent-handoff.md"]) {
    assert.ok(preview.operations.some((item) => item.id === `codex:skill:cover-project:references/${reference}`));
  }
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

  // Verify that the harness actually receives the routing policies, not just
  // the skill package. Implicit selection depends on these generated rules.
  const core = (await readFile("policies/core.md", "utf8")).trim();
  const orchestration = (await readFile("policies/orchestration.md", "utf8")).trim();
  const generated = await readFile(join(home, ".codex/AGENTS.md"), "utf8");
  assert.ok(generated.includes(core));
  assert.ok(generated.includes(orchestration));
  // The ownership checkpoint must survive installation ahead of general
  // parallel routing; merely distributing the skill does not ensure selection.
  const ownership = generated.indexOf("## Implementation test ownership");
  const parallelDefault = generated.indexOf("Run independently actionable implementation, testing and review tracks in parallel");
  assert.ok(ownership >= 0 && parallelDefault > ownership);
  assert.ok(generated.includes("Never impose one production writer for the whole project"));
  assert.ok(generated.includes("keep one writer per shared mutable surface in a checkout and sequence only conflicts"));
  assert.doesNotMatch(generated, /use one executor by default/i);
  assert.ok(ownership < generated.indexOf("## General policy"));
  const coordination = run(["status", "--home", home, "--catalog", "--json"])
    .classifiedCatalogue.find((item) => item.id === "orchestration" && item.group === "personal-slash-commands");
  assert.equal(coordination.invocation, "$orchestration");
  assert.equal(coordination.status, "installed");
  assert.equal(coordination.sourcePath, "<CODEX_HOME>/skills/orchestration/SKILL.md");

  const repeat = run(["setup", "--home", home, "--safe", "--json"]);
  assert.equal(repeat.conflicts, 0);
  assert.ok(repeat.operations.filter((item) => item.path.includes("/skills/cover-project/")).every((item) => item.status === "unchanged"));

  await unlink(join(home, ".codex/skills/cover-project/SKILL.md"));
  assert.deepEqual(entry(run(["status", "--home", home, "--catalog", "--json"])), []);
});

test("coverage discovery keeps worker routing visible in a shortened description", async () => {
  const skill = await readFile("skills/cover-project/SKILL.md", "utf8");
  const description = skill.match(/^description: (.+)$/m)?.[1];
  assert.ok(description);
  // A deliberately small discovery budget: this tests prompt distribution,
  // not a guarantee about the host's truncation algorithm or model behavior.
  assert.match(description.slice(0, 64), /^Delegate\b.*\bworker\b.*\bseparable\b/);
  const metadata = await readFile("skills/cover-project/agents/openai.yaml", "utf8");
  assert.match(metadata, /allow_implicit_invocation: true/);
});
