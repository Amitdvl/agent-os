import assert from 'node:assert/strict';
import test from 'node:test';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,mkdir,readFile,readdir,writeFile,rm,lstat,chmod} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {maintenancePlan,inspectMaintenance} from '../skills/launch-video-studio/scripts/maintenance.mjs';

const exec=promisify(execFile),revision='a'.repeat(40),nextRevision='b'.repeat(40);
function snapshot(overrides={}){
  return {repository:{root:'/owned/source',branch:'main',head:revision,remoteHead:revision,relation:'current',trackedDirty:false,...overrides.repository},
    studio:{mode:'managed',root:'/owned/managed/versions/'+revision,managedRoot:'/owned/managed',controller:'/owned/controller.mjs',libraryRoot:'/owned/managed/library',activeRevision:revision,verifiedRevision:revision,releaseValid:true,healthy:true,paused:false,activity:'idle',lastError:null,...overrides.studio},
    films:[],errors:[],...Object.fromEntries(Object.entries(overrides).filter(([key])=>!['repository','studio'].includes(key)))};
}
const types=plan=>plan.actions.map(action=>action.type);
function frozen(value){if(value&&typeof value==='object'){Object.values(value).forEach(frozen);Object.freeze(value);}return value;}
function noAction(plan,type){assert.ok(!types(plan).includes(type),JSON.stringify(plan));}

test('ordinary current healthy or stopped prompts are pure quiet no-ops',()=>{
  for(const healthy of [true,null]){
    const input=frozen(snapshot({studio:{healthy},films:[{name:'shared-film',enabled:true,ownerLocal:true,status:'synced',paused:false}]})),before=JSON.stringify(input);
    assert.deepEqual(maintenancePlan(input),{actions:[],deferred:[],attention:[]});assert.equal(JSON.stringify(input),before);
  }
});

test('only a clean main checkout behind origin gets a routine refresh action',()=>{
  assert.deepEqual(types(maintenancePlan(snapshot({repository:{relation:'behind',remoteHead:nextRevision}}))),['refresh-repo']);
  for(const repository of [{relation:'behind',trackedDirty:true},{relation:'behind',branch:'codex/unfinished-film'},{relation:'diverged'}]){
    const plan=maintenancePlan(frozen(snapshot({repository})));noAction(plan,'refresh-repo');assert.ok(plan.deferred.length+plan.attention.length>0,JSON.stringify(repository));
  }
  assert.deepEqual(maintenancePlan(snapshot({repository:{relation:'ahead'}})).actions,[],'local unpublished commits are never pushed by routine inspection');
});

test('unavailable or incompletely fetched remote state cannot imply a refresh or current release',()=>{
  const unknown=maintenancePlan(snapshot({repository:{relation:'unknown',remoteHead:null},errors:['Remote is unavailable']}));noAction(unknown,'refresh-repo');assert.ok(unknown.attention.length>0);
  const missing=maintenancePlan(snapshot({repository:{relation:'missing-objects',remoteHead:nextRevision}}));assert.deepEqual(types(missing),['fetch-repo']);
});

test('new software activates only a valid verified revision during known idle work',()=>{
  assert.ok(types(maintenancePlan(snapshot({studio:{verifiedRevision:nextRevision}}))).includes('update-studio'));
  for(const studio of [{verifiedRevision:nextRevision,releaseValid:false},{verifiedRevision:null},{verifiedRevision:nextRevision,activity:'busy'},{verifiedRevision:nextRevision,activity:'unknown'},{verifiedRevision:nextRevision,paused:true}]){
    const plan=maintenancePlan(frozen(snapshot({studio})));noAction(plan,'update-studio');
  }
});

test('repair never restarts active, paused or unknown-activity studios',()=>{
  for(const studio of [{healthy:false},{lastError:'Failed prior startup'}])assert.ok(types(maintenancePlan(snapshot({studio}))).includes('repair-studio'));
  for(const activity of ['busy','unknown'])for(const studio of [{healthy:false,activity},{lastError:'Failed prior startup',activity}]){
    const plan=maintenancePlan(frozen(snapshot({studio})));noAction(plan,'repair-studio');noAction(plan,'update-studio');assert.ok(plan.deferred.length+plan.attention.length>0);
  }
  const paused=maintenancePlan(snapshot({studio:{healthy:false,paused:true}}));noAction(paused,'repair-studio');assert.ok(paused.attention.length+paused.deferred.length>0);
});

test('ordinary film retries require enabled local ownership and healthy running studio',()=>{
  const film={name:'shared-film',enabled:true,ownerLocal:true,status:'pending',paused:false};
  const expected=maintenancePlan(snapshot({films:[film]}));assert.deepEqual(types(expected),['sync-film']);assert.equal(expected.actions[0].name,film.name);
  for(const patch of [{enabled:false},{ownerLocal:false},{paused:true},{status:'synced'},{status:'conflict'},{status:'unknown'}])noAction(maintenancePlan(snapshot({films:[{...film,...patch}]})),'sync-film');
  for(const healthy of [false,null])noAction(maintenancePlan(snapshot({studio:{healthy},films:[film]})),'sync-film');
});

test('paused and conflicted films require attention without forcing ownership or resetting retry caps',()=>{
  for(const film of [{name:'paused-film',enabled:true,ownerLocal:true,status:'pending',paused:true},{name:'conflicted-film',enabled:true,ownerLocal:true,status:'conflict',paused:false},{name:'unknown-film',enabled:true,ownerLocal:true,status:'unknown',paused:false}]){
    const input=frozen(snapshot({films:[film]})),plan=maintenancePlan(input);assert.ok(plan.attention.length>0,JSON.stringify(plan));assert.deepEqual(plan.actions,[]);
  }
});

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function retained(root){const files={};async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name),key=relative(root,path);if(entry.isDirectory())await walk(path);else{const info=await lstat(path);files[key]={bytes:info.size,mode:info.mode,sha256:sha(await readFile(path))};}}}await walk(root);return files;}
async function git(cwd,...args){return (await exec('git',['-c','core.hooksPath=',...args],{cwd,encoding:'utf8',env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'never'}})).stdout.trim();}
async function put(path,bytes){await mkdir(join(path,'..'),{recursive:true});await writeFile(path,bytes);}

async function fixture(t){
  const home=await mkdtemp(join(tmpdir(),'studio-maintenance-contract-'));t.after(()=>rm(home,{recursive:true,force:true}));
  const seed=join(home,'seed'),repo=join(home,'source'),origin=join(home,'origin.git');await mkdir(seed);
  await git(seed,'init','--initial-branch=main');await git(seed,'config','user.name','Independent owned fixture');await git(seed,'config','user.email','fixture@localhost');
  await put(join(seed,'package.json'),JSON.stringify({name:'launch-video-studio',scripts:{studio:'node scripts/studio.mjs'}}));await put(join(seed,'scripts/studio.mjs'),'// Owned harness identity fixture\n');
  await put(join(seed,'tracked.txt'),'original source\n');await put(join(seed,'projects/shared-film/index.html'),'durable film source\n');await put(join(seed,'projects/shared-film/.studio-state/sync.json'),JSON.stringify({schemaVersion:1,enabled:true,owner:'owned-fixture'}));
  await git(seed,'add','.');await git(seed,'commit','-m','Initial owned source');const activeRevision=await git(seed,'rev-parse','HEAD');
  await put(join(seed,'.studio-release.json'),JSON.stringify({schemaVersion:1,sourceRevision:activeRevision,verifiedPlatforms:['darwin','win32']}));await git(seed,'add','.');await git(seed,'commit','-m','Verified release marker');await git(home,'clone','--bare',seed,origin);await git(home,'clone',origin,repo);
  await git(repo,'config','user.name','Independent owned fixture');await git(repo,'config','user.email','fixture@localhost');
  const managedRoot=join(home,'managed'),libraryRoot=join(managedRoot,'library'),controller=join(home,'controller.mjs'),versionRoot=join(managedRoot,'versions',activeRevision),now=2_000_000_000_000;
  await git(home,'clone',origin,libraryRoot);await mkdir(versionRoot,{recursive:true});await put(controller,'// Never execute fixture controller mutations\n');
  const installation={schemaVersion:1,id:'owned-fixture',active:activeRevision,remote:origin};await put(join(managedRoot,'installation.json'),JSON.stringify(installation));
  await put(join(libraryRoot,'.git/studio-managed.json'),JSON.stringify({schemaVersion:1,remote:origin,deviceId:'owned-fixture',enabled:['shared-film'],results:{'shared-film':{status:'synced'}}}));
  await put(join(libraryRoot,'projects/.workspace/sessions.json'),'[]');
  const calls=[],requests=[],discovery={mode:'managed',root:versionRoot,managedRoot,controller,libraryRoot,revision:activeRevision};
  const doctor={running:{port:43127,revision:activeRevision,launchId:'owned-launch',health:{healthy:true,launchId:'owned-launch'}}};
  const run=async(command,args,cwd)=>{calls.push({command,args,cwd});if(command==='git'){
    assert.ok(['branch','rev-parse','status','ls-remote','cat-file','merge-base','show','config'].includes(args[0]),'Collector must never mutate Git: '+args.join(' '));if(args[0]==='config')assert.deepEqual(args,['config','--get','remote.origin.url']);
    return (await exec('git',args,{cwd,encoding:'utf8',env:{...process.env,GIT_OPTIONAL_LOCKS:'0',GIT_NO_LAZY_FETCH:'1',GIT_TERMINAL_PROMPT:'0'}})).stdout;
  }assert.equal(command,process.execPath);assert.deepEqual(args,[controller,'doctor','--root',managedRoot]);return JSON.stringify(doctor);};
  let jobs={jobs:[]};const request=async url=>{requests.push(url);assert.equal(url,'http://127.0.0.1:43127/api/jobs');return jobs;};
  const inspect=options=>inspectMaintenance({repo,home,environment:{},discovery,run,request,now,...options});
  const advance=async()=>{await put(join(seed,'upstream.txt'),'New upstream source\n');await git(seed,'add','.');await git(seed,'commit','-m','Advance owned upstream');await git(seed,'push',origin,'main');};
  return {home,seed,repo,origin,managedRoot,libraryRoot,controller,activeRevision,installation,discovery,doctor,now,calls,requests,run,request,inspect,advance,setJobs:value=>{jobs=value;}};
}

test('read-only collection of real clean Git and healthy synced state preserves all bytes and plans nothing',async t=>{
  const f=await fixture(t),before=await retained(f.home),observed=await f.inspect();
  assert.equal(observed.repository.relation,'current');assert.equal(observed.repository.trackedDirty,false);assert.equal(observed.studio.releaseValid,true);assert.equal(observed.studio.verifiedRevision,f.activeRevision);assert.equal(observed.studio.healthy,true);assert.equal(observed.studio.activity,'idle');
  assert.deepEqual(observed.films,[{name:'shared-film',enabled:true,ownerLocal:true,status:'synced',paused:false}]);assert.deepEqual(maintenancePlan(observed),{actions:[],deferred:[],attention:[]});
  assert.deepEqual(await retained(f.home),before,'the every-prompt probe must not modify even Git index/config files');assert.equal(f.requests.length,1);
});

test('real behind, tracked-dirty, untracked, feature and diverged checkouts remain intact',async t=>{
  const f=await fixture(t);await f.advance();
  let before=await retained(f.home),observed=await f.inspect();assert.equal(observed.repository.relation,'missing-objects');assert.deepEqual(types(maintenancePlan(observed)),['fetch-repo']);assert.deepEqual(await retained(f.home),before);
  await git(f.repo,'fetch','origin');before=await retained(f.home);observed=await f.inspect();assert.equal(observed.repository.relation,'behind');assert.ok(types(maintenancePlan(observed)).includes('refresh-repo'));assert.deepEqual(await retained(f.home),before);
  await put(join(f.repo,'untracked-user-notes.txt'),'Never discard these notes\n');await put(join(f.repo,'tracked.txt'),'Uncommitted source edit\n');before=await retained(f.home);observed=await f.inspect();assert.equal(observed.repository.trackedDirty,true);noAction(maintenancePlan(observed),'refresh-repo');assert.deepEqual(await retained(f.home),before);
  await git(f.repo,'add','tracked.txt');await git(f.repo,'commit','-m','Independent local source');before=await retained(f.home);observed=await f.inspect();assert.equal(observed.repository.relation,'diverged');noAction(maintenancePlan(observed),'refresh-repo');assert.deepEqual(await retained(f.home),before);
  await git(f.repo,'checkout','-b','codex/unfinished');before=await retained(f.home);observed=await f.inspect();assert.equal(observed.repository.branch,'codex/unfinished');noAction(maintenancePlan(observed),'refresh-repo');assert.deepEqual(await retained(f.home),before);
});

test('actual Studio session and job shapes guard active editing/export and unknown state',async t=>{
  const f=await fixture(t),sessions=join(f.libraryRoot,'projects/.workspace/sessions.json');
  await put(sessions,JSON.stringify([['owned-session',{name:'shared-film',lastSeen:f.now-1000}]]));let observed=await f.inspect();assert.equal(observed.studio.activity,'busy');noAction(maintenancePlan({...observed,studio:{...observed.studio,verifiedRevision:nextRevision}}),'update-studio');
  await put(sessions,'[]');f.setJobs({jobs:[{id:'owned-export',status:'rendering'}]});observed=await f.inspect();assert.equal(observed.studio.activity,'busy');
  f.setJobs({jobs:[{id:'complete',status:'complete'},{id:'failed',status:'failed'},{id:'cancelled',status:'cancelled'},{id:'interrupted',status:'interrupted'}]});observed=await f.inspect();assert.equal(observed.studio.activity,'idle');
  await put(sessions,JSON.stringify([['invalid',{name:'shared-film'}]]));observed=await f.inspect();assert.equal(observed.studio.activity,'unknown');assert.ok(observed.errors.length>0);noAction(maintenancePlan({...observed,studio:{...observed.studio,lastError:'Retained failure'}}),'repair-studio');
});

test('paused transport, conflict and foreign ownership stay visible without enabling or taking over films',async t=>{
  const f=await fixture(t),statePath=join(f.libraryRoot,'.git/studio-managed.json'),read=async()=>JSON.parse(await readFile(statePath,'utf8'));
  let state=await read();state.results['shared-film'].status='pending';await put(statePath,JSON.stringify(state));await put(join(f.libraryRoot,'.git/studio-transport.json'),JSON.stringify({'shared-film':3}));
  let observed=await f.inspect();assert.equal(observed.studio.activity,'busy');assert.equal(observed.films[0].paused,true);assert.ok(maintenancePlan(observed).attention.length>0);assert.deepEqual(maintenancePlan(observed).actions,[]);
  state.results['shared-film'].status='conflict';await put(statePath,JSON.stringify(state));await put(join(f.libraryRoot,'.git/studio-transport.json'),'{}');observed=await f.inspect();assert.equal(observed.films[0].status,'conflict');assert.ok(maintenancePlan(observed).attention.length>0);
  state.results['shared-film'].status='pending';await put(statePath,JSON.stringify(state));await put(join(f.libraryRoot,'projects/shared-film/.studio-state/sync.json'),JSON.stringify({enabled:true,owner:'other-device'}));
  const before=await retained(f.home);observed=await f.inspect();assert.equal(observed.films[0].ownerLocal,false);noAction(maintenancePlan(observed),'sync-film');assert.deepEqual(await retained(f.home),before);
  const filtered=await f.inspect({project:'unshared-film'});assert.deepEqual(filtered.films,[]);assert.equal(filtered.studio.activity,'busy','film filtering must not hide another enabled film transport from restart safety');noAction(maintenancePlan({...filtered,studio:{...filtered.studio,verifiedRevision:nextRevision}}),'update-studio');assert.deepEqual(await retained(f.home),before);
});

test('offline remote, failed doctor and failed activity request remain truthful and cannot trigger restart',async t=>{
  const f=await fixture(t),before=await retained(f.home);
  const offline=await f.inspect({run:async(command,args,cwd)=>{if(command==='git'&&args[0]==='ls-remote')throw new Error('Owned simulated offline transport');return f.run(command,args,cwd);}});
  assert.equal(offline.repository.relation,'unknown');assert.equal(offline.studio.releaseValid,false);assert.notEqual(offline.films[0].status,'synced');assert.ok(offline.errors.length>0);
  const failed=await f.inspect({run:async(command,args,cwd)=>{if(command===process.execPath)throw new Error('Owned doctor failure');return f.run(command,args,cwd);}});assert.equal(failed.studio.activity,'unknown');noAction(maintenancePlan({...failed,studio:{...failed.studio,lastError:'Prior failure'}}),'repair-studio');
  const unknown=await f.inspect({request:async()=>{throw new Error('Owned activity request failure');}});assert.equal(unknown.studio.activity,'unknown');noAction(maintenancePlan({...unknown,studio:{...unknown.studio,verifiedRevision:nextRevision}}),'update-studio');assert.deepEqual(await retained(f.home),before);
});

test('default executable collector performs only actual read-only Git and doctor queries',async t=>{
  const f=await fixture(t);await put(f.controller,'process.stdout.write('+JSON.stringify(JSON.stringify(f.doctor))+');\n');const before=await retained(f.home);
  const observed=await inspectMaintenance({repo:f.repo,home:f.home,environment:{...process.env},discovery:f.discovery,request:f.request,now:f.now});
  assert.equal(observed.repository.relation,'current');assert.equal(observed.studio.healthy,true);assert.equal(observed.studio.activity,'idle');assert.deepEqual(maintenancePlan(observed),{actions:[],deferred:[],attention:[]});assert.deepEqual(await retained(f.home),before);
});

test('foreign daemon identity and capped controller recovery cannot be mistaken for idle automatic repair',async t=>{
  const f=await fixture(t);f.doctor.running.health.launchId='different-launch';let observed=await f.inspect();assert.equal(observed.studio.activity,'unknown');assert.notEqual(observed.studio.healthy,true);assert.ok(observed.errors.length>0);
  f.doctor.running.health.launchId='owned-launch';await put(join(f.managedRoot,'installation.json'),JSON.stringify({...f.installation,healthFailures:{[f.activeRevision]:3},lastError:{phase:'health'}}));
  const before=await retained(f.home);observed=await f.inspect();assert.equal(observed.studio.paused,true);assert.ok(maintenancePlan(observed).attention.length>0);noAction(maintenancePlan(observed),'repair-studio');assert.deepEqual(await retained(f.home),before);
});

test('changed code/library origins and sync metadata fail closed without contacting a replacement remote',async t=>{
  const f=await fixture(t),foreign=join(f.home,'foreign-unowned.git');
  await git(f.repo,'remote','set-url','origin',foreign);let before=await retained(f.home);f.calls.length=0;let observed=await f.inspect();
  assert.equal(observed.repository?.relation??'unknown','unknown');assert.ok(observed.errors.length>0);assert.ok(!f.calls.some(c=>c.command==='git'&&c.cwd===f.repo&&c.args[0]==='ls-remote'),'replacement code origin must not be contacted');noAction(maintenancePlan(observed),'refresh-repo');assert.deepEqual(await retained(f.home),before);
  await git(f.repo,'remote','set-url','origin',f.origin);await git(f.libraryRoot,'remote','set-url','origin',foreign);before=await retained(f.home);observed=await f.inspect();assert.ok(observed.errors.length>0);assert.ok(observed.films.every(film=>film.status!=='synced'));noAction(maintenancePlan(observed),'sync-film');assert.deepEqual(await retained(f.home),before);
  await git(f.libraryRoot,'remote','set-url','origin',f.origin);const statePath=join(f.libraryRoot,'.git/studio-managed.json'),state=JSON.parse(await readFile(statePath,'utf8'));await put(statePath,JSON.stringify({...state,remote:foreign}));before=await retained(f.home);observed=await f.inspect();assert.ok(observed.errors.length>0);assert.ok(observed.films.every(film=>film.status!=='synced'));noAction(maintenancePlan(observed),'sync-film');assert.deepEqual(await retained(f.home),before);
});

test('default Git queries scrub inherited repository/config redirects and never execute fsmonitor',async t=>{
  const f=await fixture(t),marker=join(f.home,'forbidden-fsmonitor-write'),monitor=join(f.home,'fsmonitor.sh');
  await put(f.controller,'process.stdout.write('+JSON.stringify(JSON.stringify(f.doctor))+');\n');
  await put(monitor,'#!/bin/sh\nprintf violated > "'+marker.replaceAll('\\','/')+'"\nprintf "token\\0"\n');await chmod(monitor,0o755);await git(f.repo,'config','core.fsmonitor',monitor);
  const before=await retained(f.home),environment={...process.env,GIT_DIR:join(f.home,'missing-git-directory'),GIT_WORK_TREE:f.seed,GIT_INDEX_FILE:join(f.home,'forbidden-index'),GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'remote.origin.url',GIT_CONFIG_VALUE_0:join(f.home,'foreign-injected.git')};
  const observed=await inspectMaintenance({repo:f.repo,home:f.home,environment,discovery:f.discovery,request:f.request,now:f.now});
  assert.equal(observed.repository.relation,'current');assert.equal(observed.studio.healthy,true);assert.deepEqual(maintenancePlan(observed),{actions:[],deferred:[],attention:[]});assert.deepEqual(await retained(f.home),before,'redirect variables and executable Git monitors cannot mutate or redirect inspection');
});

test('verified completed writer handoff is quiet without resetting retained error or retry state, while uncertain handoffs fail closed',async t=>{
  const f=await fixture(t),statePath=join(f.libraryRoot,'.git/studio-managed.json'),retryPath=join(f.libraryRoot,'.git/studio-transport.json'),base=JSON.parse(await readFile(statePath,'utf8'));
  const handed={...base,deviceId:'former-writer',results:{'shared-film':{status:'error',code:'WRITER_CHANGED'}}};await put(statePath,JSON.stringify(handed));await put(retryPath,JSON.stringify({'shared-film':3}));
  let before=await retained(f.home),observed=await f.inspect();
  assert.deepEqual(observed.films,[{name:'shared-film',enabled:true,ownerLocal:false,status:'synced',paused:true,handoffComplete:true}]);assert.equal(observed.studio.activity,'idle');assert.deepEqual(maintenancePlan(observed),{actions:[],deferred:[],attention:[]});assert.deepEqual(await retained(f.home),before,'completed handoff observation must not reset old error, retry ledger, ownership or any file');
  for(const patch of [{ownerLocal:true},{status:'pending'},{status:'unknown'},{handoffComplete:'true'}]){
    const plan=maintenancePlan({...observed,films:[{...observed.films[0],...patch}]});assert.ok(plan.attention.length>0,'an inconsistent handoff flag must not suppress retained paused state: '+JSON.stringify(patch));
  }
  const blocked=async(label,options)=>{
    const preserved=await retained(f.home),value=await f.inspect(options),film=value.films[0],plan=maintenancePlan(value);
    assert.notEqual(film.handoffComplete,true,label);assert.notEqual(film.status,'synced',label);assert.equal(film.paused,true,label);assert.notEqual(value.studio.activity,'idle',label);assert.ok(plan.attention.length+plan.deferred.length>0,label);noAction(plan,'sync-film');assert.deepEqual(await retained(f.home),preserved,label+' must preserve all files');
  };
  for(const [label,state] of [
    ['local owner',{...handed,deviceId:'owned-fixture'}],
    ['different retained error',{...handed,results:{'shared-film':{status:'error',code:'PUSH_FAILED'}}}],
    ['conflict',{...handed,results:{'shared-film':{status:'conflict',code:'WRITER_CHANGED'}}}],
    ['pending is not a completed handoff',{...handed,results:{'shared-film':{status:'pending',code:'WRITER_CHANGED'}}}],
    ['missing error identity',{...handed,results:{'shared-film':{status:'error'}}}]
  ]){await put(statePath,JSON.stringify(state));await blocked(label);}
  await put(statePath,JSON.stringify(handed));await blocked('remote unknown',{run:async(command,args,cwd)=>{if(command==='git'&&args[0]==='ls-remote')throw new Error('Owned remote unavailable');return f.run(command,args,cwd);}});
  const sourcePath=join(f.libraryRoot,'projects/shared-film/index.html'),source=await readFile(sourcePath);await put(sourcePath,'Unsaved local film after ownership moved\n');await blocked('dirty local film');await put(sourcePath,source);
  await put(join(f.seed,'projects/shared-film/index.html'),'Distinct accepted incoming film\n');await git(f.seed,'add','.');await git(f.seed,'commit','-m','Different remote film checkpoint');await git(f.seed,'push',f.origin,'main');await git(f.repo,'fetch','origin');await git(f.repo,'merge','--ff-only','origin/main');await git(f.libraryRoot,'fetch','origin');await blocked('known different remote film tree');
  await git(f.libraryRoot,'merge','--ff-only','origin/main');
  for(const [label,config] of [
    ['shared config disabled',{schemaVersion:1,enabled:false,owner:'owned-fixture'}],
    ['missing owner',{schemaVersion:1,enabled:true}],
    ['null owner',{schemaVersion:1,enabled:true,owner:null}],
    ['empty owner',{schemaVersion:1,enabled:true,owner:''}],
    ['blank owner',{schemaVersion:1,enabled:true,owner:'   '}],
    ['unknown sync schema',{schemaVersion:2,enabled:true,owner:'owned-fixture'}]
  ]){
    await put(join(f.seed,'projects/shared-film/.studio-state/sync.json'),JSON.stringify(config));await git(f.seed,'add','.');await git(f.seed,'commit','-m',label);await git(f.seed,'push',f.origin,'main');for(const root of [f.repo,f.libraryRoot]){await git(root,'fetch','origin');await git(root,'merge','--ff-only','origin/main');}
    assert.equal(await git(f.libraryRoot,'rev-parse','HEAD:projects/shared-film'),await git(f.repo,'rev-parse','HEAD:projects/shared-film'),'rejection must hold even with exactly equal clean known film trees');await blocked('clean matching film with '+label);
  }
});
