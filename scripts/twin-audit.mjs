#!/usr/bin/env node

import { realpath, readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

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

async function main() {
  const liveRegistry = option("--live-registry");
  const liveCommands = option("--live-commands");
  const liveGoalPrompt = option("--live-goal-prompt");
  const liveOrchestration = option("--live-orchestration");
  const liveInstructions = option("--live-instructions");
  const forbidRoot = option("--forbid-root", { required: false });
  const targetPlatform = valueOption("--platform");
  const [registryText, goalText, instructions, toolsManifest, inventory, commandsManifest, portableGoalText, portableCorePolicy, orchestrationAudit] = await Promise.all([
    readFile(liveRegistry, "utf8"),
    readFile(liveGoalPrompt, "utf8"),
    readFile(liveInstructions, "utf8"),
    readFile(join(ROOT, "manifest", "tools.json"), "utf8"),
    readFile(join(ROOT, "manifest", "inventory-dispositions.json"), "utf8"),
    readFile(join(ROOT, "manifest", "commands.json"), "utf8"),
    readFile(join(ROOT, "skills", "goal-prompt", "SKILL.md"), "utf8"),
    readFile(join(ROOT, "policies", "core.md"), "utf8"),
    auditSkill(liveOrchestration, join(ROOT, "skills", "orchestration", "SKILL.md")),
  ]);
  const liveTools = registryToolIds(registryText);
  const portableTools = JSON.parse(toolsManifest).tools.filter((tool) => !targetPlatform || !tool.platforms || tool.platforms.includes(targetPlatform)).map((tool) => tool.id).sort();
  const exclusions = JSON.parse(inventory).twin?.excludedLiveTools ?? [];
  const exclusionIds = exclusions.map((item) => item.id).sort();
  const missingTools = difference(liveTools, [...portableTools, ...exclusionIds]);
  const extraTools = difference(portableTools, liveTools);
  const portableCommands = JSON.parse(commandsManifest).commands.filter((item) => item.path);
  const commandAudit = await auditCommands(liveCommands, portableCommands, forbidRoot);
  const portableCommandIds = portableCommands.map((item) => item.id).sort();
  const ignoredHostSkills = difference(commandAudit.hostSkillIds, portableCommandIds);
  const requiredGoalPhrases = ["mandatory character-count gate", "programmatically count", "do not send one prompt", "orchestration trigger", "beginning of the goal", "lead"];
  const normalizedLiveGoal = goalText.replace(/\s+/g, " ").toLowerCase();
  const normalizedPortableGoal = portableGoalText.replace(/\s+/g, " ").toLowerCase();
  const missingLiveGoalPhrases = requiredGoalPhrases.filter((phrase) => !normalizedLiveGoal.includes(phrase));
  const missingPortableGoalPhrases = requiredGoalPhrases.filter((phrase) => !normalizedPortableGoal.includes(phrase));
  const instructionPresent = /^#+\s+(?:Agent OS )?Twin Synchronization\s*$/mi.test(instructions);
  const normalizedInstructions = instructions.replace(/\s+/g, " ").toLowerCase();
  const requiredTwinSyncPhrases = ["commit the intended agent os mirror change locally", "push it to the configured agent os `origin`", "never force-push or push unrelated project work"];
  const missingTwinSyncPhrases = requiredTwinSyncPhrases.filter((phrase) => !normalizedInstructions.includes(phrase));
  const requiredOrchestrationPhrases = ["automatically use the `orchestration` skill", "`/goal` is an explicit orchestration trigger", "at the beginning of the goal", "the lead owns integration", "never claim a model or delegation occurred"];
  const missingOrchestrationPhrases = requiredOrchestrationPhrases.filter((phrase) => !normalizedInstructions.includes(phrase));
  const requiredWorkflowSummaryPhrases = ["reusable workflow updates", "only when the task actually added or changed", "omit this item or section entirely", "never emit negative placeholders"];
  const normalizedPortableCore = portableCorePolicy.replace(/\s+/g, " ").toLowerCase();
  const missingLiveWorkflowSummaryPhrases = requiredWorkflowSummaryPhrases.filter((phrase) => !normalizedInstructions.includes(phrase));
  const missingPortableWorkflowSummaryPhrases = requiredWorkflowSummaryPhrases.filter((phrase) => !normalizedPortableCore.includes(phrase));
  const failures = [];
  if (missingTools.length) failures.push(`live tools missing from Agent OS: ${missingTools.join(", ")}`);
  if (extraTools.length) failures.push(`Agent OS tools absent from live registry: ${extraTools.join(", ")}`);
  for (const source of commandAudit.sources) {
    if (source.status === "missing") failures.push(`portable command missing from host skill root: ${source.id}`);
    if (source.status === "content-mismatch") failures.push(`portable command content mismatch: ${source.id}`);
    if (source.forbidden) failures.push(`portable command resolves under forbidden root: ${source.id} -> ${source.resolvedPath}`);
  }
  if (missingLiveGoalPhrases.length) failures.push(`live goal-prompt is missing count-gate phrases: ${missingLiveGoalPhrases.join(", ")}`);
  if (missingPortableGoalPhrases.length) failures.push(`portable goal-prompt is missing count-gate phrases: ${missingPortableGoalPhrases.join(", ")}`);
  if (orchestrationAudit.status !== "match") failures.push("live orchestration skill content mismatch");
  if (!instructionPresent) failures.push("live global instructions are missing the Agent OS twin rule");
  if (missingTwinSyncPhrases.length) failures.push(`live global instructions are missing Agent OS publish policy phrases: ${missingTwinSyncPhrases.join(", ")}`);
  if (missingOrchestrationPhrases.length) failures.push(`live global instructions are missing orchestration policy phrases: ${missingOrchestrationPhrases.join(", ")}`);
  if (missingLiveWorkflowSummaryPhrases.length) failures.push(`live global instructions are missing conditional workflow-summary phrases: ${missingLiveWorkflowSummaryPhrases.join(", ")}`);
  if (missingPortableWorkflowSummaryPhrases.length) failures.push(`portable core policy is missing conditional workflow-summary phrases: ${missingPortableWorkflowSummaryPhrases.join(", ")}`);
  const report = {
    ok: failures.length === 0,
    platform: targetPlatform,
    liveTools,
    portableTools,
    exclusions,
    commandRoot: commandAudit.resolvedRoot,
    portableCommandIds,
    commandSources: commandAudit.sources,
    orchestration: orchestrationAudit,
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
