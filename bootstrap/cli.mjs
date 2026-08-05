#!/usr/bin/env node

import { createHash } from "node:crypto";
import { access, mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_NAMES = [
  "commands",
  "compatibility",
  "inventory-dispositions",
  "packs",
  "policies",
  "profiles",
  "schema-version",
  "secrets",
  "skills",
  "sources",
  "tools",
];
const START_PREFIX = "<!-- agent-os:start";
const END_MARKER = "<!-- agent-os:end -->";

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function exists(target) {
  try {
    await access(target, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function readText(target, fallback) {
  const hasFallback = arguments.length >= 2;
  try {
    return await readFile(target, "utf8");
  } catch (error) {
    if (error.code === "ENOENT" && hasFallback) return fallback;
    throw error;
  }
}

async function readJson(target) {
  return JSON.parse(await readText(target));
}

async function loadBundle() {
  const bundle = {};
  for (const name of MANIFEST_NAMES) {
    bundle[name] = await readJson(join(REPO_ROOT, "manifest", `${name}.json`));
  }
  bundle.package = await readJson(join(REPO_ROOT, "package.json"));
  return bundle;
}

function byId(items) {
  return new Map(items.map((item) => [item.id, item]));
}

function duplicates(items) {
  const seen = new Set();
  const repeated = new Set();
  for (const item of items) {
    if (seen.has(item.id)) repeated.add(item.id);
    seen.add(item.id);
  }
  return [...repeated];
}

async function validateBundle(bundle) {
  const errors = [];
  const warnings = [];
  const collections = {
    commands: bundle.commands.commands,
    packs: bundle.packs.packs,
    policies: bundle.policies.policies,
    profiles: bundle.profiles.profiles,
    skills: bundle.skills.skills,
    sources: bundle.sources.sources,
    tools: bundle.tools.tools,
  };

  for (const [name, items] of Object.entries(collections)) {
    if (!Array.isArray(items)) {
      errors.push(`${name} must be an array`);
      continue;
    }
    for (const duplicate of duplicates(items)) errors.push(`duplicate ${name} id: ${duplicate}`);
  }

  const profiles = byId(collections.profiles);
  const packs = byId(collections.packs);
  const policies = byId(collections.policies);
  const commands = byId(collections.commands);
  const skills = byId(collections.skills);
  const sources = byId(collections.sources);
  const tools = byId(collections.tools);

  if (!profiles.has(bundle.profiles.defaultProfile)) errors.push("default profile does not exist");

  for (const profile of collections.profiles) {
    for (const pack of profile.packs ?? []) if (!packs.has(pack)) errors.push(`profile ${profile.id} references missing pack ${pack}`);
    for (const policy of profile.policies ?? []) if (!policies.has(policy)) errors.push(`profile ${profile.id} references missing policy ${policy}`);
  }

  for (const pack of collections.packs) {
    for (const tool of [...(pack.tools ?? []), ...(pack.optionalTools ?? [])]) if (!tools.has(tool)) errors.push(`pack ${pack.id} references missing tool ${tool}`);
    for (const command of [...(pack.commands ?? []), ...(pack.optionalCommands ?? [])]) if (!commands.has(command)) errors.push(`pack ${pack.id} references missing command ${command}`);
    for (const skill of pack.skills ?? []) if (!skills.has(skill)) errors.push(`pack ${pack.id} references missing skill ${skill}`);
  }

  for (const tool of collections.tools) {
    if (!sources.has(tool.source)) errors.push(`tool ${tool.id} references missing source ${tool.source}`);
    if (!tool.binary || !tool.purpose || !tool.safety) errors.push(`tool ${tool.id} is missing routing fields`);
  }

  for (const source of collections.sources) {
    if (!source.pin) errors.push(`source ${source.id} has no pin or explicit unresolved marker`);
    if (source.automation !== "disabled") warnings.push(`source ${source.id} enables automation; review required`);
  }

  for (const item of [...collections.commands, ...collections.policies, ...collections.skills]) {
    if (!item.path) continue;
    const target = join(REPO_ROOT, item.path);
    if (!(await exists(target))) errors.push(`${item.id} path does not exist: ${item.path}`);
  }

  if (bundle["schema-version"].manifestSchema !== 1) errors.push("unsupported manifest schema");
  return { errors, warnings };
}

function parseArgs(argv) {
  const result = { _: [] };
  const valueFlags = new Set(["--profile", "--packs", "--hosts", "--home", "--state-dir", "--codex-home", "--claude-home", "--config"]);
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) {
      result._.push(value);
      continue;
    }
    if (valueFlags.has(value)) {
      if (index + 1 >= argv.length) throw new Error(`${value} requires a value`);
      result[value.slice(2)] = argv[index + 1];
      index += 1;
    } else {
      result[value.slice(2)] = true;
    }
  }
  return result;
}

function splitList(value) {
  if (!value) return null;
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function ensureUnder(base, target, label) {
  const normalizedBase = resolve(base);
  const normalizedTarget = resolve(target);
  if (normalizedTarget !== normalizedBase && !normalizedTarget.startsWith(`${normalizedBase}${sep}`)) {
    throw new Error(`${label} must remain under the selected home directory`);
  }
  return normalizedTarget;
}

async function resolveContext(bundle, options, preferState = false) {
  const userHome = resolve(options.home ?? homedir());
  const stateDir = ensureUnder(userHome, options["state-dir"] ?? join(userHome, ".agent-os"), "state directory");
  const statePath = join(stateDir, "state.json");
  const previousState = await readJson(statePath).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });

  const profileId = options.profile ?? (preferState ? previousState?.profile : null) ?? bundle.profiles.defaultProfile;
  const profile = bundle.profiles.profiles.find((item) => item.id === profileId);
  if (!profile) throw new Error(`unknown profile: ${profileId}`);

  const requestedPacks = splitList(options.packs) ?? (preferState ? previousState?.packs : null) ?? profile.packs;
  const packMap = byId(bundle.packs.packs);
  const packs = requestedPacks.map((id) => {
    const pack = packMap.get(id);
    if (!pack) throw new Error(`unknown pack: ${id}`);
    return pack;
  });

  const requestedHosts = splitList(options.hosts) ?? (preferState ? previousState?.hosts : null) ?? profile.defaultHosts;
  const hostMap = new Map(bundle.compatibility.hosts.map((item) => [item.id, item]));
  const hosts = requestedHosts.map((id) => {
    const host = hostMap.get(id);
    if (!host) throw new Error(`unknown host: ${id}`);
    return host;
  });

  const codexHome = ensureUnder(userHome, options["codex-home"] ?? join(userHome, ".codex"), "Codex home");
  const claudeHome = ensureUnder(userHome, options["claude-home"] ?? join(userHome, ".claude"), "Claude home");
  const configPath = options.config ? resolve(options.config) : join(stateDir, "config.json");
  const config = await readJson(configPath).catch((error) => {
    if (error.code === "ENOENT") return {};
    throw error;
  });

  return { bundle, options, userHome, stateDir, statePath, previousState, profile, packs, hosts, codexHome, claudeHome, config };
}

function selectedTools(context) {
  const ids = new Set(context.packs.flatMap((pack) => pack.tools ?? []));
  return context.bundle.tools.tools.filter((tool) => ids.has(tool.id));
}

function selectedSkills(context) {
  const ids = new Set(context.packs.flatMap((pack) => pack.skills ?? []));
  return context.bundle.skills.skills.filter((skill) => ids.has(skill.id) && skill.path);
}

function selectedCommands(context) {
  const ids = new Set(context.packs.flatMap((pack) => pack.commands ?? []));
  return context.bundle.commands.commands.filter((command) => ids.has(command.id) && command.path && command.selectedByDefault);
}

async function renderInstructionBlock(context) {
  const policyMap = byId(context.bundle.policies.policies);
  const sections = [];
  for (const policyId of context.profile.policies) {
    const policy = policyMap.get(policyId);
    sections.push((await readText(join(REPO_ROOT, policy.path))).trim());
  }
  const identity = context.config.identity ?? {};
  if (identity.addressAs || identity.occasionalPraise) {
    sections.push(["# Local Identity", identity.addressAs ? `- Address the user as: ${identity.addressAs}` : null, identity.occasionalPraise ? `- Occasional praise preference: ${identity.occasionalPraise}` : null].filter(Boolean).join("\n"));
  }
  const start = `${START_PREFIX} profile=${context.profile.id} -->`;
  return `${start}\n\n${sections.join("\n\n")}\n\n${END_MARKER}`;
}

function extractBlock(content) {
  const startIndex = content.indexOf(START_PREFIX);
  const endIndex = content.indexOf(END_MARKER);
  if (startIndex === -1 && endIndex === -1) return null;
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) throw new Error("malformed Agent OS managed block");
  const end = endIndex + END_MARKER.length;
  return { start: startIndex, end, text: content.slice(startIndex, end) };
}

function mergeBlock(content, block) {
  const existing = extractBlock(content);
  if (!existing) return `${content.trimEnd()}${content.trim() ? "\n\n" : ""}${block}\n`;
  return `${content.slice(0, existing.start)}${block}${content.slice(existing.end)}`;
}

function removeBlock(content) {
  const existing = extractBlock(content);
  if (!existing) return content;
  const before = content.slice(0, existing.start).trimEnd();
  const after = content.slice(existing.end).trimStart();
  return [before, after].filter(Boolean).join("\n\n") + (before || after ? "\n" : "");
}

function renderToolSkill(tool) {
  const auth = tool.auth.join(", ");
  return `---\nname: ${tool.id}\ndescription: ${tool.purpose}\n---\n\n# ${tool.id}\n\nUse the upstream \`${tool.binary}\` binary when this capability is selected and installed. Check \`command -v ${tool.binary}\` and a lightweight help/version command when exact interface support matters. Binary presence does not prove authentication.\n\n## Freshness\n\n${tool.freshness}\n\n## Safety\n\n${tool.safety}\n\nAuthentication class: ${auth}. Never inspect or expose the underlying credential, session, archive, or private application state. Agent OS does not install or authenticate this dependency automatically.\n`;
}

function managedRecord(previousState, path) {
  return previousState?.managed?.find((item) => item.path === path) ?? null;
}

async function classifyOperation(operation, previousState) {
  const current = await readText(operation.path, null);
  const previous = managedRecord(previousState, operation.path);
  if (operation.kind === "managed-block") {
    const existingBlock = current === null ? null : extractBlock(current);
    if (existingBlock && !previous) return { ...operation, status: "conflict", reason: "unowned Agent OS block exists", current };
    if (existingBlock && previous?.blockHash !== hash(existingBlock.text)) return { ...operation, status: "conflict", reason: "managed block drifted", current };
    const next = mergeBlock(current ?? "", operation.block);
    return { ...operation, status: current === next ? "unchanged" : current === null ? "create" : "update", current, next };
  }

  if (current !== null && !previous) return { ...operation, status: "conflict", reason: "destination is not ledger-owned", current };
  if (current !== null && previous?.hash !== hash(current)) return { ...operation, status: "conflict", reason: "managed file drifted", current };
  return { ...operation, status: current === operation.content ? "unchanged" : current === null ? "create" : "update", current, next: operation.content };
}

async function buildPlan(context) {
  const operations = [];
  const block = await renderInstructionBlock(context);
  for (const host of context.hosts) {
    const hostHome = host.id === "codex" ? context.codexHome : context.claudeHome;
    operations.push({ kind: "managed-block", path: join(hostHome, host.instructionFile), block, id: `${host.id}:instructions` });

    for (const skill of selectedSkills(context)) {
      operations.push({ kind: "file", path: join(hostHome, host.skillDirectory, skill.id, "SKILL.md"), content: await readText(join(REPO_ROOT, skill.path)), id: `${host.id}:skill:${skill.id}` });
    }
    for (const tool of selectedTools(context)) {
      operations.push({ kind: "file", path: join(hostHome, host.skillDirectory, tool.id, "SKILL.md"), content: renderToolSkill(tool), id: `${host.id}:tool:${tool.id}` });
    }
    for (const command of selectedCommands(context)) {
      const content = await readText(join(REPO_ROOT, command.path));
      const path = host.commandMode === "markdown" ? join(hostHome, host.commandDirectory, `${command.id}.md`) : join(hostHome, host.skillDirectory, command.id, "SKILL.md");
      operations.push({ kind: "file", path, content, id: `${host.id}:command:${command.id}` });
    }
  }

  const classified = [];
  for (const operation of operations) classified.push(await classifyOperation(operation, context.previousState));
  return classified;
}

function displayPath(context, target) {
  const rel = relative(context.userHome, target);
  return rel.startsWith("..") ? target : `~/${rel}`;
}

function planSummary(context, plan) {
  return {
    profile: context.profile.id,
    packs: context.packs.map((item) => item.id),
    hosts: context.hosts.map((item) => item.id),
    safe: Boolean(context.options.safe),
    apply: Boolean(context.options.apply),
    operations: plan.map((item) => ({ id: item.id, path: displayPath(context, item.path), status: item.status, reason: item.reason ?? null })),
    conflicts: plan.filter((item) => item.status === "conflict").length,
    externalTools: selectedTools(context).map((tool) => ({ id: tool.id, binary: tool.binary, auth: tool.auth })),
  };
}

async function atomicWrite(target, content) {
  await mkdir(dirname(target), { recursive: true });
  const temp = join(dirname(target), `.${Date.now()}-${process.pid}.agent-os.tmp`);
  await writeFile(temp, content, { mode: 0o600 });
  await rename(temp, target);
}

function backupTarget(stateDir, target, timestamp) {
  const safe = resolve(target).replace(/^[/\\]+/, "").replaceAll("..", "__");
  return join(stateDir, "backups", timestamp, safe);
}

async function applyPlan(context, plan) {
  const conflicts = plan.filter((item) => item.status === "conflict");
  if (conflicts.length) throw new Error(`refusing apply with ${conflicts.length} conflict(s)`);
  const timestamp = new Date().toISOString().replaceAll(":", "-");
  const managed = [];

  for (const operation of plan) {
    if (operation.status === "unchanged") {
      const previous = managedRecord(context.previousState, operation.path);
      if (previous) managed.push(previous);
      else if (operation.kind === "managed-block") managed.push({ id: operation.id, kind: operation.kind, path: operation.path, blockHash: hash(operation.block) });
      else managed.push({ id: operation.id, kind: operation.kind, path: operation.path, hash: hash(operation.content) });
      continue;
    }
    if (operation.current !== null) {
      const backup = backupTarget(context.stateDir, operation.path, timestamp);
      await atomicWrite(backup, operation.current);
    }
    await atomicWrite(operation.path, operation.next);
    if (operation.kind === "managed-block") managed.push({ id: operation.id, kind: operation.kind, path: operation.path, blockHash: hash(operation.block) });
    else managed.push({ id: operation.id, kind: operation.kind, path: operation.path, hash: hash(operation.content) });
  }

  const manifestDigest = hash(JSON.stringify(context.bundle));
  const state = {
    schema: 1,
    agentOsVersion: context.bundle.package.version,
    manifestDigest,
    profile: context.profile.id,
    packs: context.packs.map((item) => item.id),
    hosts: context.hosts.map((item) => item.id),
    installedAt: context.previousState?.installedAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    managed,
  };
  const config = {
    profile: context.profile.id,
    packs: state.packs,
    hosts: state.hosts,
    identity: context.config.identity ?? { displayName: "", addressAs: "", occasionalPraise: "" },
    paths: context.config.paths ?? { obsidianVault: "" },
    vaultAdapter: context.config.vaultAdapter ?? "",
  };
  await atomicWrite(join(context.stateDir, "config.json"), `${JSON.stringify(config, null, 2)}\n`);
  await atomicWrite(context.statePath, `${JSON.stringify(state, null, 2)}\n`);
  return state;
}

async function binaryAvailable(binary) {
  const pathEntries = (process.env.PATH ?? "").split(":").filter(Boolean);
  for (const entry of pathEntries) {
    const candidate = join(entry, binary);
    try {
      const info = await stat(candidate);
      if (info.isFile()) return candidate;
    } catch {
      // Continue without reading tool-owned state.
    }
  }
  return null;
}

async function stateHealth(context) {
  if (!context.previousState) return { installed: false, managed: [], drift: [] };
  const managed = [];
  const drift = [];
  for (const item of context.previousState.managed ?? []) {
    const current = await readText(item.path, null);
    let status = "ok";
    if (current === null) status = "missing";
    else if (item.kind === "managed-block") {
      const block = extractBlock(current);
      if (!block || hash(block.text) !== item.blockHash) status = "drift";
    } else if (hash(current) !== item.hash) status = "drift";
    managed.push({ path: displayPath(context, item.path), status });
    if (status !== "ok") drift.push({ path: displayPath(context, item.path), status });
  }
  return { installed: true, managed, drift };
}

async function statusReport(context, catalogue = false) {
  const health = await stateHealth(context);
  const tools = [];
  for (const tool of selectedTools(context)) tools.push({ id: tool.id, binary: tool.binary, available: Boolean(await binaryAvailable(tool.binary)), auth: tool.auth, disposition: tool.disposition });
  const report = {
    installed: health.installed,
    profile: context.profile.id,
    packs: context.packs.map((item) => item.id),
    hosts: context.hosts.map((item) => item.id),
    drift: health.drift,
    tools,
  };
  if (catalogue) {
    report.commands = context.bundle.commands.commands.map(({ id, disposition, selectedByDefault, purpose }) => ({ id, disposition, selectedByDefault, purpose }));
    report.skills = context.bundle.skills.skills;
  }
  return report;
}

async function doctorReport(context) {
  const validation = await validateBundle(context.bundle);
  const status = await statusReport(context, false);
  const runtimeMajor = Number(process.versions.node.split(".")[0]);
  const coreChecks = [
    { id: "manifests", ok: validation.errors.length === 0, detail: validation.errors.join("; ") || "valid" },
    { id: "runtime", ok: runtimeMajor >= context.bundle.compatibility.runtime.minimumMajor, detail: `Node ${process.versions.node}` },
    { id: "platform", ok: context.bundle.compatibility.platforms.includes(platform()), detail: platform() },
    { id: "managed-state", ok: status.drift.length === 0, detail: status.installed ? `${status.drift.length} drift item(s)` : "not installed; repository is still valid" },
  ];
  return {
    ok: coreChecks.every((item) => item.ok),
    coreChecks,
    warnings: validation.warnings,
    optionalTools: status.tools,
    humanCheckpoints: ["Install selected external binaries from reviewed sources.", "Configure an encrypted vault adapter for selected secret requirements.", "Complete desired account logins and macOS permissions manually."],
  };
}

async function uninstallPlan(context) {
  if (!context.previousState) return [];
  const operations = [];
  for (const item of context.previousState.managed ?? []) {
    const current = await readText(item.path, null);
    if (current === null) {
      operations.push({ ...item, status: "already-missing" });
      continue;
    }
    if (item.kind === "managed-block") {
      const block = extractBlock(current);
      if (!block || hash(block.text) !== item.blockHash) operations.push({ ...item, status: "conflict", reason: "managed block drifted" });
      else operations.push({ ...item, status: "remove-block", current, next: removeBlock(current) });
    } else if (hash(current) !== item.hash) operations.push({ ...item, status: "conflict", reason: "managed file drifted" });
    else operations.push({ ...item, status: "remove-file", current });
  }
  return operations;
}

async function applyUninstall(context, plan) {
  if (plan.some((item) => item.status === "conflict")) throw new Error("refusing uninstall while managed files have drifted");
  const timestamp = new Date().toISOString().replaceAll(":", "-");
  for (const operation of plan) {
    if (!operation.current) continue;
    await atomicWrite(backupTarget(context.stateDir, operation.path, timestamp), operation.current);
    if (operation.status === "remove-block") {
      if (operation.next) await atomicWrite(operation.path, operation.next);
      else await rm(operation.path, { force: true });
    } else if (operation.status === "remove-file") {
      await rm(operation.path, { force: true });
    }
  }
  const state = { ...context.previousState, managed: [], uninstalledAt: new Date().toISOString() };
  await atomicWrite(context.statePath, `${JSON.stringify(state, null, 2)}\n`);
  return state;
}

function printHuman(object) {
  if (object.operations) {
    console.log(`Profile: ${object.profile}`);
    console.log(`Packs: ${object.packs.join(", ")}`);
    console.log(`Hosts: ${object.hosts.join(", ")}`);
    for (const operation of object.operations) console.log(`${operation.status.padEnd(10)} ${operation.path}${operation.reason ? ` — ${operation.reason}` : ""}`);
    console.log(object.apply ? "Apply requested." : "Preview only; no files changed.");
    return;
  }
  console.log(JSON.stringify(object, null, 2));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const command = options._[0] ?? "help";
  if (["help", "--help", "-h"].includes(command)) {
    console.log("Usage: agent-os <setup|status|doctor|update|safe-uninstall|validate> [--profile ID] [--packs a,b] [--hosts codex,claude-code] [--home PATH] [--safe] [--apply] [--json]");
    return;
  }

  const bundle = await loadBundle();
  const validation = await validateBundle(bundle);
  if (command === "validate") {
    const result = { ok: validation.errors.length === 0, ...validation };
    options.json ? console.log(JSON.stringify(result)) : printHuman(result);
    if (!result.ok) process.exitCode = 1;
    return;
  }
  if (validation.errors.length) throw new Error(`invalid manifests: ${validation.errors.join("; ")}`);

  const preferState = ["status", "doctor", "update", "safe-uninstall", "uninstall"].includes(command);
  const context = await resolveContext(bundle, options, preferState);

  if (command === "setup" || command === "update") {
    const plan = await buildPlan(context);
    const summary = planSummary(context, plan);
    if (options.apply) await applyPlan(context, plan);
    options.json ? console.log(JSON.stringify(summary)) : printHuman(summary);
    return;
  }
  if (command === "status") {
    const result = await statusReport(context, Boolean(options.catalog));
    options.json ? console.log(JSON.stringify(result)) : printHuman(result);
    return;
  }
  if (command === "doctor") {
    const result = await doctorReport(context);
    options.json ? console.log(JSON.stringify(result)) : printHuman(result);
    if (!result.ok) process.exitCode = 1;
    return;
  }
  if (command === "safe-uninstall" || command === "uninstall") {
    const plan = await uninstallPlan(context);
    const summary = { apply: Boolean(options.apply), operations: plan.map(({ path, status, reason }) => ({ path: displayPath(context, path), status, reason: reason ?? null })) };
    if (options.apply) await applyUninstall(context, plan);
    options.json ? console.log(JSON.stringify(summary)) : printHuman(summary);
    return;
  }
  throw new Error(`unknown command: ${command}`);
}

main().catch((error) => {
  console.error(`agent-os: ${error.message}`);
  process.exitCode = 1;
});
