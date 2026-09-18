import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));

test("publication guard fixture suite", () => {
  const result = spawnSync("python3", ["-m", "unittest", "discover", "-s", join(ROOT, "skills/publication-safety/tests"), "-v"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});
