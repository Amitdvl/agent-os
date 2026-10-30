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
  const workflowSource = join(ROOT, "skills", "cover-project", "worker-workflow.md");
  await writeFile(join(commandRoot, "cover-project", "worker-workflow.md"), await readFile(workflowSource, "utf8"));
  if (extraSkill) {
    const unrelated = join(commandRoot, "no-temptation-lockin", "SKILL.md");
    await mkdir(dirname(unrelated), { recursive: true });
    await writeFile(unrelated, "---\nname: no-temptation-lockin\ndescription: private fixture\n---\n");
  }
  const policies = JSON.parse(await readFile(join(ROOT, "manifest", "policies.json"), "utf8")).policies;
  const profiles = JSON.parse(await readFile(join(ROOT, "manifest", "profiles.json"), "utf8")).profiles;
  const profile = profiles.find((item) => item.id === "strict-portable");
  const policySources = await Promise.all(profile.policies.map(async (id) => {
    const source = policies.find((item) => item.id === id);
    return (await readFile(join(ROOT, source.path), "utf8")).trim();
  }));
  await writeFile(instructions, `<!-- agent-os:start profile=strict-portable -->\n\n${policySources.join("\n\n")}\n\n<!-- agent-os:end -->\n`);
  return { registry, registryRoot, registryLinkRoot, commandRoot, goal, orchestration, instructions, commands, skills };
}

function auditArgs(fixture) {
  return ["--live-registry", fixture.registry, "--live-commands", fixture.commandRoot, "--live-goal-prompt", fixture.goal, "--live-orchestration", fixture.orchestration, "--live-instructions", fixture.instructions, "--live-skill-root", fixture.commandRoot, "--live-symlink-root", fixture.commandRoot];
}

async function renderPortableTools(fixture) {
  const tools = JSON.parse(await readFile(join(ROOT, "manifest", "tools.json"), "utf8")).tools;
  for (const { id } of tools) {
    const rendered = spawnSync(process.execPath, [join(ROOT, "bootstrap", "cli.mjs"), "render-tool", id], { cwd: ROOT, encoding: "utf8" });
    assert.equal(rendered.status, 0, rendered.stderr || rendered.stdout);
    await writeFile(join(fixture.registryRoot, id, "SKILL.md"), rendered.stdout);
    await writeFile(join(fixture.registryRoot, id, "routing.md"), await readFile(join(ROOT, "templates", "local-tools", id, "routing.md")));
  }
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

test("required worker workflow accepts a matching reference and unrelated extra skill files", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-workflow-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root);
  await writeFile(join(fixture.commandRoot, "fallacy-check", "unrelated-extra.md"), "host-only notes\n");
  assert.equal(JSON.parse(run(auditArgs(fixture)).stdout).ok, true);
});

test("required worker workflow rejects a missing installed reference", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-workflow-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root);
  await rm(join(fixture.commandRoot, "cover-project", "worker-workflow.md"));
  const report = JSON.parse(run(auditArgs(fixture), 1).stdout);
  assert.match(report.failures.join("\n"), /cover-project.*worker-workflow\.md/);
  assert.match(report.failures.join("\n"), /missing/i);
});

test("required worker workflow rejects a mismatched installed reference", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-workflow-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root);
  await writeFile(join(fixture.commandRoot, "cover-project", "worker-workflow.md"), "stale workflow\n");
  const report = JSON.parse(run(auditArgs(fixture), 1).stdout);
  assert.match(report.failures.join("\n"), /cover-project.*worker-workflow\.md/);
  assert.match(report.failures.join("\n"), /mismatch/i);
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

test("twin audit rejects two readable contract roots for one registered tool", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-roots-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root);
  const alternate = join(root, "alternate-discrawl");
  await mkdir(alternate);
  // Even identical text can drift independently: identity of the authoritative
  // contract, rather than current readability or content equality, is the gate.
  await writeFile(join(alternate, "SKILL.md"), await readFile(join(fixture.registryRoot, "discrawl", "SKILL.md")));
  await writeFile(join(alternate, "routing.md"), "# discrawl routing\n");
  await rm(join(fixture.registryLinkRoot, "discrawl"));
  await symlink(alternate, join(fixture.registryLinkRoot, "discrawl"));
  const report = JSON.parse(run(auditArgs(fixture), 1).stdout);
  assert.match(report.failures.join("\n"), /registered tool.*(?:contract|root|target).*discrawl|registered tool.*discrawl.*(?:contract|root|target)/i);
});

test("twin audit accepts a registry contract alias resolving to the canonical tool root", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-alias-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root);
  const alias = join(root, "legacy-contract-alias");
  await symlink(join(fixture.registryRoot, "discrawl"), alias);
  const registry = await readFile(fixture.registry, "utf8");
  await writeFile(fixture.registry, registry.replace(`skill: ${join(fixture.registryRoot, "discrawl", "SKILL.md")}`, `skill: ${join(alias, "SKILL.md")}`));
  assert.equal(JSON.parse(run(auditArgs(fixture)).stdout).ok, true);
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

test("twin audit protects parallel work, scoped exceptions and shared-surface ownership", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-parallel-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root);
  const content = await readFile(fixture.instructions, "utf8");
  assert.equal(JSON.parse(run(auditArgs(fixture)).stdout).ok, true);
  const cases = [
    ["blanket single executor", /^- Run independently actionable implementation, testing and review tracks in parallel.*$/m,
      "- For other work, use one executor by default. Automatically use the `orchestration` skill only when required.",
      "run independently actionable implementation, testing and review tracks in parallel"],
    ["global single writer", "Never impose one production writer for the whole project", "Keep one production writer for the whole project",
      "never impose one production writer for the whole project"],
    ["parallel writer isolation", "Parallel feature writers use isolated worktrees or disjoint mutable surfaces", "Parallel feature writers share mutable files",
      "parallel feature writers use isolated worktrees or disjoint mutable surfaces"],
    ["concrete exceptions", "unless explicitly requested or required by an actual dependency", "under any circumstances",
      "unless explicitly requested or required by an actual dependency"],
    ["supervisor shared surface", "keep one writer per shared mutable surface in a checkout and sequence only conflicts", "allow concurrent writers on shared files",
      "keep one writer per shared mutable surface in a checkout and sequence only conflicts"],
    ["constraint changes", "revisit the exception when the constraint changes", "keep the exception permanently",
      "revisit the exception when the constraint changes"],
  ];
  for (const [name, from, to, missing] of cases) {
    await context.test(name, async () => {
      const mutant = content.replace(from, to);
      assert.notEqual(mutant, content, "policy mutation must reach the actual instruction");
      await writeFile(fixture.instructions, mutant);
      const report = JSON.parse(run(auditArgs(fixture), 1).stdout);
      assert.ok(report.failures.some(message => message.startsWith("live global instructions are missing orchestration policy phrases:") && message.includes(missing)),
        `audit did not identify the lost parallel guard: ${name}`);
    });
  }
});

test("twin audit retains human authority and actual model restrictions under parallel defaults", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-parallel-authority-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root);
  const content = await readFile(fixture.instructions, "utf8");
  const phrases = [
    "Respect actual concurrency, model and worker-type restrictions",
    "Select each assignment's model and reasoning effort deliberately when the runtime supports it",
    "ask the human and wait for explicit approval of the concrete target/action",
    "Broad run approval, agent-drafted goals, supervisor technical review, worker recommendations and OS/UAC prompts do not grant this authority",
  ];
  for (const phrase of phrases) {
    await context.test(phrase, async () => {
      const mutant = content.replace(phrase, "[guard removed]");
      assert.notEqual(mutant, content, "authority mutation must reach the actual instruction");
      await writeFile(fixture.instructions, mutant);
      const report = JSON.parse(run(auditArgs(fixture), 1).stdout);
      assert.ok(report.failures.some(message => message.startsWith("live global instructions are missing orchestration policy phrases:") && message.includes(phrase.toLowerCase())),
        `audit did not identify the lost authority/model guard: ${phrase}`);
    });
  }
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
  await writeFile(fixture.instructions, content.replace(/^.*only when the task actually added or changed.*$/mi, ""));
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

test("twin audit rejects live instructions that drop mandatory default-branch completion", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-completion-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root);
  const before = JSON.parse(run(auditArgs(fixture)).stdout);
  assert.equal(before.ok, true);
  const content = await readFile(fixture.instructions, "utf8");
  await writeFile(fixture.instructions, content.replace(/^.*For completed repository implementation work,.*$/m, ""));
  const report = JSON.parse(run(auditArgs(fixture), 1).stdout);
  assert.match(report.failures.join("\n"), /live global instructions are missing mandatory completion policy/);
});

test("twin audit rejects a missing focus guard even if its old words remain outside the managed block", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-focus-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root);
  const original = await readFile(fixture.instructions, "utf8");
  const focus = (await readFile(join(ROOT, "policies", "focus.md"), "utf8")).trim();
  assert.ok(original.includes(focus), "fixture must first contain the full focus policy");
  await writeFile(fixture.instructions, `${focus}\n\n${original.replace(focus, "# Focus Protection\n\n[deleted guard]")}`);
  const report = JSON.parse(run(auditArgs(fixture), 1).stdout);
  assert.equal(report.instructionBlock.status, "content-mismatch");
  assert.match(report.failures.join("\n"), /live managed instruction block content-mismatch/);
});

test("twin audit fails closed on malformed, repeated and unknown-profile instruction markers", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-markers-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root);
  const original = await readFile(fixture.instructions, "utf8");
  const mutants = [
    [original.replace("<!-- agent-os:end -->", ""), "malformed"],
    [`${original}\n<!-- agent-os:end -->`, "malformed"],
    [original.replace("<!-- agent-os:start profile=strict-portable -->", "<!-- agent-os:start profile=unknown -->"), "unknown-profile"],
    [`<!-- agent-os:end -->\n${original}`, "malformed"],
    [`${original}\n<!-- agent-os:start profile=strict-portable-- >`, "malformed"],
    [`${original}\n<!-- agent-os:end-- >`, "malformed"],
  ];
  for (const [content, expected] of mutants) {
    await writeFile(fixture.instructions, content);
    const report = JSON.parse(run(auditArgs(fixture), 1).stdout);
    assert.equal(report.instructionBlock.status, expected);
    assert.ok(report.failures.includes(`live managed instruction block ${expected}`));
  }
});

test("twin audit allows an owner identity appendix without weakening portable policy comparison", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-identity-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root);
  const original = await readFile(fixture.instructions, "utf8");
  await writeFile(fixture.instructions, original.replace("\n\n<!-- agent-os:end -->", "\n\n# Local Identity\n- Owner preference: fixture only.\n\n<!-- agent-os:end -->"));
  const report = JSON.parse(run(auditArgs(fixture)).stdout);
  assert.equal(report.instructionBlock.status, "match");
});

test("twin audit compares detailed tool routing as well as its discoverable skill", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-routing-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root);
  await renderPortableTools(fixture);
  const args = [...auditArgs(fixture), "--live-tool-root", fixture.registryRoot];
  assert.equal(JSON.parse(run(args).stdout).ok, true);
  const routingPath = join(fixture.registryRoot, "discrawl", "routing.md");
  const original = await readFile(routingPath, "utf8");
  // A harmless-looking change must be caught even while the entrypoint skill
  // and all paths still match, because this file holds moved safety behavior.
  await writeFile(routingPath, `${original}\nUndeclared routing change.\n`);
  let report = JSON.parse(run(args, 1).stdout);
  assert.match(report.failures.join("\n"), /portable tool contract content-mismatch: discrawl/);
  await rm(routingPath);
  report = JSON.parse(run(args, 1).stdout);
  assert.match(report.failures.join("\n"), /registered tool routing missing: discrawl/);
});

test("twin audit binds registered contracts to the audited root even when registry and discovery agree elsewhere", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-bound-root-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await writeFixture(root);
  await renderPortableTools(fixture);
  const canonical = join(fixture.registryRoot, "discrawl");
  const alias = join(root, "canonical-discrawl-alias");
  await symlink(canonical, alias);
  const originalRegistry = await readFile(fixture.registry, "utf8");
  const declaredSkill = `skill: ${join(canonical, "SKILL.md")}`;
  await writeFile(fixture.registry, originalRegistry.replace(declaredSkill, `skill: ${join(alias, "SKILL.md")}`));
  const args = [...auditArgs(fixture), "--live-tool-root", fixture.registryRoot];
  // Different spelling of the same real contract remains valid, including when
  // the explicit audited root is supplied.
  assert.equal(JSON.parse(run(args).stdout).ok, true);

  const alternate = join(root, "second-discrawl-root");
  await mkdir(alternate);
  await writeFile(join(alternate, "SKILL.md"), `${await readFile(join(canonical, "SKILL.md"), "utf8")}\nDrifted active skill.\n`);
  await writeFile(join(alternate, "routing.md"), `${await readFile(join(canonical, "routing.md"), "utf8")}\nDrifted active routing.\n`);
  await writeFile(fixture.registry, originalRegistry.replace(declaredSkill, `skill: ${join(alternate, "SKILL.md")}`));
  await rm(join(fixture.registryLinkRoot, "discrawl"));
  await symlink(alternate, join(fixture.registryLinkRoot, "discrawl"));
  // Registry and discovery now agree, and the explicit audit root still holds
  // pristine generated files. Neither of those facts certifies the active pair.
  const report = JSON.parse(run(args, 1).stdout);
  assert.ok(report.failures.includes("portable tool contract root-mismatch: discrawl"));
  assert.equal(report.failures.some((failure) => failure.includes("competing contract roots")), false, "this challenge must expose the audited-root gap rather than the simpler registry/link mismatch");
});
