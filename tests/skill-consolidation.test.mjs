import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const coreSkills = ["systematic-debugging", "react-best-practices"];
const consolidated = [...coreSkills, "frontend-design"];
const retired = ["investigate", "impeccable", "make-interfaces-feel-better", "vercel-react-best-practices", "gstack"];

function run(args) {
  const result = spawnSync(process.execPath, [join(root, "bootstrap/cli.mjs"), ...args], {
    cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

async function filesUnder(directory, base = directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await filesUnder(path, base));
    else {
      assert.ok(entry.isFile(), `Package must contain portable regular files: ${path}`);
      result.push(relative(base, path));
    }
  }
  return result.sort();
}

async function assertLinksResolve(packageRoot, files) {
  for (const file of files.filter((name) => name.endsWith(".md"))) {
    const content = await readFile(join(packageRoot, file), "utf8");
    for (const match of content.matchAll(/\[[^\]\n]*\]\(([^\s)]+)(?:\s+"[^"\n]*")?\)/g)) {
      const target = match[1].replace(/^<|>$/g, "");
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(target)) continue;
      const path = resolve(dirname(join(packageRoot, file)), decodeURIComponent(target.split(/[?#]/)[0]));
      assert.ok(path.startsWith(packageRoot + sep), `${file} links outside its portable package: ${target}`);
      await assert.doesNotReject(access(path), `${file} has a dangling package link: ${target}`);
    }
  }
}

test("core installs the canonical debugging and React packages without creator-only or retired entry points", async (context) => {
  const temporary = await mkdtemp(join(tmpdir(), "agent-os-consolidated-core-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const home = join(temporary, "home");
  const args = ["setup", "--home", home, "--packs", "core", "--hosts", "codex,claude-code", "--json"];
  const plan = run(args);
  for (const id of coreSkills) {
    assert.ok(plan.operations.some((operation) => operation.id === `codex:skill:${id}` || operation.id === `codex:skill:${id}:SKILL.md`), `${id} is absent from the core installation plan`);
  }
  run([...args, "--apply"]);
  for (const host of [".codex", ".claude"]) {
    const entries = await readdir(join(home, host, "skills"));
    for (const id of coreSkills) assert.ok(entries.includes(id), `${host} omitted ${id}`);
    for (const id of ["frontend-design", ...retired]) assert.ok(!entries.includes(id), `${host} unexpectedly installed ${id}`);
  }
  const catalogue = run(["status", "--home", home, "--catalog", "--json"]).classifiedCatalogue;
  for (const id of coreSkills) {
    const entry = catalogue.find((item) => item.id === id && item.group === "personal-slash-commands");
    assert.ok(entry, `${id} is missing from the installed command catalogue`);
    assert.equal(entry.invocation, `$${id}`);
    assert.equal(entry.status, "installed");
  }
  const repeat = run(args);
  assert.equal(repeat.conflicts, 0);
  for (const id of coreSkills) {
    const operations = repeat.operations.filter((operation) => operation.path.includes(`/skills/${id}/`));
    assert.ok(operations.length > 0);
    assert.ok(operations.every((operation) => operation.status === "unchanged"), `${id} installation is not stable on replay`);
  }
});

test("creator installation preserves complete skill packages and all package-local links without gstack runtime dependencies", async (context) => {
  const temporary = await mkdtemp(join(tmpdir(), "agent-os-consolidated-creator-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const home = join(temporary, "home");
  run(["setup", "--home", home, "--packs", "core,creator", "--hosts", "codex,claude-code", "--apply", "--json"]);
  for (const id of consolidated) {
    const source = join(root, "skills", id);
    const files = await filesUnder(source);
    assert.ok(files.includes("SKILL.md"));
    assert.ok(files.some((file) => file !== "SKILL.md" && !file.startsWith("agents/")), `${id} lost its reference package`);
    await assertLinksResolve(source, files);
    for (const host of [".codex", ".claude"]) {
      const installed = join(home, host, "skills", id);
      assert.deepEqual(await filesUnder(installed), files, `${host} lost ${id} package files`);
      for (const file of files) {
        assert.deepEqual(await readFile(join(installed, file)), await readFile(join(source, file)), `${host} changed ${id}/${file}`);
      }
      await assertLinksResolve(installed, files);
    }
    for (const file of files.filter((name) => /\.(?:md|sh|mjs|js|py|ya?ml)$/.test(name))) {
      const content = await readFile(join(source, file), "utf8");
      if (/\.m?js$/.test(file)) {
        const executableLines = content.split("\n").filter((line) => !/^\s*(?:\/\/|\*|\/\*)/.test(line)).join("\n");
        for (const match of executableLines.matchAll(/(?:from\s*|import\s*(?:\(\s*)?)(["'])(\.[^"']+)\1/g)) {
          await assert.doesNotReject(access(resolve(dirname(join(source, file)), match[2])), `${id}/${file} imports missing ${match[2]}`);
        }
      }
      for (const match of content.matchAll(/`([^`/\n]+\.(?:ts|sh|mjs|md))` in this directory/g)) {
        await assert.doesNotReject(access(join(dirname(join(source, file)), match[1])), `${id}/${file} promises missing ${match[1]}`);
      }
      for (const match of content.matchAll(/<SKILL_ROOT>\/(scripts\/[^"'\s<>`)]+)/g)) {
        await assert.doesNotReject(access(join(source, match[1])), `${id}/${file} invokes missing ${match[1]}`);
      }
      assert.doesNotMatch(content, /(?:~\/(?:\.claude\/skills\/|\.codex\/skills\/)?gstack|\$\{?GSTACK|\/gstack\/(?:bin|browse)|\/Users\/)/i, `${id}/${file} depends on a removed pack or a machine-specific path`);
    }
  }
  const catalogue = run(["status", "--home", home, "--catalog", "--json"]).classifiedCatalogue;
  const design = catalogue.find((item) => item.id === "frontend-design" && item.group === "personal-slash-commands");
  assert.ok(design, "Installed frontend design is absent from the command catalogue");
  assert.equal(design.invocation, "$frontend-design");
  assert.equal(design.status, "installed");
  for (const host of [".codex", ".claude"]) {
    const entries = await readdir(join(home, host, "skills"));
    for (const id of retired) assert.ok(!entries.includes(id), `Retired entry ${id} is still distributed`);
  }
});


test("installed frontend context and critique helpers work in a fresh project without upstream CLI or packages", async (context) => {
  const temporary = await mkdtemp(join(tmpdir(), "agent-os-design-helpers-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const home = join(temporary, "home");
  const project = join(temporary, "project");
  await mkdir(project);
  run(["setup", "--home", home, "--packs", "core,creator", "--hosts", "codex", "--apply", "--json"]);
  const installed = join(home, ".codex/skills/frontend-design");
  const helper = (name, args = []) => spawnSync(process.execPath, [join(installed, "scripts", name), ...args], {
    cwd: project, encoding: "utf8", timeout: 10000,
    env: { ...process.env, IMPECCABLE_CONTEXT_DIR: "", IMPECCABLE_CRITIQUE_META: "" },
  });
  const empty = helper("context.mjs");
  assert.equal(empty.status, 0, empty.stderr);
  assert.match(empty.stdout, /NO_PRODUCT_MD/);
  assert.deepEqual(await readdir(project), [], "Reading absent context must not mutate the project");
  await writeFile(join(project, "PRODUCT.md"), "# Demo\n\n## Register\nproduct\n\nA scheduling app.\n");
  await writeFile(join(project, "DESIGN.md"), "# Tokens\nUse existing system spacing.\n");
  const populated = helper("context.mjs");
  assert.equal(populated.status, 0, populated.stderr);
  assert.match(populated.stdout, /A scheduling app/);
  assert.match(populated.stdout, /Use existing system spacing/);
  assert.match(populated.stdout, /reference\/product\.md/);
  const slug = helper("critique-storage.mjs", ["slug", "src/Calendar.tsx"]);
  assert.equal(slug.status, 0, slug.stderr);
  assert.ok(slug.stdout.trim());
  const missing = helper("critique-storage.mjs", ["latest", slug.stdout.trim()]);
  assert.equal(missing.status, 2, missing.stderr);
  const report = join(project, "report.md");
  await writeFile(report, "Calendar controls need visible focus.\n");
  const written = helper("critique-storage.mjs", ["write", slug.stdout.trim(), report]);
  assert.equal(written.status, 0, written.stderr);
  const latest = helper("critique-storage.mjs", ["latest", slug.stdout.trim()]);
  assert.equal(latest.status, 0, latest.stderr);
  assert.match(latest.stdout, /Calendar controls need visible focus/);
});
