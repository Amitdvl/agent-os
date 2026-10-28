import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGE = join(ROOT, "skills", "goal-supervisor");

function run(args) {
  const result = spawnSync(process.execPath, [join(ROOT, "bootstrap", "cli.mjs"), ...args], {
    cwd: ROOT, encoding: "utf8",
  });
  assert.equal(result.status, 0, `${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

async function filesUnder(root, directory = root) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await filesUnder(root, path));
    else if (entry.isFile()) result.push(relative(root, path));
  }
  return result.sort();
}

function entries(catalogue) {
  return catalogue.classifiedCatalogue.filter((item) =>
    item.group === "personal-slash-commands" && item.id === "goal-supervisor");
}

test("core setup installs the complete supervisor package byte-for-byte for both hosts and remains idempotent", async (context) => {
  const temporary = await mkdtemp(join(tmpdir(), "agent-os-supervisor-package-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const home = join(temporary, "user");
  const sourceFiles = await filesUnder(PACKAGE);
  assert.deepEqual(sourceFiles, [
    "SKILL.md", "agents/openai.yaml", "references/auditor-contract.md", "references/worker-contract.md",
  ]);

  const preview = run(["setup", "--home", home, "--safe", "--json"]);
  for (const host of ["codex", "claude-code"]) {
    for (const file of sourceFiles) {
      assert.ok(preview.operations.some((item) => item.id === `${host}:skill:goal-supervisor:${file}`),
        `missing ${host} package operation for ${file}`);
    }
  }
  await assert.rejects(readFile(join(home, ".codex", "skills", "goal-supervisor", "SKILL.md")),
    { code: "ENOENT" }, "preview must not install the package");
  run(["setup", "--home", home, "--safe", "--apply", "--json"]);

  for (const host of [".codex", ".claude"]) {
    const installedRoot = join(home, host, "skills", "goal-supervisor");
    assert.deepEqual(await filesUnder(installedRoot), sourceFiles, `${host} package incomplete`);
    for (const file of sourceFiles) {
      assert.deepEqual(await readFile(join(installedRoot, file)), await readFile(join(PACKAGE, file)),
        `${host}/${file} differs from portable source`);
    }
    const installedSkill = await readFile(join(installedRoot, "SKILL.md"), "utf8");
    const linkedReferences = [...installedSkill.matchAll(/\]\((references\/[^)]+)\)/g)].map((match) => match[1]);
    assert.ok(linkedReferences.includes("references/auditor-contract.md"),
      `${host} skill must expose the installed auditor assignment contract`);
    for (const reference of linkedReferences) {
      assert.deepEqual(await readFile(join(installedRoot, reference)), await readFile(join(PACKAGE, reference)),
        `${host} skill reference ${reference} is unavailable or differs from source`);
    }
  }

  const repeat = run(["setup", "--home", home, "--safe", "--apply", "--json"]);
  assert.equal(repeat.conflicts, 0);
  const packageOperations = repeat.operations.filter((item) => item.path.includes("/skills/goal-supervisor/"));
  assert.equal(packageOperations.length, sourceFiles.length * 2);
  assert.ok(packageOperations.every((item) => item.status === "unchanged"));
});

for (const reference of ["references/auditor-contract.md", "references/worker-contract.md"]) {
  test(`setup repairs missing ${reference} on both hosts and refuses to overwrite a drifted contract`, async (context) => {
    const temporary = await mkdtemp(join(tmpdir(), "agent-os-supervisor-recovery-"));
    context.after(() => rm(temporary, { recursive: true, force: true }));
    const home = join(temporary, "user");
    run(["setup", "--home", home, "--safe", "--apply", "--json"]);
    for (const host of [".codex", ".claude"]) {
      await unlink(join(home, host, "skills", "goal-supervisor", reference));
    }

    const repair = run(["setup", "--home", home, "--safe", "--json"]);
    const packageOperations = repair.operations.filter((item) => item.path.includes("/skills/goal-supervisor/"));
    assert.equal(packageOperations.length, 8);
    for (const host of ["codex", "claude-code"]) {
      assert.equal(packageOperations.find((item) => item.id === `${host}:skill:goal-supervisor:${reference}`)?.status,
        "create", `${host} missing contract must be repairable`);
    }
    assert.equal(packageOperations.filter((item) => item.status === "unchanged").length, 6);
    run(["setup", "--home", home, "--safe", "--apply", "--json"]);
    for (const host of [".codex", ".claude"]) {
      assert.deepEqual(await readFile(join(home, host, "skills", "goal-supervisor", reference)),
        await readFile(join(PACKAGE, reference)));
    }

    const driftedPath = join(home, ".codex", "skills", "goal-supervisor", reference);
    const changedContract = `${await readFile(driftedPath, "utf8")}\nLocal review instruction.\n`;
    await writeFile(driftedPath, changedContract);
    const preview = run(["setup", "--home", home, "--safe", "--json"]);
    assert.equal(preview.conflicts, 1);
    const conflict = preview.operations.find((item) => item.id === `codex:skill:goal-supervisor:${reference}`);
    assert.equal(conflict?.status, "conflict");
    assert.equal(conflict?.reason, "managed file drifted");
    const refused = spawnSync(process.execPath,
      [join(ROOT, "bootstrap", "cli.mjs"), "setup", "--home", home, "--safe", "--apply", "--json"],
      { cwd: ROOT, encoding: "utf8" });
    assert.equal(refused.status, 1, "drifted role instructions must not be silently replaced");
    assert.match(refused.stderr, /refusing apply with 1 conflict/);
    assert.equal(await readFile(driftedPath, "utf8"), changedContract, "refused apply changed the local contract");
  });
}

test("catalog distinguishes an installed supervisor skill from an absent one and exposes its actual invocation", async (context) => {
  const temporary = await mkdtemp(join(tmpdir(), "agent-os-supervisor-catalog-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const home = join(temporary, "user");
  assert.deepEqual(entries(run(["status", "--home", home, "--catalog", "--json"])), []);
  run(["setup", "--home", home, "--safe", "--apply", "--json"]);
  const installed = entries(run(["status", "--home", home, "--catalog", "--json"]));
  assert.equal(installed.length, 1);
  assert.equal(installed[0].invocation, "$goal-supervisor");
  assert.equal(installed[0].source, "manifest/skills.json");
  assert.equal(installed[0].sourcePath, "<CODEX_HOME>/skills/goal-supervisor/SKILL.md");
  assert.equal(installed[0].status, "installed");
  assert.ok(installed[0].description.includes(installed[0].invocation));
  await unlink(join(home, ".codex", "skills", "goal-supervisor", "SKILL.md"));
  assert.deepEqual(entries(run(["status", "--home", home, "--catalog", "--json"])), [],
    "remaining alternate-host copy must not advertise an installed Codex skill");
});

test("installed discovery metadata asks for a proposal and generated host instructions carry the supervisor policy", async (context) => {
  const temporary = await mkdtemp(join(tmpdir(), "agent-os-supervisor-policy-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const home = join(temporary, "user");
  run(["setup", "--home", home, "--safe", "--apply", "--json"]);
  const metadata = await readFile(join(home, ".codex", "skills", "goal-supervisor", "agents", "openai.yaml"), "utf8");
  assert.match(metadata, /allow_implicit_invocation: true/);
  const prompt = metadata.match(/^  default_prompt: "(.+)"$/m)?.[1];
  assert.ok(prompt);
  assert.ok(prompt.includes("$goal-supervisor"));
  assert.match(prompt, /propose supervision/);
  assert.match(prompt, /start only after my explicit approval/);

  const promptSource = await readFile(join(ROOT, "skills", "goal-prompt", "SKILL.md"));
  for (const host of [".codex", ".claude"]) {
    assert.deepEqual(await readFile(join(home, host, "skills", "goal-prompt", "SKILL.md")), promptSource,
      `${host} goal drafting instructions differ from the portable source`);
  }

  const policy = (await readFile(join(ROOT, "policies", "orchestration.md"), "utf8")).trim();
  assert.ok(policy.includes("proactively recommend `goal-supervisor`"), "source policy lost supervisor discovery");
  for (const [host, filename] of [[".codex", "AGENTS.md"], [".claude", "CLAUDE.md"]]) {
    const generated = await readFile(join(home, host, filename), "utf8");
    assert.ok(generated.includes(policy), `${host} did not receive the complete policy`);
    const profile = (await readFile(join(ROOT, "policies", "strict-portable.md"), "utf8")).trim();
    assert.ok(generated.includes(profile), `${host} did not receive the autonomy/authority profile`);
  }
  // These assertions verify actual package/policy distribution. They do not
  // demonstrate model compliance, human approval authenticity, native goal
  // availability on either host, recovery safety, or cooperative stop timing.
});

test("model routing stays consistent across the supervisor, goal, orchestration and global policy", async () => {
  const paths = [
    "policies/orchestration.md",
    "skills/goal-supervisor/SKILL.md",
    "skills/goal-prompt/SKILL.md",
    "skills/orchestration/SKILL.md",
  ];
  for (const path of paths) {
    const text = (await readFile(join(ROOT, path), "utf8")).replace(/\s+/g, " ");
    for (const tier of ["GPT-5.6 Terra Medium", "GPT-6 Sol Medium", "GPT-6.1 Sol High"]) {
      assert.ok(text.includes(tier), `${path} omits ${tier}`);
    }
    assert.match(text, /fresh (?:worker )?context/i, `${path} omits fresh context`);
    assert.match(text, /Ultra/, `${path} omits the Ultra exclusion`);
    assert.match(text, /accept/i, `${path} omits acceptance fidelity`);
  }
});
