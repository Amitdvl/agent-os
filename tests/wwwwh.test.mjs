import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { lstat, mkdir, mkdtemp, readFile, readdir, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(ROOT, "bootstrap", "cli.mjs");
const PACKAGE = join(ROOT, "skills", "wwwwh");
const HOSTS = [["codex", ".codex"], ["claude-code", ".claude"]];

function run(args, expectedStatus = 0) {
  const result = spawnSync(process.execPath, [CLI, ...args], { cwd: ROOT, encoding: "utf8" });
  assert.equal(result.status, expectedStatus, `${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
  return result;
}

function setup(home, apply = false, expectedStatus = 0) {
  return run(["setup", "--home", home, "--safe", ...(apply ? ["--apply"] : []), "--json"], expectedStatus);
}

function catalogue(home) {
  return JSON.parse(run(["status", "--home", home, "--catalog", "--json"]).stdout)
    .classifiedCatalogue.filter((item) => item.group === "personal-slash-commands" && item.id === "wwwwh");
}

async function fixture(context) {
  const temporary = await mkdtemp(join(tmpdir(), "agent-os-wwwwh-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  return join(temporary, "user");
}

async function filesUnder(root, directory = root) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await filesUnder(root, path));
    else if (entry.isFile()) result.push(relative(root, path));
    else assert.fail(`unexpected non-file package entry: ${path}`);
  }
  return result.sort();
}

test("safe core preview is read-only and apply installs the entire WWWWH package on both hosts idempotently", async (context) => {
  const home = await fixture(context);
  const sourceFiles = await filesUnder(PACKAGE);
  assert.ok(sourceFiles.includes("SKILL.md"));
  const preview = JSON.parse(setup(home).stdout);
  assert.equal(preview.apply, false);
  assert.equal(preview.conflicts, 0);
  for (const [host] of HOSTS) {
    for (const file of sourceFiles) {
      assert.equal(preview.operations.find((item) => item.id === `${host}:skill:wwwwh:${file}`)?.status, "create");
    }
  }
  await assert.rejects(lstat(home), { code: "ENOENT" }, "preview created target-home state");
  setup(home, true);

  for (const [, directory] of HOSTS) {
    const installed = join(home, directory, "skills", "wwwwh");
    assert.deepEqual(await filesUnder(installed), sourceFiles, `${directory} package file set differs`);
    for (const file of sourceFiles) {
      assert.deepEqual(await readFile(join(installed, file)), await readFile(join(PACKAGE, file)),
        `${directory}/${file} differs from the portable source bytes`);
    }
  }

  const unrelated = join(home, ".codex", "skills", "wwwwh", "personal-notes.txt");
  await writeFile(unrelated, "Keep this user-owned note.\n");
  const replay = JSON.parse(setup(home, true).stdout);
  assert.equal(replay.conflicts, 0);
  const operations = replay.operations.filter((item) => item.id.startsWith("codex:skill:wwwwh:") ||
    item.id.startsWith("claude-code:skill:wwwwh:"));
  assert.equal(operations.length, sourceFiles.length * HOSTS.length);
  assert.ok(operations.every((item) => item.status === "unchanged"), "replay rewrites an installed package");
  assert.equal(await readFile(unrelated, "utf8"), "Keep this user-owned note.\n");
});

test("Commands discovery advertises WWWWH only while its Codex entry point is installed", async (context) => {
  const home = await fixture(context);
  assert.deepEqual(catalogue(home), [], "uninstalled WWWWH was advertised as ready");
  setup(home, true);
  const entries = catalogue(home);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].invocation, "$wwwwh");
  assert.equal(entries[0].source, "manifest/skills.json");
  assert.equal(entries[0].sourcePath, "<CODEX_HOME>/skills/wwwwh/SKILL.md");
  assert.equal(entries[0].status, "installed");
  assert.ok(entries[0].description.includes("$wwwwh"));
  await unlink(join(home, ".codex", "skills", "wwwwh", "SKILL.md"));
  assert.deepEqual(catalogue(home), [], "remaining Claude copy advertised a missing Codex skill");
  assert.deepEqual(await readFile(join(home, ".claude", "skills", "wwwwh", "SKILL.md")),
    await readFile(join(PACKAGE, "SKILL.md")));
});

for (const [host, directory] of HOSTS) {
  test(`${host} unowned WWWWH instructions block apply without installing other targets or losing user data`, async (context) => {
    const home = await fixture(context);
    const destination = join(home, directory, "skills", "wwwwh", "SKILL.md");
    const unrelated = join(home, "personal.txt");
    const ownedBytes = Buffer.from("User-authored inquiry guidance.\n");
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, ownedBytes);
    await writeFile(unrelated, "Unrelated user content.\n");
    const preview = JSON.parse(setup(home).stdout);
    assert.equal(preview.conflicts, 1);
    assert.equal(preview.operations.find((item) => item.id === `${host}:skill:wwwwh:SKILL.md`)?.status, "conflict");
    const refused = setup(home, true, 1);
    assert.match(refused.stderr, /refusing apply with 1 conflict/);
    assert.deepEqual(await readFile(destination), ownedBytes);
    assert.equal(await readFile(unrelated, "utf8"), "Unrelated user content.\n");
    const alternate = HOSTS.find(([id]) => id !== host)[1];
    await assert.rejects(lstat(join(home, alternate)), { code: "ENOENT" }, "refused apply partially installed the alternate host");
    assert.deepEqual((await filesUnder(home)).sort(), [relative(home, destination), "personal.txt"].sort(),
      "refused apply or preview wrote target state");
  });

  test(`${host} managed WWWWH drift is rejected and preserves a pending repair without partial apply`, async (context) => {
    const home = await fixture(context);
    setup(home, true);
    const destination = join(home, directory, "skills", "wwwwh", "SKILL.md");
    const alternate = HOSTS.find(([id]) => id !== host)[1];
    const missing = join(home, alternate, "skills", "wwwwh", "SKILL.md");
    const drift = Buffer.concat([await readFile(destination), Buffer.from("\nLocal instructions requiring review.\n")]);
    await writeFile(destination, drift);
    await unlink(missing);
    const preview = JSON.parse(setup(home).stdout);
    assert.equal(preview.conflicts, 1);
    const operation = preview.operations.find((item) => item.id === `${host}:skill:wwwwh:SKILL.md`);
    assert.equal(operation?.status, "conflict");
    assert.equal(operation?.reason, "managed file drifted");
    const refused = setup(home, true, 1);
    assert.match(refused.stderr, /refusing apply with 1 conflict/);
    assert.deepEqual(await readFile(destination), drift, "refused apply overwrote locally changed guidance");
    await assert.rejects(lstat(missing), { code: "ENOENT" }, "refused apply partially repaired another host");
  });
}

// These tests establish package distribution, discovery, replay and write isolation.
// They deliberately make no claim about an LLM following the inquiry guidance.
