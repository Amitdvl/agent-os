import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, chmod, lstat, mkdir, readFile, readlink, rm, rmdir, stat, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(ROOT, "bootstrap", "cli.mjs");
const SANDBOX = join(ROOT, ".sandbox", `integration-${process.pid}`);

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
  assert.equal(setup.conflicts, 0);
  assert.match(await readFile(codexInstructions, "utf8"), /Existing User Policy/);
  const registry = join(home, ".agent-os", "local-tools", "registry.json");
  assert.equal(JSON.parse(await readFile(registry, "utf8")).tools.length, 19);
  const codexLink = join(home, ".codex", "skills", "birdclaw");
  const claudeLink = join(home, ".claude", "skills", "birdclaw");
  assert.ok((await lstat(codexLink)).isSymbolicLink());
  assert.ok((await lstat(claudeLink)).isSymbolicLink());
  assert.match(await readFile(join(codexLink, "SKILL.md"), "utf8"), /## Preflight/);
  assert.match(await readFile(join(home, ".codex", "rules", "agent-os.rules"), "utf8"), /prefix_rule\(pattern=\["birdclaw"\]/);
  assert.ok((await readlink(codexLink)).includes(".agent-os/local-tools/tools/birdclaw"));

  const status = JSON.parse(run(["status", "--home", home, "--json"], 0, noTools).stdout);
  assert.equal(status.installed, true);
  assert.deepEqual(status.drift, []);
  assert.equal(status.tools.find((item) => item.id === "notion").cli, "absent");
  assert.equal(status.tools.find((item) => item.id === "notion").vault, "missing-requirement");
  assert.equal(status.tools.find((item) => item.id === "remindctl").permission, "missing-macos-permission");
  assert.equal(status.tools.find((item) => item.id === "wacli").auth, "unauthenticated-human-checkpoint");
  const doctor = JSON.parse(run(["doctor", "--home", home, "--json"], 0, noTools).stdout);
  assert.equal(doctor.ok, true);
  assert.match(doctor.nextActions[1], /install/);

  const beforeUpdate = await readFile(join(home, ".agent-os", "state.json"), "utf8");
  const update = JSON.parse(run(["update", "--home", home, "--safe", "--json"], 0, noTools).stdout);
  assert.equal(update.apply, false);
  assert.equal(await readFile(join(home, ".agent-os", "state.json"), "utf8"), beforeUpdate);

  const preview = JSON.parse(run(["safe-uninstall", "--home", home, "--json"], 0, noTools).stdout);
  assert.equal(preview.apply, false);
  run(["safe-uninstall", "--home", home, "--apply", "--json"], 0, noTools);
  assert.match(await readFile(codexInstructions, "utf8"), /Existing User Policy/);
  assert.equal(await exists(codexLink), false);
  assert.deepEqual(JSON.parse(await readFile(join(home, ".agent-os", "state.json"), "utf8")).managed, []);
});

test("install mode is separately invoked and remains a dry-run without reviewed apply", async (context) => {
  const root = join(SANDBOX, "install-preview");
  context.after(() => rm(root, { recursive: true, force: true }));
  const plan = JSON.parse(run(["install", "--home", join(root, "user"), "--tools", "yt-dlp", "--json"]).stdout);
  assert.equal(plan.apply, false);
  assert.equal(plan.installs[0].id, "yt-dlp");
  assert.match(plan.installs[0].command, /^brew install yt-dlp$/);
  run(["install", "--home", join(root, "user"), "--tools", "yt-dlp", "--safe", "--apply", "--reviewed-install", "--json"], 1);
});

test("vault setup and validation use fixture binaries only and leave tmp clean", async (context) => {
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

test("update and uninstall refuse a drifted managed symlink", async (context) => {
  const root = join(SANDBOX, "symlink-drift");
  context.after(() => rm(root, { recursive: true, force: true }));
  const home = join(root, "user");
  const noTools = { PATH: join(root, "empty-bin") };
  run(["setup", "--home", home, "--packs", "core,research", "--apply", "--json"], 0, noTools);
  const link = join(home, ".codex", "skills", "birdclaw");
  await rm(link, { force: true });
  await writeFile(link, "user replacement\n", "utf8");
  const update = run(["update", "--home", home, "--apply", "--json"], 1, noTools);
  assert.match(update.stderr, /managed symlink drifted|conflict/);
  const uninstall = run(["safe-uninstall", "--home", home, "--apply", "--json"], 1, noTools);
  assert.match(uninstall.stderr, /refusing uninstall/);
  assert.equal(await readFile(link, "utf8"), "user replacement\n");
});

test("entrypoint scripts are executable", async () => {
  for (const name of ["agent-os", "setup", "install", "vault", "status", "doctor", "update", "safe-uninstall"]) assert.ok((await stat(join(ROOT, "bin", name))).mode & 0o100, `${name} is not executable`);
});
