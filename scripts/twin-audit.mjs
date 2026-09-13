#!/usr/bin/env node

import { lstat, realpath, readdir, readFile, readlink } from "node:fs/promises";
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

function pathOptions(name) {
  const paths = [];
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] !== name) continue;
    if (!process.argv[index + 1]) throw new Error(`${name} requires a path`);
    paths.push(resolve(process.argv[index + 1]));
  }
  return paths;
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

function registryRecords(text, registryPath) {
  try {
    const registry = JSON.parse(text);
    if (Array.isArray(registry.tools)) {
      return registry.tools.map((tool) => ({
        ...tool,
        skill: tool.skill ? resolve(dirname(registryPath), tool.skill) : null,
        skill_symlink: tool.skill_symlink ? resolve(dirname(registryPath), tool.skill_symlink) : null,
      }));
    }
  } catch {
    // Legacy YAML registries are handled below.
  }
  const records = [];
  let current = null;
  let inTools = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^tools:\s*$/.test(line)) { inTools = true; continue; }
    if (!inTools) continue;
    const id = line.match(/^  ([a-z0-9][a-z0-9-]*):\s*$/i);
    if (id) {
      current = { id: id[1] };
      records.push(current);
      continue;
    }
    const field = line.match(/^    (binary|skill|skill_symlink):\s*(.*?)\s*$/);
    if (!field || !current) continue;
    const value = field[2].replace(/^(?:"(.*)"|'(.*)')$/, "$1$2");
    current[field[1]] = ["skill", "skill_symlink"].includes(field[1]) ? resolve(dirname(registryPath), value) : value;
  }
  return records;
}

async function readableStatus(path) {
  if (!path) return "not-declared";
  try {
    await readFile(path, "utf8");
    return "readable";
  } catch (error) {
    if (["ENOENT", "ENOTDIR"].includes(error.code)) return "missing";
    throw error;
  }
}

async function auditRegistryContracts(records) {
  const detailed = records.some((record) => record.skill || record.skill_symlink);
  if (!detailed) return [];
  return Promise.all(records.map(async (record) => {
    const routing = record.skill ? join(dirname(record.skill), "routing.md") : null;
    let linkStatus = "not-declared";
    let resolvedLink = null;
    if (record.skill_symlink) {
      try {
        const info = await lstat(record.skill_symlink);
        if (!info.isSymbolicLink()) linkStatus = "not-symlink";
        else {
          resolvedLink = await realpath(record.skill_symlink);
          linkStatus = await readableStatus(join(record.skill_symlink, "SKILL.md"));
        }
      } catch (error) {
        if (["ENOENT", "ENOTDIR"].includes(error.code)) linkStatus = "missing";
        else throw error;
      }
    }
    return {
      id: record.id,
      skillPath: record.skill,
      skill: await readableStatus(record.skill),
      routingPath: routing,
      routing: await readableStatus(routing),
      skillSymlink: record.skill_symlink,
      resolvedLink,
      link: linkStatus,
    };
  }));
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

async function auditSkillRootLinks(root) {
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [{ root, livePath: root, status: "missing-root", rawTarget: null, resolvedTarget: null }];
    throw error;
  }
  return Promise.all(entries.filter((entry) => entry.isSymbolicLink()).map(async (entry) => {
    const livePath = join(root, entry.name);
    const rawTarget = await readlink(livePath);
    try {
      const resolvedTarget = await realpath(livePath);
      const entrypoint = await readableStatus(join(livePath, "SKILL.md"));
      return { root, id: entry.name, livePath, rawTarget, resolvedTarget, status: entrypoint === "readable" ? "ok" : "missing-entrypoint" };
    } catch (error) {
      if (["ENOENT", "ENOTDIR"].includes(error.code)) return { root, id: entry.name, livePath, rawTarget, resolvedTarget: null, status: "broken-target" };
      throw error;
    }
  }));
}

function referencedSkillPaths(instructions, liveInstructions) {
  const home = dirname(dirname(liveInstructions));
  const paths = [];
  for (const match of instructions.matchAll(/`((?:~\/|\/)[^`\n]*\/skills\/[^`\n/]+\/SKILL\.md)`/g)) {
    const path = match[1].startsWith("~/") ? join(home, match[1].slice(2)) : resolve(match[1]);
    paths.push(path);
  }
  return [...new Set(paths)].sort();
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
  const liveSymlinkRoots = pathOptions("--live-symlink-root");
  const liveRules = optionalPathOption("--live-rules");
  const liveCtx7Hook = optionalPathOption("--live-ctx7-hook");
  const liveNoVerifyHook = optionalPathOption("--live-no-verify-hook");
  const liveCtx7Test = optionalPathOption("--live-ctx7-test");
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
  const registryContracts = await auditRegistryContracts(registryRecords(registryText, liveRegistry));
  const allTools = JSON.parse(toolsManifest).tools.filter((tool) => !targetPlatform || !tool.platforms || tool.platforms.includes(targetPlatform));
  const portableTools = allTools.map((tool) => tool.id).sort();
  const skillsManifest = JSON.parse(await readFile(join(ROOT, "manifest", "skills.json"), "utf8"));
  const exclusions = JSON.parse(inventory).twin?.excludedLiveTools ?? [];
  const exclusionIds = exclusions.map((item) => item.id).sort();
  const missingTools = difference(liveTools, [...portableTools, ...exclusionIds]);
  const extraTools = difference(portableTools, liveTools);
  const portableCommands = JSON.parse(commandsManifest).commands.filter((item) => item.path);
  const commandAudit = await auditCommands(liveCommands, portableCommands, forbidRoot);
  const roots = [...new Set([liveCommands, liveSkillRoot, ...liveSymlinkRoots].filter(Boolean))];
  const [toolAudit, skillAudit, ctx7Audit, noVerifyAudit, ctx7TestAudit, rootLinkGroups] = await Promise.all([
    auditRenderedTools(liveToolRoot, allTools),
    auditPortableSkills(liveSkillRoot, skillsManifest.skills),
    auditExactFile(liveCtx7Hook, join(ROOT, "templates", "hooks", "ctx7-guard", "ctx7_guard.py")),
    auditExactFile(liveNoVerifyHook, join(ROOT, "templates", "hooks", "block-no-verify", "block_no_verify.sh")),
    auditExactFile(liveCtx7Test, join(ROOT, "templates", "hooks", "ctx7-guard", "tests", "test_ctx7_guard.py")),
    Promise.all(roots.map(auditSkillRootLinks)),
  ]);
  const skillLinks = rootLinkGroups.flat();
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
  const dispositionGroups = JSON.parse(inventory).skillGroups ?? [];
  const excludedLiveSkills = JSON.parse(inventory).twin?.excludedLiveSkills ?? [];
  const knownHostSkills = new Set([
    ...portableCommandIds,
    ...liveTools,
    ...skillsManifest.skills.map((skill) => skill.id),
    ...dispositionGroups.flatMap((group) => group.skills ?? []),
    ...excludedLiveSkills.map((skill) => skill.id),
  ]);
  const ignoredHostSkills = commandAudit.hostSkillIds.filter((id) => knownHostSkills.has(id) && !portableCommandIds.includes(id));
  const uncoveredHostSkills = commandAudit.hostSkillIds.filter((id) => !knownHostSkills.has(id));
  const instructionSkillPaths = await Promise.all(referencedSkillPaths(instructions, liveInstructions).map(async (path) => ({ path, status: await readableStatus(path) })));
  const instructionPresent = /^#+\s+(?:Agent OS )?Twin Synchronization\s*$/mi.test(instructions);
  const normalizedInstructions = instructions.replace(/\s+/g, " ").toLowerCase();
  const requiredTwinSyncPhrases = ["commit the intended agent os mirror change locally", "push it to the configured agent os `origin`", "never force-push or push unrelated project work"];
  const missingTwinSyncPhrases = requiredTwinSyncPhrases.filter((phrase) => !normalizedInstructions.includes(phrase));
  const requiredOrchestrationPhrases = ["persistent, thread-scoped objective", "does not by itself require orchestration", "use one executor by default", "automatically use the `orchestration` skill only", "the lead owns integration", "never claim a model or delegation occurred", "worker output is evidence", "not a replacement goal", "do not create user-visible tasks merely to split a goal"];
  const missingOrchestrationPhrases = requiredOrchestrationPhrases.filter((phrase) => !normalizedInstructions.includes(phrase));
  const requiredWorkflowSummaryPhrases = ["reusable workflow updates", "only when the task actually added or changed", "omit this item or section entirely", "never emit negative placeholders"];
  const requiredCorePolicyPhrases = ["frequent small, coherent commits", "use `fallacy-check` quietly"];
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
  for (const source of registryContracts) {
    if (source.skill !== "readable") failures.push(`registered tool skill ${source.skill}: ${source.id}`);
    if (source.routing !== "readable") failures.push(`registered tool routing ${source.routing}: ${source.id}`);
    if (source.link !== "readable") failures.push(`registered tool skill link ${source.link}: ${source.id}`);
  }
  for (const link of skillLinks) if (link.status !== "ok") failures.push(`host skill symlink ${link.status}: ${link.livePath}`);
  if (uncoveredHostSkills.length) failures.push(`live skills missing from Agent OS inventory: ${uncoveredHostSkills.join(", ")}`);
  for (const reference of instructionSkillPaths) if (reference.status !== "readable") failures.push(`live instruction skill path ${reference.status}: ${reference.path}`);
  if (rulesAudit && rulesAudit.status !== "match") failures.push(`generated Agent OS rules ${rulesAudit.status}`);
  if (ctx7Audit && ctx7Audit.status !== "match") failures.push(`ctx7 hook ${ctx7Audit.status}`);
  if (noVerifyAudit && noVerifyAudit.status !== "match") failures.push(`no-verify hook ${noVerifyAudit.status}`);
  if (ctx7TestAudit && ctx7TestAudit.status !== "match") failures.push(`ctx7 hook test ${ctx7TestAudit.status}`);
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
    excludedLiveSkills,
    registryContracts,
    commandRoot: commandAudit.resolvedRoot,
    portableCommandIds,
    commandSources: commandAudit.sources,
    goalPrompt: goalPromptAudit,
    orchestration: orchestrationAudit,
    toolContracts: toolAudit,
    portableSkills: skillAudit,
    skillLinks,
    uncoveredHostSkills,
    instructionSkillPaths,
    rules: rulesAudit,
    ctx7Hook: ctx7Audit,
    noVerifyHook: noVerifyAudit,
    ctx7HookTest: ctx7TestAudit,
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
