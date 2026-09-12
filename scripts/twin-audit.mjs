#!/usr/bin/env node

import { realpath, readdir, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(ROOT, "bootstrap", "cli.mjs");

function option(name, { required = true } = {}) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    if (required) throw new Error(`${name} is required`);
    return null;
  }
  if (!process.argv[index + 1]) throw new Error(`${name} requires a path`);
  return resolve(process.argv[index + 1]);
}

function valueOption(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  if (!process.argv[index + 1]) throw new Error(`${name} requires a value`);
  return process.argv[index + 1];
}

function optionalPathOption(name) {
  return option(name, { required: false });
}

function registryToolIds(text) {
  try {
    const registry = JSON.parse(text);
    if (Array.isArray(registry.tools)) return registry.tools.map((tool) => tool.id).filter(Boolean).sort();
  } catch {
    // Legacy YAML registries are handled below.
  }
  const tools = text.split(/^tools:\s*$/m)[1] ?? "";
  return [...tools.matchAll(/^  ([a-z0-9][a-z0-9-]*):\s*$/gmi)].map((match) => match[1]).sort();
}

async function commandIds(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const ids = await Promise.all(entries.filter((entry) => entry.isDirectory() || entry.isSymbolicLink()).map(async (entry) => {
    try {
      await readFile(join(root, entry.name, "SKILL.md"), "utf8");
      return entry.name;
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  }));
  return ids.filter(Boolean).sort();
}

function difference(left, right) {
  const other = new Set(right);
  return left.filter((item) => !other.has(item));
}

function isWithin(target, root) {
  const path = relative(root, target);
  return path === "" || (path !== ".." && !path.startsWith(`..${sep}`));
}

async function auditCommands(liveRoot, commands, forbidRoot) {
  const [resolvedRoot, resolvedForbiddenRoot] = await Promise.all([
    realpath(liveRoot),
    forbidRoot ? realpath(forbidRoot) : null,
  ]);
  const hostSkillIds = await commandIds(resolvedRoot);
  const sources = await Promise.all(commands.map(async (command) => {
    const path = join(resolvedRoot, command.id, "SKILL.md");
    const expectedPath = join(ROOT, command.path);
    const expected = await readFile(expectedPath, "utf8");
    try {
      const resolvedPath = await realpath(path);
      const content = await readFile(resolvedPath, "utf8");
      return {
        id: command.id,
        expectedPath: relative(ROOT, expectedPath),
        livePath: path,
        resolvedPath,
        status: content === expected ? "match" : "content-mismatch",
        forbidden: Boolean(resolvedForbiddenRoot && isWithin(resolvedPath, resolvedForbiddenRoot)),
      };
    } catch (error) {
      if (error.code === "ENOENT") {
        return {
          id: command.id,
          expectedPath: relative(ROOT, expectedPath),
          livePath: path,
          resolvedPath: null,
          status: "missing",
          forbidden: false,
        };
      }
      throw error;
    }
  }));
  return { resolvedRoot, hostSkillIds, sources };
}

async function auditSkill(livePath, portablePath) {
  const [resolvedPath, liveContent, portableContent] = await Promise.all([
    realpath(livePath),
    readFile(livePath, "utf8"),
    readFile(portablePath, "utf8"),
  ]);
  return {
    livePath,
    resolvedPath,
    expectedPath: relative(ROOT, portablePath),
    status: liveContent === portableContent ? "match" : "content-mismatch",
  };
}

function renderedToolSkill(id) {
  const result = spawnSync(process.execPath, [CLI, "render-tool", id], { cwd: ROOT, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`could not render ${id}: ${result.stderr || result.stdout}`);
  return result.stdout;
}

async function auditRenderedTools(liveRoot, tools) {
  if (!liveRoot) return [];
  return Promise.all(tools.map(async (tool) => {
    const livePath = join(liveRoot, tool.id, "SKILL.md");
    try {
      const live = await readFile(livePath, "utf8");
      return { id: tool.id, livePath, status: live === renderedToolSkill(tool.id) ? "match" : "content-mismatch" };
    } catch (error) {
      if (error.code === "ENOENT") return { id: tool.id, livePath, status: "missing" };
      throw error;
    }
  }));
}

async function auditPortableSkills(liveRoot, skills) {
  if (!liveRoot) return [];
  const portable = skills.filter((skill) => skill.path && skill.disposition !== "portable-core-contract");
  return Promise.all(portable.map(async (skill) => {
    const livePath = join(liveRoot, skill.id, "SKILL.md");
    try {
      const [live, expected] = await Promise.all([readFile(livePath, "utf8"), readFile(join(ROOT, skill.path), "utf8")]);
      return { id: skill.id, livePath, status: live === expected ? "match" : "content-mismatch" };
    } catch (error) {
      if (error.code === "ENOENT") return { id: skill.id, livePath, status: "missing" };
      throw error;
    }
  }));
}

async function auditExactFile(livePath, expectedPath) {
  if (!livePath) return null;
  try {
    const [live, expected] = await Promise.all([readFile(livePath, "utf8"), readFile(expectedPath, "utf8")]);
    return { livePath, expectedPath: relative(ROOT, expectedPath), status: live === expected ? "match" : "content-mismatch" };
  } catch (error) {
    if (error.code === "ENOENT") return { livePath, expectedPath: relative(ROOT, expectedPath), status: "missing" };
    throw error;
  }
}

async function main() {
  const liveRegistry = option("--live-registry");
  const liveCommands = option("--live-commands");
  const liveGoalPrompt = option("--live-goal-prompt");
  const liveOrchestration = option("--live-orchestration");
  const liveInstructions = option("--live-instructions");
  const forbidRoot = option("--forbid-root", { required: false });
  const targetPlatform = valueOption("--platform");
  const liveToolRoot = optionalPathOption("--live-tool-root");
  const liveSkillRoot = optionalPathOption("--live-skill-root");
  const liveRules = optionalPathOption("--live-rules");
  const liveCtx7Hook = optionalPathOption("--live-ctx7-hook");
  const liveNoVerifyHook = optionalPathOption("--live-no-verify-hook");
  const [registryText, instructions, toolsManifest, inventory, commandsManifest, portableCorePolicy, goalPromptAudit, orchestrationAudit] = await Promise.all([
    readFile(liveRegistry, "utf8"),
    readFile(liveInstructions, "utf8"),
    readFile(join(ROOT, "manifest", "tools.json"), "utf8"),
    readFile(join(ROOT, "manifest", "inventory-dispositions.json"), "utf8"),
    readFile(join(ROOT, "manifest", "commands.json"), "utf8"),
    readFile(join(ROOT, "policies", "core.md"), "utf8"),
    auditSkill(liveGoalPrompt, join(ROOT, "skills", "goal-prompt", "SKILL.md")),
    auditSkill(liveOrchestration, join(ROOT, "skills", "orchestration", "SKILL.md")),
  ]);
  const liveTools = registryToolIds(registryText);
  const allTools = JSON.parse(toolsManifest).tools.filter((tool) => !targetPlatform || !tool.platforms || tool.platforms.includes(targetPlatform));
  const portableTools = allTools.map((tool) => tool.id).sort();
  const skillsManifest = JSON.parse(await readFile(join(ROOT, "manifest", "skills.json"), "utf8"));
  const exclusions = JSON.parse(inventory).twin?.excludedLiveTools ?? [];
  const exclusionIds = exclusions.map((item) => item.id).sort();
  const missingTools = difference(liveTools, [...portableTools, ...exclusionIds]);
  const extraTools = difference(portableTools, liveTools);
  const portableCommands = JSON.parse(commandsManifest).commands.filter((item) => item.path);
  const commandAudit = await auditCommands(liveCommands, portableCommands, forbidRoot);
  const [toolAudit, skillAudit, ctx7Audit, noVerifyAudit] = await Promise.all([
    auditRenderedTools(liveToolRoot, allTools),
    auditPortableSkills(liveSkillRoot, skillsManifest.skills),
    auditExactFile(liveCtx7Hook, join(ROOT, "templates", "hooks", "ctx7-guard", "ctx7_guard.py")),
    auditExactFile(liveNoVerifyHook, join(ROOT, "templates", "hooks", "block-no-verify", "block_no_verify.sh")),
  ]);
  let rulesAudit = null;
  if (liveRules) {
    const expected = `${[...new Set(allTools.map((tool) => tool.binary))].sort().map((binary) => `prefix_rule(pattern=["${binary}"], decision="allow")`).join("\n")}\n`;
    try {
      rulesAudit = { livePath: liveRules, status: (await readFile(liveRules, "utf8")) === expected ? "match" : "content-mismatch" };
    } catch (error) {
      if (error.code === "ENOENT") rulesAudit = { livePath: liveRules, status: "missing" };
      else throw error;
    }
  }
  const portableCommandIds = portableCommands.map((item) => item.id).sort();
  const ignoredHostSkills = difference(commandAudit.hostSkillIds, portableCommandIds);
  const instructionPresent = /^#+\s+(?:Agent OS )?Twin Synchronization\s*$/mi.test(instructions);
  const normalizedInstructions = instructions.replace(/\s+/g, " ").toLowerCase();
  const requiredTwinSyncPhrases = ["commit the intended agent os mirror change locally", "push it to the configured agent os `origin`", "never force-push or push unrelated project work"];
  const missingTwinSyncPhrases = requiredTwinSyncPhrases.filter((phrase) => !normalizedInstructions.includes(phrase));
  const requiredOrchestrationPhrases = ["persistent, thread-scoped objective", "does not by itself require orchestration", "use one executor by default", "automatically use the `orchestration` skill only", "the lead owns integration", "never claim a model or delegation occurred", "worker output is evidence", "not a replacement goal", "do not create user-visible tasks merely to split a goal"];
  const missingOrchestrationPhrases = requiredOrchestrationPhrases.filter((phrase) => !normalizedInstructions.includes(phrase));
  const requiredWorkflowSummaryPhrases = ["reusable workflow updates", "only when the task actually added or changed", "omit this item or section entirely", "never emit negative placeholders"];
  const requiredCorePolicyPhrases = ["frequent small, coherent commits"];
  const normalizedPortableCore = portableCorePolicy.replace(/\s+/g, " ").toLowerCase();
  const missingLiveWorkflowSummaryPhrases = requiredWorkflowSummaryPhrases.filter((phrase) => !normalizedInstructions.includes(phrase));
  const missingLiveCorePolicyPhrases = requiredCorePolicyPhrases.filter((phrase) => !normalizedInstructions.includes(phrase));
  const missingPortableCorePolicyPhrases = requiredCorePolicyPhrases.filter((phrase) => !normalizedPortableCore.includes(phrase));
  const failures = [];
  if (missingTools.length) failures.push(`live tools missing from Agent OS: ${missingTools.join(", ")}`);
  if (extraTools.length) failures.push(`Agent OS tools absent from live registry: ${extraTools.join(", ")}`);
  for (const source of commandAudit.sources) {
    if (source.status === "missing") failures.push(`portable command missing from host skill root: ${source.id}`);
    if (source.status === "content-mismatch") failures.push(`portable command content mismatch: ${source.id}`);
    if (source.forbidden) failures.push(`portable command resolves under forbidden root: ${source.id} -> ${source.resolvedPath}`);
  }
  for (const source of toolAudit) if (source.status !== "match") failures.push(`portable tool contract ${source.status}: ${source.id}`);
  for (const source of skillAudit) if (source.status !== "match") failures.push(`portable skill ${source.status}: ${source.id}`);
  if (rulesAudit && rulesAudit.status !== "match") failures.push(`generated Agent OS rules ${rulesAudit.status}`);
  if (ctx7Audit && ctx7Audit.status !== "match") failures.push(`ctx7 hook ${ctx7Audit.status}`);
  if (noVerifyAudit && noVerifyAudit.status !== "match") failures.push(`no-verify hook ${noVerifyAudit.status}`);
  if (goalPromptAudit.status !== "match") failures.push("live goal-prompt content mismatch");
  if (orchestrationAudit.status !== "match") failures.push("live orchestration skill content mismatch");
  if (!instructionPresent) failures.push("live global instructions are missing the Agent OS twin rule");
  if (missingTwinSyncPhrases.length) failures.push(`live global instructions are missing Agent OS publish policy phrases: ${missingTwinSyncPhrases.join(", ")}`);
  if (missingOrchestrationPhrases.length) failures.push(`live global instructions are missing orchestration policy phrases: ${missingOrchestrationPhrases.join(", ")}`);
  if (missingLiveWorkflowSummaryPhrases.length) failures.push(`live global instructions are missing conditional workflow-summary phrases: ${missingLiveWorkflowSummaryPhrases.join(", ")}`);
  if (missingLiveCorePolicyPhrases.length) failures.push(`live global instructions are missing commit-hygiene phrases: ${missingLiveCorePolicyPhrases.join(", ")}`);
  if (missingPortableCorePolicyPhrases.length) failures.push(`portable core policy is missing commit-hygiene phrases: ${missingPortableCorePolicyPhrases.join(", ")}`);
  const report = {
    ok: failures.length === 0,
    platform: targetPlatform,
    liveTools,
    portableTools,
    exclusions,
    commandRoot: commandAudit.resolvedRoot,
    portableCommandIds,
    commandSources: commandAudit.sources,
    goalPrompt: goalPromptAudit,
    orchestration: orchestrationAudit,
    toolContracts: toolAudit,
    portableSkills: skillAudit,
    rules: rulesAudit,
    ctx7Hook: ctx7Audit,
    noVerifyHook: noVerifyAudit,
    ignoredHostSkills,
    failures,
  };
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`twin-audit: ${error.message}`);
  process.exitCode = 1;
});
