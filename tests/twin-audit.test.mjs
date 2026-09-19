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
  const skills = JSON.parse(await readFile(join(ROOT, "manifest", "skills.json"), "utf8")).skills.filter((item) => item.path && item.disposition !== "portable-core-contract");
  const registry = join(root, "registry.yaml");
  const commandRoot = join(root, "skills");
  const goal = join(commandRoot, "goal-prompt", "SKILL.md");
  const orchestration = join(commandRoot, "orchestration", "SKILL.md");
  const instructions = join(root, "AGENTS.md");
  const registryIds = [...tools, "agent-inbox", "vox"].sort();
  const registryRoot = join(root, "registry-tools");
  const registryLinkRoot = join(root, "registry-links");
  const registryLines = [];
  await mkdir(registryLinkRoot, { recursive: true });
  for (const id of registryIds) {
    const toolRoot = join(registryRoot, id);
    await mkdir(toolRoot, { recursive: true });
    await writeFile(join(toolRoot, "SKILL.md"), `---\nname: ${id}\ndescription: fixture\n---\n`);
    await writeFile(join(toolRoot, "routing.md"), `# ${id} routing\n`);
    await symlink(toolRoot, join(registryLinkRoot, id));
    registryLines.push(`  ${id}:\n    binary: ${id}\n    skill: ${join(toolRoot, "SKILL.md")}\n    skill_symlink: ${join(registryLinkRoot, id)}`);
  }
  await writeFile(registry, `version: 1\ntools:\n${registryLines.join("\n")}\n`);
  for (const command of commands) {
    const commandPath = join(commandRoot, command.id, "SKILL.md");
    await mkdir(dirname(commandPath), { recursive: true });
    await writeFile(commandPath, await readFile(join(ROOT, command.path), "utf8"));
  }
  for (const skill of skills) {
    const skillPath = join(commandRoot, skill.id, "SKILL.md");
    await mkdir(dirname(skillPath), { recursive: true });
    await writeFile(skillPath, await readFile(join(ROOT, skill.path), "utf8"));
  }
  if (extraSkill) {
    const unrelated = join(commandRoot, "no-temptation-lockin", "SKILL.md");
    await mkdir(dirname(unrelated), { recursive: true });
    await writeFile(unrelated, "---\nname: no-temptation-lockin\ndescription: private fixture\n---\n");
  }
  await writeFile(instructions, "## Agent OS Twin Synchronization\nCommit the intended Agent OS mirror change locally. Push it to the configured Agent OS `origin`. Never force-push or push unrelated project work.\n\n## Task Orchestration\n`/goal` creates a persistent, thread-scoped objective; it does not by itself require orchestration. Use one executor by default. Automatically use the `orchestration` skill only when justified. The lead owns integration. Never claim a model or delegation occurred. Worker output is evidence, not a replacement goal. Do not create user-visible tasks merely to split a goal.\n\n## Core Agent Policy\nMake frequent small, coherent commits at safe milestones. Use `fallacy-check` quietly.\n\n## Conditional Workflow Summaries\nInclude Reusable workflow updates only when the task actually added or changed a reusable surface. Omit this item or section entirely otherwise. Never emit negative placeholders.\n");
  return { registry, registryRoot, registryLinkRoot, commandRoot, goal, orchestration, instructions, commands, skills };
}

function auditArgs(fixture) {
  return ["--live-registry", fixture.registry, "--live-commands", fixture.commandRoot, "--live-goal-prompt", fixture.goal, "--live-orchestration", fixture.orchestration, "--live-instructions", fixture.instructions, "--live-skill-root", fixture.commandRoot, "--live-symlink-root", fixture.commandRoot];
}

test("twin audit accepts mirrored commands and an explicitly excluded live skill", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-audit-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root, { extraSkill: true });
  const report = JSON.parse(run(auditArgs(fixture)).stdout);
  assert.equal(report.ok, true);
  assert.deepEqual(report.portableCommandIds, ["add", "archive", "commands", "decision-queue", "ground", "pre-publication", "teach", "trashness", "trunk-finish"]);
  assert.deepEqual(report.commandSources.map((source) => source.status), Array(fixture.commands.length).fill("match"));
  assert.ok(report.ignoredHostSkills.includes("no-temptation-lockin"));
  assert.deepEqual(report.uncoveredHostSkills, []);
});

test("twin audit detects missing and mismatched portable skill content", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-audit-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root);
  await writeFile(join(fixture.commandRoot, "fallacy-check", "SKILL.md"), "mismatched skill\n");
  await rm(join(fixture.commandRoot, "outcome-loop", "SKILL.md"));
  const report = JSON.parse(run(auditArgs(fixture), 1).stdout);
  assert.match(report.failures.join("\n"), /portable skill content-mismatch: fallacy-check/);
  assert.match(report.failures.join("\n"), /portable skill missing: outcome-loop/);
});

test("twin audit rejects dangling host skill links before inventory filtering", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-audit-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root);
  await symlink(join(root, "vanished-skill"), join(fixture.commandRoot, "unlisted-broken-skill"));
  const report = JSON.parse(run(auditArgs(fixture), 1).stdout);
  assert.match(report.failures.join("\n"), /host skill symlink broken-target: .*unlisted-broken-skill/);
});

test("twin audit rejects duplicate enabled skill names and honors an exact Codex disable entry", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-audit-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root);
  const sharedRoot = join(root, "shared-skills");
  const duplicate = join(sharedRoot, "cli-copy", "SKILL.md");
  await mkdir(dirname(duplicate), { recursive: true });
  await writeFile(duplicate, "---\nname: cli-for-agents\ndescription: shared fixture\n---\n");
  const args = [...auditArgs(fixture), "--live-symlink-root", sharedRoot];
  const failed = JSON.parse(run(args, 1).stdout);
  assert.match(failed.failures.join("\n"), /enabled live skill name collision: cli-for-agents/);
  assert.equal(failed.skillNames.collisions[0].entries.length, 2);

  const config = join(root, "config.toml");
  await writeFile(config, `[[skills.config]]\npath = "${duplicate}"\nenabled = false\n`);
  const passing = JSON.parse(run([...args, "--live-codex-config", config]).stdout);
  assert.equal(passing.ok, true);
  assert.deepEqual(passing.skillNames.collisions, []);
  assert.ok(passing.skillNames.disabledPaths.includes(duplicate));
});

test("twin audit reports same-target aliases without treating Codex's realpath deduplication as a collision", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-audit-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root);
  const sharedRoot = join(root, "shared-skills");
  await mkdir(sharedRoot, { recursive: true });
  await symlink(join(fixture.commandRoot, "cli-for-agents"), join(sharedRoot, "cli-alias"));
  const report = JSON.parse(run([...auditArgs(fixture), "--live-symlink-root", sharedRoot]).stdout);
  assert.deepEqual(report.skillNames.collisions, []);
  assert.equal(report.skillNames.aliases.find((item) => item.normalizedName === "cli-for-agents").entries.length, 2);
});

test("twin audit rejects a missing registered tool routing document", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-audit-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root);
  await rm(join(fixture.registryRoot, "discrawl", "routing.md"));
  const report = JSON.parse(run(auditArgs(fixture), 1).stdout);
  assert.match(report.failures.join("\n"), /registered tool routing missing: discrawl/);
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

test("twin audit detects live goal-prompt skill drift", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-audit-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root);
  await writeFile(fixture.goal, "mismatched goal-prompt skill\n");
  assert.match(run(auditArgs(fixture), 1).stdout, /live goal-prompt content mismatch/);
});

test("twin audit detects a missing conditional workflow summary rule", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-audit-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root);
  const content = await readFile(fixture.instructions, "utf8");
  await writeFile(fixture.instructions, content.replace(/\n\n## Conditional Workflow Summaries[\s\S]*$/, "\n"));
  assert.match(run(auditArgs(fixture), 1).stdout, /missing conditional workflow-summary phrases/);
});

test("twin audit rejects an unreadable absolute skill path in live instructions", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-audit-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root);
  const content = await readFile(fixture.instructions, "utf8");
  await writeFile(fixture.instructions, `${content}\nRead \`${join(root, "missing", "skills", "declared", "SKILL.md")}\`.\n`);
  const report = JSON.parse(run(auditArgs(fixture), 1).stdout);
  assert.match(report.failures.join("\n"), /live instruction skill path missing/);
});
