import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, readlink, rm, rmdir, symlink, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { platform, tmpdir } from "node:os";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(ROOT, "bootstrap", "cli.mjs");
const SANDBOX = join(ROOT, ".sandbox", `ownership-${process.pid}`);
const WINDOWS = platform() === "win32";
const digest = (value) => createHash("sha256").update(value).digest("hex");

function run(args, expected = 0) {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    cwd: ROOT, encoding: "utf8", env: { ...process.env, PATH: join(SANDBOX, "empty-bin") },
  });
  assert.equal(result.status, expected, `${args.join(" ")}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
  return result;
}
const conflictCount = (summary) => Array.isArray(summary.conflicts) ? summary.conflicts.length : summary.conflicts ?? summary.operations.filter((item) => item.status === "conflict").length;

async function tree(root, excludeLedger = false) {
  const entries = {};
  async function visit(path, key = "") {
    if (excludeLedger && (key === ".agent-os/state.json" || key === ".agent-os/backups")) return;
    let info;
    try { info = await lstat(path); } catch (error) { if (error.code === "ENOENT") return; throw error; }
    if (info.isSymbolicLink()) entries[key] = { link: await readlink(path), inode: info.ino, modified: info.mtimeMs };
    else if (info.isDirectory()) {
      entries[key] = { directory: true };
      for (const name of (await readdir(path)).sort()) await visit(join(path, name), key ? `${key}/${name}` : name);
    } else entries[key] = { hash: digest(await readFile(path)), mode: info.mode & 0o777, inode: info.ino, modified: info.mtimeMs };
  }
  await visit(root);
  return entries;
}

async function fixture(context, name) {
  const root = join(SANDBOX, name);
  context.after(() => rm(root, { recursive: true, force: true }));
  const home = join(root, "user");
  run(["setup", "--home", home, "--safe", "--hosts", "codex", "--apply", "--json"]);
  const statePath = join(home, ".agent-os", "state.json");
  return {
    root, home, statePath,
    skill: join(home, ".codex", "skills", "agent-os", "SKILL.md"),
    agents: join(home, ".codex", "AGENTS.md"),
    readState: async () => JSON.parse(await readFile(statePath, "utf8")),
    writeState: async (state) => writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`),
    reconcile: (apply = false, status = 0) => run(["reconcile-ownership", "--home", home, ...(apply ? ["--apply"] : []), "--json"], status),
  };
}

async function assertRejectedWithoutChanges(fixture) {
  const before = await tree(fixture.home);
  const preview = JSON.parse(fixture.reconcile().stdout);
  assert.ok(conflictCount(preview) > 0, "preview must identify a real ownership conflict");
  const applied = fixture.reconcile(true, 1);
  assert.match(applied.stderr, /refus|conflict|reconcil/i, "expected a contract rejection, not an arbitrary crash");
  assert.deepEqual(await tree(fixture.home), before, "rejected batch wrote target, config, backup, or ledger state");
}

test.after(async () => {
  await rm(SANDBOX, { recursive: true, force: true });
  await rmdir(join(ROOT, ".sandbox")).catch((error) => { if (!["ENOENT", "ENOTEMPTY"].includes(error.code)) throw error; });
});

test("ownership reconciliation requires a ledger and never turns a missing installation into setup", async (context) => {
  const root = join(SANDBOX, "missing-ledger");
  context.after(() => rm(root, { recursive: true, force: true }));
  const home = join(root, "user");
  const preview = JSON.parse(run(["reconcile-ownership", "--home", home, "--json"]).stdout);
  assert.ok(conflictCount(preview) > 0);
  run(["reconcile-ownership", "--home", home, "--apply", "--json"], 1);
  assert.deepEqual(await tree(home), {});
});

test("exact regular files and managed blocks are ledger-only adoption with backup and idempotent replay", async (context) => {
  const f = await fixture(context, "ledger-only-adoption");
  const wrapper = "# Private local wrapper\n\nKeep my personal routing customizations.\n\n";
  await writeFile(f.agents, wrapper + await readFile(f.agents, "utf8"));
  const config = join(f.home, ".agent-os", "config.json");
  await writeFile(config, `${JSON.stringify({ ...JSON.parse(await readFile(config, "utf8")), identity: { displayName: "Local test identity", addressAs: "", occasionalPraise: "" } }, null, 4)}\n`);
  const state = await f.readState();
  state.managed = state.managed.filter((item) => item.path !== f.skill);
  state.managed.find((item) => item.path === f.agents).blockHash = "obsolete-block-hash";
  const registryRecord = state.managed.find((item) => item.path.endsWith(join("local-tools", "registry.json")));
  registryRecord.hash = "obsolete-file-hash";
  registryRecord.customMetadata = { ownerNote: "Useful selected-record provenance" };
  await writeFile(f.statePath, JSON.stringify(state, null, 4) + "\n\n");
  const ledgerBefore = await readFile(f.statePath, "utf8");
  const targetsBefore = await tree(f.home, true);
  const preview = JSON.parse(f.reconcile().stdout);
  assert.equal(preview.apply, false);
  assert.equal(conflictCount(preview), 0);
  assert.equal(await readFile(f.statePath, "utf8"), ledgerBefore);
  assert.deepEqual(await tree(f.home, true), targetsBefore);
  f.reconcile(true);
  assert.deepEqual(await tree(f.home, true), targetsBefore, "adoption changed useful customized targets/config");
  const ledgerAfter = await f.readState();
  assert.equal(ledgerAfter.managed.find((item) => item.path === f.skill).hash, digest(await readFile(f.skill)));
  assert.notEqual(ledgerAfter.managed.find((item) => item.path === f.agents).blockHash, "obsolete-block-hash");
  assert.deepEqual(ledgerAfter.managed.find((item) => item.path === registryRecord.path).customMetadata, registryRecord.customMetadata);
  const backups = await tree(join(f.home, ".agent-os", "backups"));
  assert.ok(Object.values(backups).some((item) => item.hash === digest(ledgerBefore)), "original ledger was not backed up exactly");
  const afterFirstApply = await tree(f.home);
  assert.equal(conflictCount(JSON.parse(f.reconcile().stdout)), 0);
  f.reconcile(true);
  assert.deepEqual(await tree(f.home), afterFirstApply, "second reconciliation must be a no-op including backup/ledger bytes");
  assert.equal(JSON.parse(run(["update", "--home", f.home, "--json"]).stdout).conflicts, 0);
  assert.equal(JSON.parse(run(["update", "--home", f.home, "--apply", "--json"]).stdout).conflicts, 0);
  assert.match(await readFile(f.agents, "utf8"), /^# Private local wrapper/);
});

test("canonical package and command links own only discovery roots; update preserves spelling and uninstall preserves source", { skip: WINDOWS }, async (context) => {
  const f = await fixture(context, "canonical-source-links");
  const roots = [
    { target: join(f.home, ".codex", "skills", "cover-project"), source: join(ROOT, "skills", "cover-project"), relative: false },
    { target: join(f.home, ".codex", "skills", "add"), source: join(ROOT, "commands", "add"), relative: true },
  ];
  const sourceBefore = await Promise.all(roots.map((item) => tree(item.source)));
  const originalLinks = [];
  for (const item of roots) {
    await rm(item.target, { recursive: true });
    const spelling = item.relative ? relative(dirname(item.target), item.source) : item.source;
    await symlink(spelling, item.target);
    originalLinks.push(spelling);
  }
  const before = await tree(f.home, true);
  assert.equal(conflictCount(JSON.parse(f.reconcile().stdout)), 0);
  f.reconcile(true);
  const adopted = await f.readState();
  for (const item of roots) {
    const rootRecord = adopted.managed.find((record) => record.path === item.target);
    assert.equal(rootRecord?.kind, "symlink");
    assert.equal(adopted.managed.some((record) => record.path.startsWith(`${item.target}/`)), false, "source package descendants must never be removable file ownership");
  }
  assert.deepEqual(await tree(f.home, true), before);
  assert.equal(JSON.parse(run(["update", "--home", f.home, "--apply", "--json"]).stdout).conflicts, 0);
  for (let index = 0; index < roots.length; index += 1) assert.equal(await readlink(roots[index].target), originalLinks[index]);
  assert.equal(conflictCount(JSON.parse(f.reconcile().stdout)), 0);
  f.reconcile(true);
  run(["safe-uninstall", "--home", f.home, "--apply", "--json"]);
  for (let index = 0; index < roots.length; index += 1) {
    await assert.rejects(lstat(roots[index].target), { code: "ENOENT" });
    assert.deepEqual(await tree(roots[index].source), sourceBefore[index], "discovery uninstall altered portable source");
  }
});

for (const boundary of ["arbitrary-directory-link", "file-link", "linked-ancestor"]) {
  test(`byte-identical ${boundary} is rejected without side effects`, { skip: WINDOWS }, async (context) => {
    const f = await fixture(context, boundary);
    const state = await f.readState();
    state.managed = state.managed.filter((record) => record.path !== f.skill);
    await f.writeState(state);
    if (boundary === "arbitrary-directory-link") {
      const external = join(f.root, "equal-but-not-canonical");
      await cp(dirname(f.skill), external, { recursive: true });
      await rm(dirname(f.skill), { recursive: true });
      await symlink(external, dirname(f.skill));
    } else if (boundary === "file-link") {
      const external = join(f.root, "equal-file.md");
      await cp(f.skill, external);
      await rm(f.skill);
      await symlink(external, f.skill);
    } else {
      const skills = dirname(dirname(f.skill));
      const external = join(f.root, "equal-skills");
      await cp(skills, external, { recursive: true });
      await rm(skills, { recursive: true });
      await symlink(external, skills);
    }
    const externalBefore = await tree(f.root);
    await assertRejectedWithoutChanges(f);
    assert.deepEqual(await tree(f.root), externalBefore);
  });
}

for (const boundary of ["custom-bytes", "missing-selected-file", "modified-managed-block"]) {
  test(`reconciliation rejects the whole batch for ${boundary} while retaining an otherwise adoptable file`, async (context) => {
    const f = await fixture(context, boundary);
    const state = await f.readState();
    state.managed = state.managed.filter((record) => record.path !== f.skill);
    await f.writeState(state);
    const other = join(f.home, ".agent-os", "local-tools", "registry.json");
    if (boundary === "custom-bytes") await writeFile(other, '{"privateCustomization":true}\n');
    else if (boundary === "missing-selected-file") await rm(other);
    else await writeFile(f.agents, (await readFile(f.agents, "utf8")).replace("# Core Agent Policy", "# Useful custom Core Agent Policy"));
    await assertRejectedWithoutChanges(f);
  });
}

test("obsolete absent records retire while unrelated present valid ownership survives", async (context) => {
  const f = await fixture(context, "preserve-unrelated");
  const extra = join(f.home, ".codex", "private-owned-reference.md");
  await writeFile(extra, "Useful unrelated file\n");
  const extraRecord = { id: "private-reference", kind: "file", path: extra, hash: digest(await readFile(extra)), customMetadata: "retain" };
  const absent = { id: "retired-reference", kind: "file", path: join(f.home, ".codex", "gone.md"), hash: digest("gone") };
  const state = await f.readState();
  state.managed.push(extraRecord, absent);
  await f.writeState(state);
  const before = await tree(f.home, true);
  assert.equal(conflictCount(JSON.parse(f.reconcile().stdout)), 0);
  f.reconcile(true);
  const reconciled = await f.readState();
  assert.deepEqual(reconciled.managed.find((record) => record.path === extra), extraRecord);
  assert.equal(reconciled.managed.some((record) => record.path === absent.path), false);
  assert.deepEqual(await tree(f.home, true), before);
});

test("unrelated ownership drift cannot be silently forgotten during reconciliation", async (context) => {
  const f = await fixture(context, "unrelated-drift");
  const extra = join(f.home, ".codex", "private-reference.md");
  await writeFile(extra, "changed useful content\n");
  const state = await f.readState();
  state.managed.push({ id: "private-reference", kind: "file", path: extra, hash: digest("original content\n") });
  await f.writeState(state);
  await assertRejectedWithoutChanges(f);
});

test("retargeted canonical discovery ownership is rejected by reconciliation, update, and uninstall", { skip: WINDOWS }, async (context) => {
  const f = await fixture(context, "retargeted-source-link");
  const target = dirname(f.skill);
  await rm(target, { recursive: true });
  await symlink(join(ROOT, "skills", "agent-os"), target);
  f.reconcile(true);
  const external = join(f.root, "equal-foreign-source");
  await cp(join(ROOT, "skills", "agent-os"), external, { recursive: true });
  await rm(target);
  await symlink(external, target);
  await assertRejectedWithoutChanges(f);
  const before = await tree(f.home);
  const update = JSON.parse(run(["update", "--home", f.home, "--json"]).stdout);
  assert.ok(update.conflicts > 0);
  run(["update", "--home", f.home, "--apply", "--json"], 1);
  run(["safe-uninstall", "--home", f.home, "--apply", "--json"], 1);
  assert.deepEqual(await tree(f.home), before);
  assert.equal(await readFile(join(external, "SKILL.md"), "utf8"), await readFile(join(ROOT, "skills", "agent-os", "SKILL.md"), "utf8"));
});

async function assertLifecycleRefuses(f, command) {
  const before = await tree(f.home);
  const preview = spawnSync(process.execPath, [CLI, command, "--home", f.home, "--json"], { cwd: ROOT, encoding: "utf8" });
  if (preview.status === 0) assert.ok(conflictCount(JSON.parse(preview.stdout)) > 0, `${command} preview certified an unsafe lifecycle operation`);
  else {
    assert.equal(preview.status, 1, `${command} crashed unexpectedly`);
    assert.match(preview.stderr, /refus|conflict|symlink|marker|managed block|ledger|normaliz/i);
  }
  const applied = run([command, "--home", f.home, "--apply", "--json"], 1);
  assert.match(applied.stderr, /refus|conflict|symlink|marker|managed block|ledger|normaliz/i);
  assert.deepEqual(await tree(f.home), before, `${command} refusal altered target or ownership state`);
}

for (const boundary of ["canonical-directory-link", "foreign-directory-link", "leaf-file-link"]) {
  test(`old descendant file ownership cannot authorize update or uninstall through ${boundary}`, { skip: WINDOWS }, async (context) => {
    const f = await fixture(context, `old-owned-${boundary}`);
    const source = join(ROOT, "skills", "agent-os");
    const sourceBefore = await tree(source);
    const external = join(f.root, "equal-external-source");
    await cp(source, external, { recursive: true });
    const externalBefore = await tree(external);
    if (boundary === "leaf-file-link") {
      await rm(f.skill);
      await symlink(join(external, "SKILL.md"), f.skill);
    } else {
      await rm(dirname(f.skill), { recursive: true });
      await symlink(boundary === "canonical-directory-link" ? source : external, dirname(f.skill));
    }
    // Deliberately retain the old descendant file ledger: reconciliation has not run.
    for (const command of ["update", "safe-uninstall"]) await assertLifecycleRefuses(f, command);
    assert.deepEqual(await tree(source), sourceBefore, "old discovery ownership changed canonical source bytes or metadata");
    assert.deepEqual(await tree(external), externalBefore, "old discovery ownership changed redirected external source");
  });
}

for (const markers of ["duplicate-complete", "nested", "unmatched-start", "unmatched-end"]) {
  test(`ambiguous ${markers} managed markers refuse reconciliation and lifecycle without certifying ownership`, async (context) => {
    const f = await fixture(context, `markers-${markers}`);
    const original = await readFile(f.agents, "utf8");
    const start = original.match(/<!-- agent-os:start profile=[^\n]+ -->/)[0];
    const end = "<!-- agent-os:end -->";
    let ambiguous;
    if (markers === "duplicate-complete") ambiguous = original + "\n" + original;
    else if (markers === "nested") ambiguous = original.replace("# Core Agent Policy", `${start}\n# Core Agent Policy`);
    else ambiguous = original + `\n${markers === "unmatched-start" ? start : end}\n`;
    await writeFile(f.agents, ambiguous);
    for (const command of ["reconcile-ownership", "update", "safe-uninstall"]) await assertLifecycleRefuses(f, command);
  });
}

test("redirected backup subtree rejects reconciliation before any ledger or external writes", { skip: WINDOWS }, async (context) => {
  const f = await fixture(context, "redirected-backups");
  const state = await f.readState();
  state.managed = state.managed.filter((record) => record.path !== f.skill);
  await f.writeState(state);
  const external = join(f.root, "unrelated-backup-destination");
  await mkdir(external);
  await writeFile(join(external, "keep.txt"), "Useful unrelated content\n");
  const backupRoot = join(f.home, ".agent-os", "backups");
  await rm(backupRoot, { recursive: true, force: true });
  await symlink(external, backupRoot);
  const externalBefore = await tree(external);
  await assertLifecycleRefuses(f, "reconcile-ownership");
  assert.deepEqual(await tree(external), externalBefore, "ledger backup escaped into a redirected subtree");
});

for (const alias of ["dot", "parent"]) {
  test(`non-normalized ${alias} ledger path is refused rather than silently retired beneath a source link`, { skip: WINDOWS }, async (context) => {
    const f = await fixture(context, `ledger-path-${alias}`);
    const state = await f.readState();
    const record = state.managed.find((item) => item.path === f.skill);
    record.path = alias === "dot" ? `${dirname(f.skill)}/./SKILL.md` : `${dirname(f.skill)}/../agent-os/SKILL.md`;
    await f.writeState(state);
    await rm(dirname(f.skill), { recursive: true });
    await symlink(join(ROOT, "skills", "agent-os"), dirname(f.skill));
    const sourceBefore = await tree(join(ROOT, "skills", "agent-os"));
    await assertLifecycleRefuses(f, "reconcile-ownership");
    assert.deepEqual(await tree(join(ROOT, "skills", "agent-os")), sourceBefore);
  });
}

test("exclusive lifecycle lock rejects all concurrent apply routes without writes and is never stolen", async (context) => {
  const f = await fixture(context, "held-lifecycle-lock");
  const lock = join(f.home, ".agent-os", "lifecycle.lock");
  await mkdir(lock);
  await writeFile(join(lock, "owner.json"), `${JSON.stringify({ pid: process.pid, evidence: "test writer still owns this lock" })}\n`);
  const before = await tree(f.home);
  const commands = [["setup"], ["update"], ["reconcile-instructions"], ["reconcile-ownership"], ["safe-uninstall"], ["vault", "unbind"], ["live-cutover"], ["live-rollback"]];
  for (const command of commands) {
    const result = run([...command, "--home", f.home, "--apply", "--json"], 1);
    assert.match(result.stderr, /another Agent OS lifecycle operation holds the lock/);
    assert.deepEqual(await tree(f.home), before, `${command.join(" ")} changed state or stole the held lock`);
  }
  // The fixture represents a writer that now releases its own lock.
  await rm(lock, { recursive: true });
  f.reconcile(true);
  await assert.rejects(lstat(lock), { code: "ENOENT" });
});

test("lifecycle lock is released after successful and refused apply so a corrected retry can proceed", async (context) => {
  const f = await fixture(context, "lifecycle-lock-finally");
  const lock = join(f.home, ".agent-os", "lifecycle.lock");
  await assert.rejects(lstat(lock), { code: "ENOENT" });
  const original = await readFile(f.skill, "utf8");
  await writeFile(f.skill, original + "\nUseful customization must be preserved.\n");
  const before = await tree(f.home);
  f.reconcile(true, 1);
  await assert.rejects(lstat(lock), { code: "ENOENT" });
  assert.deepEqual(await tree(f.home), before, "refusal failed to release lock or changed useful content");
  await writeFile(f.skill, original);
  f.reconcile(true);
  await assert.rejects(lstat(lock), { code: "ENOENT" });
  const update = JSON.parse(run(["update", "--home", f.home, "--apply", "--json"]).stdout);
  assert.equal(update.conflicts, 0);
  await assert.rejects(lstat(lock), { code: "ENOENT" });
});


test("macOS temporary homes tolerate the standard system alias while rejecting descendant redirects", { skip: platform() !== "darwin" }, async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-ownership-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const home = join(root, "user");
  run(["setup", "--home", home, "--safe", "--hosts", "codex", "--apply", "--json"]);
  const statePath = join(home, ".agent-os", "state.json");
  const skill = join(home, ".codex", "skills", "agent-os", "SKILL.md");
  const state = JSON.parse(await readFile(statePath, "utf8"));
  state.managed = state.managed.filter((record) => record.path !== skill);
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
  assert.equal(conflictCount(JSON.parse(run(["reconcile-ownership", "--home", home, "--apply", "--json"]).stdout)), 0);
  assert.equal(JSON.parse(run(["update", "--home", home, "--apply", "--json"]).stdout).conflicts, 0);
  const external = join(root, "equal-foreign-source");
  await cp(dirname(skill), external, { recursive: true });
  await rm(dirname(skill), { recursive: true });
  await symlink(external, dirname(skill));
  const externalBefore = await tree(external);
  const f = { home };
  for (const command of ["reconcile-ownership", "update", "safe-uninstall"]) await assertLifecycleRefuses(f, command);
  assert.deepEqual(await tree(external), externalBefore, "standard system alias exception widened to an arbitrary descendant link");
});
