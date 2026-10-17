import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const retired = ["superpowers", "subagent-driven-development", "sentry", "remotion-best-practices"];
const required = {
  orchestration: ["references/planning.md", "references/delegation.md", "references/code-review.md"],
  "cover-project": ["references/regression-design.md", "references/writing-good-tests.md"],
  "launch-video-studio": ["references/remotion-supplement/index.md"],
};

function cli(args) {
  const result = spawnSync(process.execPath, [join(root, "bootstrap/cli.mjs"), ...args], {
    cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

async function filesUnder(directory, base = directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(target, base));
    else {
      assert.ok(entry.isFile(), `Nonportable package entry: ${target}`);
      files.push(relative(base, target));
    }
  }
  return files.sort();
}

async function verifyReferences(packageRoot, files) {
  for (const file of files.filter((path) => path.endsWith(".md"))) {
    const content = await readFile(join(packageRoot, file), "utf8");
    for (const match of content.matchAll(/\[[^\]\n]*\]\(([^\s)]+)(?:\s+"[^"\n]*")?\)/g)) {
      const target = match[1].replace(/^<|>$/g, "");
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(target)) continue;
      const resolved = resolve(dirname(join(packageRoot, file)), decodeURIComponent(target.split(/[?#]/)[0]));
      assert.ok(resolved.startsWith(packageRoot + sep), `${file} requires an external skill file: ${target}`);
      await assert.doesNotReject(access(resolved), `${file} has a dangling package link: ${target}`);
    }
    assert.doesNotMatch(content, /(?:~\/(?:\.codex|\.agents|\.claude)\/skills\/(?:superpowers|subagent-driven-development|remotion-best-practices|sentry)\b|\/superpowers\/[^\s]*SKILL\.md|\$(?:subagent-driven-development|remotion-best-practices)\b)/, `${file} requires a retired runtime entry point`);
  }
}

async function verifyInstalled(home, id) {
  const source = join(root, "skills", id);
  const files = await filesUnder(source);
  for (const file of ["SKILL.md", ...required[id]]) assert.ok(files.includes(file), `${id} omitted retained reference ${file}`);
  const entry = await readFile(join(source, "SKILL.md"), "utf8");
  for (const file of required[id]) assert.ok(entry.includes(`](${file})`), `${id} does not route its entry point to ${file}`);
  await verifyReferences(source, files);
  for (const host of [".codex", ".claude"]) {
    const installed = join(home, host, "skills", id);
    assert.deepEqual(await filesUnder(installed), files, `${id} lost reference package files on ${host}`);
    for (const file of files) assert.deepEqual(await readFile(join(installed, file)), await readFile(join(source, file)), `${id}/${file} was altered during installation`);
    await verifyReferences(installed, files);
  }
}

for (const [packs, ids] of [["core", ["orchestration", "cover-project"]], ["core,creator", Object.keys(required)]]) {
  test(`${packs} installation and replay retain migrated skill knowledge without retired packages`, async (context) => {
    const temporary = await mkdtemp(join(tmpdir(), "agent-os-retirement-"));
    context.after(() => rm(temporary, { recursive: true, force: true }));
    const home = join(temporary, "home");
    const args = ["setup", "--home", home, "--packs", packs, "--hosts", "codex,claude-code", "--json"];
    cli([...args, "--apply"]);
    for (const id of ids) await verifyInstalled(home, id);
    for (const host of [".codex", ".claude"]) {
      const entries = await readdir(join(home, host, "skills"));
      for (const id of retired) assert.ok(!entries.includes(id), `${host} reintroduced retired ${id}`);
      if (packs === "core") assert.ok(!entries.includes("launch-video-studio"), "Remotion supplement leaked into core selection");
    }
    const replay = cli(args);
    assert.equal(replay.conflicts, 0);
    for (const id of ids) {
      const operations = replay.operations.filter((operation) => operation.path.includes(`/skills/${id}/`));
      assert.ok(operations.length > 0, `No installation operations found for ${id}`);
      assert.ok(operations.every((operation) => operation.status === "unchanged"), `${id} is not stable on replay`);
    }
    const catalogue = cli(["status", "--home", home, "--catalog", "--json"]).classifiedCatalogue;
    for (const id of ids) {
      const entry = catalogue.find((item) => item.group === "personal-slash-commands" && item.id === id);
      assert.equal(entry?.status, "installed", `${id} disappeared from command discovery`);
      assert.equal(entry?.invocation, `$${id}`);
    }
  });
}
