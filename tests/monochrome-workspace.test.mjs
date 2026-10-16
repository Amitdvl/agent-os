import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile,mkdtemp,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import test from 'node:test';
const root=resolve(import.meta.dirname,'..');
const source=join(root,'skills/monochrome-workspace');
async function files(dir,prefix='') {
 const all=[];
 for(const entry of await readdir(dir,{withFileTypes:true})) {
  const name=prefix+entry.name;
  if(entry.isDirectory()) all.push(...await files(join(dir,entry.name),name+'/'));
  else all.push(name);
 }
 return all.sort();
}
test('creator deployment preserves the whole standalone design kit, including hidden native metadata',async t=>{
 const home=await mkdtemp(join(tmpdir(),'monochrome-kit-'));
 t.after(()=>rm(home,{recursive:true,force:true}));
 const result=spawnSync(process.execPath,[join(root,'bootstrap/cli.mjs'),'setup','--home',home,'--packs','core,creator','--hosts','codex','--apply','--json'],{encoding:'utf8',cwd:root});
 assert.equal(result.status,0,result.stderr+'\n'+result.stdout);
 const installed=join(home,'.codex/skills/monochrome-workspace');
 for(const file of await files(source)) assert.equal(await readFile(join(installed,file),'utf8'),await readFile(join(source,file),'utf8'),`Distribution changed ${file}`);
 assert.ok((await files(installed)).includes('assets/kit/.impeccable/design.json'));
 const catalog=spawnSync(process.execPath,[join(root,'bootstrap/cli.mjs'),'status','--home',home,'--catalog','--json'],{encoding:'utf8',cwd:root});
 assert.equal(catalog.status,0,catalog.stderr);
 const entry=JSON.parse(catalog.stdout).classifiedCatalogue.find(x=>x.id==='monochrome-workspace'&&x.group==='personal-slash-commands');
 assert.equal(entry.invocation,'$monochrome-workspace');assert.equal(entry.status,'installed');
 assert.match(entry.sourcePath,/monochrome-workspace\/SKILL.md$/);
});
test('the specimen is self-contained and native snippets use shipped, scoped primitives',async()=>{
 const kit=join(source,'assets/kit');const html=await readFile(join(kit,'example.html'),'utf8');
 for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if(match[1].startsWith('#'))continue;
  assert.ok(!/^(?:[a-z]+:|\/\/|\/)/i.test(match[1]),`External dependency: ${match[1]}`);
  await readFile(join(kit,match[1]));
 }
 const metadata=JSON.parse(await readFile(join(kit,'kit.json'),'utf8'));
 assert.deepEqual(metadata.runtimeDependencies,[]);
 const reference=await readFile(join(kit,metadata.reference.path),'utf8');
 assert.match(reference,new RegExp(`viewBox="0 0 ${metadata.reference.width} ${metadata.reference.height}"`));
 const embedded=reference.match(/href="data:image\/jpeg;base64,([A-Za-z0-9+/=]+)"/);
 assert.ok(embedded,'Reference must embed its own image rather than depend on an external URL');
 assert.deepEqual([...Buffer.from(embedded[1],'base64').subarray(0,2)],[0xff,0xd8]);
 const sidecar=JSON.parse(await readFile(join(kit,'.impeccable/design.json'),'utf8'));
 assert.equal(sidecar.schemaVersion,2);assert.ok(sidecar.components.length>=5);
 for(const c of sidecar.components){
  for(const classAttr of c.html.matchAll(/class="([^"]+)"/g))for(const name of classAttr[1].split(/\s+/))if(name!=='mw')assert.ok(c.css.includes('.'+name),`Missing style for ${name}`);
  assert.ok(!/(?:^|\n)(?:body|:root|button|input)[\s{.:]/.test(c.css),'Unscoped snippet style');
 }
 const css=await readFile(join(kit,'workspace.css'),'utf8');
 assert.ok(!/(?:^|\n)(?:body|:root|button|input)[\s{.:]/.test(css),'Unscoped kit style');
 const policy=await readFile(join(source,'agents/openai.yaml'),'utf8');assert.match(policy,/allow_implicit_invocation: true/);
});
