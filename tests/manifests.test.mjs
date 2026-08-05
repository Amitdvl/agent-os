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
    if (entry.isDirectory()) result.push(...await filesUnder(target));
    else if (entry.isFile()) result.push(target);
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
  assert.equal(profiles.defaultProfile, "amit-strict");
  const profile = profiles.profiles.find((item) => item.id === "amit-strict");
  assert.deepEqual(new Set(profile.packs), new Set(["core", "local-productivity", "research", "communication", "creator"]));
  assert.deepEqual(new Set(profile.packs), new Set(packs.packs.map((item) => item.id)));
  assert.equal(profile.memory, "disabled");
  assert.equal(profile.externalWrites, "exact-intent");
});

test("every audited tool and skill has a machine-readable disposition", async () => {
  const dispositions = await json("inventory-dispositions");
  const tools = await json("tools");
  const commands = await json("commands");
  assert.equal(dispositions.localTools.length, 19);
  assert.deepEqual(new Set(dispositions.localTools.map((item) => item.id)), new Set(tools.tools.filter((item) => item.id !== "agent-reach").map((item) => item.id)));
  assert.deepEqual(new Set(dispositions.commands.map((item) => item.id)), new Set(commands.commands.map((item) => item.id)));
  const installedSkills = dispositions.skillGroups.flatMap((group) => group.skills);
  assert.equal(installedSkills.length, 89);
  assert.equal(new Set(installedSkills).size, 89);
  for (const group of dispositions.skillGroups) assert.ok(group.disposition);
  for (const item of [...dispositions.hooks, ...dispositions.rules, ...dispositions.policySurfaces]) assert.ok(item.disposition);
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

test("portable assets contain no Amit-specific absolute path or embedded secret-looking value", async () => {
  const roots = ["bin", "bootstrap", "commands", "manifest", "policies", "profiles", "skills", "templates", "tests"];
  const secretValue = /(?:api[_-]?key|auth[_-]?token|secret|password)\s*[:=]\s*["'][A-Za-z0-9_\-]{12,}["']/i;
  const personalPath = ["", "Users", "amitdvl"].join("/");
  for (const root of roots) {
    for (const target of await filesUnder(join(ROOT, root))) {
      const content = await readFile(target, "utf8");
      assert.equal(content.includes(personalPath), false, `personal path in ${relative(ROOT, target)}`);
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
