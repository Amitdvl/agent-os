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
