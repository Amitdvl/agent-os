import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, realpath, rename, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
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

async function managedFixture(t){
  const f=await fixture(t),managedRoot=join(f.home,'managed studio'),revision='1'.repeat(40),version=join(managedRoot,'versions',revision);
  await mkdir(join(version,'.git'),{recursive:true});await mkdir(join(version,'scripts'));await mkdir(join(managedRoot,'library'));
  await writeFile(join(version,'scripts/studio.mjs'),'// verified managed harness fixture\n');
  await writeFile(join(version,'package.json'),JSON.stringify({name:'launch-video-studio',scripts:{studio:'node scripts/studio.mjs'}}));
  const controller=join(f.studio,'scripts/managed-studio.mjs');await writeFile(controller,'// registered repair controller fixture\n');
  const state={schemaVersion:1,id:'owned-fixture-installation',canonicalRoot:await realpath(managedRoot),remote:'https://example.invalid/private/studio.git',active:revision};
  const statePath=join(managedRoot,'installation.json'),markerPath=join(version,'.git/studio-software.json');
  const marker={revision,remote:state.remote},entry={id:'launch-video-studio',path:f.studio,status:'active',managedRoot};
  await writeFile(statePath,JSON.stringify(state));await writeFile(markerPath,JSON.stringify(marker));
  const register=async(config={canonicalProjects:[entry]})=>{const raw=JSON.stringify(config);await writeFile(f.registry,raw);return raw;};
  await register();return {...f,managedRoot,revision,version,controller,state,statePath,marker,markerPath,entry,register};
}

test('owned managed discovery takes precedence over obsolete remote routing and returns structured local paths read-only',async t=>{
  const f=await managedFixture(t),root=await realpath(f.version),managedRoot=await realpath(f.managedRoot);
  for(const remotePrimaryProjects of [[{id:'launch-video-studio',hostLabel:'Obsolete Windows Host',projectLabel:'Old Studio'}],{obsolete:'remote routing'}]){
    const raw=await f.register({canonicalProjects:[f.entry],remotePrimaryProjects});
    assert.equal(await resolveStudio({home:f.home,environment:{}}),root);
    assert.deepEqual(await resolveStudio({home:f.home,environment:{},details:true}),{root,mode:'managed',managedRoot,controller:await realpath(f.controller),libraryRoot:join(managedRoot,'library'),revision:f.revision});
    assert.equal(await readFile(f.registry,'utf8'),raw,'managed discovery must not rewrite private routing');
  }
});

test('explicit development override wins invalid managed and remote routing without accidental fallback',async t=>{
  const f=await managedFixture(t);
  const raw=await f.register({canonicalProjects:[{...f.entry,managedRoot:join(f.home,'missing')}],remotePrimaryProjects:{invalid:true}});
  assert.deepEqual(await resolveStudio({home:f.home,environment:{LAUNCH_VIDEO_STUDIO_ROOT:f.studio},details:true}),{root:await realpath(f.studio),mode:'development'});
  assert.equal(await readFile(f.registry,'utf8'),raw);
  await f.register();
  await assert.rejects(resolveStudio({home:f.home,environment:{LAUNCH_VIDEO_STUDIO_ROOT:join(f.home,'missing')},details:true}),/configured studio path.*unavailable/);
  assert.equal(await resolveStudio({home:f.home,environment:{LAUNCH_VIDEO_STUDIO_ROOT:relative(process.cwd(),f.studio)}}),await realpath(f.studio),'legacy explicit overrides retain relative-path compatibility');
});

test('ambiguous managed registrations and invalid managed roots fail closed despite a usable development checkout',async t=>{
  const f=await managedFixture(t);
  for(const canonicalProjects of [[f.entry,f.entry],[f.entry,{id:'launch-video-studio',path:f.studio,status:'active'}],...[null,'',17].map(managedRoot=>[{...f.entry,managedRoot}])]){
    const raw=await f.register({canonicalProjects});
    await assert.rejects(resolveStudio({home:f.home,environment:{}}),/managed Studio installation/i);
    assert.equal(await readFile(f.registry,'utf8'),raw);
  }
});

test('missing or inconsistent installation pointers and ownership markers never fall back to development',async t=>{
  const f=await managedFixture(t);
  for(const state of [null,{...f.state,schemaVersion:2},{...f.state,id:''},{...f.state,active:undefined},{...f.state,active:'../../outside'},{...f.state,active:'2'.repeat(40)},{...f.state,canonicalRoot:f.studio}]){
    if(state===null)await rm(f.statePath);else await writeFile(f.statePath,JSON.stringify(state));
    await assert.rejects(resolveStudio({home:f.home,environment:{}}),/managed Studio installation.*unavailable/i);
    await writeFile(f.statePath,JSON.stringify(f.state));
  }
  for(const marker of [null,{...f.marker,revision:'2'.repeat(40)},{...f.marker,remote:'https://example.invalid/different.git'}]){
    if(marker===null)await rm(f.markerPath);else await writeFile(f.markerPath,JSON.stringify(marker));
    await assert.rejects(resolveStudio({home:f.home,environment:{}}),/managed Studio installation.*unavailable/i);
    await writeFile(f.markerPath,JSON.stringify(f.marker));
  }
  await rm(join(f.version,'scripts/studio.mjs'));
  await assert.rejects(resolveStudio({home:f.home,environment:{}}),/configured studio path.*unavailable/);
});

test('redirected managed version directories are rejected without following their code or changing user files',async t=>{
  const f=await managedFixture(t);
  for(const [label,path] of [['versions',join(f.managedRoot,'versions')],['version',f.version],['git',join(f.version,'.git')]]){
    const retained=join(f.home,`retained-${label}`);await rename(path,retained);await symlink(retained,path,process.platform==='win32'?'junction':'dir');
    try{await assert.rejects(resolveStudio({home:f.home,environment:{}}),/managed Studio installation.*unavailable/i);}
    finally{await rm(path);await rename(retained,path);}
  }
  assert.equal(await readFile(join(f.version,'scripts/studio.mjs'),'utf8'),'// verified managed harness fixture\n');
  assert.equal(await readFile(join(f.studio,'scripts/studio.mjs'),'utf8'),'// owned harness fixture\n');
});

test('managed root and ownership-file aliases cannot redirect discovery outside their registered leaves',async t=>{
  const f=await managedFixture(t),alias=join(f.home,'managed-link');
  await symlink(f.managedRoot,alias,process.platform==='win32'?'junction':'dir');await f.register({canonicalProjects:[{...f.entry,managedRoot:alias}]});
  await assert.rejects(resolveStudio({home:f.home,environment:{}}),/managed Studio installation.*unavailable/i);await f.register();
  for(const [label,path] of [['state',f.statePath],['marker',f.markerPath],['controller',f.controller]]){
    const retained=join(f.home,`retained-${label}.json`),original=await readFile(path,'utf8');await rename(path,retained);await symlink(retained,path,'file');
    try{await assert.rejects(resolveStudio({home:f.home,environment:{}}),/managed Studio installation.*unavailable/i);assert.equal(await readFile(retained,'utf8'),original);}
    finally{await rm(path);await rename(retained,path);}
  }
});

test('managed paths must be absolute and an ownership pair must declare a nonempty remote identity',async t=>{
  const f=await managedFixture(t);
  for(const entry of [{...f.entry,managedRoot:relative(process.cwd(),f.managedRoot)},{...f.entry,controller:relative(process.cwd(),f.controller)}]){
    await f.register({canonicalProjects:[entry]});await assert.rejects(resolveStudio({home:f.home,environment:{}}),/managed Studio installation.*unavailable/i);
  }
  await f.register();
  for(const remote of [undefined,null,'',17]){
    await writeFile(f.statePath,JSON.stringify({...f.state,remote}));await writeFile(f.markerPath,JSON.stringify({...f.marker,remote}));
    await assert.rejects(resolveStudio({home:f.home,environment:{}}),/managed Studio installation.*unavailable/i);
  }
});

test('an explicit private controller works independently of development and invalid controllers fail closed',async t=>{
  const f=await managedFixture(t),controller=join(f.home,'private controller.mjs');
  await writeFile(controller,'// separately installed controller\n');
  await rm(f.studio,{recursive:true});
  await f.register({canonicalProjects:[{...f.entry,controller}]});
  const details=await resolveStudio({home:f.home,environment:{},details:true});
  assert.equal(details.mode,'managed');assert.equal(details.controller,await realpath(controller));assert.equal(details.root,await realpath(f.version));
  for(const invalid of [join(f.home,'missing-controller.mjs'),f.home]){
    await f.register({canonicalProjects:[{...f.entry,controller:invalid}]});
    await assert.rejects(resolveStudio({home:f.home,environment:{}}),/managed Studio installation.*unavailable/i);
  }
  assert.equal(await readFile(controller,'utf8'),'// separately installed controller\n');
});

test('controller ancestor aliases resolve to a durable canonical controller path',async t=>{
  const f=await managedFixture(t),alias=join(f.home,'controller-checkout-alias');
  await symlink(f.studio,alias,process.platform==='win32'?'junction':'dir');
  for(const entry of [{...f.entry,path:alias},{...f.entry,controller:join(alias,'scripts/managed-studio.mjs')}]){
    await f.register({canonicalProjects:[entry]});
    const details=await resolveStudio({home:f.home,environment:{},details:true});
    assert.equal(details.mode,'managed');assert.equal(details.controller,await realpath(f.controller));
    assert.notEqual(details.controller,join(alias,'scripts/managed-studio.mjs'));
    assert.equal(await readFile(details.controller,'utf8'),'// registered repair controller fixture\n');
  }
  const details=await resolveStudio({home:f.home,environment:{},details:true});
  await rm(alias);
  assert.equal(await readFile(details.controller,'utf8'),'// registered repair controller fixture\n','returned controller remains usable after an ancestor alias is removed');
});

test('actual resolver CLI emits managed JSON and preserves string and development-override interfaces',async t=>{
  const f=await managedFixture(t),cli=new URL('../skills/launch-video-studio/scripts/resolve-studio.mjs',import.meta.url);
  const environment={...process.env,HOME:f.home,USERPROFILE:f.home};delete environment.LAUNCH_VIDEO_STUDIO_ROOT;
  const json=spawnSync(process.execPath,[fileURLToPath(cli),'--json'],{env:environment,encoding:'utf8'});
  assert.equal(json.status,0,json.stderr);assert.equal(json.stderr,'');
  assert.deepEqual(JSON.parse(json.stdout),{root:await realpath(f.version),mode:'managed',managedRoot:await realpath(f.managedRoot),controller:await realpath(f.controller),libraryRoot:join(await realpath(f.managedRoot),'library'),revision:f.revision});
  const text=spawnSync(process.execPath,[fileURLToPath(cli)],{env:environment,encoding:'utf8'});assert.equal(text.status,0,text.stderr);assert.equal(text.stdout.trim(),await realpath(f.version));
  const local=spawnSync(process.execPath,[fileURLToPath(cli),'--json'],{env:{...environment,LAUNCH_VIDEO_STUDIO_ROOT:f.studio},encoding:'utf8'});
  assert.equal(local.status,0,local.stderr);assert.deepEqual(JSON.parse(local.stdout),{root:await realpath(f.studio),mode:'development'});
});
