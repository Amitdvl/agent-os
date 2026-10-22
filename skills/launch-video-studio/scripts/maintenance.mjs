#!/usr/bin/env node
// Read-only observations and decisions. Existing Studio controllers own mutations.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, realpath } from 'node:fs/promises';
import { homedir, devNull } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveStudio } from './resolve-studio.mjs';
const execute = promisify(execFile);
const oid = value => /^[a-f0-9]{40}$/.test(value ?? '');
const completedHandoff = film => film.handoffComplete === true && film.ownerLocal === false && film.status === 'synced';
const json = async path => JSON.parse(await readFile(path, 'utf8'));
function gitEnvironment(environment) {
  const env = { ...environment, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never', GIT_LITERAL_PATHSPECS: '1', GIT_OPTIONAL_LOCKS: '0', GIT_NO_LAZY_FETCH: '1' };
  for (const key of Object.keys(env)) if (['GIT_DIR', 'GIT_COMMON_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES'].includes(key) || key.startsWith('GIT_CONFIG_')) delete env[key];
  return env;
}

export function maintenancePlan(snapshot) {
  const actions = [], deferred = [], attention = [...(snapshot.errors ?? [])];
  const repo = snapshot.repository, studio = snapshot.studio;
  if (repo?.relation === 'missing-objects') actions.push({ type: 'fetch-repo', root: repo.root });
  if (repo?.relation === 'behind') {
    if (repo.branch === 'main' && repo.trackedDirty === false) actions.push({ type: 'refresh-repo', root: repo.root });
    else deferred.push('Repository refresh: preserve tracked edits and the selected branch.');
  }
  if (repo?.relation === 'diverged') attention.push('Repository diverged: preserve both histories; inspect before merging.');
  if (studio?.mode === 'managed') {
    const update = studio.releaseValid === true && oid(studio.verifiedRevision) && studio.verifiedRevision !== studio.activeRevision;
    const repair = studio.healthy === false || Boolean(studio.lastError);
    if (update || repair) {
      if (studio.paused || studio.activity !== 'idle') deferred.push('Studio maintenance: wait for idle editing/rendering/sync and respect paused recovery.');
      else actions.push({ type: repair ? 'repair-studio' : 'update-studio', managedRoot: studio.managedRoot, controller: studio.controller });
    }
    if (studio.paused) attention.push('Studio recovery is paused; inspect diagnostics before an explicit retry.');
  }
  for (const film of snapshot.films ?? []) {
    if (!film.enabled) continue;
    if ((film.paused && !completedHandoff(film)) || film.status === 'conflict' || film.status === 'unknown') attention.push(`Film ${film.name}: ${film.paused ? 'retries paused' : film.status}; preserve local work and inspect diagnostics.`);
    else if (film.status === 'pending' && film.ownerLocal && studio?.healthy === true) actions.push({ type: 'sync-film', name: film.name });
  }
  return { actions, deferred, attention };
}

export async function inspectMaintenance({ repo, home = homedir(), environment = process.env, project, now = Date.now(), discovery,
  run = async (command, args, cwd) => (await execute(command, command === 'git' ? [...(process.platform === 'win32' ? ['-c', 'core.longpaths=true'] : []), '-c', 'core.fsmonitor=false', '-c', `core.hooksPath=${devNull}`, ...args] : args, { cwd, encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024,
    env: gitEnvironment(environment) })).stdout,
  request = async url => { const response = await fetch(url, { signal: AbortSignal.timeout(5000), redirect: 'error' }); if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); }
} = {}) {
  const snapshot = { repository: null, studio: null, films: [], errors: [] };
  const git = async (root, ...args) => (await run('git', args, root)).trim();
  const ancestor = async (root, a, b) => { try { await git(root, 'merge-base', '--is-ancestor', a, b); return true; } catch { return false; } };
  try {
    discovery ??= await resolveStudio({ home, environment, details: true });
    if (!repo) {
      if (environment.LAUNCH_VIDEO_STUDIO_ROOT) repo = discovery.root;
      else { const registry = await json(join(home, '.agent-os', 'workspaces.json')); repo = registry.canonicalProjects?.find(entry => entry.id === 'launch-video-studio' && entry.status === 'active')?.path; }
    }
  } catch { snapshot.errors.push('Studio discovery failed; inspect registered ownership/controller before repair.'); }
  let remoteHead;
  if (repo) try {
    repo = await realpath(repo);
    const pkg = await json(join(repo, 'package.json'));
    if (pkg.name !== 'launch-video-studio' || pkg.scripts?.studio !== 'node scripts/studio.mjs') throw new Error('Wrong project');
    const origin = await git(repo, 'config', '--get', 'remote.origin.url');
    if (discovery?.mode === 'managed') {
      const installation = await json(join(discovery.managedRoot, 'installation.json'));
      const sync = await json(join(discovery.libraryRoot, '.git', 'studio-managed.json'));
      const libraryOrigin = await git(discovery.libraryRoot, 'config', '--get', 'remote.origin.url');
      if (!installation.remote || origin !== installation.remote || libraryOrigin !== installation.remote || sync.remote !== installation.remote) throw new Error('Foreign origin');
    }
    const r = snapshot.repository = { root: repo, branch: await git(repo, 'branch', '--show-current'), head: await git(repo, 'rev-parse', 'HEAD'),
      trackedDirty: Boolean(await git(repo, 'status', '--porcelain', '--untracked-files=no')), remoteHead: null, relation: 'unknown' };
    remoteHead = (await git(repo, 'ls-remote', '--exit-code', 'origin', 'refs/heads/main')).split(/\s/)[0];
    if (!oid(remoteHead)) throw new Error('Invalid remote identity');
    r.remoteHead = remoteHead;
    if (r.head === remoteHead) r.relation = 'current';
    else {
      try { await git(repo, 'cat-file', '-e', `${remoteHead}^{commit}`); }
      catch { r.relation = 'missing-objects'; }
      if (r.relation !== 'missing-objects') r.relation = await ancestor(repo, r.head, remoteHead) ? 'behind' : await ancestor(repo, remoteHead, r.head) ? 'ahead' : 'diverged';
    }
  } catch { snapshot.errors.push('Repository freshness unavailable; retain local work and report offline/auth uncertainty when relevant.'); }
  if (!discovery) return snapshot;
  const studio = snapshot.studio = { ...discovery, activeRevision: discovery.revision ?? null, verifiedRevision: null, releaseValid: false,
    healthy: null, paused: false, activity: 'unknown', lastError: null };
  if (studio.mode !== 'managed') return snapshot;
  if (repo && oid(remoteHead)) try {
    const release = JSON.parse(await git(repo, 'show', `${remoteHead}:.studio-release.json`));
    if (release.schemaVersion === 1 && oid(release.sourceRevision) && ['darwin', 'win32'].every(platform => release.verifiedPlatforms?.includes(platform)) && await ancestor(repo, release.sourceRevision, remoteHead)) {
      studio.verifiedRevision = release.sourceRevision; studio.releaseValid = true;
    } else snapshot.errors.push('Remote release marker is invalid; preserve installed software.');
  } catch { if (snapshot.repository?.relation !== 'missing-objects') snapshot.errors.push('Verified remote release unavailable; preserve installed software.'); }
  try {
    const state = await json(join(studio.managedRoot, 'installation.json'));
    studio.paused = [state.failures, state.startupFailures, state.healthFailures].some(ledger => Object.values(ledger ?? {}).some(count => count >= 3));
    studio.lastError = state.lastError ? 'Controller reports a retained failure; inspect doctor.' : null;
    const doctor = JSON.parse(await run(process.execPath, [studio.controller, 'doctor', '--root', studio.managedRoot], studio.root));
    if (doctor.running) {
      const running = doctor.running;
      if (!Number.isInteger(running.port) || running.port < 1 || running.port > 65535 || running.revision !== studio.activeRevision || running.health?.healthy !== true || running.health.launchId !== running.launchId) throw new Error('Unverified daemon identity');
      studio.healthy = true; studio.url = `http://127.0.0.1:${running.port}`;
      const sessions = await json(join(studio.libraryRoot, 'projects', '.workspace', 'sessions.json'));
      const jobs = await request(`${studio.url}/api/jobs`);
      if (!Array.isArray(sessions) || !Array.isArray(jobs.jobs) || sessions.some(item => !Array.isArray(item) || !Number.isFinite(item[1]?.lastSeen))) throw new Error('Unknown activity');
      const fresh = sessions.some(([, session]) => now - session.lastSeen < 30 * 60 * 1000);
      const busy = jobs.jobs.some(job => !['complete', 'failed', 'cancelled', 'interrupted'].includes(job.status));
      studio.activity = fresh || busy ? 'busy' : 'idle';
    } else {
      // A stopped Studio is healthy enough to leave stopped. Startup owns reconciliation.
      studio.activity = state.launchIntent ? 'unknown' : 'idle';
    }
    if (state.launchIntent) studio.activity = 'unknown';
  } catch { studio.activity = 'unknown'; snapshot.errors.push('Studio health/activity could not be established; defer restart and inspect doctor.'); }
  try {
    const state = await json(join(studio.libraryRoot, '.git', 'studio-managed.json'));
    let retries = {};
    try { retries = await json(join(studio.libraryRoot, '.git', 'studio-transport.json')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (!Array.isArray(state.enabled) || typeof state.deviceId !== 'string') throw new Error('Invalid sync state');
    for (const name of state.enabled) {
      if (typeof name !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(name)) throw new Error('Invalid film name');
      const film = { name, enabled: true, ownerLocal: false, status: 'unknown', paused: Number(retries[name] ?? 0) >= 3 };
      if (!project || name === project) snapshot.films.push(film);
      const config = await json(join(studio.libraryRoot, 'projects', name, '.studio-state', 'sync.json'));
      film.ownerLocal = config.owner === state.deviceId;
      const result = state.results?.[name];
      const prior = result?.status;
      const movedWriter = !film.ownerLocal && config.schemaVersion === 1 && typeof config.owner === 'string' && Boolean(config.owner.trim()) && config.enabled === true && prior === 'error' && result.code === 'WRITER_CHANGED';
      const dirty = Boolean(await git(studio.libraryRoot, 'status', '--porcelain', '--', `projects/${name}`));
      film.status = prior === 'conflict' ? 'conflict' : dirty ? 'pending' : prior === 'pending' ? 'pending' : 'unknown';
      // Compare trees, not whole commits: unrelated code/film changes need no transfer.
      if (!dirty && (prior === 'synced' || movedWriter) && oid(remoteHead)) {
        const localTree = await git(studio.libraryRoot, 'rev-parse', `HEAD:projects/${name}`);
        const remoteTree = await git(studio.libraryRoot, 'rev-parse', `${remoteHead}:projects/${name}`);
        if (oid(localTree) && localTree === remoteTree) { film.status = 'synced'; if (movedWriter) film.handoffComplete = true; }
        else film.status = 'pending';
      }
      if (film.status === 'pending') studio.activity = 'busy';
      else if (film.status === 'unknown' || film.status === 'conflict' || (film.paused && !completedHandoff(film))) studio.activity = 'unknown';
    }
  } catch { studio.activity = 'unknown'; snapshot.errors.push('Film sync freshness unavailable; preserve data and inspect existing sync diagnostics.'); }
  return snapshot;
}

if (process.argv[1] && import.meta.url === pathToFileURL(await realpath(resolve(process.argv[1]))).href) {
  const argument = name => { const index = process.argv.indexOf(name); return index < 0 ? undefined : process.argv[index + 1]; };
  try { const snapshot = await inspectMaintenance({ repo: argument('--repo'), project: argument('--project') }); console.log(JSON.stringify({ snapshot, ...maintenancePlan(snapshot) }, null, 2)); }
  catch { console.error('Maintenance inspection failed; preserve current state and inspect registered Studio diagnostics.'); process.exitCode = 1; }
}
