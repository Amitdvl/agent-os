import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("core policy prevents Spotlight-visible generated macOS app copies", async () => {
  const content = await readFile(join(ROOT, "policies", "core.md"), "utf8");
  for (const phrase of [
    "ending in `.noindex`",
    "indexable generated app copy remains",
    "unregister and remove task-created disposable products",
    "fresh exact approval manifest",
  ]) {
    assert.ok(content.includes(phrase), `core build-artifact policy is missing: ${phrase}`);
  }
});

test("core policy makes private workspace navigation deterministic", async () => {
  const content = await readFile(join(ROOT, "policies", "core.md"), "utf8");
  for (const phrase of [
    "~/.agent-os/workspaces.json",
    "canonical project paths",
    "dated task directories as transient scratch",
    "intermediate material in `work/`",
    "deliverables in `outputs/`",
    "private machine state",
  ]) {
    assert.ok(content.includes(phrase), `core workspace policy is missing: ${phrase}`);
  }
});

test("core policy requires capability claims to be verified", async () => {
  const content = await readFile(join(ROOT, "policies", "core.md"), "utf8");
  for (const phrase of [
    "verify the current installed interface and authoritative documentation",
    "Distinguish what the product can do from what the current policy",
    "If another agent product is named as a comparison",
    "Never claim a capability is impossible from assumption alone",
  ]) {
    assert.ok(content.includes(phrase), `capability-verification policy is missing: ${phrase}`);
  }
});
