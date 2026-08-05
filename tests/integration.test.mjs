import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(ROOT, "bootstrap", "cli.mjs");
const SANDBOX = join(ROOT, ".sandbox", `integration-${process.pid}`);

async function exists(target) {
  try {
    await access(target, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function run(args, expectedStatus = 0) {
  const result = spawnSync(process.execPath, [CLI, ...args], { cwd: ROOT, encoding: "utf8" });
  assert.equal(result.status, expectedStatus, `command failed: ${args.join(" ")}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
  return result;
}

test("dry-run creates no home or state files", async (context) => {
  const root = join(SANDBOX, "dry-run");
  context.after(() => rm(root, { recursive: true, force: true }));
  await rm(root, { recursive: true, force: true });
  const home = join(root, "user");
  const result = run(["setup", "--home", home, "--safe", "--json"]);
  const summary = JSON.parse(result.stdout);
  assert.equal(summary.apply, false);
  assert.equal(summary.conflicts, 0);
  assert.ok(summary.operations.length > 20);
  assert.equal(await exists(home), false);
});

test("apply, status, doctor, update preview, and safe uninstall stay inside sandbox", async (context) => {
  const root = join(SANDBOX, "lifecycle");
  context.after(() => rm(root, { recursive: true, force: true }));
  await rm(root, { recursive: true, force: true });
  const home = join(root, "user");
  const codexInstructions = join(home, ".codex", "AGENTS.md");
  await mkdir(dirname(codexInstructions), { recursive: true });
  await writeFile(codexInstructions, "# Existing User Policy\n\nKeep this text.\n", "utf8");

  const setup = run(["setup", "--home", home, "--safe", "--apply", "--json"]);
  assert.equal(JSON.parse(setup.stdout).conflicts, 0);
  const codexContent = await readFile(codexInstructions, "utf8");
  assert.match(codexContent, /Existing User Policy/);
  assert.match(codexContent, /agent-os:start profile=amit-strict/);
  assert.ok(await exists(join(home, ".claude", "CLAUDE.md")));
  assert.ok(await exists(join(home, ".codex", "skills", "birdclaw", "SKILL.md")));
  assert.ok(await exists(join(home, ".claude", "commands", "add.md")));
  assert.ok(await exists(join(home, ".agent-os", "state.json")));

  const status = JSON.parse(run(["status", "--home", home, "--json"]).stdout);
  assert.equal(status.installed, true);
  assert.deepEqual(status.drift, []);

  const doctor = JSON.parse(run(["doctor", "--home", home, "--json"]).stdout);
  assert.equal(doctor.ok, true);
  assert.equal(doctor.coreChecks.find((item) => item.id === "managed-state").ok, true);

  const beforeUpdate = await readFile(join(home, ".agent-os", "state.json"), "utf8");
  const update = JSON.parse(run(["update", "--home", home, "--safe", "--json"]).stdout);
  assert.equal(update.apply, false);
  assert.equal(await readFile(join(home, ".agent-os", "state.json"), "utf8"), beforeUpdate);

  const preview = JSON.parse(run(["safe-uninstall", "--home", home, "--json"]).stdout);
  assert.equal(preview.apply, false);
  assert.match(await readFile(codexInstructions, "utf8"), /agent-os:start/);

  run(["safe-uninstall", "--home", home, "--apply", "--json"]);
  const after = await readFile(codexInstructions, "utf8");
  assert.match(after, /Existing User Policy/);
  assert.doesNotMatch(after, /agent-os:start/);
  assert.equal(await exists(join(home, ".codex", "skills", "birdclaw", "SKILL.md")), false);
  const state = JSON.parse(await readFile(join(home, ".agent-os", "state.json"), "utf8"));
  assert.deepEqual(state.managed, []);
});

test("apply fails closed on an unowned destination", async (context) => {
  const root = join(SANDBOX, "conflict");
  context.after(() => rm(root, { recursive: true, force: true }));
  await rm(root, { recursive: true, force: true });
  const home = join(root, "user");
  const conflict = join(home, ".codex", "skills", "agent-os", "SKILL.md");
  await mkdir(dirname(conflict), { recursive: true });
  await writeFile(conflict, "user-owned\n", "utf8");

  const result = run(["setup", "--home", home, "--safe", "--apply", "--json"], 1);
  assert.match(result.stderr, /refusing apply with 1 conflict/);
  assert.equal(await readFile(conflict, "utf8"), "user-owned\n");
  assert.equal(await exists(join(home, ".agent-os", "state.json")), false);
  assert.equal(await exists(join(home, ".claude", "CLAUDE.md")), false);
});

test("entrypoint scripts are executable", async () => {
  for (const name of ["agent-os", "setup", "status", "doctor", "update", "safe-uninstall"]) {
    const info = await stat(join(ROOT, "bin", name));
    assert.ok(info.mode & 0o100, `${name} is not executable`);
  }
});

