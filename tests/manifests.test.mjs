import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function json(name) {
  const filename = name === "secrets" ? "secret-requirements" : name;
  return JSON.parse(await readFile(join(ROOT, "manifest", `${filename}.json`), "utf8"));
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

test("default profile is opinionated and selects the portable capability packs", async () => {
  const profiles = await json("profiles");
  assert.equal(profiles.defaultProfile, "strict-portable");
  const profile = profiles.profiles.find((item) => item.id === "strict-portable");
  assert.deepEqual(new Set(profile.packs), new Set(["core", "local-productivity", "research", "communication", "creator"]));
  assert.equal(profile.memory, "disabled");
  assert.equal(profile.externalWrites, "exact-intent");
});

test("core policy makes Awareness HUD command registration a mandatory completion gate", async () => {
  const content = await readFile(join(ROOT, "policies", "core.md"), "utf8");
  for (const phrase of [
    "Mandatory command-registry step",
    "Awareness HUD **Commands** page",
    "required completion criterion",
    "refresh the page and verify that the entry is visible",
    "leave the task incomplete",
  ]) {
    assert.ok(content.includes(phrase), `core policy missing ${phrase}`);
  }
});

test("secret requirements use a guard-safe manifest filename", async () => {
  const requirements = await json("secrets");
  assert.ok(Array.isArray(requirements.requirements));
  await stat(join(ROOT, "manifest", "secret-requirements.json"));
});

test("Windows Suite selects every pack while platform filtering owns its exclusions", async () => {
  const profiles = JSON.parse(await readFile(join(ROOT, "manifest", "profiles.json"), "utf8"));
  const windows = profiles.profiles.find((profile) => profile.id === "windows-suite");
  assert.ok(windows);
  assert.deepEqual(windows.packs, ["core", "local-productivity", "research", "communication", "creator"]);
});

test("core installs all eight portable commands and every portable core skill by default", async () => {
  const packs = await json("packs");
  const commands = await json("commands");
  const core = packs.packs.find((pack) => pack.id === "core");
  assert.deepEqual(core.commands, ["add", "archive", "commands", "ground", "pre-publication", "teach", "trashness", "trunk-finish"]);
  assert.deepEqual(core.optionalCommands, []);
  const selected = commands.commands.filter((command) => core.commands.includes(command.id));
  assert.equal(selected.length, 8);
  assert.ok(selected.every((command) => command.disposition === "portable-core" && command.selectedByDefault));
  for (const id of ["book", "cli-for-agents", "fallacy-check", "outcome-loop", "pamphlet", "production-repo-baseline", "publication-safety"]) assert.ok(core.skills.includes(id), `${id} is not selected by core`);
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
  assert.equal(dispositions.localTools.length, 20);
  assert.deepEqual(new Set(dispositions.localTools.map((item) => item.id)), new Set(tools.tools.map((item) => item.id)));
  assert.deepEqual(new Set(dispositions.commands.map((item) => item.id)), new Set(commands.commands.map((item) => item.id)));
  const installedSkills = dispositions.skillGroups.flatMap((group) => group.skills);
  assert.equal(installedSkills.length, 96);
  assert.equal(new Set(installedSkills).size, 96);
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

test("portable drift guard is paused and cannot overwrite unowned or semantic surfaces", async () => {
  const content = await readFile(join(ROOT, "templates", "automations", "agent-os-drift-guard", "automation.toml"), "utf8");
  assert.match(content, /status = "PAUSED"/);
  assert.match(content, /agent-os update --apply/);
  assert.match(content, /Do not overwrite an unowned skill, tool adapter, hook, AGENTS policy, automation, registry, default\.rules, or source-version change/);
  assert.match(content, /--live-symlink-root ~\/\.agents\/skills/);
  assert.match(content, /--live-ctx7-test ~\/\.codex\/hooks\/tests\/test_ctx7_guard\.py/);
  assert.match(content, /missing registered `routing\.md`/);
  assert.match(content, /Stay quiet when every check is clean/);
});

test("portable remindctl Urgent monitor is paused and only acts on verified native support", async () => {
  const content = await readFile(join(ROOT, "templates", "automations", "remindctl-urgent-support-monitor", "automation.toml"), "utf8");
  assert.match(content, /status = "PAUSED"/);
  assert.match(content, /Do not treat a closed issue, documentation-only change, alarm help improvement, bot activity/);
  assert.match(content, /explicitly approve a supported native Urgent capability or when merged\/released upstream code provides it/);
  assert.match(content, /validation, full tests, git diff --check, and twin audit/);
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
    "commands/archive/SKILL.md": ["## Usage", "## Resolve the target", "## Move safely", "## Verify and report", "Documents/ArchivedProjects", "git worktree move", "git worktree repair", "Never overwrite"],
    "commands/commands/SKILL.md": ["## Usage", "## Workflow", "## Rules", "agent-os status --catalog --json", "personal slash commands", "active automations", "credential files", "Agent OS"],
    "commands/decision-queue/SKILL.md": ["## Usage", "Natural-language requests", "## Configuration", "decision-queue.json", "## Capture", "## Write and Verify", "Unresolved", "Do not alter the database"],
    "commands/ground/SKILL.md": ["## Usage", "## Natural-language activation", "## Operating Principle", "## The V.A.L.U.E. Formula", "## OS Order Contract", "## Source Handling", "### Durable web links", "### Link completion gate", "### Durable file attachments", "## OS Library Record", "## Output Contract", "semantic intent", "Ground these", "study-ready", "each distinct source", "retrieval-first", "one material page", "Area umbrella", "Never paste a bare URL as plain text", "actual rich-text hyperlink", "rendered link's", "target/href", "expected-source manifest", "saved record must be a bijection", "re-read the complete material page", "Resolve every external", "exact target ID", "whole-page scan", "validate-link-record.mjs", "Never say `Grounded`", "clickable file block", "clean, human filename", "attachment path is only a temporary input", "prominent, real, clickable source link", "ephemeral or machine-local path", "clear action label", "temporary signed download URL", "actual file-block `name`", "rendered filename on the attachment control", "Do not add a raw-source dump"],
    "commands/pre-publication/SKILL.md": ["publication-safety", "independent history-capable secret scanner", "codex-security:security-scan", "frozen candidate SHA", "completed report", "history", "visibility", "Stop"],
    "commands/trashness/SKILL.md": ["## Operating Principle", "## Build Artifact Hygiene", "## Eligible Categories", "## Absolute Exclusions", "## Approval Contract", "## Deletion Workflow", "## Monthly Automation Behavior", "stable, ignored `.noindex` output root", "unrelated worktrees", "protected-names", "permanent deletion", "exact manifest"],
    "commands/teach/SKILL.md": ["## Usage", "## Source Resolution", "## Teaching Loop", "One question at a time", "--student", "motivation and tradeoffs"],
    "commands/trunk-finish/SKILL.md": ["recovery-first", "## Operating Principle", "## Workflow", "## Repair Behavior", "sensitive surfaces", "worktrees", "## Stop Conditions", "## Output Contract", "instruction to finish", "verified branch to trunk", "Do not ask for confirmation", "delete only merged local branches", "preserved user-owned or generated artifacts"],
    "skills/goal-prompt/SKILL.md": ["persistent, thread-scoped objective", "Goal Lifecycle", "native goal controls", "at most 4,000 characters", "excluding the `/goal `", "Do not split one outcome", "Goal mode does not by itself require orchestration", "Use one executor by default", "worker output is evidence"],
    "skills/orchestration/SKILL.md": ["## Activation", "## Lead Contract", "## Assignments", "## Coordination Rules", "## Completion Gate", "does not by itself require orchestration", "executor by default", "Do not orchestrate merely because work uses `/goal`", "Never claim a model or delegation occurred", "worker output as evidence", "silently redirect"],
  };
  for (const [path, phrases] of Object.entries(required)) {
    const content = await readFile(join(ROOT, path), "utf8");
    for (const phrase of phrases) assert.match(content, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), `${path} missing ${phrase}`);
    if (path.startsWith("commands/")) assert.doesNotMatch(content, /agent-system/, `${path} retains an active legacy dependency`);
  }
});

test("restored core skills are declared, packaged, and behaviorally anchored", async () => {
  const [skills, packs, dispositions, tools] = await Promise.all(["skills", "packs", "inventory-dispositions", "tools"].map(json));
  const core = packs.packs.find((pack) => pack.id === "core");
  const inventory = dispositions.skillGroups.find((group) => group.id === "agent-os-core-skills");
  for (const id of ["book", "fallacy-check", "outcome-loop", "production-repo-baseline"]) {
    const entry = skills.skills.find((skill) => skill.id === id);
    assert.ok(entry?.path, `${id} missing from skill manifest`);
    assert.ok(core.skills.includes(id), `${id} missing from core pack`);
    assert.ok(inventory.skills.includes(id), `${id} missing from inventory dispositions`);
    await stat(join(ROOT, entry.path));
  }
  assert.equal(skills.skills.find((skill) => skill.id === "book").includePackage, true);
  assert.equal(skills.skills.find((skill) => skill.id === "production-repo-baseline").includePackage, true);
  assert.ok(!tools.tools.some((tool) => tool.id === "fallacy-check"));
  const fallacy = await readFile(join(ROOT, "skills/fallacy-check/SKILL.md"), "utf8");
  assert.ok(fallacy.includes("## Intervention threshold"));
  const outcome = await readFile(join(ROOT, "skills/outcome-loop/SKILL.md"), "utf8");
  for (const phrase of ["## Establish the target", "## Close the loop", "Do not replace the objective with an easier metric", "## Leave the result in Notion"]) assert.ok(outcome.includes(phrase), `outcome-loop missing ${phrase}`);
  const baseline = await readFile(join(ROOT, "skills/production-repo-baseline/SKILL.md"), "utf8");
  for (const phrase of ["# Production Repo Baseline", "second things", "initialize Git with `main`", "no fake application CI", "Do **not** scaffold Bun", "Dependabot"]) assert.ok(baseline.includes(phrase), `production-repo-baseline missing ${phrase}`);
  await stat(join(ROOT, "skills/production-repo-baseline/scripts/main.go"));
});

test("every deployable skill is selected and live-only skills are explicitly excluded", async () => {
  const [skills, packs, dispositions] = await Promise.all(["skills", "packs", "inventory-dispositions"].map(json));
  const selected = new Set(packs.packs.flatMap((pack) => pack.skills ?? []));
  for (const skill of skills.skills.filter((item) => item.path && item.disposition !== "portable-core-contract")) {
    assert.ok(selected.has(skill.id), `${skill.id} is deployable but absent from every pack`);
  }
  for (const id of selected) assert.ok(skills.skills.some((skill) => skill.id === id), `${id} is pack-selected but absent from skills manifest`);
  assert.deepEqual(dispositions.twin.excludedLiveSkills.map((item) => item.id), ["no-temptation-lockin"]);
  assert.ok(dispositions.twin.excludedLiveSkills[0].reason);
  const outcome = skills.skills.find((skill) => skill.id === "outcome-loop");
  assert.equal(outcome.path, "skills/outcome-loop/SKILL.md");
  assert.ok(selected.has("outcome-loop"));
});

test("OpenAI aesthetic skill preserves directional light-field guidance and source references", async () => {
  const skills = await json("skills");
  const entry = skills.skills.find((item) => item.id === "openai-aesthetic-images");
  assert.deepEqual(entry, { id: "openai-aesthetic-images", path: "skills/openai-aesthetic-images/SKILL.md", disposition: "portable-core" });
  const creator = (await json("packs")).packs.find((pack) => pack.id === "creator");
  assert.ok(creator.skills.includes("openai-aesthetic-images"));
  const content = await readFile(join(ROOT, entry.path), "utf8");
  for (const phrase of ["Gradient Labs", "New funding to build towards AGI", "large-scale directional color flow", "isolated orange bloom", "3:1 X profile banner", "Visual acceptance check"]) {
    assert.match(content, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `missing ${phrase}`);
  }
});

test("half-bounce is an Apple Suite standalone macOS workflow", async () => {
  const [skills, packs, profiles, dispositions] = await Promise.all(["skills", "packs", "profiles", "inventory-dispositions"].map(json));
  const entry = skills.skills.find((item) => item.id === "half-bounce");
  assert.deepEqual(entry, { id: "half-bounce", path: "skills/half-bounce/SKILL.md", disposition: "portable-macos-workflow" });
  const macosDevelopment = packs.packs.find((pack) => pack.id === "macos-development");
  assert.deepEqual(macosDevelopment.skills, ["half-bounce"]);
  const apple = profiles.profiles.find((profile) => profile.id === "apple-suite");
  assert.ok(apple.packs.includes("macos-development"));
  const inventory = dispositions.skillGroups.find((group) => group.id === "macos-development");
  assert.deepEqual(inventory.skills, ["half-bounce"]);
  const content = await readFile(join(ROOT, entry.path), "utf8");
  for (const phrase of ["Software readiness", "Physical readiness", "metadata-only", "freeze before dismissal", "Dock", "Not Done"]) {
    assert.match(content, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `missing ${phrase}`);
  }
});

test("twin inventory documents intentional live-tool exclusions", async () => {
  const dispositions = await json("inventory-dispositions");
  assert.equal(dispositions.twin.mode, "one-way-portable-contract");
  assert.deepEqual(dispositions.twin.excludedLiveTools.map((item) => item.id).sort(), ["agent-inbox", "epubcheck", "pandoc", "silicon", "summarize", "telgo", "vox"]);
  for (const item of dispositions.twin.excludedLiveTools) assert.ok(item.reason);
});

test("workspace registry is explicitly machine-local with a portable template", async () => {
  const dispositions = await json("inventory-dispositions");
  const excluded = dispositions.twin.excludedLiveConfiguration.find((item) => item.id === "workspace-registry");
  assert.ok(excluded?.reason);
  assert.ok(dispositions.policySurfaces.some((item) => item.id === "workspace-navigation" && item.disposition === "portable-core-contract"));
  const template = JSON.parse(await readFile(join(ROOT, "templates", "workspaces.example.json"), "utf8"));
  assert.equal(template.schemaVersion, 1);
  assert.ok(Array.isArray(template.canonicalProjects));
  assert.match(template.roots.taskScratch, /^<.+>$/);
});


test("Apple Suite includes guarded ASC with unresolved install and vault requirements", async () => {
  const [profiles, packs, tools, sources, secrets] = await Promise.all(["profiles", "packs", "tools", "sources", "secrets"].map(json));
  assert.deepEqual(profiles.profiles.find((p) => p.id === "apple-suite").packs, packs.packs.map((p) => p.id));
  const asc = tools.tools.find((t) => t.id === "asc");
  assert.deepEqual(asc.platforms, ["darwin"]);
  assert.ok(packs.packs.find((p) => p.id === "local-productivity").tools.includes("asc"));
  const source = sources.sources.find((s) => s.id === asc.source);
  assert.equal(source.pin, "manual-unresolved");
  assert.equal(source.automation, "disabled");
  assert.equal(source.locator, "asc");
  assert.deepEqual(secrets.requirements.find((r) => r.tool === "asc").names, ["ASC_KEY_ID", "ASC_ISSUER_ID", "ASC_PRIVATE_KEY_PATH", "ASC_PRIVATE_KEY", "ASC_PRIVATE_KEY_B64", "ASC_KEY_TYPE"]);
});
