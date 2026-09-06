import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import test from "node:test";

test("optional Codex template uses nested context settings and preserves disabled memory", () => {
  const path = new URL("../templates/codex-full-access-context.toml", import.meta.url);
  const config = JSON.parse(execFileSync("python3", ["-c", "import json,sys,tomllib; print(json.dumps(tomllib.loads(sys.stdin.read())))"], { input: readFileSync(path), encoding: "utf8" }));
  assert.equal(config.features.context_management.experimental_mode, true);
  assert.equal(config.features.memories, false);
  assert.deepEqual(config.memories, { generate_memories: false, use_memories: false });
  assert.equal(config.approval_policy, "never");
  assert.equal(config.sandbox_mode, "danger-full-access");
  assert.equal(config.web_search, "live");
  assert.equal(config.mcp_servers, undefined);
  assert.equal(config.projects, undefined);
});
