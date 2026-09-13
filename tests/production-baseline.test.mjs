import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const GO = spawnSync("go", ["version"], { encoding: "utf8" });

test("production repository baseline helper passes its fixture suite", { skip: GO.status !== 0 && "Go is not installed" }, () => {
  const result = spawnSync("go", ["test", "./..."], {
    cwd: join(ROOT, "skills", "production-repo-baseline", "scripts"),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});
