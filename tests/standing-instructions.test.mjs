import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const normalize = (text) => text.replace(/\s+/g, " ").toLowerCase();

// These obligations come from the pre-consolidation owner instructions, rather
// than a snapshot of the replacement prose. They check that guidance survives;
// they cannot establish that a language model will obey it in every execution.
const SCENARIOS = [
  ["eligible implementation assigns testing before suite expansion", "core", [
    /before writing or substantially expanding the suite/,
    /actually dispatch one bounded worker/,
    /independent(?:ly)? (?:contract assertions|contract-derived assertions)/,
    /having already started tests is not an exception/,
  ]],
  ["routine work and explicit constraints do not force a testing team", "core", [
    /routine label\/config changes or one ordinary regression test/,
    /explicit single-agent\/no-delegation constraint/,
    /unavailable agents/,
    /assigned testing worker.*without spawning more workers/,
  ]],
  ["repository completion honors the intended default branch and explicit limits", "core", [
    /merging into the repository's default branch and pushing that branch are mandatory completion steps/,
    /apply `trunk-finish` automatically after verification/,
    /honor explicit draft, pr-only, local-only, or no-push requests/,
    /never bypass protections, force-push, or include unrelated work/,
    /read-only and exploratory tasks do not require commits or merges/,
  ]],
  ["modifying a reusable command requires a visible HUD entry", "core", [
    /awareness hud \*\*commands\*\* page/,
    /name, purpose, invocation, source path, and current status/,
    /refresh the page and verify that the entry is visible/,
    /leave the task incomplete/,
  ]],
  ["a goal does not silently create an orchestration team or new chats", "orchestration", [
    /persistent, thread-scoped objective/,
    /does not by itself require orchestration/,
    /use one executor by default/,
    /worker output is evidence.*not a replacement goal/,
    /do not create user-visible tasks merely to split a goal/,
    /isolated write scope/,
  ]],
  ["supervisor activation requires actual human consent", "orchestration", [
    /actual human reply explicitly approves creating and messaging separate worker chats/,
    /preselection, silence and question-delivery acknowledgment do not count/,
    /do not repeat a declined offer/,
  ]],
  ["supervisor completion follows independent audit and deliberate stops", "orchestration", [
    /independent final auditor.*after any correction\/re-audit loop/,
    /do not configure cycle, time or token budgets unless requested/,
    /preserve deliberate pauses/,
    /reconcile uncertain launches before retrying/,
    /propagate human stops to active workers/,
    /preserve exactly one prefix/,
  ]],
  ["supervisor shared changes need concrete approval before dispatch", "orchestration", [
    /explicit approval of the concrete target\/action before system-wide or user-global/,
    /check before dispatch and execution/,
    /human rejection or deliberate human cancellation does not authorize another route/,
    /cannot retroactively authorize changes/,
  ]],
  ["external writes need exact authority and verification", "external-actions", [
    /exact target and content\/action/,
    /do not infer authority for a materially different action/,
    /verify through the same system/,
    /never use a broad home directory, filesystem root, unresolved variable, or expansive glob/,
  ]],
  ["local autonomy preserves the supervisor exception", "all", [
    /(?:overrides|override).*skill-specific (?:local checkpoints|approval)/,
    /supervisor authority boundary/,
    /(?:ordinary|normal) project-local.*autonomous/,
  ]],
  ["memory remains disabled after removing the duplicate wrapper", "all", [
    /memory.*disabled/,
    /do not create, read,.*(?:rely on|summarize into).*`memory\.md`/,
  ]],
  ["temporary unblock requests and indirect routes still fail", "focus", [
    /tiktok.*spotify.*(?:preserve existing blocks|refuse requests)/,
    /refuse requests to unblock, bypass, weaken/,
    /(?:do not enable the instagram website|instagram website \| blocked)/,
    /(?:do not enable spotify's website or service endpoints|spotify website and service endpoints remain blocked)/,
    /hosts files, dns, vpn, firewall/,
    /i can't help lift that block\. i can verify or restore the block instead\./,
  ]],
  ["focus cleanup preserves allowed exceptions and recovery", "focus", [
    /youtube.*allowed/,
    /facebook.*allowed/,
    /instagram.*(?:agent-owned|agent).*cli/,
    /(?:verifying|verify), (?:restoring|restore),? or (?:strengthening|strengthen)/,
  ]],
  ["credentials use existing vault records before replacement or chat", "all", [
    /`agent-secrets`/,
    /(?:check|look up).*existing.*(?:vault|encrypted).*(?:before|first)/,
    /never (?:ask for|request).*secrets.*chat|never request credentials.*chat/,
    /preserve existing (?:secrets|values).*unless replacement is explicitly requested/,
  ]],
  ["service onboarding inventories credentials without leaking them", "all", [
    /(?:adding|add).*first (?:using|use).*same task|same task.*(?:adding|add).*first (?:using|use)/,
    /agent-vs-human access classification/,
    /(?:temporary directory|tmp).*empty|empty.*(?:temporary directory|tmp)/,
    /never (?:print|copy).*decrypted/,
  ]],
  ["archive answers preserve refresh exceptions and stale-data honesty", "freshness", [
    /before answering.*refresh/,
    /unless the user requests no (?:refresh|sync).*setup\/status/,
    /automatically run `discrawl sync --full` first.*after a supported send, run another full sync before archive verification/,
    /stale-but-readable local data.*unavailable current state/,
  ]],
  ["build cleanup retains noindex isolation and exact artifact authority", "core", [
    /non-deployed `\.app`.*project-local ignored.*`\.noindex`/,
    /inventory those artifacts and identify the active or deployed bundle separately/,
    /keep source, untracked user work, active or deployed apps, requested evidence, and unrelated worktrees/,
    /`\/trashness`.*fresh exact manifest/,
    /explicit codex or other ai agent deletion requests need no separate human approval; otherwise remove only user-approved targets/,
  ]],
  ["portable changes require full validation and published intended history", "twin-sync", [
    /manifests, templates, generated behavior, documentation, and tests in the same task/,
    /validation, its full tests, `git diff --check`/,
    /twin audit.*declared live sources/,
    /`origin` default branch before completion/,
    /never force-push or push unrelated project work/,
    /explicit inventory exclusion with a reason/,
  ]],
  ["portable synchronization does not export private state or redeploy it", "twin-sync", [
    /never copy credentials, secret values, sessions, private archives, recordings, identities, account data, or machine-specific absolute paths/,
    /one-way synchronization/,
    /does not authorize deployment onto the owner machine/,
  ]],
  ["registered tool routing retains authoritative contracts and automatic recording", "all", [
    /`skill\.md` and (?:sibling )?`routing\.md`/,
    /(?:if either|missing).*?(?:resolve|stop|before operating)/,
    /(?:broad|binary-wide).*allow.*prefix|allow.*prefix.*(?:broad|binary-wide)/,
    /(?:recording requests.*`opencap`|`opencap`.*recording requests)/,
  ]],
  ["capability claims use current interfaces and compare permissions separately", "core", [
    /verify the current installed interface and authoritative documentation/,
    /distinguish what the product can do from what the current policy, permissions, sandbox, or connector configuration allows/,
    /another agent product.*verify that product's current documentation or interface too/,
    /never claim a capability is impossible from assumption alone/,
  ]],
  ["inaccessible UI tries the declared fallbacks before blocking", "core", [
    /before declaring ui access blocked.*browser use or computer use/,
    /switch to computer use instead of repeatedly retrying/,
    /screenshots are blank, stale, cropped.*`peekaboo`/,
    /start read-only, honor action authority, and record the exact path/,
  ]],
  ["automation requests produce a working supported app automation or a concrete fallback", "strict-portable", [
    /default to codex app automations/,
    /supported automation-update tool to create\/update directly/,
    /do not stop at suggested wording unless wording\/review was requested/,
    /another scheduler only when explicitly requested or clearly owned by that system/,
    /complete paste-ready prompt and the exact manual-setup reason/,
  ]],
  ["bounded tool output retains decisive evidence and real command status", "core", [
    /never a cap on decisive evidence, errors, attribution, requested full content, required skill instructions, or contractually verbatim output/,
    /complete noisy build\/test output in task-local logs without secrets/,
    /real command exit status, pass\/fail counts and relevant failures/,
    /successful tail\/filter is not a successful test/,
    /never suppress errors to claim success/,
  ]],
];

async function sources() {
  const manifest = JSON.parse(await readFile(join(ROOT, "manifest", "policies.json"), "utf8"));
  const entries = await Promise.all(manifest.policies.map(async ({ id, path }) => [id, normalize(await readFile(join(ROOT, path), "utf8"))]));
  const result = Object.fromEntries(entries);
  result.all = `${Object.values(result).join(" ")} ${normalize(await readFile(join(ROOT, "skills", "agent-secrets", "SKILL.md"), "utf8"))} ${normalize(await readFile(join(ROOT, "skills", "tool-routing", "SKILL.md"), "utf8"))}`;
  return result;
}

function failures(scenario, source) {
  return scenario[2].filter((requirement) => !requirement.test(source));
}

for (const scenario of SCENARIOS) {
  test(`standing policy scenario: ${scenario[0]}`, async () => {
    const source = (await sources())[scenario[1]];
    assert.deepEqual(failures(scenario, source).map(String), [], `${scenario[0]} lost required behavior`);
  });
}

test("standing policy guards discriminate loss of high-risk obligations", async () => {
  const corpus = await sources();
  for (const index of [0, 2, 3, 5, 6, 7, 8, 11, 13, 14, 16, 17, 18]) {
    const scenario = SCENARIOS[index];
    const source = corpus[scenario[1]];
    assert.deepEqual(failures(scenario, source), [], `cannot fault-check an invalid baseline: ${scenario[0]}`);
    for (const obligation of scenario[2]) {
      const mutant = source.replace(new RegExp(obligation.source, "g"), "[removed obligation]");
      assert.notEqual(mutant, source, `fault did not apply: ${scenario[0]} ${obligation}`);
      assert.ok(failures(scenario, mutant).includes(obligation), `lost obligation survived: ${scenario[0]} ${obligation}`);
    }
  }
});

test("all profile renderers preserve every selected policy and the private wrapper", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "agent-os-policy-render-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const policies = JSON.parse(await readFile(join(ROOT, "manifest", "policies.json"), "utf8")).policies;
  const profiles = JSON.parse(await readFile(join(ROOT, "manifest", "profiles.json"), "utf8")).profiles;
  const wrapper = "# Private Owner Configuration\n\nKeep this private marker and owner-specific binding.\n";
  for (const profile of profiles) {
    const home = join(root, profile.id);
    const instructions = join(home, ".codex", "AGENTS.md");
    await mkdir(dirname(instructions), { recursive: true });
    await writeFile(instructions, wrapper);
    const result = spawnSync(process.execPath, [join(ROOT, "bootstrap", "cli.mjs"), "setup", "--home", home, "--profile", profile.id, "--safe", "--apply", "--json"], { cwd: ROOT, encoding: "utf8", env: { ...process.env, PATH: join(root, "empty-bin") } });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const rendered = await readFile(instructions, "utf8");
    assert.ok(rendered.startsWith(wrapper), `${profile.id} changed the private wrapper`);
    const selected = await Promise.all(profile.policies.map(async (id) => (await readFile(join(ROOT, policies.find((item) => item.id === id).path), "utf8")).trim()));
    const expected = `<!-- agent-os:start profile=${profile.id} -->\n\n${selected.join("\n\n")}\n\n<!-- agent-os:end -->`;
    assert.equal(rendered.slice(rendered.indexOf("<!-- agent-os:start" )).trim(), expected, `${profile.id} dropped or changed a policy during rendering`);
  }
});

test("rendered Discrawl pair preserves the unique write and refresh safeguards", () => {
  const render = (...args) => {
    const result = spawnSync(process.execPath, [join(ROOT, "bootstrap", "cli.mjs"), "render-tool", "discrawl", ...args], { cwd: ROOT, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    return result.stdout;
  };
  assert.match(render(), /Read sibling `routing\.md` before operation/);
  const routing = normalize(render("--routing"));
  for (const obligation of [
    /before answering.*automatically run `discrawl sync --full`/,
    /skip only when the user requests no sync.*installation\/configuration\/status/,
    /never use a separate discord send helper/,
    /user's request includes that write, exact target channel and exact message/,
    /installed discrawl cli actually supports the action/,
    /after a successful supported discord write, automatically run `discrawl sync --full` again/,
    /verify through the archive or supported cli result before reporting success/,
    /never inspect or expose bot tokens, credential stores or secret-bearing configuration/,
  ]) assert.match(routing, obligation);
});

test("named X folder failures retain the OpenCLI corpus fallback without folder attribution", () => {
  const result = spawnSync(process.execPath, [join(ROOT, "bootstrap", "cli.mjs"), "render-tool", "opencli", "--routing"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const routing = normalize(result.stdout);
  assert.match(routing, /bookmarkfoldersslice.*404/);
  assert.match(routing, /`opencli twitter bookmarks(?:[^`]+)?`/, "fallback must remain the OpenCLI adapter, not silently switch to another binary");
  assert.match(routing, /corpus-wide, never folder-attributed/);
  assert.match(routing, /do not manufacture folder ids from cookies, storage or traces/);
});
