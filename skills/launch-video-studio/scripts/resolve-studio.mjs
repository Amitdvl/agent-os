#!/usr/bin/env node
import { readFile, realpath, stat, lstat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function resolveStudio({ environment = process.env, home = homedir(), details = false } = {}) {
  let managed = null;
  let candidate = environment.LAUNCH_VIDEO_STUDIO_ROOT;
  if (!candidate) {
    let registry;
    try { registry = JSON.parse(await readFile(join(home, '.agent-os', 'workspaces.json'), 'utf8')); }
    catch { throw new Error('Register an active canonical project with id launch-video-studio in ~/.agent-os/workspaces.json, or set LAUNCH_VIDEO_STUDIO_ROOT.'); }
    const entries=(Array.isArray(registry.canonicalProjects)?registry.canonicalProjects:[]).filter(entry=>entry.id==='launch-video-studio'&&entry.status==='active');
    const installations=entries.filter(entry=>entry.managedRoot!==undefined);
    if(installations.length){
      if(installations.length!==1||entries.length!==1||typeof installations[0].managedRoot!=='string'||!installations[0].managedRoot.trim())throw new Error('Register exactly one managed Studio installation.');
      const entry=installations[0];
      try{
        if(!isAbsolute(entry.managedRoot)||(await lstat(entry.managedRoot)).isSymbolicLink())throw new Error();
        const managedRoot=await realpath(entry.managedRoot);
        if((await lstat(join(managedRoot,'installation.json'))).isSymbolicLink())throw new Error();
        const state=JSON.parse(await readFile(join(managedRoot,'installation.json'),'utf8'));
        if(state.schemaVersion!==1||typeof state.id!=='string'||!state.id||typeof state.remote!=='string'||!state.remote||state.canonicalRoot!==managedRoot||!/^[a-f0-9]{40}$/.test(state.active))throw new Error();
        candidate=join(managedRoot,'versions',state.active);
        for(const path of [join(managedRoot,'versions'),candidate,join(candidate,'.git')])if((await lstat(path)).isSymbolicLink()||await realpath(path)!==path)throw new Error();
        if((await lstat(join(candidate,'.git/studio-software.json'))).isSymbolicLink())throw new Error();
        const marker=JSON.parse(await readFile(join(candidate,'.git/studio-software.json'),'utf8'));
        if(marker.revision!==state.active||marker.remote!==state.remote)throw new Error();
        const controller=entry.controller??join(entry.path,'scripts/managed-studio.mjs');
        if(!isAbsolute(controller)||!(await lstat(controller)).isFile())throw new Error();
        managed={mode:'managed',managedRoot,controller:await realpath(controller),libraryRoot:join(managedRoot,'library'),revision:state.active};
      }catch{throw new Error('The registered managed Studio installation is unavailable or has an invalid ownership marker. Run its registered controller doctor/open to repair it; do not fall back to a development checkout.');}
    }
    if(!managed){
    if (registry.remotePrimaryProjects !== undefined && (!Array.isArray(registry.remotePrimaryProjects) || registry.remotePrimaryProjects.some(entry => !entry || typeof entry !== 'object' || Array.isArray(entry)))) {
      throw new Error('The workspace registry remotePrimaryProjects must be an array of project records.');
    }
    const remote = (registry.remotePrimaryProjects ?? [])
      .filter((entry) => entry.id === 'launch-video-studio');
    if (remote.length) {
      if (remote.length !== 1 || !['hostLabel', 'projectLabel'].every(key => typeof remote[0][key] === 'string' && remote[0][key].trim())) {
        throw new Error('The workspace registry must contain exactly one remote launch-video-studio primary with hostLabel and projectLabel.');
      }
      throw new Error(`The primary Launch Video Studio is on ${remote[0].hostLabel}. Open its saved Codex project “${remote[0].projectLabel}” there. This machine retains a backup; set LAUNCH_VIDEO_STUDIO_ROOT only when deliberately using that local copy.`);
    }
    const matches = (Array.isArray(registry.canonicalProjects) ? registry.canonicalProjects : [])
      .filter((entry) => entry.id === 'launch-video-studio' && entry.status === 'active');
    if (matches.length !== 1 || typeof matches[0].path !== 'string' || !matches[0].path.trim()) {
      throw new Error('The workspace registry must contain exactly one active launch-video-studio canonical project with a path.');
    }
    candidate = matches[0].path;
    }
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
  return details?{root,...(managed??{mode:'development'})}:root;
}

if (process.argv[1] && import.meta.url === pathToFileURL(await realpath(resolve(process.argv[1]))).href) {
  try { const details=process.argv.includes('--json');const result=await resolveStudio({details});console.log(details?JSON.stringify(result,null,2):result); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
