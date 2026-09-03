import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { platform, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BLOCK_NO_VERIFY = join(ROOT, "templates", "hooks", "block-no-verify", "block_no_verify.sh");
const WINDOWS = platform() === "win32";

test("portable no-verify hook denies only verification bypasses", { skip: WINDOWS }, async () => {
  const denied = spawnSync("bash", [BLOCK_NO_VERIFY], { input: JSON.stringify({ tool_input: { command: "git commit --no-verify -m test" } }), encoding: "utf8" });
  assert.equal(denied.status, 0, denied.stderr);
  assert.equal(JSON.parse(denied.stdout).permissionDecision, "deny");
  const push = spawnSync("bash", [BLOCK_NO_VERIFY], { input: JSON.stringify({ tool_input: { command: "git push origin HEAD --no-verify" } }), encoding: "utf8" });
  assert.equal(JSON.parse(push.stdout).permissionDecision, "deny");
  const allowed = spawnSync("bash", [BLOCK_NO_VERIFY], { input: JSON.stringify({ tool_input: { command: "git status --short" } }), encoding: "utf8" });
  assert.deepEqual(JSON.parse(allowed.stdout), {});
});

test("watcher keeps explicit prompt and dry-run safeguards while manager reports portable state", { skip: WINDOWS }, async (context) => {
  const watcher = await readFile(join(ROOT, "templates", "hooks", "commit-push-watcher", "codex_commit_push_watcher.py"), "utf8");
  const manager = join(ROOT, "templates", "hooks", "commit-push-watcher", "manage_commit_push_hook.sh");
  assert.equal(watcher.includes("/Users/"), false);
  assert.match(watcher, /show_dialog/);
  assert.match(watcher, /--test-session/);
  assert.match(watcher, /dry_run=True/);
  assert.match(watcher, /Commit & Push/);
  const temp = await mkdtemp(join(tmpdir(), "agent-os-hook-"));
  context.after(async () => { await (await import("node:fs/promises")).rm(temp, { recursive: true, force: true }); });
  const plist = join(temp, "watcher.plist");
  const watcherPath = join(temp, "watcher.py");
  await writeFile(watcherPath, "#!/usr/bin/env python3\n");
  const status = spawnSync("zsh", [manager, "status"], { encoding: "utf8", env: { ...process.env, CODEX_COMMIT_PUSH_WATCHER_PLIST: plist, CODEX_COMMIT_PUSH_WATCHER_SCRIPT: watcherPath } });
  assert.equal(status.status, 0, status.stderr);
  assert.match(status.stdout, /plist=missing/);
  assert.match(status.stdout, /watcher=present/);
});
