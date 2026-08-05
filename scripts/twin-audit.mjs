#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function option(name) {
  const index = process.argv.indexOf(name);
  if (index === -1 || !process.argv[index + 1]) throw new Error(`${name} is required`);
  return resolve(process.argv[index + 1]);
}

function registryToolIds(text) {
  const tools = text.split(/^tools:\s*$/m)[1] ?? "";
  return [...tools.matchAll(/^  ([a-z0-9][a-z0-9-]*):\s*$/gmi)].map((match) => match[1]).sort();
}

async function commandIds(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const ids = await Promise.all(entries.filter((entry) => entry.isDirectory()).map(async (entry) => {
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

async function main() {
  const liveRegistry = option("--live-registry");
  const liveCommands = option("--live-commands");
  const liveGoalPrompt = option("--live-goal-prompt");
  const liveInstructions = option("--live-instructions");
  const [registryText, goalText, instructions, toolsManifest, inventory, commandsManifest, portableGoalText] = await Promise.all([
    readFile(liveRegistry, "utf8"),
    readFile(liveGoalPrompt, "utf8"),
    readFile(liveInstructions, "utf8"),
    readFile(join(ROOT, "manifest", "tools.json"), "utf8"),
    readFile(join(ROOT, "manifest", "inventory-dispositions.json"), "utf8"),
    readFile(join(ROOT, "manifest", "commands.json"), "utf8"),
    readFile(join(ROOT, "skills", "goal-prompt", "SKILL.md"), "utf8"),
  ]);
  const liveTools = registryToolIds(registryText);
  const portableTools = JSON.parse(toolsManifest).tools.map((tool) => tool.id).sort();
  const exclusions = JSON.parse(inventory).twin?.excludedLiveTools ?? [];
  const exclusionIds = exclusions.map((item) => item.id).sort();
  const missingTools = difference(liveTools, [...portableTools, ...exclusionIds]);
  const extraTools = difference(portableTools, liveTools);
  const liveCommandIds = await commandIds(liveCommands);
  const portableCommandIds = JSON.parse(commandsManifest).commands.filter((item) => item.path).map((item) => item.id).sort();
  const missingCommands = difference(liveCommandIds, portableCommandIds);
  const extraCommands = difference(portableCommandIds, liveCommandIds);
  const requiredGoalPhrases = ["mandatory character-count gate", "programmatically count", "do not send one prompt"];
  const normalizedLiveGoal = goalText.replace(/\s+/g, " ").toLowerCase();
  const normalizedPortableGoal = portableGoalText.replace(/\s+/g, " ").toLowerCase();
  const missingLiveGoalPhrases = requiredGoalPhrases.filter((phrase) => !normalizedLiveGoal.includes(phrase));
  const missingPortableGoalPhrases = requiredGoalPhrases.filter((phrase) => !normalizedPortableGoal.includes(phrase));
  const instructionPresent = instructions.includes("## Agent OS Twin Synchronization");
  const failures = [];
  if (missingTools.length) failures.push(`live tools missing from Agent OS: ${missingTools.join(", ")}`);
  if (extraTools.length) failures.push(`Agent OS tools absent from live registry: ${extraTools.join(", ")}`);
  if (missingCommands.length) failures.push(`live commands missing from Agent OS: ${missingCommands.join(", ")}`);
  if (extraCommands.length) failures.push(`Agent OS commands absent from live source: ${extraCommands.join(", ")}`);
  if (missingLiveGoalPhrases.length) failures.push(`live goal-prompt is missing count-gate phrases: ${missingLiveGoalPhrases.join(", ")}`);
  if (missingPortableGoalPhrases.length) failures.push(`portable goal-prompt is missing count-gate phrases: ${missingPortableGoalPhrases.join(", ")}`);
  if (!instructionPresent) failures.push("live global instructions are missing the Agent OS twin rule");
  const report = { ok: failures.length === 0, liveTools, portableTools, exclusions, liveCommandIds, portableCommandIds, failures };
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`twin-audit: ${error.message}`);
  process.exitCode = 1;
});
