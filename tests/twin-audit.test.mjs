import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const AUDIT = join(ROOT, "scripts", "twin-audit.mjs");

function run(args, expected = 0) {
  const result = spawnSync(process.execPath, [AUDIT, ...args], { cwd: ROOT, encoding: "utf8" });
  assert.equal(result.status, expected, result.stderr || result.stdout);
  return result;
}

test("twin audit accepts mirrored live contracts and reports unexpected drift", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-twin-audit-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const tools = JSON.parse(await readFile(join(ROOT, "manifest", "tools.json"), "utf8")).tools.map((item) => item.id);
  const commands = JSON.parse(await readFile(join(ROOT, "manifest", "commands.json"), "utf8")).commands.filter((item) => item.path).map((item) => item.id);
  const registry = join(root, "registry.yaml");
  const commandRoot = join(root, "commands");
  const goal = join(root, "goal-prompt.md");
  const instructions = join(root, "AGENTS.md");
  await writeFile(registry, `version: 1\ntools:\n${[...tools, "agent-inbox", "vox"].sort().map((id) => `  ${id}:`).join("\n")}\n`);
  for (const id of commands) {
    const commandPath = join(commandRoot, id, "SKILL.md");
    await mkdir(dirname(commandPath), { recursive: true });
    await writeFile(commandPath, `---\nname: ${id}\n---\n`);
  }
  await writeFile(goal, "## Mandatory Character-Count Gate\nprogrammatically count the prompt\nDo not send one prompt above the limit\n");
  await writeFile(instructions, "## Agent OS Twin Synchronization\n");
  const args = ["--live-registry", registry, "--live-commands", commandRoot, "--live-goal-prompt", goal, "--live-instructions", instructions];
  assert.equal(JSON.parse(run(args).stdout).ok, true);
  await writeFile(registry, `version: 1\ntools:\n${[...tools.filter((id) => id !== "birdclaw"), "agent-inbox", "vox"].sort().map((id) => `  ${id}:`).join("\n")}\n`);
  assert.match(run(args, 1).stdout, /birdclaw/);
});
