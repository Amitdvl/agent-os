#!/usr/bin/env node
import { readFile, realpath, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function resolveStudio({ environment = process.env, home = homedir() } = {}) {
  let candidate = environment.LAUNCH_VIDEO_STUDIO_ROOT;
  if (!candidate) {
    let registry;
    try { registry = JSON.parse(await readFile(join(home, '.agent-os', 'workspaces.json'), 'utf8')); }
    catch { throw new Error('Register an active canonical project with id launch-video-studio in ~/.agent-os/workspaces.json, or set LAUNCH_VIDEO_STUDIO_ROOT.'); }
    const matches = (Array.isArray(registry.canonicalProjects) ? registry.canonicalProjects : [])
      .filter((entry) => entry.id === 'launch-video-studio' && entry.status === 'active');
    if (matches.length !== 1 || typeof matches[0].path !== 'string' || !matches[0].path.trim()) {
      throw new Error('The workspace registry must contain exactly one active launch-video-studio canonical project with a path.');
    }
    candidate = matches[0].path;
  }
  let root, pkg;
  try {
    root = await realpath(resolve(candidate));
    pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
    if (pkg.name !== 'launch-video-studio' || pkg.scripts?.studio !== 'node scripts/studio.mjs') throw new Error();
    if (!(await stat(join(root, 'scripts', 'studio.mjs'))).isFile()) throw new Error();
  } catch {
    throw new Error('The configured studio path is unavailable or does not identify the launch-video-studio repository and its expected harness.');
  }
  return root;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { console.log(await resolveStudio()); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
