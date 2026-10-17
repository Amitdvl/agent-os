import assert from 'node:assert/strict';
import { spawnSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, copyFile, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const helper = join(root, 'skills/frontend-testing-debugging/scripts/with_server.py');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const quote = value => "'" + String(value).replaceAll("'", "'\\''") + "'";
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const python = 'python3';

function cli(args) {
  const result = spawnSync(process.execPath, [join(root, 'bootstrap/cli.mjs'), ...args], { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}
async function temporary(context, label) {
  const directory = await mkdtemp(join(tmpdir(), `agent-os-${label}-`));
  context.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}
async function files(directory, base = directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await files(path, base));
    else {
      assert.ok(entry.isFile(), `Nonportable package file: ${path}`);
      found.push(relative(base, path));
    }
  }
  return found.sort();
}

test('approved consolidated packages install completely, remain discoverable, and replay without conflicts', async context => {
  const home = join(await temporary(context, 'approved-install'), 'home');
  const args = ['setup', '--home', home, '--packs', 'core,creator,web-development', '--hosts', 'codex,claude-code', '--json'];
  cli([...args, '--apply']);
  const packages = [
    ['skills', 'cloudflare'], ['skills', 'agents-sdk'], ['skills', 'frontend-testing-debugging'],
    ['skills', 'current-limiting-factor'], ['skills', 'outcome-loop'],
  ];
  for (const [kind, id] of packages) {
    const source = join(root, kind, id);
    const sourceFiles = await files(source);
    assert.ok(sourceFiles.includes('SKILL.md'));
    for (const host of ['.codex', '.claude']) {
      const installed = join(home, host, 'skills', id);
      assert.deepEqual(await files(installed), sourceFiles, `${host}/${id} dropped package files`);
      for (const file of sourceFiles) assert.deepEqual(await readFile(join(installed, file)), await readFile(join(source, file)), `${host}/${id}/${file} changed during install`);
    }
  }
  for (const [host, file] of [['.codex', 'skills/commands/SKILL.md'], ['.claude', 'commands/commands.md']]) {
    assert.deepEqual(await readFile(join(home, host, file)), await readFile(join(root, 'commands/commands/SKILL.md')), `${host} lost installed-first discovery guidance`);
  }
  for (const host of ['.codex', '.claude']) {
    const installed = await readdir(join(home, host, 'skills'));
    for (const retired of ['cloudflare-deploy', 'webapp-testing', 'find-skills']) assert.ok(!installed.includes(retired), `Retired ${retired} is still distributed`);
  }
  const replay = cli(args);
  assert.equal(replay.conflicts, 0);
  for (const [, id] of packages) {
    const operations = replay.operations.filter(item => item.path.includes(`/skills/${id}/`));
    assert.ok(operations.length > 0, `${id} has no replay operations`);
    assert.ok(operations.every(item => item.status === 'unchanged'), `${id} is not stable on replay`);
  }
  const catalogue = cli(['status', '--home', home, '--catalog', '--json']).classifiedCatalogue;
  for (const [, id] of packages) assert.ok(catalogue.some(item => item.id === id && item.status === 'installed'), `${id} is absent from installed discovery`);
});

test('core selection does not pull provider or frontend QA packages into every installation', async context => {
  const home = join(await temporary(context, 'approved-core'), 'home');
  cli(['setup', '--home', home, '--packs', 'core', '--hosts', 'codex', '--apply', '--json']);
  const installed = await readdir(join(home, '.codex/skills'));
  for (const id of ['cloudflare', 'agents-sdk', 'frontend-testing-debugging']) assert.ok(!installed.includes(id), `${id} leaked into core`);
  assert.ok(installed.includes('current-limiting-factor'));
});

test('catalogue retains physically installed provider packages when a later status selection excludes their pack', async context => {
  const home = join(await temporary(context, 'approved-catalogue'), 'home');
  const absent = cli(['status', '--home', home, '--packs', 'core', '--catalog', '--json']).classifiedCatalogue;
  for (const id of ['cloudflare', 'agents-sdk']) assert.ok(!absent.some(item => item.id === id && item.group === 'personal-slash-commands' && item.status === 'installed'), `Absent ${id} falsely appears installed`);
  cli(['setup', '--home', home, '--packs', 'core,web-development', '--hosts', 'codex', '--apply', '--json']);
  const selectedCore = cli(['status', '--home', home, '--packs', 'core', '--catalog', '--json']).classifiedCatalogue;
  for (const id of ['cloudflare', 'agents-sdk']) assert.ok(selectedCore.some(item => item.id === id && item.group === 'personal-slash-commands' && item.status === 'installed' && item.invocation === `$${id}` && item.source === 'manifest/skills.json' && item.sourcePath === `<CODEX_HOME>/skills/${id}/SKILL.md`), `Installed ${id} disappears when its pack is not selected`);
});

test('deployment reconciliation retains auth, primary references, license and QA examples', async () => {
  const cloud = join(root, 'skills/cloudflare');
  const reconciliations = JSON.parse(await readFile(join(cloud, 'reconciliation.json'), 'utf8'));
  assert.equal(reconciliations.length, 44, 'All originally differing entry/reference decisions must remain traceable');
  assert.equal(new Set(reconciliations.map(item => item.path)).size, 44);
  for (const item of reconciliations) {
    assert.match(item.platformSha256, /^[a-f0-9]{64}$/);
    assert.match(item.deploymentSha256, /^[a-f0-9]{64}$/);
    assert.notEqual(item.platformSha256, item.deploymentSha256);
    assert.ok(item.resolution, `Missing reconciliation reason: ${item.path}`);
    const retained = await readFile(join(cloud, item.path));
    if (item.path !== 'SKILL.md' && !item.path.startsWith('references/wrangler/')) {
      assert.equal(hash(retained), item.platformSha256, `${item.path} no longer retains the reviewed primary reference`);
    }
  }
  for (const file of ['references/wrangler/auth.md', 'references/deployment.md', 'LICENSE.txt']) await access(join(cloud, file));
  const qa = join(root, 'skills/frontend-testing-debugging');
  for (const file of ['LICENSE.txt', 'examples/console_logging.py', 'examples/element_discovery.py', 'examples/static_html_automation.py', 'scripts/with_server.py']) await access(join(qa, file));
});

async function freePort() {
  const listener = net.createServer();
  await new Promise((resolve, reject) => listener.once('error', reject).listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  return port;
}
async function listening(port) {
  return new Promise(resolve => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => resolve(false));
    socket.setTimeout(300, () => { socket.destroy(); resolve(false); });
  });
}
async function eventually(check, message) {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (await check()) return;
    await pause(25);
  }
  assert.fail(message);
}
async function fixture(context) {
  const directory = await mkdtemp(join(tmpdir(), 'agent-os-qa-lifecycle-'));
  const serverScript = join(directory, 'server.py');
  await writeFile(serverScript, `import os,pathlib,socket,sys,time\npathlib.Path(sys.argv[2]).write_text(str(os.getpid()))\nif sys.argv[3]=='hang':\n while True: time.sleep(.1)\ns=socket.socket();s.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1);s.bind(('127.0.0.1',int(sys.argv[1])));s.listen()\nwhile True:\n c,_=s.accept();c.close()\n`);
  const servers = [];
  context.after(async () => {
    for (const server of servers) {
      try { process.kill(Number(await readFile(server.pidFile, 'utf8')), 'SIGTERM'); }
      catch (error) { if (!['ENOENT', 'ESRCH'].includes(error.code)) throw error; }
    }
    await rm(directory, { recursive: true, force: true });
  });
  return {
    directory,
    async server(mode = 'ready') {
      const port = await freePort();
      const pidFile = join(directory, `pid-${servers.length}`);
      const result = { port, pidFile, command: `${python} ${quote(serverScript)} ${port} ${quote(pidFile)} ${mode} >${quote(join(directory, `server-${servers.length}.log`))} 2>&1 & wait` };
      servers.push(result);
      return result;
    },
  };
}
const argsFor = servers => servers.flatMap(server => ['--server', server.command, '--port', String(server.port)]);
function runHelper(args) { return spawnSync(python, [helper, ...args], { encoding: 'utf8', timeout: 15000, maxBuffer: 1024 * 1024 }); }
async function assertStopped(servers) {
  for (const server of servers) {
    await eventually(async () => !await listening(server.port), `Owned descendant is still listening on ${server.port}`);
    const pid = Number(await readFile(server.pidFile, 'utf8'));
    await eventually(() => { try { process.kill(pid, 0); return false; } catch (error) { if (error.code === 'ESRCH') return true; throw error; } }, `Owned descendant ${pid} survived cleanup`);
  }
}
const posix = { skip: process.platform === 'win32' ? 'POSIX process group lifecycle checks; Windows tree cleanup requires a Windows runner' : false };

test('multi-server helper waits for both servers, runs the dependent command and stops shell descendants', posix, async context => {
  const setup = await fixture(context);
  const servers = [await setup.server(), await setup.server()];
  const marker = join(setup.directory, 'dependent-ran');
  const dependent = `import pathlib,socket\nfor p in ${JSON.stringify(servers.map(item => item.port))}:\n s=socket.create_connection(('127.0.0.1',p));s.close()\npathlib.Path(${JSON.stringify(marker)}).write_text('both ready')`;
  const result = runHelper([...argsFor(servers), '--timeout', '3', '--', python, '-c', dependent]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(marker, 'utf8'), 'both ready');
  await assertStopped(servers);
});

test('helper preserves a failing dependent command exit status and still stops descendants', posix, async context => {
  const setup = await fixture(context);
  const server = await setup.server();
  const result = runHelper([...argsFor([server]), '--timeout', '3', '--', python, '-c', 'raise SystemExit(7)']);
  assert.equal(result.status, 7, result.stderr);
  await assertStopped([server]);
});

test('failed second startup does not run dependent work and cleans the first server', posix, async context => {
  const setup = await fixture(context);
  const servers = [await setup.server(), await setup.server('hang')];
  const marker = join(setup.directory, 'must-not-run');
  const result = runHelper([...argsFor(servers), '--timeout', '.3', '--', python, '-c', `import pathlib;pathlib.Path(${JSON.stringify(marker)}).touch()`]);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /did not start/);
  await assert.rejects(access(marker), { code: 'ENOENT' });
  await assertStopped(servers);
});

test('invalid server/port arity is rejected before any startup or dependent side effect', posix, async context => {
  const setup = await fixture(context);
  const server = await setup.server();
  const marker = join(setup.directory, 'must-not-run');
  const result = runHelper(['--server', server.command, '--port', String(server.port), '--port', String(await freePort()), '--', python, '-c', `import pathlib;pathlib.Path(${JSON.stringify(marker)}).touch()`]);
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /counts must match/);
  await assert.rejects(access(server.pidFile), { code: 'ENOENT' });
  await assert.rejects(access(marker), { code: 'ENOENT' });
});

test('occupied unrelated server is retained and no owned process is started', posix, async context => {
  const setup = await fixture(context);
  const server = await setup.server();
  const listener = net.createServer(socket => socket.destroy());
  await new Promise(resolve => listener.listen(server.port, '127.0.0.1', resolve));
  context.after(() => new Promise(resolve => listener.close(resolve)));
  const result = runHelper([...argsFor([server]), '--', python, '-c', 'raise SystemExit(0)']);
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /already occupied/);
  await assert.rejects(access(server.pidFile), { code: 'ENOENT' });
  assert.ok(await listening(server.port), 'Helper stopped an unrelated listener');
});

test('SIGTERM during dependent work stops both the dependent process and owned server groups', posix, async context => {
  const setup = await fixture(context);
  const server = await setup.server();
  const dependentPid = join(setup.directory, 'dependent-pid');
  const child = spawn(python, [helper, ...argsFor([server]), '--timeout', '3', '--', python, '-c', `import os,pathlib,time;pathlib.Path(${JSON.stringify(dependentPid)}).write_text(str(os.getpid()));time.sleep(30)`], { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', bytes => { stderr += bytes; });
  const exited = new Promise(resolve => child.once('exit', (code, signal) => resolve({ code, signal })));
  context.after(() => { child.kill('SIGKILL'); });
  await eventually(async () => { try { await access(dependentPid); return true; } catch { return false; } }, 'Dependent never started');
  child.kill('SIGTERM');
  const result = await exited;
  assert.equal(result.code, 143, stderr);
  await assertStopped([server]);
  const pid = Number(await readFile(dependentPid, 'utf8'));
  await eventually(() => { try { process.kill(pid, 0); return false; } catch (error) { if (error.code === 'ESRCH') return true; throw error; } }, 'Dependent process survived helper interruption');
});

async function overlayFixture(context) {
  const directory = await temporary(context, 'overlays');
  const repo = join(directory, 'repo');
  const cache = join(directory, 'cache');
  await mkdir(join(repo, 'scripts'), { recursive: true });
  await mkdir(join(repo, 'manifest'), { recursive: true });
  await copyFile(join(root, 'scripts/skill-overlays.mjs'), join(repo, 'scripts/skill-overlays.mjs'));
  const definitions = JSON.parse(await readFile(join(root, 'manifest/skill-overlays.json'), 'utf8'));
  const originals = new Map();
  for (const [index, entry] of definitions.overlays.entries()) {
    const original = Buffer.from(`Reviewed synthetic original ${index}\n`);
    originals.set(entry.target, original);
    const source = await readFile(join(root, entry.source));
    await mkdir(dirname(join(repo, entry.source)), { recursive: true });
    await writeFile(join(repo, entry.source), source);
    await mkdir(dirname(join(cache, entry.target)), { recursive: true });
    await writeFile(join(cache, entry.target), original);
    entry.originalSha256 = hash(original);
  }
  const manifest = join(repo, 'manifest/skill-overlays.json');
  await writeFile(manifest, JSON.stringify(definitions));
  return { repo, cache, definitions, originals, manifest,
    run: (...args) => spawnSync(process.execPath, [join(repo, 'scripts/skill-overlays.mjs'), '--plugin-root', cache, ...args], { encoding: 'utf8' }) };
}

test('overlay preview and check are read-only; apply updates all reviewed targets and is stable on replay', async context => {
  const fixture = await overlayFixture(context);
  const preview = fixture.run();
  assert.equal(preview.status, 0, preview.stderr);
  assert.ok(preview.stdout, JSON.stringify(preview));
  assert.ok(JSON.parse(preview.stdout).overlays.every(item => item.state === 'reviewed-original'));
  const unchecked = fixture.run('--check');
  assert.equal(unchecked.status, 1);
  for (const entry of fixture.definitions.overlays) assert.deepEqual(await readFile(join(fixture.cache, entry.target)), fixture.originals.get(entry.target));
  const apply = fixture.run('--apply');
  assert.equal(apply.status, 0, apply.stderr);
  for (const entry of fixture.definitions.overlays) assert.deepEqual(await readFile(join(fixture.cache, entry.target)), await readFile(join(fixture.repo, entry.source)));
  assert.equal(fixture.run('--check').status, 0);
  const replay = fixture.run('--apply');
  assert.equal(replay.status, 0, replay.stderr);
  assert.ok(JSON.parse(replay.stdout).overlays.every(item => item.state === 'match'));
});

test('one unknown overlay target rejects the whole batch without partial application', async context => {
  const fixture = await overlayFixture(context);
  const last = fixture.definitions.overlays.at(-1);
  const drift = Buffer.from('New vendor version requires review\n');
  await writeFile(join(fixture.cache, last.target), drift);
  const result = fixture.run('--apply');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unreviewed plugin content/);
  for (const entry of fixture.definitions.overlays) assert.deepEqual(await readFile(join(fixture.cache, entry.target)), entry === last ? drift : fixture.originals.get(entry.target));
});

test('overlay source drift is rejected before writes', async context => {
  const fixture = await overlayFixture(context);
  await writeFile(join(fixture.repo, fixture.definitions.overlays.at(-1).source), 'Unreviewed local edit');
  const result = fixture.run('--apply');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Overlay source changed/);
  for (const entry of fixture.definitions.overlays) assert.deepEqual(await readFile(join(fixture.cache, entry.target)), fixture.originals.get(entry.target));
});

test('overlay traversal and symlink escapes are rejected without modifying targets', async context => {
  const fixture = await overlayFixture(context);
  const first = fixture.definitions.overlays[0];
  first.target = '../outside.md';
  const outside = join(dirname(fixture.cache), 'outside.md');
  await writeFile(outside, 'keep');
  await writeFile(fixture.manifest, JSON.stringify(fixture.definitions));
  const traversal = fixture.run('--apply');
  assert.equal(traversal.status, 1);
  assert.match(traversal.stderr, /Unsafe overlay path/);
  assert.equal(await readFile(outside, 'utf8'), 'keep');
  first.target = 'linked.md';
  await symlink(outside, join(fixture.cache, 'linked.md'));
  await writeFile(fixture.manifest, JSON.stringify(fixture.definitions));
  const escape = fixture.run('--apply');
  assert.equal(escape.status, 1);
  assert.match(escape.stderr, /escapes plugin root/);
  assert.equal(await readFile(outside, 'utf8'), 'keep');
});
