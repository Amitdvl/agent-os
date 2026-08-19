import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function json(name) {
  return JSON.parse(await readFile(join(ROOT, "manifest", `${name}.json`), "utf8"));
}

async function filesUnder(root) {
  const result = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const target = join(root, entry.name);
    if (entry.isDirectory() && entry.name !== "__pycache__") result.push(...await filesUnder(target));
    else if (entry.isFile() && !entry.name.endsWith(".pyc")) result.push(target);
  }
  return result;
}

test("CLI validates the complete manifest graph", () => {
  const output = execFileSync(process.execPath, [join(ROOT, "bootstrap", "cli.mjs"), "validate", "--json"], { cwd: ROOT, encoding: "utf8" });
  const result = JSON.parse(output);
  assert.equal(result.ok, true, result.errors?.join("\n"));
  assert.deepEqual(result.warnings, []);
});

test("default profile is opinionated and selects every capability pack", async () => {
  const profiles = await json("profiles");
  const packs = await json("packs");
  assert.equal(profiles.defaultProfile, "strict-portable");
  const profile = profiles.profiles.find((item) => item.id === "strict-portable");
  assert.deepEqual(new Set(profile.packs), new Set(["core", "local-productivity", "research", "communication", "creator"]));
  assert.deepEqual(new Set(profile.packs), new Set(packs.packs.map((item) => item.id)));
  assert.equal(profile.memory, "disabled");
  assert.equal(profile.externalWrites, "exact-intent");
});

test("core installs all six portable commands by default", async () => {
  const packs = await json("packs");
  const commands = await json("commands");
  const core = packs.packs.find((pack) => pack.id === "core");
  assert.deepEqual(core.commands, ["add", "commands", "ground", "teach", "trashness", "trunk-finish"]);
  assert.deepEqual(core.optionalCommands, []);
  const selected = commands.commands.filter((command) => core.commands.includes(command.id));
  assert.equal(selected.length, 6);
  assert.ok(selected.every((command) => command.disposition === "portable-core" && command.selectedByDefault));
});

test("CLI design guidance is portable and defaults custom CLIs to Go", async () => {
  const skills = await json("skills");
  const dispositions = await json("inventory-dispositions");
  const entry = skills.skills.find((item) => item.id === "cli-for-agents");
  assert.deepEqual(entry, { id: "cli-for-agents", path: "skills/cli-for-agents/SKILL.md", disposition: "portable-core" });
  assert.ok(dispositions.skillGroups.find((group) => group.id === "agent-os-core-skills").skills.includes("cli-for-agents"));
  const content = await readFile(join(ROOT, entry.path), "utf8");
  assert.match(content, /Build custom CLIs in Go\./);
});

test("every audited tool and skill has a machine-readable disposition", async () => {
  const dispositions = await json("inventory-dispositions");
  const tools = await json("tools");
  const commands = await json("commands");
  assert.equal(dispositions.localTools.length, 19);
  assert.deepEqual(new Set(dispositions.localTools.map((item) => item.id)), new Set(tools.tools.map((item) => item.id)));
  assert.deepEqual(new Set(dispositions.commands.map((item) => item.id)), new Set(commands.commands.map((item) => item.id)));
  const installedSkills = dispositions.skillGroups.flatMap((group) => group.skills);
  assert.equal(installedSkills.length, 85);
  assert.equal(new Set(installedSkills).size, 85);
  for (const group of dispositions.skillGroups) assert.ok(group.disposition);
  for (const item of [...dispositions.hooks, ...dispositions.rules, ...dispositions.policySurfaces]) assert.ok(item.disposition);
  for (const item of [...dispositions.automationTemplates, ...dispositions.referenceOnly]) assert.ok(item.disposition);
});

test("portable automation, hook, and skill-cleaner assets have declared sources without legacy ownership", async () => {
  const dispositions = await json("inventory-dispositions");
  const portablePaths = [
    "skills/skill-cleaner/SKILL.md",
    "templates/hooks/commit-push-watcher/codex_commit_push_watcher.py",
    "templates/hooks/commit-push-watcher/manage_commit_push_hook.sh",
    "templates/hooks/block-no-verify/block_no_verify.sh",
    "templates/hooks/ctx7-guard/ctx7_guard.py",
    "templates/hooks/ctx7-guard/ctx7_guard_config.example.json",
    ...dispositions.automationTemplates.map((item) => item.path),
    ...dispositions.hooks.filter((item) => item.path).map((item) => item.path),
  ];
  for (const path of portablePaths) {
    const content = await readFile(join(ROOT, path), "utf8");
    assert.equal(content.includes("agent-system"), false, `${path} retains legacy ownership`);
  }
});

test("all external tools have explicit source pins or unresolved markers", async () => {
  const tools = await json("tools");
  const sources = await json("sources");
  const sourceMap = new Map(sources.sources.map((source) => [source.id, source]));
  for (const tool of tools.tools) {
    const source = sourceMap.get(tool.source);
    assert.ok(source, `missing source for ${tool.id}`);
    assert.ok(source.pin, `missing pin for ${tool.id}`);
    assert.equal(source.automation, "disabled", `${tool.id} must not auto-install`);
  }
});

test("portable assets contain no personal path, identity, excluded feature, or embedded secret-looking value", async () => {
  const roots = ["bin", "bootstrap", "commands", "manifest", "policies", "profiles", "scripts", "skills", "templates", "tests"];
  const secretValue = /(?:api[_-]?key|auth[_-]?token|secret|password)\s*[:=]\s*["'][A-Za-z0-9_\-]{12,}["']/i;
  const personalPath = ["", "Users", "ami" + "tdvl"].join("/");
  for (const root of roots) {
    for (const target of await filesUnder(join(ROOT, root))) {
      const content = await readFile(target, "utf8");
      assert.equal(content.includes(personalPath), false, `personal path in ${relative(ROOT, target)}`);
      assert.equal(new RegExp(`\\b${"am" + "it"}\\b`, "i").test(content), false, `personal identity in ${relative(ROOT, target)}`);
      assert.equal(new RegExp(`${"agent"}[ -]${"reach"}`, "i").test(content), false, `excluded feature in ${relative(ROOT, target)}`);
      assert.equal(secretValue.test(content), false, `secret-looking value in ${relative(ROOT, target)}`);
    }
  }
});

test("documentation links resolve inside the repository", async () => {
  const markdown = [join(ROOT, "README.md"), ...await filesUnder(join(ROOT, "docs"))].filter((target) => target.endsWith(".md"));
  for (const source of markdown) {
    const content = await readFile(source, "utf8");
    for (const match of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const link = match[1].split("#")[0];
      if (!link || /^(https?:|mailto:)/.test(link)) continue;
      const target = resolve(dirname(source), link);
      await stat(target).catch(() => assert.fail(`broken link ${link} in ${relative(ROOT, source)}`));
    }
  }
});

test("portable command and goal contracts retain their required workflow sections", async () => {
  const required = {
    "commands/add/SKILL.md": ["## Operating Principle", "## Workflow", "## Skill Document Requirements", "## Registry Requirements", "## Verification Commands", "## Stop Conditions", "## Output Contract", "Agent OS"],
    "commands/commands/SKILL.md": ["## Usage", "## Workflow", "## Rules", "agent-os status --catalog --json", "personal slash commands", "active automations", "credential files", "Agent OS"],
    "commands/ground/SKILL.md": ["## Usage", "## Natural-language activation", "## Operating Principle", "## The V.A.L.U.E. Formula", "## OS Order Contract", "## Source Handling", "### Durable file attachments", "## OS Library Record", "## Output Contract", "semantic intent", "Ground these", "study-ready", "each distinct source", "retrieval-first", "one material page", "Area umbrella", "clickable file block", "clean, human filename", "attachment path is only a temporary input", "display an ephemeral or machine-local path", "Verify both the attachment and filename"],
    "commands/trashness/SKILL.md": ["## Operating Principle", "## Eligible Categories", "## Absolute Exclusions", "## Approval Contract", "## Deletion Workflow", "## Monthly Automation Behavior", "protected-names", "permanent deletion", "exact manifest"],
    "commands/teach/SKILL.md": ["## Usage", "## Source Resolution", "## Teaching Loop", "One question at a time", "--student", "motivation and tradeoffs"],
    "commands/trunk-finish/SKILL.md": ["recovery-first", "## Operating Principle", "## Workflow", "## Repair Behavior", "sensitive surfaces", "worktrees", "## Stop Conditions", "## Output Contract"],
    "skills/goal-prompt/SKILL.md": ["3,800", "at most three", "visual work", "metric gaming", "Progress reporting", "`/goal` is an orchestration trigger", "beginning of the goal", "Never claim a model or delegation occurred"],
    "skills/orchestration/SKILL.md": ["## Activation", "## Lead Contract", "## Assignments", "## Coordination Rules", "## Completion Gate", "every `/goal` activates orchestration", "multiple files", "Never claim a model or delegation occurred"],
  };
  for (const [path, phrases] of Object.entries(required)) {
    const content = await readFile(join(ROOT, path), "utf8");
    for (const phrase of phrases) assert.match(content, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), `${path} missing ${phrase}`);
    if (path.startsWith("commands/")) assert.doesNotMatch(content, /agent-system/, `${path} retains an active legacy dependency`);
  }
});

test("twin inventory documents the only intentional live-tool exclusions", async () => {
  const dispositions = await json("inventory-dispositions");
  assert.equal(dispositions.twin.mode, "one-way-portable-contract");
  assert.deepEqual(dispositions.twin.excludedLiveTools.map((item) => item.id).sort(), ["agent-inbox", "vox"]);
  for (const item of dispositions.twin.excludedLiveTools) assert.ok(item.reason);
});
