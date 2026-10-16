import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { resolveStudio } from '../skills/launch-video-studio/scripts/resolve-studio.mjs';

async function fixture(t) {
  const home = await mkdtemp(join(tmpdir(), 'launch-studio-discovery-'));
  t.after(() => rm(home, { recursive: true, force: true }));
  const studio = join(home, 'studio');
  await mkdir(join(studio, 'scripts'), { recursive: true });
  await writeFile(join(studio, 'scripts', 'studio.mjs'), '// owned harness fixture\n');
  await writeFile(join(studio, 'package.json'), JSON.stringify({ name: 'launch-video-studio', scripts: { studio: 'node scripts/studio.mjs' } }));
  await mkdir(join(home, '.agent-os'));
  return { home, studio, registry: join(home, '.agent-os', 'workspaces.json') };
}

test('studio discovery resolves the private canonical project and an explicit override', async (t) => {
  const f = await fixture(t);
  await writeFile(f.registry, JSON.stringify({ canonicalProjects: [{ id: 'launch-video-studio', path: f.studio, status: 'active' }] }));
  assert.equal(await resolveStudio({ home: f.home, environment: {} }), await realpath(f.studio));
  await writeFile(f.registry, 'invalid registry');
  assert.equal(await resolveStudio({ home: f.home, environment: { LAUNCH_VIDEO_STUDIO_ROOT: f.studio } }), await realpath(f.studio));
});

test('studio discovery refuses missing, ambiguous, inactive, and wrong-identity checkouts', async (t) => {
  const f = await fixture(t);
  await assert.rejects(resolveStudio({ home: f.home, environment: {} }), /Register an active/);
  for (const entries of [[], [{id:'launch-video-studio',path:f.studio,status:'archived'}], Array(2).fill({id:'launch-video-studio',path:f.studio,status:'active'})]) {
    await writeFile(f.registry, JSON.stringify({canonicalProjects:entries}));
    await assert.rejects(resolveStudio({home:f.home,environment:{}}), /exactly one active/);
  }
  await writeFile(join(f.studio, 'package.json'), JSON.stringify({name:'unrelated-project',scripts:{studio:'node scripts/studio.mjs'}}));
  await assert.rejects(resolveStudio({home:f.home,environment:{LAUNCH_VIDEO_STUDIO_ROOT:f.studio}}), /does not identify/);
});

test('creator pack distributes the complete automatically invoked studio discovery package', async () => {
  const skills = JSON.parse(await readFile(new URL('../manifest/skills.json', import.meta.url), 'utf8')).skills;
  const entry = skills.find(s => s.id === 'launch-video-studio');
  assert.equal(entry.includePackage, true);
  assert.equal(entry.command.invocation, '$launch-video-studio');
  const packs = JSON.parse(await readFile(new URL('../manifest/packs.json', import.meta.url), 'utf8')).packs;
  assert.ok(packs.find(p => p.id === 'creator').skills.includes(entry.id));
  const policy = await readFile(new URL('../skills/launch-video-studio/agents/openai.yaml', import.meta.url), 'utf8');
  assert.match(policy, /allow_implicit_invocation: true/);
});


test('studio resolver executes through a global skill symlink', async (t) => {
  const f = await fixture(t);
  const launcher = join(f.home, 'resolve-studio.mjs');
  await symlink(new URL('../skills/launch-video-studio/scripts/resolve-studio.mjs', import.meta.url), launcher);
  const output = execFileSync(process.execPath, [launcher], { env: {...process.env, LAUNCH_VIDEO_STUDIO_ROOT:f.studio}, encoding:'utf8' });
  assert.equal(output.trim(), await realpath(f.studio));
});
