import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { prepareImplementationEvaluation } from "../scripts/prepare-implementation-eval.mjs";

for (const [name, baselineTests] of [["checkout", 1], ["toolkit", 4]]) {
  test(`${name} blind fixture starts pristine, runs offline, and keeps evaluation cues out of the assignment`, async (context) => {
    const parent = await mkdtemp(join(tmpdir(), "agent-os-evaluation-"));
    context.after(() => rm(parent, { recursive: true, force: true }));
    const instructions = join(parent, "AGENTS.md");
    await writeFile(instructions, "# Isolated instructions\n");
    const prepared = await prepareImplementationEvaluation(name, { parent, globalInstructions: instructions });
    const request = await readFile(join(prepared.project, "REQUEST.md"), "utf8");
    for (const content of [prepared.launch, request]) {
      for (const cue of ["coverage", "skill", "delegation"]) assert.ok(!content.toLowerCase().includes(cue));
      assert.ok(!content.includes("<PROJECT>") && !content.includes("<GLOBAL_INSTRUCTIONS>"));
    }
    assert.ok(request.includes(prepared.project));
    assert.ok(request.includes(instructions));
    assert.deepEqual((await readdir(parent)).sort(), ["AGENTS.md", prepared.project.split(/[\\/]/).at(-1)].sort());
    assert.equal(await readFile(instructions, "utf8"), "# Isolated instructions\n");
    const { NODE_TEST_CONTEXT: _parentTestContext, ...childEnv } = process.env;
    const suite = process.platform === "win32"
      ? spawnSync("cmd.exe", ["/d", "/s", "/c", "npm test"], { cwd: prepared.project, encoding: "utf8", env: childEnv })
      : spawnSync("npm", ["test"], { cwd: prepared.project, encoding: "utf8", env: childEnv });
    assert.equal(suite.status, 0, suite.stderr || suite.stdout);
    assert.match(suite.stdout, new RegExp(`(?:tests ${baselineTests}|# tests ${baselineTests})`));
    const fixtureText = await readFile(`tests/fixtures/implementation-discovery/${name}.json`, "utf8");
    assert.ok(!fixtureText.includes("/Users/"));
  });
}

test("preparer rejects an unknown case without creating a checkout", async (context) => {
  const parent = await mkdtemp(join(tmpdir(), "agent-os-evaluation-"));
  context.after(() => rm(parent, { recursive: true, force: true }));
  await assert.rejects(prepareImplementationEvaluation("../other", { parent }), /Unknown implementation fixture/);
  assert.deepEqual(await readdir(parent), []);
});

for (const name of ["checkout", "toolkit"]) {
  test(`${name} discovery removes instruction-read cues while preserving the fixture contract`, async (context) => {
    const parent = await mkdtemp(join(tmpdir(), "agent-os-discovery-"));
    context.after(() => rm(parent, { recursive: true, force: true }));
    const instructions = join(parent, "global-instructions.md");
    await writeFile(instructions, "# Global sentinel\n");
    const forced = await prepareImplementationEvaluation(name, { parent, globalInstructions: instructions, mode: "forced-read" });
    const discovery = await prepareImplementationEvaluation(name, { parent, globalInstructions: instructions, mode: "discovery" });
    const defaultMode = await prepareImplementationEvaluation(name, { parent, globalInstructions: instructions });
    const forcedRequest = await readFile(join(forced.project, "REQUEST.md"), "utf8");
    const request = await readFile(join(discovery.project, "REQUEST.md"), "utf8");
    const forcedAgents = await readFile(join(forced.project, "AGENTS.md"), "utf8");
    const agents = await readFile(join(discovery.project, "AGENTS.md"), "utf8");

    // Omitting the mode keeps the original forced-read behavior.
    assert.equal(await readFile(join(defaultMode.project, "REQUEST.md"), "utf8"), forcedRequest.replaceAll(forced.project, defaultMode.project));
    assert.equal(await readFile(join(defaultMode.project, "AGENTS.md"), "utf8"), forcedAgents);
    assert.equal(defaultMode.launch, forced.launch.replaceAll(forced.project, defaultMode.project));

    // Legacy mode explicitly requests a read; discovery must not cue or name it.
    assert.match(forcedRequest, /Read the installed global instructions/);
    assert.ok(forcedRequest.includes(instructions));
    assert.match(forcedAgents, /Read the installed global\s+instructions/);
    for (const text of [discovery.launch, request, agents]) {
      assert.doesNotMatch(text, /(?:read|load|follow)\s+(?:the\s+)?(?:installed\s+)?global\s+instructions/i);
      assert.ok(!text.includes(instructions), "discovery must not reveal the instruction path");
      assert.ok(!text.includes("<GLOBAL_INSTRUCTIONS>"));
    }

    // Compare all remaining bytes after removing the legacy cue and normalizing
    // the independently-created project path. This protects product and isolation
    // requirements, rather than checking a few selected phrases.
    const legacyRequestCue = `Read the installed global instructions at ${instructions} and the project's AGENTS.md and follow ${name === "checkout" ? "the " : ""}normal available workflows. `;
    assert.ok(forcedRequest.includes(legacyRequestCue));
    assert.equal(request, forcedRequest.replace(legacyRequestCue, "").replaceAll(forced.project, discovery.project));
    const legacyAgentsCue = name === "checkout"
      ? `Read the installed global\ninstructions at ${instructions} and follow this project's public\ncontract.`
      : `Read the installed global instructions at ${instructions}.\n`;
    assert.ok(forcedAgents.includes(legacyAgentsCue));
    assert.equal(agents, forcedAgents.replace(legacyAgentsCue,
      name === "checkout" ? "Follow this project's public\ncontract." : ""));
    assert.equal(discovery.launch, forced.launch.replaceAll(forced.project, discovery.project));
    assert.equal(await readFile(instructions, "utf8"), "# Global sentinel\n");
    const fixture = JSON.parse(await readFile(`tests/fixtures/implementation-discovery/${name}.json`, "utf8"));
    for (const relative of Object.keys(fixture.files).filter((file) => file !== "AGENTS.md")) {
      assert.equal(await readFile(join(discovery.project, relative), "utf8"),
        (await readFile(join(forced.project, relative), "utf8")).replaceAll(forced.project, discovery.project));
    }
  });
}

test("unknown evaluation mode rejects before creating a checkout", async (context) => {
  const parent = await mkdtemp(join(tmpdir(), "agent-os-invalid-mode-"));
  context.after(() => rm(parent, { recursive: true, force: true }));
  await assert.rejects(prepareImplementationEvaluation("checkout", { parent, mode: "unexpected" }), /Unknown evaluation mode/);
  assert.deepEqual(await readdir(parent), []);
});
