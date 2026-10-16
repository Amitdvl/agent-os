import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
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


test('remote primary refuses a valid local backup and names the saved host/project without modifying registry', async t => {
  const f = await fixture(t);
  const config={canonicalProjects:[{id:'launch-video-studio',path:f.studio,status:'active'}],remotePrimaryProjects:[{id:'launch-video-studio',hostLabel:'Windows Creator',projectLabel:'Launch Video Studio',path:'does-not-exist-and-is-not-a-local-root'}]};
  const raw=JSON.stringify(config);await writeFile(f.registry,raw);
  await assert.rejects(resolveStudio({home:f.home,environment:{}}),error=>{
    assert.match(error.message,/primary Launch Video Studio is on Windows Creator/);
    assert.match(error.message,/saved Codex project “Launch Video Studio”/);
    assert.match(error.message,/set LAUNCH_VIDEO_STUDIO_ROOT/);return true;
  });
  assert.equal(await readFile(f.registry,'utf8'),raw,'Discovery is read-only');
  await assert.doesNotReject(async()=>assert.equal(await resolveStudio({home:f.home,environment:{LAUNCH_VIDEO_STUDIO_ROOT:f.studio}}),await realpath(f.studio)),'A deliberate explicit local override wins');
  await assert.rejects(resolveStudio({home:f.home,environment:{LAUNCH_VIDEO_STUDIO_ROOT:join(f.home,'missing')}}),/configured studio path.*unavailable/,'An invalid explicit override cannot fall back to either registered copy');
});

test('invalid or duplicate matching remote primaries fail closed instead of using the local backup', async t => {
  const f=await fixture(t), valid={id:'launch-video-studio',hostLabel:'Windows Creator',projectLabel:'Launch Video Studio'};
  for(const entries of [[valid,valid],[{...valid,hostLabel:''}],[{...valid,hostLabel:'  '}],[{...valid,hostLabel:17}],[{...valid,projectLabel:null}],[{id:'launch-video-studio',hostLabel:'Windows Creator'}]]){
    const raw=JSON.stringify({canonicalProjects:[{id:'launch-video-studio',path:f.studio,status:'active'}],remotePrimaryProjects:entries});
    await writeFile(f.registry,raw);
    await assert.rejects(resolveStudio({home:f.home,environment:{}}),/exactly one remote launch-video-studio primary with hostLabel and projectLabel/);
    assert.equal(await readFile(f.registry,'utf8'),raw);
    assert.equal(await resolveStudio({home:f.home,environment:{LAUNCH_VIDEO_STUDIO_ROOT:f.studio}}),await realpath(f.studio),'Explicit override also precedes malformed remote configuration');
  }
});

test('remote metadata for another project does not interfere with local canonical discovery', async t => {
  const f=await fixture(t);
  await writeFile(f.registry,JSON.stringify({canonicalProjects:[{id:'launch-video-studio',path:f.studio,status:'active'}],remotePrimaryProjects:[{id:'another-project',hostLabel:null}]}));
  assert.equal(await resolveStudio({home:f.home,environment:{}}),await realpath(f.studio));
});

test('real resolver CLI reports remote-primary instructions and honors a deliberate local override', async t => {
  const f=await fixture(t);
  await writeFile(f.registry,JSON.stringify({canonicalProjects:[{id:'launch-video-studio',path:f.studio,status:'active'}],remotePrimaryProjects:[{id:'launch-video-studio',hostLabel:'Windows Creator',projectLabel:'Launch Video Studio'}]}));
  const cli=new URL('../skills/launch-video-studio/scripts/resolve-studio.mjs',import.meta.url);
  const environment={...process.env,HOME:f.home,USERPROFILE:f.home};delete environment.LAUNCH_VIDEO_STUDIO_ROOT;
  const remote=spawnSync(process.execPath,[fileURLToPath(cli)],{env:environment,encoding:'utf8'});
  assert.equal(remote.status,1,remote.stderr);assert.equal(remote.stdout,'');assert.match(remote.stderr,/primary Launch Video Studio is on Windows Creator/);assert.match(remote.stderr,/Launch Video Studio”/);
  const local=spawnSync(process.execPath,[fileURLToPath(cli)],{env:{...environment,LAUNCH_VIDEO_STUDIO_ROOT:f.studio},encoding:'utf8'});
  assert.equal(local.status,0,local.stderr);assert.equal(local.stdout.trim(),await realpath(f.studio));assert.equal(local.stderr,'');
});


test('malformed declared remote routing fails closed while omitted and empty routing stay compatible', async t => {
  const f=await fixture(t),canonicalProjects=[{id:'launch-video-studio',path:f.studio,status:'active'}];
  for(const remotePrimaryProjects of [null,{},'Windows',17,[null],[[]],['invalid']]){
    const raw=JSON.stringify({canonicalProjects,remotePrimaryProjects});await writeFile(f.registry,raw);
    await assert.rejects(resolveStudio({home:f.home,environment:{}}),error=>{
      assert.equal(error.name,'Error');assert.match(error.message,/registry remotePrimaryProjects.*array/);return true;
    });
    assert.equal(await readFile(f.registry,'utf8'),raw);
    assert.equal(await resolveStudio({home:f.home,environment:{LAUNCH_VIDEO_STUDIO_ROOT:f.studio}}),await realpath(f.studio));
  }
  for(const config of [{canonicalProjects},{canonicalProjects,remotePrimaryProjects:[]}]){
    await writeFile(f.registry,JSON.stringify(config));assert.equal(await resolveStudio({home:f.home,environment:{}}),await realpath(f.studio));
  }
});
