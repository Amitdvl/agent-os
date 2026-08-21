#!/usr/bin/env node

import { createHash } from "node:crypto";
import { access, chmod, lstat, mkdir, readFile, readdir, readlink, realpath, rename, rm, stat, symlink, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
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
const LIVE_CUTOVER_COMMAND_IDS = ["add", "commands", "teach", "trunk-finish"];
const LEGACY_COMMAND_IDS = ["add", "commands", "trunk-finish"];
const LEGACY_GUIDANCE = "Consuming repos should use `.agents/skills` as the canonical repo-local skill root; `agent-system/skills` is only the upstream source for reusable global assets.";
const CUTOVER_GUIDANCE = "Consuming repos should use `.agents/skills` as the canonical repo-local skill root; Agent OS is the canonical portable source for reusable global assets.";

// These are portable *templates*, not machine configuration. Every selected
// tool receives the same complete section structure, with only safe command
// examples and placeholders for private data roots.
const TOOL_CONTRACTS = {
  birdclaw: { root: "<user-home>/.birdclaw", preflight: ["birdclaw --help"], reads: ["birdclaw sync", "birdclaw search --json --max 20"], writes: ["Explicit tweet, reply, DM, mute, or block command only after exact user intent"], limits: "Archive freshness and available history depend on the user's own account sync.", fix: "Complete the tool's supported login locally; never inspect its cookie or database files." },
  discrawl: { root: "<tool-owned Discord archive>", preflight: ["discrawl --help"], reads: ["discrawl sync --full", "discrawl search <query>"], writes: ["Supported discrawl send only with an exact channel and message"], limits: "A full archive sync is required before answering from Discord data.", fix: "Use the tool's documented account setup; do not expose a bot token." },
  "instagram-cli": { root: "<user-home>/.instagram-cli", preflight: ["instagram-cli --version", "instagram-cli auth whoami"], reads: ["instagram-cli inbox --output json --limit 20"], writes: ["instagram-cli send/reply only with exact thread and content"], limits: "There is intentionally no Instagram website or browser-automation fallback.", fix: "The user must run instagram-cli auth login locally when the session is absent or expired." },
  notcrawl: { root: "<tool-owned Notion archive>", preflight: ["notcrawl status --json"], reads: ["notcrawl sync --source desktop", "notcrawl search <query>"], writes: ["notcrawl publish --push only with an exact remote target and push intent"], limits: "Sync/export/share can change a local archive; publishing is never implicit.", fix: "Configure an independently created vault record or supported desktop/API access." },
  notebridge: { root: "<Wispr Flow local database and NoteBridge state>", preflight: ["notebridge --version", "notebridge --format json doctor"], reads: ["notebridge --format json notes list --source wispr --limit 20 --offset 0", "notebridge --format json notes list --source apple --limit 20 --offset 0"], writes: ["Apple changes only for exact stable apple: IDs with --apply --yes", "For Apple body edits, preserve retrieved raw_content as HTML, pass the existing title explicitly, and verify the title, original-content prefix, and requested change after the write", "One-way Wispr-to-Apple mirror only after reviewing the exact account/folder dry run"], limits: "No network client or remote sync; export requires an explicit destination and --force is intentional overwrite authority.", fix: "Confirm Notes is installed and macOS automation permission is granted; verify the local Wispr schema with doctor." },
  notion: { root: "<no local archive; service API>", preflight: ["notion auth status"], reads: ["notion search <query>", "notion blocks children <id>"], writes: ["notion create/append only with exact page/database target and content"], limits: "The command needs an independently supplied vault environment; 404 can mean the integration was not shared.", fix: "Create the named vault requirement and share the target with the new user's integration." },
  obsidian: { root: "<configured user-owned Obsidian vault>", preflight: ["obsidian --help"], reads: ["obsidian search <query>", "obsidian read <note>"], writes: ["Specific create/edit/append only after an explicit note target"], limits: "The vault is read-only by default and its contents are never migrated by Agent OS.", fix: "Set the non-secret vault path in Agent OS config after the user chooses one." },
  opencap: { root: "<tool-owned OpenCap state>", preflight: ["opencap record status"], reads: ["opencap record status"], writes: ["opencap record start/stop/share/edit only for the exact requested window or display"], limits: "Screen Recording and optional account access are human checkpoints.", fix: "Grant the narrow macOS permission in System Settings and complete the supported login manually." },
  opencli: { root: "<tool-owned browser bridge state>", preflight: ["opencli doctor", "opencli profile list"], reads: ["opencli doctor", "opencli twitter bookmark-folders -f json", "opencli twitter bookmark-folder <folder-id> --limit 1000 -f json", "opencli twitter bookmarks --limit 1000 -f json (only when the authenticated folder index fails; label results corpus-wide)"], writes: ["Browser/UI mutation only with exact target and action"], limits: "Cookies, browser profiles, extension permissions, and traces are never inspected or copied. Do not invent a bookmark-folder ID when X returns a folder-index error.", fix: "Install/enable the supported bridge and select a user-owned browser profile manually." },
  peekaboo: { root: "<macOS accessibility and screen state>", preflight: ["peekaboo --help"], reads: ["peekaboo list windows"], writes: ["UI automation only with a clear target and task authority"], limits: "Read-only inspection is preferred; Accessibility/Screen Recording stay user-controlled.", fix: "Grant only the required macOS privacy permission in System Settings." },
  "rdt-cli": { root: "<tool-owned browser-session state>", preflight: ["rdt --help"], reads: ["rdt search <query> --json --max 20"], writes: ["Comment, vote, save, subscribe, or account changes only with exact target/action"], limits: "Browser credentials are opaque and must never be inspected.", fix: "Connect the user's own supported browser session manually." },
  remindctl: { root: "<Apple Reminders database>", preflight: ["remindctl --help"], reads: ["remindctl list"], writes: ["Create/update/complete/delete only with exact list, reminder, date, and action", "Create new reminders with high (urgent) priority unless the user explicitly requests another priority"], limits: "Results can lag native state and access requires macOS permission.", fix: "Grant Reminders access in System Settings, then verify in the native app." },
  spogo: { root: "<tool-owned Spotify session>", preflight: ["spogo auth status"], reads: ["spogo now-playing"], writes: ["Playback, queue, device, library, playlist, and volume changes only on exact request"], limits: "Player changes are visible remote writes and browser credentials remain opaque.", fix: "Complete the supported user login or browser import locally." },
  "twitter-cli": { root: "<tool-owned browser-session state>", preflight: ["twitter --help"], reads: ["twitter search <query> --json --max 20"], writes: ["Post/reply/quote/delete/like/follow only with exact target and content"], limits: "Use Birdclaw for historical archive work; do not print auth diagnostics.", fix: "Connect a user-owned browser session through the tool's documented flow." },
  wacli: { root: "<tool-owned WhatsApp linked-device state>", preflight: ["wacli --help"], reads: ["wacli status"], writes: ["Send, reaction, archive, pin, group/channel, or account mutation only with exact target/action"], limits: "Linked-device sessions are user-owned and must never be read from disk.", fix: "Link the user's own device through the supported interactive flow." },
  wacrawl: { root: "<WhatsApp Desktop local archive>", preflight: ["wacrawl sync"], reads: ["wacrawl sync", "wacrawl search <query>"], writes: ["None: this integration is archive read-only"], limits: "Sync before answering unless the user opts out or asks only about setup.", fix: "Install WhatsApp Desktop and let the user establish their own archive." },
  xurl: { root: "<tool-owned X API configuration>", preflight: ["xurl --help"], reads: ["xurl --help"], writes: ["Any authenticated action only with exact target/content"], limits: "OAuth configuration is user-owned; never use inline credentials or verbose auth output.", fix: "Complete the supported OAuth setup locally." },
  "yt-dlp": { root: "<user-selected download destination>", preflight: ["yt-dlp --version"], reads: ["yt-dlp --no-playlist --skip-download <single-public-url>"], writes: ["A single authorized --no-playlist download to an explicit destination"], limits: "No cookies, login, proxy, geo-bypass, background, or bulk retrieval.", fix: "Install from a reviewed source and use only public, authorized media." },
  summarize: { root: "<user-home>/.summarize", preflight: ["summarize --version", "summarize --help", "summarize status"], reads: ["summarize <user-supplied-url-or-file> --extract --plain", "summarize <user-supplied-url-or-file> --cli codex --length short --plain"], writes: ["Use --slides only with an explicit output directory", "Use --clear-cache only with an explicit deletion request"], limits: "This is not an offline summarizer: model-backed output can use an existing coding CLI or an independently configured provider. Published transcripts may be unavailable or inaccurate.", fix: "Install the Homebrew formula, verify the chosen coding CLI is already signed in, or configure provider credentials only through the user's own vault." },
  youtube: { root: "<no local data; existing OpenCLI browser session>", preflight: ["youtube --help", "opencli doctor"], reads: ["youtube inspect <single-YouTube-url>", "youtube watch-later --limit 20"], writes: ["youtube save <single-YouTube-url> --yes only with exact user intent"], limits: "The built-in Watch Later list is browser-only; this wrapper never reads cookies or session files.", fix: "Build the reviewed local wrapper, enable the OpenCLI Browser Bridge, and sign into YouTube in the selected user-owned browser profile." },
};

const TOOL_DETAILS = {
  birdclaw: "Check archive db stats; use cached whois/search/links and exact date ranges. Sync again after a requested remote write.",
  discrawl: "Run a full sync before archive answers and after supported writes; prefer concise summaries over raw private messages.",
  "instagram-cli": "Use fresh bounded inbox JSON and returned thread IDs. Mark-seen/download are writes. Never use the Instagram website or browser automation.",
  notcrawl: "Use status/doctor before selecting a sync source. Exports mutate local output; publish --push needs exact remote intent and never writes back to Notion.",
  notebridge: "Use JSON-first bounded reads. Wispr is local read-only; never expose note content unless requested. Apple mutations are dry-run by default and need stable IDs plus --apply --yes. Treat body edits as whole-document replacements: retrieve raw_content, preserve it as HTML, pass the existing title explicitly, and read back the title, original-content prefix, and requested change. If preservation cannot be verified, stop instead of writing. Mirrors are one-way, conflict-aware, and never delete Notes.",
  notion: "Use only the new user's vault requirement. A 404 usually means the target was not shared with the integration.",
  obsidian: "Configured vault paths are user-owned. Search/read/backlinks are reads; create, append, rename, move, and delete are exact-target writes.",
  opencap: "Check status first; prefer named windows. Event-log milestones, and only stop/share/edit/delete requested recordings.",
  opencli: "Run doctor/profile list; browser commands operate on a selected logged-in profile and extensions are manual checkpoints. For a named X bookmark folder, list folders, match the requested name, then fetch that folder. If the authenticated folder index returns X's bookmarkFoldersSlice 404, mine `opencli twitter bookmarks --limit 1000 -f json` instead and explicitly label the result corpus-wide rather than folder-attributed; never inspect cookies, storage, or traces to bypass the failure.",
  peekaboo: "Run permissions and inspect apps/windows first. UI clicks, typing, menus, clipboard, and dialogs need clear authority.",
  "rdt-cli": "Keep requests bounded and sequential; short indexes require a fresh listing. Exports use task-local paths and interactions require exact target/text.",
  remindctl: "Use JSON and read back writes. Set newly created reminders to high (urgent) priority unless the user explicitly requests another priority. Native Reminders UI is freshest for Today/current/subtasks; never use it for calendar events.",
  spogo: "Check auth and bound search/history. Playback, queue/device/library/playlist/volume/shuffle/repeat are user-visible writes.",
  "twitter-cli": "Prefer Birdclaw for history. Use bounded YAML/JSON and never verbose diagnostics; verify requested live writes with narrow reads.",
  wacli: "Use JSON and --read-only for exploration. Sends, reactions, account/group/channel and state mutations need exact intent.",
  wacrawl: "Read-only archive tooling: sync before answers; never write into the app container or expose archive/backup data.",
  xurl: "Check auth without inline values or verbose mode. API mutations, DMs, media, and app actions are exact-intent writes.",
  "yt-dlp": "Inspect one public URL with --no-playlist. Every output needs source, scope, and destination; never use cookies or bypasses.",
  summarize: "Use --extract for source text and --cli codex for user-scoped model summaries when that existing CLI is signed in. Never inspect ~/.summarize/config.json or send private material to a provider without clear authority. Slides write files; cache clearing deletes tool-owned data.",
  youtube: "Use yt-dlp only for metadata; use the wrapper only for explicit Watch Later saves. Require --yes for non-interactive writes and report success only after the checkbox is selected.",
};

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
    if (!TOOL_CONTRACTS[tool.id]) errors.push(`tool ${tool.id} has no portable template`);
  }

  for (const id of Object.keys(TOOL_CONTRACTS)) if (!tools.has(id)) errors.push(`portable template ${id} has no tool manifest`);

  for (const source of collections.sources) {
    if (!source.pin) errors.push(`source ${source.id} has no pin or explicit unresolved marker`);
    if (source.automation !== "disabled") warnings.push(`source ${source.id} enables automation; review required`);
  }

  for (const item of [...collections.commands, ...collections.policies, ...collections.skills]) {
    if (!item.path) continue;
    const target = join(REPO_ROOT, item.path);
    if (!(await exists(target))) errors.push(`${item.id} path does not exist: ${item.path}`);
  }

  const inventory = bundle["inventory-dispositions"];
  for (const item of [...(inventory.hooks ?? []), ...(inventory.automationTemplates ?? []), ...(inventory.referenceOnly ?? [])]) {
    if (!item.id || !item.disposition) errors.push("inventory item is missing id or disposition");
    if (item.path && !(await exists(join(REPO_ROOT, item.path)))) errors.push(`inventory path does not exist: ${item.path}`);
  }

  if (bundle["schema-version"].manifestSchema !== 1) errors.push("unsupported manifest schema");
  return { errors, warnings };
}

function parseArgs(argv) {
  const result = { _: [] };
  const valueFlags = new Set(["--profile", "--packs", "--hosts", "--home", "--state-dir", "--codex-home", "--claude-home", "--config", "--tools", "--vault-dir", "--age-recipient", "--legacy-root"]);
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

  const requestedPacks = options.safe ? ["core"] : splitList(options.packs) ?? (preferState ? previousState?.packs : null) ?? profile.packs;
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

  const localToolsRoot = join(stateDir, "local-tools");
  const vaultDir = ensureUnder(userHome, options["vault-dir"] ?? join(stateDir, "vault"), "vault directory");
  return { bundle, options, userHome, stateDir, statePath, previousState, profile, packs, hosts, codexHome, claudeHome, localToolsRoot, vaultDir, config };
}

function selectedTools(context) {
  const ids = new Set(context.packs.flatMap((pack) => pack.tools ?? []));
  return context.bundle.tools.tools.filter((tool) => ids.has(tool.id));
}

function selectedSkills(context) {
  const ids = new Set(context.packs.flatMap((pack) => pack.skills ?? []));
  return context.bundle.skills.skills.filter((skill) => ids.has(skill.id) && skill.path);
}

async function portableSkillFiles(skill) {
  const root = dirname(join(REPO_ROOT, skill.path));
  const files = [];
  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const target = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (["testdata", "tests", "__pycache__"].includes(entry.name)) continue;
        await visit(target);
        continue;
      }
      if (!entry.isFile() || entry.name.endsWith(".test.js") || entry.name.endsWith(".test.mjs") || entry.name.endsWith(".test.ts") || entry.name.endsWith("_test.go")) continue;
      files.push({ relativePath: relative(root, target), content: await readText(target) });
    }
  }
  await visit(root);
  return files;
}

function selectedCommands(context) {
  const ids = new Set(context.packs.flatMap((pack) => pack.commands ?? []));
  return context.bundle.commands.commands.filter((command) => ids.has(command.id) && command.path && command.selectedByDefault);
}

function launcherPath(context) {
  return join(context.userHome, ".local", "bin", "agent-os");
}

function canonicalLauncherTarget() {
  return join(REPO_ROOT, "bin", "agent-os");
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

function renderToolSkill(tool, source) {
  const contract = TOOL_CONTRACTS[tool.id];
  if (!contract) throw new Error(`missing portable tool contract for ${tool.id}`);
  const auth = tool.auth.join(", ");
  return `---\nname: ${tool.id}\ndescription: ${tool.purpose}\ninstall_source: ${source.kind}:${source.locator}\nsource_pin: ${source.pin}\n---\n\n# ${tool.id}\n\nThis managed template routes Agent OS to the upstream \`${tool.binary}\` binary after the user has deliberately installed it. Binary presence does not prove authentication.\n\n## Setup and configuration\n\nInstall only through the reviewed source plan. Configuration path: ${contract.root}. This is a placeholder for the new user's user-owned data root; authentication is never copied.\n\n## Tool-specific workflow\n\n${TOOL_DETAILS[tool.id]}\n\n## Data and authentication\n\n- Data root: ${contract.root}\n- Authentication: ${auth}\n- Credential rule: Never inspect, print, copy, or migrate credentials, sessions, archives, browser state, or private app state.\n\n## Preflight\n\n${contract.preflight.map((command) => `- \`${command}\``).join("\n")}\n\n## Freshness\n\n${tool.freshness}\n\n## Safe reads\n\n${contract.reads.map((command) => `- \`${command}\``).join("\n")}\n\n## Guarded writes\n\n${contract.writes.map((command) => `- ${command}`).join("\n")}\n\n${tool.safety}\n\n## Limitations\n\n${contract.limits}\n\n## Troubleshooting\n\n${contract.fix}\n`;
}

function managedRecord(previousState, path) {
  return previousState?.managed?.find((item) => item.path === path) ?? null;
}

async function classifyOperation(operation, previousState) {
  if (operation.kind === "symlink") {
    let currentTarget = null;
    let currentKind = null;
    try {
      const info = await lstat(operation.path);
      currentKind = info.isSymbolicLink() ? "symlink" : "other";
      if (currentKind === "symlink") currentTarget = await readlink(operation.path);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    const previous = managedRecord(previousState, operation.path);
    if (currentKind === "other" || (currentKind === "symlink" && !previous)) return { ...operation, status: "conflict", reason: "destination is not ledger-owned", currentTarget };
    if (currentKind === "symlink" && previous?.linkTarget !== currentTarget) return { ...operation, status: "conflict", reason: "managed symlink drifted", currentTarget };
    return { ...operation, status: currentTarget === operation.linkTarget ? "unchanged" : "create", currentTarget };
  }
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

function renderRegistry(tools) {
  return `${JSON.stringify({ version: 1, architecture: "agent-os-managed-local-tools", root: "tools", tools: tools.map((tool) => ({ id: tool.id, binary: tool.binary, skill: `tools/${tool.id}/SKILL.md`, data_root: TOOL_CONTRACTS[tool.id].root, auth: tool.auth, source: tool.source, removable: false })) }, null, 2)}\n`;
}

function renderAllowRules(tools) {
  return `${[...new Set(tools.map((tool) => tool.binary))].sort().map((binary) => `prefix_rule(pattern=["${binary}"], decision="allow")`).join("\n")}\n`;
}

async function buildPlan(context) {
  const operations = [];
  const block = await renderInstructionBlock(context);
  const tools = selectedTools(context);
  const sourceMap = byId(context.bundle.sources.sources);
  operations.push({ kind: "file", path: join(context.localToolsRoot, "registry.json"), content: renderRegistry(tools), id: "local-tools:registry" });
  const launcher = launcherPath(context);
  operations.push({ kind: "symlink", path: launcher, linkTarget: relative(dirname(launcher), canonicalLauncherTarget()), id: "agent-os:launcher" });
  for (const tool of tools) operations.push({ kind: "file", path: join(context.localToolsRoot, "tools", tool.id, "SKILL.md"), content: renderToolSkill(tool, sourceMap.get(tool.source)), id: `local-tools:tool:${tool.id}` });
  for (const host of context.hosts) {
    const hostHome = host.id === "codex" ? context.codexHome : context.claudeHome;
    operations.push({ kind: "managed-block", path: join(hostHome, host.instructionFile), block, id: `${host.id}:instructions` });

    for (const skill of selectedSkills(context)) {
      for (const file of await portableSkillFiles(skill)) {
        operations.push({ kind: "file", path: join(hostHome, host.skillDirectory, skill.id, file.relativePath), content: file.content, id: `${host.id}:skill:${skill.id}:${file.relativePath}` });
      }
    }
    for (const tool of tools) {
      const path = join(hostHome, host.skillDirectory, tool.id);
      operations.push({ kind: "symlink", path, linkTarget: relative(dirname(path), join(context.localToolsRoot, "tools", tool.id)), id: `${host.id}:tool-link:${tool.id}` });
    }
    for (const command of selectedCommands(context)) {
      const content = await readText(join(REPO_ROOT, command.path));
      const path = host.commandMode === "markdown" ? join(hostHome, host.commandDirectory, `${command.id}.md`) : join(hostHome, host.skillDirectory, command.id, "SKILL.md");
      operations.push({ kind: "file", path, content, id: `${host.id}:command:${command.id}` });
    }
    if (host.id === "codex" && tools.length) operations.push({ kind: "file", path: join(hostHome, "rules", "agent-os.rules"), content: renderAllowRules(tools), id: "codex:allow-rules" });
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
      else if (operation.kind === "symlink") managed.push({ id: operation.id, kind: operation.kind, path: operation.path, linkTarget: operation.linkTarget });
      else managed.push({ id: operation.id, kind: operation.kind, path: operation.path, hash: hash(operation.content) });
      continue;
    }
    if (operation.current != null) {
      const backup = backupTarget(context.stateDir, operation.path, timestamp);
      await atomicWrite(backup, operation.current);
    }
    if (operation.kind === "symlink") {
      await mkdir(dirname(operation.path), { recursive: true });
      await symlink(operation.linkTarget, operation.path);
    } else {
      await atomicWrite(operation.path, operation.next);
    }
    if (operation.kind === "managed-block") managed.push({ id: operation.id, kind: operation.kind, path: operation.path, blockHash: hash(operation.block) });
    else if (operation.kind === "symlink") managed.push({ id: operation.id, kind: operation.kind, path: operation.path, linkTarget: operation.linkTarget });
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
    let status = "ok";
    if (item.kind === "symlink") {
      try {
        const info = await lstat(item.path);
        status = !info.isSymbolicLink() ? "drift" : (await readlink(item.path)) === item.linkTarget ? "ok" : "drift";
      } catch (error) {
        if (error.code === "ENOENT") status = "missing";
        else throw error;
      }
    } else {
      const current = await readText(item.path, null);
      if (current === null) status = "missing";
      else if (item.kind === "managed-block") {
      const block = extractBlock(current);
      if (!block || hash(block.text) !== item.blockHash) status = "drift";
      } else if (hash(current) !== item.hash) status = "drift";
    }
    managed.push({ path: displayPath(context, item.path), status });
    if (status !== "ok") drift.push({ path: displayPath(context, item.path), status });
  }
  return { installed: true, managed, drift };
}

function cutoverStatePath(context) {
  return join(context.stateDir, "live-cutover-state.json");
}

function cutoverBackupPath(context) {
  return join(context.stateDir, "live-cutover", "AGENTS.md.original");
}

function cutoverPaths(context) {
  return {
    agents: join(context.codexHome, "AGENTS.md"),
    skills: join(context.codexHome, "skills"),
  };
}

function canonicalCommandTarget(id) {
  return join(REPO_ROOT, "commands", id);
}

function normalManagedLauncher(context) {
  const path = launcherPath(context);
  return context.previousState?.managed?.find((item) => item.kind === "symlink" && item.path === path) ?? null;
}

async function readCutoverState(context) {
  try {
    return await readJson(cutoverStatePath(context));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function inspectCutoverLink(path) {
  try {
    const info = await lstat(path);
    if (!info.isSymbolicLink()) return { kind: info.isDirectory() ? "directory" : "file", rawTarget: null, resolvedTarget: null };
    const rawTarget = await readlink(path);
    try {
      return { kind: "symlink", rawTarget, resolvedTarget: await realpath(path) };
    } catch (error) {
      if (error.code === "ENOENT") return { kind: "broken-symlink", rawTarget, resolvedTarget: null };
      throw error;
    }
  } catch (error) {
    if (error.code === "ENOENT") return { kind: "missing", rawTarget: null, resolvedTarget: null };
    throw error;
  }
}

function exactGuidancePlan(content) {
  if (content === null) return { status: "conflict", reason: "Codex AGENTS.md is missing", original: null, next: null };
  const legacyCount = content.split(LEGACY_GUIDANCE).length - 1;
  const targetCount = content.split(CUTOVER_GUIDANCE).length - 1;
  if (legacyCount === 1 && targetCount === 0) return { status: "replace-guidance", reason: null, original: content, next: content.replace(LEGACY_GUIDANCE, CUTOVER_GUIDANCE) };
  if (legacyCount === 0 && targetCount === 1) return { status: "already-cut-over", reason: null, original: content, next: content };
  return { status: "conflict", reason: "Codex AGENTS.md does not contain exactly one recognized cutover guidance sentence", original: content, next: null };
}

async function inspectAppliedCutover(context, state) {
  const paths = cutoverPaths(context);
  const links = {};
  const drift = [];
  for (const id of LIVE_CUTOVER_COMMAND_IDS) {
    const current = await inspectCutoverLink(join(paths.skills, id));
    const expected = state?.links?.[id];
    const canonical = canonicalCommandTarget(id);
    const matches = current.kind === "symlink" && expected && current.rawTarget === expected.appliedTarget && current.resolvedTarget === canonical;
    links[id] = matches ? "managed" : current.kind;
    if (!matches) drift.push(`command:${id}`);
  }
  const launcher = await inspectCutoverLink(launcherPath(context));
  const expectedLauncher = state?.launcher;
  const launcherMatches = launcher.kind === "symlink" && expectedLauncher && launcher.rawTarget === expectedLauncher.appliedTarget && launcher.resolvedTarget === canonicalLauncherTarget();
  if (!launcherMatches) drift.push("launcher");
  const guidance = await readText(paths.agents, null);
  const guidanceMatches = Boolean(state?.guidance?.appliedHash) && guidance !== null && hash(guidance) === state.guidance.appliedHash;
  if (!guidanceMatches) drift.push("guidance");
  return { links, launcher: launcherMatches ? (expectedLauncher.created ? "managed" : "preserved-managed") : launcher.kind, guidance: guidanceMatches ? "managed" : guidance === null ? "missing" : "drifted", drift };
}

async function liveCutoverPlan(context) {
  const state = await readCutoverState(context);
  const paths = cutoverPaths(context);
  if (state?.status === "applied") {
    const applied = await inspectAppliedCutover(context, state);
    return {
      action: "live-cutover",
      apply: Boolean(context.options.apply),
      mode: applied.drift.length ? "drift" : "already-applied",
      operations: LIVE_CUTOVER_COMMAND_IDS.map((id) => ({ path: displayPath(context, join(paths.skills, id)), status: applied.links[id], reason: null })).concat([{ path: displayPath(context, launcherPath(context)), status: applied.launcher, reason: null }, { path: displayPath(context, paths.agents), status: applied.guidance, reason: null }]),
      conflicts: applied.drift.map((item) => `managed ${item} drifted`),
      state,
      guidance: null,
    };
  }
  if (state && state.status !== "rolled-back") {
    return { action: "live-cutover", apply: Boolean(context.options.apply), mode: "unknown-state", operations: [], conflicts: ["existing live-cutover state is incomplete or unrecognized"], state, guidance: null };
  }

  const guidance = exactGuidancePlan(await readText(paths.agents, null));
  const operations = [];
  const conflicts = [];
  let legacyRoot = null;
  if (context.options["legacy-root"]) {
    try {
      legacyRoot = await realpath(resolve(context.options["legacy-root"]));
    } catch {
      conflicts.push("legacy root is not resolvable");
    }
  } else if (context.options.apply) {
    conflicts.push("live-cutover --apply requires --legacy-root for the first apply");
  }
  for (const id of LEGACY_COMMAND_IDS) {
    const path = join(paths.skills, id);
    const current = await inspectCutoverLink(path);
    const expectedLegacy = legacyRoot ? join(legacyRoot, "commands", id) : null;
    const adoptable = current.kind === "symlink" && expectedLegacy !== null && current.resolvedTarget === expectedLegacy;
    operations.push({ path: displayPath(context, path), status: adoptable ? "adopt-legacy-link" : current.kind, reason: adoptable ? null : "must be a symlink resolving exactly to the declared legacy command" , current });
    if (!adoptable) conflicts.push(`command:${id} is not an adoptable legacy symlink`);
  }
  const teachPath = join(paths.skills, "teach");
  const teach = await inspectCutoverLink(teachPath);
  operations.push({ path: displayPath(context, teachPath), status: teach.kind === "missing" ? "create-link" : teach.kind, reason: teach.kind === "missing" ? null : "teach must be absent before first cutover", current: teach });
  if (teach.kind !== "missing") conflicts.push("command:teach must be absent before first cutover");
  const launcher = await inspectCutoverLink(launcherPath(context));
  const normalLauncher = normalManagedLauncher(context);
  const launcherManagedByNormalLifecycle = launcher.kind === "symlink" && normalLauncher && launcher.rawTarget === normalLauncher.linkTarget && launcher.resolvedTarget === canonicalLauncherTarget();
  const launcherCreatable = launcher.kind === "missing";
  operations.push({ path: displayPath(context, launcherPath(context)), status: launcherCreatable ? "create-launcher" : launcherManagedByNormalLifecycle ? "preserve-managed-launcher" : launcher.kind, reason: launcherCreatable || launcherManagedByNormalLifecycle ? null : "launcher must be absent or managed by the Agent OS lifecycle", current: launcher });
  if (!launcherCreatable && !launcherManagedByNormalLifecycle) conflicts.push("launcher is not absent or known Agent OS-managed state");
  operations.push({ path: displayPath(context, paths.agents), status: guidance.status, reason: guidance.reason });
  if (guidance.status === "conflict") conflicts.push(`guidance: ${guidance.reason}`);
  if (!state && guidance.status === "already-cut-over") conflicts.push("guidance is already replaced but no live-cutover state exists");
  return { action: "live-cutover", apply: Boolean(context.options.apply), mode: "first-apply", operations, conflicts, state, guidance, legacyRoot };
}

async function replaceSymlink(path, target) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = join(dirname(path), `.${Date.now()}-${process.pid}.agent-os-link`);
  await symlink(target, temporary);
  await rename(temporary, path);
}

async function applyLiveCutover(context, plan) {
  if (plan.mode === "already-applied") return;
  if (plan.conflicts.length) throw new Error(`refusing live cutover with ${plan.conflicts.length} conflict(s): ${plan.conflicts.join("; ")}`);
  if (!context.options["legacy-root"]) throw new Error("live-cutover --apply requires --legacy-root for the first apply");
  const paths = cutoverPaths(context);
  const links = {};
  for (const id of LEGACY_COMMAND_IDS) {
    const current = plan.operations.find((item) => item.path === displayPath(context, join(paths.skills, id))).current;
    links[id] = { originalTarget: current.rawTarget, originalResolvedTarget: current.resolvedTarget, appliedTarget: canonicalCommandTarget(id), appliedResolvedTarget: canonicalCommandTarget(id) };
  }
  links.teach = { originalTarget: null, originalResolvedTarget: null, appliedTarget: canonicalCommandTarget("teach"), appliedResolvedTarget: canonicalCommandTarget("teach") };
  const launcherOperation = plan.operations.find((item) => item.path === displayPath(context, launcherPath(context)));
  const launcher = launcherOperation.current;
  const pending = {
    version: 1,
    status: "pending",
    appliedAt: null,
    links,
    launcher: {
      originalTarget: launcher.rawTarget,
      originalResolvedTarget: launcher.resolvedTarget,
      appliedTarget: launcher.kind === "missing" ? canonicalLauncherTarget() : launcher.rawTarget,
      appliedResolvedTarget: canonicalLauncherTarget(),
      created: launcher.kind === "missing",
    },
    guidance: {
      backup: relative(context.stateDir, cutoverBackupPath(context)),
      originalHash: hash(plan.guidance.original),
      appliedHash: hash(plan.guidance.next),
    },
  };
  await atomicWrite(cutoverBackupPath(context), plan.guidance.original);
  await atomicWrite(cutoverStatePath(context), `${JSON.stringify(pending, null, 2)}\n`);
  for (const id of LIVE_CUTOVER_COMMAND_IDS) await replaceSymlink(join(paths.skills, id), canonicalCommandTarget(id));
  if (pending.launcher.created) await replaceSymlink(launcherPath(context), canonicalLauncherTarget());
  await atomicWrite(paths.agents, plan.guidance.next);
  const state = { ...pending, status: "applied", appliedAt: new Date().toISOString() };
  await atomicWrite(cutoverStatePath(context), `${JSON.stringify(state, null, 2)}\n`);
}

async function liveRollbackPlan(context) {
  const state = await readCutoverState(context);
  const paths = cutoverPaths(context);
  if (!state || state.status === "rolled-back") return { action: "live-rollback", apply: Boolean(context.options.apply), mode: "not-applied", operations: [], conflicts: [], state: state ?? null, guidance: null };
  if (state.status === "pending") return pendingRollbackPlan(context, state);
  if (state.status !== "applied") return { action: "live-rollback", apply: Boolean(context.options.apply), mode: "unknown-state", operations: [], conflicts: ["live-cutover state is incomplete or unrecognized"], state, guidance: null };
  const applied = await inspectAppliedCutover(context, state);
  const backup = await readText(cutoverBackupPath(context), null);
  const conflicts = [...applied.drift];
  if (backup === null || hash(backup) !== state.guidance.originalHash) conflicts.push("guidance-backup");
  const operations = LEGACY_COMMAND_IDS.map((id) => ({ path: displayPath(context, join(paths.skills, id)), status: applied.links[id] === "managed" ? "restore-link" : "conflict", reason: applied.links[id] === "managed" ? null : "managed command drifted" }));
  operations.push({ path: displayPath(context, join(paths.skills, "teach")), status: applied.links.teach === "managed" ? "remove-link" : "conflict", reason: applied.links.teach === "managed" ? null : "managed command drifted" });
  operations.push({ path: displayPath(context, launcherPath(context)), status: applied.launcher === "managed" || applied.launcher === "preserved-managed" ? state.launcher.created ? "remove-launcher" : "preserve-launcher" : "conflict", reason: applied.launcher === "managed" || applied.launcher === "preserved-managed" ? null : "managed launcher drifted" });
  operations.push({ path: displayPath(context, paths.agents), status: applied.guidance === "managed" && !conflicts.includes("guidance-backup") ? "restore-guidance" : "conflict", reason: applied.guidance === "managed" ? (conflicts.includes("guidance-backup") ? "original guidance backup drifted" : null) : "managed guidance drifted" });
  return { action: "live-rollback", apply: Boolean(context.options.apply), mode: "applied", operations, conflicts, state, guidance: backup };
}

function matchesRecordedLink(current, record, canonical) {
  const original = record.originalTarget === null
    ? current.kind === "missing"
    : current.kind === "symlink" && current.rawTarget === record.originalTarget && current.resolvedTarget === record.originalResolvedTarget;
  const applied = current.kind === "symlink" && current.rawTarget === record.appliedTarget && current.resolvedTarget === canonical;
  return { original, applied };
}

async function pendingRollbackPlan(context, state) {
  const paths = cutoverPaths(context);
  const backup = await readText(cutoverBackupPath(context), null);
  const conflicts = [];
  if (!state.links || !state.launcher || !state.guidance || backup === null || hash(backup ?? "") !== state.guidance?.originalHash) conflicts.push("cutover-state-or-guidance-backup");
  const restore = { links: {}, launcher: null, guidance: null };
  const operations = [];
  for (const id of LIVE_CUTOVER_COMMAND_IDS) {
    const record = state.links?.[id];
    const current = await inspectCutoverLink(join(paths.skills, id));
    if (!record) {
      conflicts.push(`command:${id}:missing-state`);
      operations.push({ path: displayPath(context, join(paths.skills, id)), status: "conflict", reason: "missing recorded target" });
      continue;
    }
    const match = matchesRecordedLink(current, record, canonicalCommandTarget(id));
    if (!match.original && !match.applied) {
      conflicts.push(`command:${id}:unknown-drift`);
      operations.push({ path: displayPath(context, join(paths.skills, id)), status: "conflict", reason: "current target is neither recorded original nor canonical applied target" });
      continue;
    }
    restore.links[id] = match.applied;
    operations.push({ path: displayPath(context, join(paths.skills, id)), status: match.applied ? (id === "teach" ? "remove-link" : "restore-link") : "already-original", reason: null });
  }
  const launcherCurrent = await inspectCutoverLink(launcherPath(context));
  const launcherMatch = state.launcher ? matchesRecordedLink(launcherCurrent, state.launcher, canonicalLauncherTarget()) : { original: false, applied: false };
  if (!launcherMatch.original && !launcherMatch.applied) {
    conflicts.push("launcher:unknown-drift");
    operations.push({ path: displayPath(context, launcherPath(context)), status: "conflict", reason: "current target is neither recorded original nor canonical applied target" });
  } else {
    restore.launcher = launcherMatch.applied;
    operations.push({ path: displayPath(context, launcherPath(context)), status: launcherMatch.applied && state.launcher.created ? "remove-launcher" : launcherMatch.applied ? "restore-launcher" : "already-original", reason: null });
  }
  const guidance = await readText(paths.agents, null);
  const guidanceOriginal = guidance !== null && state.guidance && hash(guidance) === state.guidance.originalHash;
  const guidanceApplied = guidance !== null && state.guidance && hash(guidance) === state.guidance.appliedHash;
  if (!guidanceOriginal && !guidanceApplied) {
    conflicts.push("guidance:unknown-drift");
    operations.push({ path: displayPath(context, paths.agents), status: "conflict", reason: "guidance is neither recorded original nor recorded applied content" });
  } else {
    restore.guidance = guidanceApplied;
    operations.push({ path: displayPath(context, paths.agents), status: guidanceApplied ? "restore-guidance" : "already-original", reason: null });
  }
  return { action: "live-rollback", apply: Boolean(context.options.apply), mode: "pending", operations, conflicts, state, guidance: backup, restore };
}

async function applyLiveRollback(context, plan) {
  if (plan.mode === "not-applied") return;
  if (plan.conflicts.length) throw new Error(`refusing live rollback with ${plan.conflicts.length} conflict(s): ${plan.conflicts.join("; ")}`);
  const paths = cutoverPaths(context);
  if (plan.mode === "pending") {
    for (const id of LEGACY_COMMAND_IDS) if (plan.restore.links[id]) await replaceSymlink(join(paths.skills, id), plan.state.links[id].originalTarget);
    if (plan.restore.links.teach) await rm(join(paths.skills, "teach"), { force: true });
    if (plan.restore.launcher) {
      if (plan.state.launcher.originalTarget === null) await rm(launcherPath(context), { force: true });
      else await replaceSymlink(launcherPath(context), plan.state.launcher.originalTarget);
    }
    if (plan.restore.guidance) await atomicWrite(paths.agents, plan.guidance);
    const pendingState = { ...plan.state, status: "rolled-back", rolledBackAt: new Date().toISOString() };
    await atomicWrite(cutoverStatePath(context), `${JSON.stringify(pendingState, null, 2)}\n`);
    return;
  }
  for (const id of LEGACY_COMMAND_IDS) await replaceSymlink(join(paths.skills, id), plan.state.links[id].originalTarget);
  await rm(join(paths.skills, "teach"), { force: true });
  if (plan.state.launcher.created) await rm(launcherPath(context), { force: true });
  await atomicWrite(paths.agents, plan.guidance);
  const state = { ...plan.state, status: "rolled-back", rolledBackAt: new Date().toISOString() };
  await atomicWrite(cutoverStatePath(context), `${JSON.stringify(state, null, 2)}\n`);
}

async function liveCutoverStatus(context) {
  const state = await readCutoverState(context);
  if (!state) return { status: "not-applied", commands: {}, guidance: "not-managed" };
  if (state.status === "rolled-back") return { status: "rolled-back", commands: {}, guidance: "restored" };
  if (state.status !== "applied") return { status: "unknown-state", commands: {}, guidance: "unknown" };
  const applied = await inspectAppliedCutover(context, state);
  return { status: applied.drift.length ? "drift" : "applied", commands: applied.links, launcher: applied.launcher, guidance: applied.guidance, drift: applied.drift };
}

async function directoryNames(path) {
  try {
    return (await readdir(path, { withFileTypes: true })).map((entry) => entry.name).filter((name) => !name.startsWith(".")).sort();
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function statusReport(context, catalogue = false) {
  const health = await stateHealth(context);
  const liveCutover = await liveCutoverStatus(context);
  const tools = [];
  const requirements = context.bundle.secrets.requirements;
  for (const tool of selectedTools(context)) {
    const available = Boolean(await binaryAvailable(tool.binary));
    const toolRequirements = requirements.filter((item) => item.tool === tool.id && item.class === "agent-vault");
    const vaultReady = !toolRequirements.length || await exists(join(context.vaultDir, "tools", `${tool.id}.sops.yaml`));
    const permissionNeeded = tool.auth.includes("macos-permission");
    const authNeeded = tool.auth.some((item) => ["human-login", "browser-session", "telecom-consent"].includes(item));
    const nextAction = !available ? `Review and preview: agent-os install --tools ${tool.id}`
      : !vaultReady ? `Initialize/fill the vault requirement for ${tool.id}`
      : permissionNeeded ? "Grant the required macOS permission manually, then rerun doctor"
      : authNeeded ? "Complete the tool's supported interactive login manually"
      : "Ready for the documented preflight";
    tools.push({ id: tool.id, binary: tool.binary, cli: available ? "available" : "absent", vault: vaultReady ? "not-required-or-present" : "missing-requirement", auth: authNeeded ? "unauthenticated-human-checkpoint" : "not-required", permission: permissionNeeded ? "missing-macos-permission" : "not-required", disposition: tool.disposition, nextAction });
  }
  const registryPath = join(context.localToolsRoot, "registry.json");
  let tmpClean = true;
  try { tmpClean = (await readdir(join(context.vaultDir, "tmp"))).length === 0; } catch (error) { if (error.code !== "ENOENT") throw error; }
  const report = {
    installed: health.installed,
    profile: context.profile.id,
    packs: context.packs.map((item) => item.id),
    hosts: context.hosts.map((item) => item.id),
    drift: health.drift,
    registry: { path: displayPath(context, registryPath), status: await exists(registryPath) ? "present" : "absent" },
    vault: { path: displayPath(context, context.vaultDir), config: await exists(join(context.vaultDir, ".sops.yaml")) ? "present" : "absent", tmpClean },
    liveCutover,
    tools,
  };
  if (catalogue) {
    report.commands = context.bundle.commands.commands.map(({ id, disposition, selectedByDefault, purpose }) => ({ id, disposition, selectedByDefault, purpose }));
    report.workflows = context.bundle.packs.packs.map(({ id, description }) => ({ id, description }));
    report.skills = context.bundle.skills.skills;
    report.hostSkills = {
      codex: await directoryNames(join(context.codexHome, "skills")),
      "claude-code": await directoryNames(join(context.claudeHome, "skills")),
    };
    report.automations = [...new Set([...(await directoryNames(join(context.stateDir, "automations"))), ...(await directoryNames(join(context.codexHome, "automations"))), ...(await directoryNames(join(context.claudeHome, "automations")))])].sort();
    report.plugins = [...new Set([...(await directoryNames(join(context.codexHome, "plugins"))), ...(await directoryNames(join(context.claudeHome, "plugins")))])].sort();
    report.classifiedCatalogue = [
      ...report.commands.map((item) => ({ group: "personal-slash-commands", id: item.id, description: item.purpose, source: "manifest/commands.json" })),
      ...report.workflows.map((item) => ({ group: "workflows", id: item.id, description: item.description, source: "manifest/packs.json" })),
      ...report.automations.map((id) => ({ group: "active-automations", id, description: "directory entry", source: "host/state automations directory" })),
      ...tools.map((item) => ({ group: "local-tools", id: item.id, description: item.binary, source: "managed local-tools registry" })),
      ...report.plugins.map((id) => ({ group: "plugins", id, description: "directory entry", source: "host plugins directory" })),
      ...report.skills.map((item) => ({ group: "standalone-skills", id: item.id, description: item.description, source: "manifest/skills.json" })),
    ];
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
    { id: "live-cutover", ok: status.liveCutover.status !== "drift" && status.liveCutover.status !== "unknown-state", detail: status.liveCutover.status },
  ];
  return {
    ok: coreChecks.every((item) => item.ok),
    coreChecks,
    warnings: validation.warnings,
    optionalTools: status.tools,
    nextActions: [
      status.installed ? "Run agent-os status --json and follow each selected tool's nextAction." : "Run agent-os setup --safe to review the core-only plan.",
      "Use agent-os install --tools <id> for a reviewed installation plan; it is preview-only unless explicitly confirmed.",
      "Use agent-os vault init for an independent SOPS + age vault preview, then complete logins and macOS permissions manually.",
      "Use agent-os live-cutover --legacy-root <legacy-root> to preview the separate Codex command cutover.",
    ],
  };
}

function requestedTools(context) {
  const ids = splitList(context.options.tools);
  if (!ids) return selectedTools(context);
  const toolMap = byId(context.bundle.tools.tools);
  return ids.map((id) => {
    const tool = toolMap.get(id);
    if (!tool) throw new Error(`unknown tool: ${id}`);
    return tool;
  });
}

function installCommand(source) {
  if (source.pin === "manual-unresolved") return null;
  if (source.kind === "homebrew") return { command: "brew", args: ["install", source.locator] };
  if (source.kind === "npm") return { command: "npm", args: ["install", "--global", `${source.locator}@${source.pin}`] };
  if (source.kind === "python-package") return { command: "uv", args: ["tool", "install", `${source.locator}==${source.pin.replace(/-audited$/, "")}`] };
  if (source.kind === "git" && /^https:\/\//.test(source.locator)) return { command: "git", args: ["clone", "--depth", "1", source.locator, `<choose-destination-for-${source.id}>`] };
  return null;
}

function installPlan(context) {
  const sourceMap = byId(context.bundle.sources.sources);
  return requestedTools(context).map((tool) => {
    const source = sourceMap.get(tool.source);
    const command = installCommand(source);
    return { id: tool.id, source: source.id, pin: source.pin, status: command ? "review-required" : "manual-required", command: command ? [command.command, ...command.args].join(" ") : null, reason: command ? "Run only with --apply --reviewed-install after verifying current upstream provenance and license." : "This source is unresolved or unsupported; installation remains a human checkpoint." };
  });
}

function runChecked(command, args, label) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${label}: ${result.stderr?.trim() || `exit ${result.status}`}`);
  return result.stdout;
}

function vaultTools(context) {
  const wanted = new Set(requestedTools(context).map((tool) => tool.id));
  return context.bundle.secrets.requirements.filter((item) => wanted.has(item.tool) && item.class === "agent-vault");
}

async function vaultPlan(context) {
  const requirements = vaultTools(context);
  return {
    vault: displayPath(context, context.vaultDir),
    apply: Boolean(context.options.apply),
    safe: Boolean(context.options.safe),
    requirements: requirements.map((item) => ({ tool: item.tool, names: item.names, inventory: displayPath(context, join(context.vaultDir, "tools", `${item.tool}.sops.yaml`)), env: displayPath(context, join(context.vaultDir, "tools", `${item.tool}.sops.env`)) })),
    operations: ["Create a new independent SOPS configuration and age recipient.", "Create encrypted non-secret inventory and env placeholders.", "Keep temporary plaintext in the vault tmp directory only for the encryption process, then remove it."],
    humanCheckpoint: "Do not enter real values until reviewing the generated encrypted records in the new user's vault.",
  };
}

async function encryptPlaceholder(context, recipient, target, content) {
  const tmpDir = join(context.vaultDir, "tmp");
  await mkdir(tmpDir, { recursive: true });
  const input = join(tmpDir, `${Date.now()}-${process.pid}.placeholder`);
  try {
    await atomicWrite(input, content);
    runChecked("sops", ["--encrypt", "--age", recipient, "--output", target, input], `encrypt ${target}`);
  } finally {
    await rm(input, { force: true });
  }
}

async function applyVaultInit(context) {
  if (context.options.safe) throw new Error("--safe never executes SOPS or age; run vault init without --safe after reviewing the preview");
  let recipient = context.options["age-recipient"];
  if (!recipient && !context.options["generate-age-key"]) throw new Error("vault init --apply requires --age-recipient or --generate-age-key");
  if (!recipient) {
    const keyPath = join(context.vaultDir, "age", "keys.txt");
    await mkdir(dirname(keyPath), { recursive: true });
    const output = runChecked("age-keygen", ["-o", keyPath], "generate an age key");
    await chmod(keyPath, 0o600);
    recipient = output.match(/age1[0-9a-z]+/)?.[0];
    if (!recipient) throw new Error("age-keygen did not return a public recipient");
  }
  await mkdir(join(context.vaultDir, "tools"), { recursive: true });
  await atomicWrite(join(context.vaultDir, ".sops.yaml"), `creation_rules:\n  - path_regex: ^tools/.*\\.sops\\.(yaml|env)$\n    age: ${recipient}\n`);
  for (const requirement of vaultTools(context)) {
    const inventory = `tool: ${requirement.tool}\naccess_class: agent-vault\nvariables:\n${requirement.names.map((name) => `  ${name}: __SET_LOCALLY_WITH_SOPS__`).join("\n")}\n`;
    const env = `${requirement.names.map((name) => `${name}=__SET_LOCALLY_WITH_SOPS__`).join("\n")}\n`;
    await encryptPlaceholder(context, recipient, join(context.vaultDir, "tools", `${requirement.tool}.sops.yaml`), inventory);
    await encryptPlaceholder(context, recipient, join(context.vaultDir, "tools", `${requirement.tool}.sops.env`), env);
  }
  const leftovers = await readdir(join(context.vaultDir, "tmp"));
  if (leftovers.length) throw new Error("vault tmp cleanliness check failed");
}

async function vaultValidate(context, verifyCrypto = false) {
  const requirements = vaultTools(context);
  const results = [];
  for (const item of requirements) {
    const inventory = join(context.vaultDir, "tools", `${item.tool}.sops.yaml`);
    const env = join(context.vaultDir, "tools", `${item.tool}.sops.env`);
    const inventoryEncrypted = await readText(inventory, "").then((content) => /(^|\n)sops:/.test(content));
    const envEncrypted = await readText(env, "").then((content) => /(^|\n)sops:/.test(content));
    let crypto = "not-requested";
    if (verifyCrypto && await exists(inventory)) {
      if (context.options.safe) throw new Error("--safe never decrypts vault records");
      runChecked("sops", ["--decrypt", "--output", "/dev/null", inventory], `validate ${item.tool} inventory`);
      runChecked("sops", ["--decrypt", "--output", "/dev/null", env], `validate ${item.tool} env`);
      crypto = "verified-without-printing";
    }
    results.push({ tool: item.tool, inventory: inventoryEncrypted ? "encrypted" : await exists(inventory) ? "not-sops" : "missing", env: envEncrypted ? "encrypted" : await exists(env) ? "not-sops" : "missing", crypto });
  }
  const tmpDir = join(context.vaultDir, "tmp");
  let tmpClean = true;
  try { tmpClean = (await readdir(tmpDir)).length === 0; } catch (error) { if (error.code !== "ENOENT") throw error; }
  return { ok: await exists(join(context.vaultDir, ".sops.yaml")) && tmpClean && results.every((item) => item.inventory === "encrypted" && item.env === "encrypted"), vault: displayPath(context, context.vaultDir), tmpClean, requirements: results };
}

async function uninstallPlan(context) {
  if (!context.previousState) return [];
  const operations = [];
  for (const item of context.previousState.managed ?? []) {
    if (item.kind === "symlink") {
      try {
        const info = await lstat(item.path);
        if (!info.isSymbolicLink() || (await readlink(item.path)) !== item.linkTarget) operations.push({ ...item, status: "conflict", reason: "managed symlink drifted" });
        else operations.push({ ...item, status: "remove-symlink" });
      } catch (error) {
        if (error.code === "ENOENT") operations.push({ ...item, status: "already-missing" });
        else throw error;
      }
      continue;
    }
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
    if (operation.status === "remove-symlink") {
      await rm(operation.path, { force: true });
      continue;
    }
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
    if (object.profile) {
      console.log(`Profile: ${object.profile}`);
      console.log(`Packs: ${object.packs.join(", ")}`);
      console.log(`Hosts: ${object.hosts.join(", ")}`);
    }
    for (const operation of object.operations) console.log(`${operation.status.padEnd(10)} ${operation.path}${operation.reason ? ` — ${operation.reason}` : ""}`);
    for (const conflict of object.conflicts ?? []) console.log(`conflict   ${conflict}`);
    console.log(object.apply ? "Apply requested." : "Preview only; no files changed.");
    return;
  }
  console.log(JSON.stringify(object, null, 2));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const command = options._[0] ?? "help";
  if (["help", "--help", "-h"].includes(command)) {
    console.log("Usage: agent-os <setup|install|vault|status|doctor|update|safe-uninstall|live-cutover|live-rollback|validate> [--profile ID] [--packs a,b] [--tools a,b] [--hosts codex,claude-code] [--home PATH] [--legacy-root PATH] [--safe] [--apply] [--json]");
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

  const preferState = ["status", "doctor", "update", "safe-uninstall", "uninstall", "live-cutover", "live-rollback"].includes(command);
  const context = await resolveContext(bundle, options, preferState);

  if (command === "install") {
    const plan = { apply: Boolean(options.apply), reviewedInstall: Boolean(options["reviewed-install"]), safe: Boolean(options.safe), installs: installPlan(context) };
    if (options.apply) {
      if (options.safe) throw new Error("--safe forbids installation; use the reviewed install flow without --safe after reviewing its plan");
      if (!options["reviewed-install"]) throw new Error("install --apply requires --reviewed-install");
      for (const item of plan.installs) {
        if (item.status !== "review-required") throw new Error(`${item.id} cannot be installed automatically: ${item.reason}`);
        const source = byId(bundle.sources.sources).get(bundle.tools.tools.find((tool) => tool.id === item.id).source);
        const install = installCommand(source);
        runChecked(install.command, install.args, `install ${item.id}`);
      }
    }
    options.json ? console.log(JSON.stringify(plan)) : printHuman(plan);
    return;
  }

  if (command === "vault") {
    const subcommand = options._[1] ?? "help";
    if (subcommand === "init") {
      const plan = await vaultPlan(context);
      if (options.apply) await applyVaultInit(context);
      options.json ? console.log(JSON.stringify(plan)) : printHuman(plan);
      return;
    }
    if (subcommand === "validate") {
      const report = await vaultValidate(context, Boolean(options["verify-crypto"]));
      options.json ? console.log(JSON.stringify(report)) : printHuman(report);
      if (!report.ok) process.exitCode = 1;
      return;
    }
    throw new Error("Usage: agent-os vault <init|validate> [--tools a,b] [--age-recipient age1…] [--generate-age-key] [--apply]");
  }

  if (command === "setup" || command === "update") {
    const plan = await buildPlan(context);
    const summary = planSummary(context, plan);
    if (options.apply) await applyPlan(context, plan);
    options.json ? console.log(JSON.stringify(summary)) : printHuman(summary);
    return;
  }
  if (command === "live-cutover") {
    const plan = await liveCutoverPlan(context);
    const summary = { apply: Boolean(options.apply), mode: plan.mode, operations: plan.operations.map(({ path, status, reason }) => ({ path, status, reason: reason ?? null })), conflicts: plan.conflicts };
    if (options.apply) await applyLiveCutover(context, plan);
    options.json ? console.log(JSON.stringify(summary)) : printHuman(summary);
    return;
  }
  if (command === "live-rollback") {
    const plan = await liveRollbackPlan(context);
    const summary = { apply: Boolean(options.apply), mode: plan.mode, operations: plan.operations.map(({ path, status, reason }) => ({ path, status, reason: reason ?? null })), conflicts: plan.conflicts };
    if (options.apply) await applyLiveRollback(context, plan);
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
