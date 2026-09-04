import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, chmod, lstat, mkdir, readFile, readlink, realpath, rm, rmdir, stat, symlink, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { platform } from "node:os";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(ROOT, "bootstrap", "cli.mjs");
const SANDBOX = join(ROOT, ".sandbox", `integration-${process.pid}`);
const WINDOWS = platform() === "win32";
const PLATFORM_TOOL_IDS = WINDOWS
  ? ["obsidian", "opencli", "rdt-cli", "twitter-cli", "wacli", "wacrawl", "xurl", "yt-dlp", "youtube"]
  : ["birdclaw", "discrawl", "instagram-cli", "notcrawl", "notebridge", "notion", "obsidian", "opencap", "opencli", "peekaboo", "rdt-cli", "remindctl", "spogo", "twitter-cli", "wacli", "wacrawl", "xurl", "yt-dlp", "youtube"];

test.after(async () => {
  await rm(SANDBOX, { recursive: true, force: true });
  await rmdir(join(ROOT, ".sandbox")).catch((error) => {
    if (!["ENOENT", "ENOTEMPTY"].includes(error.code)) throw error;
  });
});

async function exists(target) {
  try { await access(target, fsConstants.F_OK); return true; } catch { return false; }
}

function run(args, expectedStatus = 0, env = {}) {
  const result = spawnSync(process.execPath, [CLI, ...args], { cwd: ROOT, encoding: "utf8", env: { ...process.env, ...env } });
  assert.equal(result.status, expectedStatus, `command failed: ${args.join(" ")}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
  return result;
}

test("safe setup is a core-only no-write preview", async (context) => {
  const root = join(SANDBOX, "safe-preview");
  context.after(() => rm(root, { recursive: true, force: true }));
  const home = join(root, "user");
  const summary = JSON.parse(run(["setup", "--home", home, "--safe", "--json"]).stdout);
  assert.equal(summary.apply, false);
  assert.equal(summary.safe, true);
  assert.deepEqual(summary.packs, ["core"]);
  assert.equal(summary.externalTools.length, 0);
  assert.equal(summary.operations.some((item) => item.id === "codex:allow-rules"), false);
  assert.equal(await exists(home), false);
});

test("full deployment renders central registry, host symlinks, rules, status and safe uninstall", async (context) => {
  const root = join(SANDBOX, "lifecycle");
  context.after(() => rm(root, { recursive: true, force: true }));
  const home = join(root, "user");
  const codexInstructions = join(home, ".codex", "AGENTS.md");
  await mkdir(dirname(codexInstructions), { recursive: true });
  await writeFile(codexInstructions, "# Existing User Policy\n\nKeep this text.\n", "utf8");
  const noTools = { PATH: join(root, "empty-bin") };

  const setup = JSON.parse(run(["setup", "--home", home, "--apply", "--json"], 0, noTools).stdout);
  if (WINDOWS) assert.equal(setup.profile, "windows-suite");
  assert.equal(setup.conflicts, 0);
  assert.match(await readFile(codexInstructions, "utf8"), /Existing User Policy/);
  const registry = join(home, ".agent-os", "local-tools", "registry.json");
  assert.equal(JSON.parse(await readFile(registry, "utf8")).tools.length, PLATFORM_TOOL_IDS.length);
  const launcher = join(home, ".local", "bin", WINDOWS ? "agent-os.cmd" : "agent-os");
  if (WINDOWS) assert.match(await readFile(launcher, "utf8"), /bootstrap\\cli\.mjs/);
  else {
    assert.ok((await lstat(launcher)).isSymbolicLink());
    assert.equal(await realpath(launcher), join(ROOT, "bin", "agent-os"));
  }
  const launcherSmoke = WINDOWS
    ? spawnSync("cmd.exe", ["/d", "/s", "/c", launcher, "validate"], { cwd: root, encoding: "utf8", env: process.env })
    : spawnSync(launcher, ["validate"], { cwd: root, encoding: "utf8", env: process.env });
  assert.equal(launcherSmoke.status, 0, `launcher failed:\nstdout: ${launcherSmoke.stdout}\nstderr: ${launcherSmoke.stderr}`);
  assert.equal(JSON.parse(launcherSmoke.stdout).ok, true);
  const primaryTool = WINDOWS ? "opencli" : "birdclaw";
  const codexLink = join(home, ".codex", "skills", primaryTool);
  const claudeLink = join(home, ".claude", "skills", primaryTool);
  assert.ok((await lstat(codexLink)).isSymbolicLink());
  assert.ok((await lstat(claudeLink)).isSymbolicLink());
  assert.match(await readFile(join(codexLink, "SKILL.md"), "utf8"), /## Preflight/);
  const toolRequirements = {
    birdclaw: "birdclaw sync", discrawl: "discrawl sync --full", "instagram-cli": "no Instagram website", notcrawl: "notcrawl sync --source desktop", notebridge: "notebridge --format json doctor", notion: "notion auth status", obsidian: "obsidian search", opencap: "opencap record status", opencli: "opencli twitter bookmark-folders", peekaboo: "peekaboo list windows", "rdt-cli": "rdt search", remindctl: "remindctl list", spogo: "spogo auth status", "twitter-cli": "twitter search", wacli: "wacli status", wacrawl: "wacrawl sync", xurl: "xurl --help", "yt-dlp": "--no-playlist", youtube: "watch later",
  };
  for (const [id, phrase] of Object.entries(toolRequirements).filter(([id]) => PLATFORM_TOOL_IDS.includes(id))) {
    const content = await readFile(join(home, ".agent-os", "local-tools", "tools", id, "SKILL.md"), "utf8");
    for (const heading of ["## Setup and configuration", "## Tool-specific workflow", "## Data and authentication", "## Preflight", "## Freshness", "## Safe reads", "## Guarded writes", "## Limitations", "## Troubleshooting"]) assert.match(content, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(content, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), `${id} lacks its canonical requirement`);
  }
  if (PLATFORM_TOOL_IDS.includes("remindctl")) {
    const remindctlContract = await readFile(join(home, ".agent-os", "local-tools", "tools", "remindctl", "SKILL.md"), "utf8");
    assert.match(remindctlContract, /newly created reminders to high \(urgent\) priority/i);
  }
  if (PLATFORM_TOOL_IDS.includes("notebridge")) {
    const noteBridgeContract = await readFile(join(home, ".agent-os", "local-tools", "tools", "notebridge", "SKILL.md"), "utf8");
    assert.match(noteBridgeContract, /retrieve raw_content/i);
    assert.match(noteBridgeContract, /existing title explicitly/i);
    assert.match(noteBridgeContract, /original-content prefix/i);
  }
  assert.match(await readFile(join(home, ".codex", "rules", "agent-os.rules"), "utf8"), new RegExp(`prefix_rule\\(pattern=\\["${WINDOWS ? "opencli" : "birdclaw"}"\\]`));
  if (!WINDOWS) assert.ok((await readlink(codexLink)).includes(".agent-os/local-tools/tools/birdclaw"));
  for (const id of ["add", "commands", "ground", "teach", "trashness", "trunk-finish"]) {
    assert.match(await readFile(join(home, ".codex", "skills", id, "SKILL.md"), "utf8"), new RegExp(`name: ${id}`));
    assert.match(await readFile(join(home, ".claude", "commands", `${id}.md`), "utf8"), new RegExp(`name: ${id}`));
  }
  for (const hostHome of [join(home, ".codex"), join(home, ".claude")]) {
    const orchestration = await readFile(join(hostHome, "skills", "orchestration", "SKILL.md"), "utf8");
    assert.match(orchestration, /name: orchestration/);
    assert.match(orchestration, /## Completion Gate/);
  }

  const status = JSON.parse(run(["status", "--home", home, "--json"], 0, noTools).stdout);
  assert.equal(status.installed, true);
  assert.deepEqual(status.drift, []);
  const statusTool = WINDOWS ? "opencli" : "notion";
  assert.equal(status.tools.find((item) => item.id === statusTool).cli, "absent");
  assert.equal(status.tools.find((item) => item.id === statusTool).vault, WINDOWS ? "not-required-or-present" : "missing-requirement");
  if (!WINDOWS) assert.equal(status.tools.find((item) => item.id === "remindctl").permission, "missing-macos-permission");
  assert.equal(status.tools.find((item) => item.id === "wacli").auth, "unauthenticated-human-checkpoint");
  const doctor = JSON.parse(run(["doctor", "--home", home, "--json"], 0, noTools).stdout);
  assert.equal(doctor.ok, true);
  assert.match(doctor.nextActions[1], /install/);
  const catalogue = JSON.parse(run(["status", "--home", home, "--catalog", "--json"], 0, noTools).stdout);
  assert.equal(catalogue.workflows.length, 5);
  assert.ok(catalogue.hostSkills.codex.includes(WINDOWS ? "opencli" : "birdclaw"));
  assert.deepEqual(catalogue.automations, []);
  assert.deepEqual(catalogue.plugins, []);
  assert.deepEqual(catalogue.workflows.map((item) => item.id), ["core", "local-productivity", "research", "communication", "creator"]);
  assert.deepEqual(catalogue.classifiedCatalogue.map((item) => item.group).filter((item, index, all) => index === all.indexOf(item)), ["personal-slash-commands", "workflows", "local-tools", "standalone-skills"]);
  assert.equal(catalogue.classifiedCatalogue.find((item) => item.id === (WINDOWS ? "opencli" : "birdclaw")).source, "managed local-tools registry");

  const beforeUpdate = await readFile(join(home, ".agent-os", "state.json"), "utf8");
  const update = JSON.parse(run(["update", "--home", home, "--safe", "--json"], 0, noTools).stdout);
  assert.equal(update.apply, false);
  assert.equal(await readFile(join(home, ".agent-os", "state.json"), "utf8"), beforeUpdate);

  const preview = JSON.parse(run(["safe-uninstall", "--home", home, "--json"], 0, noTools).stdout);
  assert.equal(preview.apply, false);
  run(["safe-uninstall", "--home", home, "--apply", "--json"], 0, noTools);
  assert.match(await readFile(codexInstructions, "utf8"), /Existing User Policy/);
  assert.equal(await exists(codexLink), false);
  assert.equal(await exists(launcher), false);
  assert.deepEqual(JSON.parse(await readFile(join(home, ".agent-os", "state.json"), "utf8")).managed, []);
});

test("install mode is separately invoked and remains a dry-run without reviewed apply", async (context) => {
  const root = join(SANDBOX, "install-preview");
  context.after(() => rm(root, { recursive: true, force: true }));
  const plan = JSON.parse(run(["install", "--home", join(root, "user"), "--tools", "yt-dlp", "--json"]).stdout);
  assert.equal(plan.apply, false);
  assert.equal(plan.installs[0].id, "yt-dlp");
  if (WINDOWS) assert.equal(plan.installs[0].status, "manual-required");
  else assert.match(plan.installs[0].command, /^brew install yt-dlp$/);
  run(["install", "--home", join(root, "user"), "--tools", "yt-dlp", "--safe", "--apply", "--reviewed-install", "--json"], 1);
});

test("vault setup and validation use fixture binaries only and leave tmp clean", { skip: WINDOWS }, async (context) => {
  const root = join(SANDBOX, "vault");
  context.after(() => rm(root, { recursive: true, force: true }));
  const fakeBin = join(root, "bin");
  await mkdir(fakeBin, { recursive: true });
  await writeFile(join(fakeBin, "age-keygen"), "#!/bin/sh\nmkdir -p \"$(dirname \"$2\")\"\nprintf 'private-key-fixture\\n' > \"$2\"\nprintf 'Public key: age1fixtureportablevault0000000000000000000000000000000000000000000000000000\\n'\n", "utf8");
  await writeFile(join(fakeBin, "sops"), "#!/bin/sh\nout=''\nlast=''\nwhile [ \"$#\" -gt 0 ]; do\n  if [ \"$1\" = '--decrypt' ]; then exit 0; fi\n  if [ \"$1\" = '--output' ]; then shift; out=\"$1\"; else last=\"$1\"; fi\n  shift\ndone\nprintf 'sops: fixture-encrypted\\n' > \"$out\"\n", "utf8");
  await chmod(join(fakeBin, "age-keygen"), 0o755);
  await chmod(join(fakeBin, "sops"), 0o755);
  const home = join(root, "user");
  const env = { PATH: `${fakeBin}:${process.env.PATH}` };
  run(["vault", "init", "--home", home, "--tools", "notion", "--apply", "--generate-age-key", "--json"], 0, env);
  const vault = join(home, ".agent-os", "vault");
  assert.ok(await exists(join(vault, ".sops.yaml")));
  assert.match(await readFile(join(vault, "tools", "notion.sops.yaml"), "utf8"), /fixture-encrypted/);
  const validation = JSON.parse(run(["vault", "validate", "--home", home, "--tools", "notion", "--verify-crypto", "--json"], 0, env).stdout);
  assert.equal(validation.ok, true);
  assert.equal(validation.tmpClean, true);
  run(["vault", "init", "--home", home, "--tools", "notion", "--safe", "--apply", "--age-recipient", "age1fixture", "--json"], 1, env);
});

test("apply and uninstall fail closed on an unowned tool destination", async (context) => {
  const root = join(SANDBOX, "conflict");
  context.after(() => rm(root, { recursive: true, force: true }));
  const home = join(root, "user");
  const conflict = join(home, ".codex", "skills", "agent-os", "SKILL.md");
  await mkdir(dirname(conflict), { recursive: true });
  await writeFile(conflict, "user-owned\n", "utf8");
  const result = run(["setup", "--home", home, "--safe", "--apply", "--json"], 1);
  assert.match(result.stderr, /refusing apply with 1 conflict/);
  assert.equal(await readFile(conflict, "utf8"), "user-owned\n");
});

test("setup refuses an existing unowned agent-os launcher", async (context) => {
  const root = join(SANDBOX, "launcher-conflict");
  context.after(() => rm(root, { recursive: true, force: true }));
  const home = join(root, "user");
  const launcher = join(home, ".local", "bin", WINDOWS ? "agent-os.cmd" : "agent-os");
  await mkdir(dirname(launcher), { recursive: true });
  await writeFile(launcher, "user-owned launcher\n", "utf8");
  const result = run(["setup", "--home", home, "--safe", "--apply", "--json"], 1);
  assert.match(result.stderr, /refusing apply with 1 conflict/);
  assert.equal(await readFile(launcher, "utf8"), "user-owned launcher\n");
});

test("update and uninstall refuse a drifted managed symlink", async (context) => {
  const root = join(SANDBOX, "symlink-drift");
  context.after(() => rm(root, { recursive: true, force: true }));
  const home = join(root, "user");
  const noTools = { PATH: join(root, "empty-bin") };
  run(["setup", "--home", home, "--packs", "core,research", "--apply", "--json"], 0, noTools);
  const link = join(home, ".codex", "skills", WINDOWS ? "opencli" : "birdclaw");
  await rm(link, { force: true });
  await writeFile(link, "user replacement\n", "utf8");
  const update = run(["update", "--home", home, "--apply", "--json"], 1, noTools);
  assert.match(update.stderr, /managed symlink drifted|conflict/);
  const uninstall = run(["safe-uninstall", "--home", home, "--apply", "--json"], 1, noTools);
  assert.match(uninstall.stderr, /refusing uninstall/);
  assert.equal(await readFile(link, "utf8"), "user replacement\n");
});

const LEGACY_GUIDANCE = "Consuming repos should use `.agents/skills` as the canonical repo-local skill root; `agent-system/skills` is only the upstream source for reusable global assets.";
const CUTOVER_GUIDANCE = "Consuming repos should use `.agents/skills` as the canonical repo-local skill root; Agent OS is the canonical portable source for reusable global assets.";
const CUTOVER_COMMANDS = ["add", "commands", "teach", "trunk-finish"];
const LEGACY_COMMANDS = ["add", "commands", "trunk-finish"];

async function createCutoverFixture(root) {
  const home = join(root, "user");
  const codex = join(home, ".codex");
  const skills = join(codex, "skills");
  const legacy = join(root, "legacy-root");
  const originalGuidance = `# Existing guidance\n\n${LEGACY_GUIDANCE}\n\n# Preserve every other byte\n`;
  await mkdir(skills, { recursive: true });
  await writeFile(join(codex, "AGENTS.md"), originalGuidance, "utf8");
  for (const id of LEGACY_COMMANDS) {
    const target = join(legacy, "commands", id);
    await mkdir(target, { recursive: true });
    await writeFile(join(target, "SKILL.md"), `legacy ${id}\n`, "utf8");
    await symlink(target, join(skills, id));
  }
  return { home, codex, skills, legacy, originalGuidance };
}

test("live cutover is preview-first, exact, idempotent, and rollback restores the original Codex state", { skip: WINDOWS }, async (context) => {
  const root = join(SANDBOX, "live-cutover");
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await createCutoverFixture(root);
  const agents = join(fixture.codex, "AGENTS.md");
  const preview = JSON.parse(run(["live-cutover", "--home", fixture.home, "--legacy-root", fixture.legacy, "--json"]).stdout);
  assert.equal(preview.apply, false);
  assert.equal(preview.conflicts.length, 0);
  assert.equal(await readFile(agents, "utf8"), fixture.originalGuidance);
  assert.equal(await exists(join(fixture.skills, "teach")), false);
  for (const id of LEGACY_COMMANDS) assert.equal(await realpath(join(fixture.skills, id)), join(fixture.legacy, "commands", id));
  const missingLegacy = run(["live-cutover", "--home", fixture.home, "--apply", "--json"], 1);
  assert.match(missingLegacy.stderr, /requires --legacy-root/);
  assert.equal(await readFile(agents, "utf8"), fixture.originalGuidance);

  const applied = JSON.parse(run(["live-cutover", "--home", fixture.home, "--legacy-root", fixture.legacy, "--apply", "--json"]).stdout);
  assert.equal(applied.conflicts.length, 0);
  for (const id of CUTOVER_COMMANDS) {
    const link = join(fixture.skills, id);
    assert.ok((await lstat(link)).isSymbolicLink());
    assert.equal(await realpath(link), join(ROOT, "commands", id));
    assert.equal(await readFile(join(link, "SKILL.md"), "utf8"), await readFile(join(ROOT, "commands", id, "SKILL.md"), "utf8"));
  }
  const launcher = join(fixture.home, ".local", "bin", "agent-os");
  assert.ok((await lstat(launcher)).isSymbolicLink());
  assert.equal(await realpath(launcher), join(ROOT, "bin", "agent-os"));
  assert.equal(await readFile(agents, "utf8"), fixture.originalGuidance.replace(LEGACY_GUIDANCE, CUTOVER_GUIDANCE));
  const statePath = join(fixture.home, ".agent-os", "live-cutover-state.json");
  const state = JSON.parse(await readFile(statePath, "utf8"));
  assert.equal(state.status, "applied");
  assert.equal(state.links.add.originalTarget, join(fixture.legacy, "commands", "add"));
  assert.equal(state.launcher.created, true);
  assert.equal(await readFile(join(fixture.home, ".agent-os", "live-cutover", "AGENTS.md.original"), "utf8"), fixture.originalGuidance);
  const status = JSON.parse(run(["status", "--home", fixture.home, "--json"]).stdout);
  assert.equal(status.liveCutover.status, "applied");
  assert.equal(status.liveCutover.guidance, "managed");
  assert.equal(JSON.parse(run(["doctor", "--home", fixture.home, "--json"]).stdout).coreChecks.find((item) => item.id === "live-cutover").ok, true);

  const idempotent = JSON.parse(run(["live-cutover", "--home", fixture.home, "--apply", "--json"]).stdout);
  assert.equal(idempotent.mode, "already-applied");
  assert.equal(idempotent.conflicts.length, 0);
  const rollbackPreview = JSON.parse(run(["live-rollback", "--home", fixture.home, "--json"]).stdout);
  assert.equal(rollbackPreview.apply, false);
  assert.equal(await realpath(join(fixture.skills, "add")), join(ROOT, "commands", "add"));
  run(["live-rollback", "--home", fixture.home, "--apply", "--json"]);
  for (const id of LEGACY_COMMANDS) assert.equal(await realpath(join(fixture.skills, id)), join(fixture.legacy, "commands", id));
  assert.equal(await exists(join(fixture.skills, "teach")), false);
  assert.equal(await exists(launcher), false);
  assert.equal(await readFile(agents, "utf8"), fixture.originalGuidance);
  assert.equal(JSON.parse(await readFile(statePath, "utf8")).status, "rolled-back");
  assert.equal(JSON.parse(run(["live-rollback", "--home", fixture.home, "--apply", "--json"]).stdout).mode, "not-applied");
});

test("live cutover and rollback refuse conflicting or drifted Codex command state", { skip: WINDOWS }, async (context) => {
  const conflictRoot = join(SANDBOX, "live-cutover-conflict");
  const driftRoot = join(SANDBOX, "live-cutover-drift");
  context.after(async () => {
    await rm(conflictRoot, { recursive: true, force: true });
    await rm(driftRoot, { recursive: true, force: true });
  });
  const conflict = await createCutoverFixture(conflictRoot);
  await writeFile(join(conflict.skills, "teach"), "user-owned\n", "utf8");
  const unknownLauncher = join(conflict.home, ".local", "bin", "agent-os");
  await mkdir(dirname(unknownLauncher), { recursive: true });
  await writeFile(unknownLauncher, "user-owned launcher\n", "utf8");
  const rejected = run(["live-cutover", "--home", conflict.home, "--legacy-root", conflict.legacy, "--apply", "--json"], 1);
  assert.match(rejected.stderr, /refusing live cutover/);
  assert.equal(await readFile(join(conflict.codex, "AGENTS.md"), "utf8"), conflict.originalGuidance);
  assert.equal(await readFile(unknownLauncher, "utf8"), "user-owned launcher\n");
  for (const id of LEGACY_COMMANDS) assert.equal(await realpath(join(conflict.skills, id)), join(conflict.legacy, "commands", id));

  const drift = await createCutoverFixture(driftRoot);
  run(["live-cutover", "--home", drift.home, "--legacy-root", drift.legacy, "--apply", "--json"]);
  await rm(join(drift.skills, "add"));
  await symlink(join(drift.legacy, "commands", "add"), join(drift.skills, "add"));
  const status = JSON.parse(run(["status", "--home", drift.home, "--json"]).stdout);
  assert.equal(status.liveCutover.status, "drift");
  assert.equal(JSON.parse(run(["doctor", "--home", drift.home, "--json"], 1).stdout).coreChecks.find((item) => item.id === "live-cutover").ok, false);
  const rollback = run(["live-rollback", "--home", drift.home, "--apply", "--json"], 1);
  assert.match(rollback.stderr, /refusing live rollback/);
  assert.equal(await realpath(join(drift.skills, "add")), join(drift.legacy, "commands", "add"));
});

test("live rollback recovers a recorded pending cutover and rejects unknown pending drift", { skip: WINDOWS }, async (context) => {
  const recoverRoot = join(SANDBOX, "live-cutover-pending-recover");
  const driftRoot = join(SANDBOX, "live-cutover-pending-drift");
  context.after(async () => {
    await rm(recoverRoot, { recursive: true, force: true });
    await rm(driftRoot, { recursive: true, force: true });
  });
  const recover = await createCutoverFixture(recoverRoot);
  run(["live-cutover", "--home", recover.home, "--legacy-root", recover.legacy, "--apply", "--json"]);
  const recoverStatePath = join(recover.home, ".agent-os", "live-cutover-state.json");
  const recoverState = JSON.parse(await readFile(recoverStatePath, "utf8"));
  recoverState.status = "pending";
  await writeFile(recoverStatePath, `${JSON.stringify(recoverState, null, 2)}\n`);
  await rm(join(recover.skills, "add"));
  await symlink(join(recover.legacy, "commands", "add"), join(recover.skills, "add"));
  await writeFile(join(recover.codex, "AGENTS.md"), recover.originalGuidance);
  run(["live-rollback", "--home", recover.home, "--apply", "--json"]);
  for (const id of LEGACY_COMMANDS) assert.equal(await realpath(join(recover.skills, id)), join(recover.legacy, "commands", id));
  assert.equal(await exists(join(recover.skills, "teach")), false);
  assert.equal(await exists(join(recover.home, ".local", "bin", "agent-os")), false);
  assert.equal(await readFile(join(recover.codex, "AGENTS.md"), "utf8"), recover.originalGuidance);
  assert.equal(JSON.parse(await readFile(recoverStatePath, "utf8")).status, "rolled-back");

  const drift = await createCutoverFixture(driftRoot);
  run(["live-cutover", "--home", drift.home, "--legacy-root", drift.legacy, "--apply", "--json"]);
  const driftStatePath = join(drift.home, ".agent-os", "live-cutover-state.json");
  const driftState = JSON.parse(await readFile(driftStatePath, "utf8"));
  driftState.status = "pending";
  await writeFile(driftStatePath, `${JSON.stringify(driftState, null, 2)}\n`);
  await rm(join(drift.skills, "commands"));
  await writeFile(join(drift.skills, "commands"), "unknown drift\n");
  const rejected = run(["live-rollback", "--home", drift.home, "--apply", "--json"], 1);
  assert.match(rejected.stderr, /unknown-drift/);
  assert.equal(await readFile(join(drift.skills, "commands"), "utf8"), "unknown drift\n");
});

test("a replaced guidance sentence without cutover state is never silently adopted", { skip: WINDOWS }, async (context) => {
  const root = join(SANDBOX, "live-cutover-guidance-conflict");
  context.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await createCutoverFixture(root);
  await writeFile(join(fixture.codex, "AGENTS.md"), fixture.originalGuidance.replace(LEGACY_GUIDANCE, CUTOVER_GUIDANCE));
  const result = run(["live-cutover", "--home", fixture.home, "--legacy-root", fixture.legacy, "--apply", "--json"], 1);
  assert.match(result.stderr, /already replaced but no live-cutover state/);
  for (const id of LEGACY_COMMANDS) assert.equal(await realpath(join(fixture.skills, id)), join(fixture.legacy, "commands", id));
});

test("entrypoint scripts are executable", async () => {
  if (WINDOWS) {
    assert.equal(await exists(join(ROOT, "bin", "agent-os.cmd")), true);
    return;
  }
  for (const name of ["agent-os", "setup", "install", "vault", "status", "doctor", "update", "safe-uninstall", "live-cutover", "live-rollback", "twin-audit"]) assert.ok((await stat(join(ROOT, "bin", name))).mode & 0o100, `${name} is not executable`);
});
