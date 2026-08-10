import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const AUDIT = join(ROOT, "scripts", "twin-audit.mjs");

function run(args, expected = 0) {
  const result = spawnSync(process.execPath, [AUDIT, ...args], { cwd: ROOT, encoding: "utf8" });
  assert.equal(result.status, expected, result.stderr || result.stdout);
  return result;
}

async function writeFixture(root, { extraSkill = false } = {}) {
  const tools = JSON.parse(await readFile(join(ROOT, "manifest", "tools.json"), "utf8")).tools.map((item) => item.id);
  const commands = JSON.parse(await readFile(join(ROOT, "manifest", "commands.json"), "utf8")).commands.filter((item) => item.path);
  const registry = join(root, "registry.yaml");
  const commandRoot = join(root, "skills");
  const goal = join(root, "goal-prompt.md");
  const orchestration = join(root, "orchestration.md");
  const instructions = join(root, "AGENTS.md");
  await writeFile(registry, `version: 1\ntools:\n${[...tools, "agent-inbox", "vox"].sort().map((id) => `  ${id}:`).join("\n")}\n`);
  for (const command of commands) {
    const commandPath = join(commandRoot, command.id, "SKILL.md");
    await mkdir(dirname(commandPath), { recursive: true });
    await writeFile(commandPath, await readFile(join(ROOT, command.path), "utf8"));
  }
  if (extraSkill) {
    const unrelated = join(commandRoot, "unrelated-tool", "SKILL.md");
    await mkdir(dirname(unrelated), { recursive: true });
    await writeFile(unrelated, "---\nname: unrelated-tool\n---\n");
  }
  await writeFile(goal, "## Mandatory Character-Count Gate\nprogrammatically count the prompt\nDo not send one prompt above the limit\nMultiple files and theoretical parallelism are insufficient.\nLead owns acceptance. Ask the human whether to orchestrate.\n");
  await writeFile(orchestration, await readFile(join(ROOT, "skills", "orchestration", "SKILL.md"), "utf8"));
  await writeFile(instructions, "## Agent OS Twin Synchronization\nCommit the intended Agent OS mirror change locally. Push it to the configured Agent OS `origin`. Never force-push or push unrelated project work.\n\n## Task Orchestration\nAutomatically use the `orchestration` skill. Multiple files alone are insufficient. Ask the human whether to orchestrate. The lead defines scope. Never claim a model or delegation occurred.\n");
  return { registry, commandRoot, goal, orchestration, instructions, commands };
}

function auditArgs(fixture) {
  return ["--live-registry", fixture.registry, "--live-commands", fixture.commandRoot, "--live-goal-prompt", fixture.goal, "--live-orchestration", fixture.orchestration, "--live-instructions", fixture.instructions];
}

test("twin audit accepts five mirrored commands and ignores unrelated host skills", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-audit-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root, { extraSkill: true });
  const report = JSON.parse(run(auditArgs(fixture)).stdout);
  assert.equal(report.ok, true);
  assert.deepEqual(report.portableCommandIds, ["add", "commands", "teach", "trashness", "trunk-finish"]);
  assert.deepEqual(report.commandSources.map((source) => source.status), ["match", "match", "match", "match", "match"]);
  assert.deepEqual(report.ignoredHostSkills, ["unrelated-tool"]);
});

test("twin audit detects missing and mismatched portable command content", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-audit-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root);
  await writeFile(join(fixture.commandRoot, "add", "SKILL.md"), "mismatched command\n");
  await rm(join(fixture.commandRoot, "teach", "SKILL.md"));
  const report = JSON.parse(run(auditArgs(fixture), 1).stdout);
  assert.match(report.failures.join("\n"), /content mismatch: add/);
  assert.match(report.failures.join("\n"), /missing from host skill root: teach/);
  assert.equal(report.commandSources.find((source) => source.id === "add").status, "content-mismatch");
  assert.equal(report.commandSources.find((source) => source.id === "teach").status, "missing");
});

test("twin audit rejects portable command links resolving under a forbidden legacy root", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-audit-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root);
  const legacyRoot = join(root, "legacy-agent-system");
  const legacyCommand = join(legacyRoot, "add", "SKILL.md");
  await mkdir(dirname(legacyCommand), { recursive: true });
  await writeFile(legacyCommand, await readFile(join(ROOT, "commands", "add", "SKILL.md"), "utf8"));
  await rm(join(fixture.commandRoot, "add"), { recursive: true });
  await symlink(join(legacyRoot, "add"), join(fixture.commandRoot, "add"));
  const report = JSON.parse(run([...auditArgs(fixture), "--forbid-root", legacyRoot], 1).stdout);
  assert.match(report.failures.join("\n"), /resolves under forbidden root: add/);
  assert.equal(report.commandSources.find((source) => source.id === "add").forbidden, true);
});

test("twin audit still reports unexpected live tool drift", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-audit-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root);
  const tools = JSON.parse(await readFile(join(ROOT, "manifest", "tools.json"), "utf8")).tools.map((item) => item.id);
  await writeFile(fixture.registry, `version: 1\ntools:\n${[...tools.filter((id) => id !== "birdclaw"), "agent-inbox", "vox"].sort().map((id) => `  ${id}:`).join("\n")}\n`);
  assert.match(run(auditArgs(fixture), 1).stdout, /birdclaw/);
});

test("twin audit detects live orchestration skill drift", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-audit-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root);
  await writeFile(fixture.orchestration, "mismatched orchestration skill\n");
  assert.match(run(auditArgs(fixture), 1).stdout, /live orchestration skill content mismatch/);
});
