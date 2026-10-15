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

test("default completion requires publishing intended work without overriding scope or protections", async () => {
  const core = await readFile(join(ROOT, "policies", "core.md"), "utf8");
  for (const phrase of [
    "merging into the repository's default branch and pushing that branch are mandatory completion steps",
    "Apply `trunk-finish` automatically",
    "Honor explicit draft, PR-only, local-only, or no-push requests",
    "never bypass protections, force-push, or include unrelated work",
    "leave the work explicitly unfinished",
    "Read-only and exploratory tasks do not require commits or merges",
  ]) assert.ok(core.includes(phrase), `default completion policy is missing: ${phrase}`);
  const skill = await readFile(join(ROOT, "commands", "trunk-finish", "SKILL.md"), "utf8");
  for (const phrase of ["even\nwithout an explicit finish invocation", "A pushed feature branch alone is not completion", "Verify the intended commits are included in the remote default branch", "Never promote unrelated commits"])
    assert.ok(skill.includes(phrase), `finish skill is missing: ${phrase}`);
});
