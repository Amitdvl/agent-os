import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';
import {verifyAwarenessCommand, validateVisibleEvidence} from '../scripts/verify-awareness-command.mjs';

const id = 'sample-command';
const description = 'Inspect the local sample command';
const bounds = {windowBounds: [0, 0, 640, 480], viewport: [20, 20, 500, 300], row: [24, 40, 470, 32]};
const nativeEvidence = () => ({window: 'Codex Commands', refreshed: true, label: `/${id}`,
  description, visible: true, rowCount: 1, statusText: '1 commands available', ...bounds});
const catalogEntry = () => ({group: 'personal-slash-commands', id, status: 'installed',
  description, invocation: `$${id}`, sourcePath: `<CODEX_HOME>/skills/${id}/SKILL.md`});
const png = () => {
  const bytes = Buffer.alloc(24);
  Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes);
  bytes.write('IHDR', 12, 'ascii');
  bytes.writeUInt32BE(1, 16);
  bytes.writeUInt32BE(1, 20);
  return bytes;
};

async function fixture(context, {installed = '# Sample command\n'} = {}) {
  const root = await mkdtemp(join(tmpdir(), 'awareness-verify-'));
  context.after(() => rm(root, {recursive: true, force: true}));
  const home = join(root, 'home'), codexHome = join(root, 'codex'), output = join(root, 'evidence');
  await mkdir(join(codexHome, 'skills', id), {recursive: true});
  if (installed !== null) await writeFile(join(codexHome, 'skills', id, 'SKILL.md'), installed);
  let screenshotPath;
  const calls = [];
  let entries = [catalogEntry()], native = nativeEvidence();
  let capture = {success: true, data: {window_title: 'Codex Commands'}};
  let writesScreenshot = true, screenshotBytes = png();
  const run = (file, args) => {
    calls.push({file, args});
    if (file === join(home, '.local', 'bin', 'agent-os')) return JSON.stringify({classifiedCatalogue: entries});
    if (file === '/usr/bin/osascript') return JSON.stringify(native);
    if (file === 'peekaboo') {
      screenshotPath = args[args.indexOf('--path') + 1];
      assert.deepEqual(args.slice(0, 2), ['see', '--app']);
      assert.ok(args.includes('--window-title'));
      assert.equal(args[args.indexOf('--window-title') + 1], 'Codex Commands');
      assert.equal(args[args.indexOf('--path') + 1], screenshotPath);
      if (writesScreenshot) {
        // A synchronous fake at the external capture boundary, with no app or account access.
        writeFileSync(screenshotPath, screenshotBytes);
      }
      return JSON.stringify({...capture, data: {...capture.data, screenshot_raw: capture.data.screenshot_raw ?? screenshotPath}});
    }
    throw new Error(`Unexpected command: ${file}`);
  };
  const verify = () => verifyAwarenessCommand({id, home, codexHome, output, app: join(root, 'Awareness.app'), platform: 'darwin', run});
  return {root, output, get screenshotPath() {return screenshotPath;}, calls, verify,
    setEntries: value => {entries = value;}, setNative: value => {native = value;},
    setCapture: value => {capture = value;}, setWritesScreenshot: value => {writesScreenshot = value;},
    setScreenshotBytes: value => {screenshotBytes = value;}};
}

async function assertIncomplete(f, pattern, forbiddenCommand) {
  const result = await f.verify();
  assert.equal(result.status, 'incomplete');
  assert.match(result.error, pattern);
  const persisted = JSON.parse(await readFile(result.receiptPath, 'utf8'));
  assert.equal(persisted.status, 'incomplete');
  assert.equal(persisted.error, result.error);
  if (forbiddenCommand) assert.ok(!f.calls.some(call => call.file === forbiddenCommand));
  return result;
}

test('requires an installed catalog entry and a nonempty installed SKILL.md before native inspection', async t => {
  for (const [name, entries, installed] of [
    ['absent', [], '# Sample\n'],
    ['duplicate', [catalogEntry(), catalogEntry()], '# Sample\n'],
    ['uninstalled', [{...catalogEntry(), status: 'missing'}], '# Sample\n'],
    ['wrong source', [{...catalogEntry(), sourcePath: '<CODEX_HOME>/skills/other/SKILL.md'}], '# Sample\n'],
    ['empty skill', [catalogEntry()], ''],
    ['missing skill', [catalogEntry()], null],
  ]) await t.test(name, async context => {
    const f = await fixture(context, {installed});
    f.setEntries(entries);
    await assertIncomplete(f, /Catalog|skill|ENOENT/i, '/usr/bin/osascript');
  });
});

test('accepts exact refreshed native evidence and an exact-window PNG, then persists a verified receipt', async t => {
  const f = await fixture(t);
  const result = await f.verify();
  assert.equal(result.status, 'verified', result.error);
  assert.equal(result.checks.native.label, `/${id}`);
  assert.equal(result.checks.screenshot.path, f.screenshotPath);
  assert.equal(result.checks.screenshot.bytes, 24);
  assert.equal(JSON.parse(await readFile(result.receiptPath, 'utf8')).status, 'verified');
  assert.deepEqual(f.calls.map(call => call.file), [join(f.root, 'home', '.local', 'bin', 'agent-os'), '/usr/bin/osascript', 'peekaboo']);
});

test('native evidence must be refreshed, exact, visible and geometrically contained', async t => {
  const cases = [
    ['stale', {refreshed: false}], ['refresh failed with old rows', {statusText: 'Could not load Codex commands'}], ['wrong window', {window: 'Awareness'}],
    ['wrong label', {label: '/other'}], ['wrong description', {description: 'Old description'}],
    ['hidden', {visible: false}], ['offscreen', {row: [24, 310, 470, 32]}],
    ['outside window', {viewport: [200, 200, 500, 300]}],
    ['nonfinite', {row: [24, 40, Infinity, 32]}], ['zero size', {row: [24, 40, 0, 32]}],
  ];
  for (const [name, patch] of cases) await t.test(name, async context => {
    const f = await fixture(context);
    f.setNative({...nativeEvidence(), ...patch});
    await assertIncomplete(f, /Native Commands evidence|fully inside/i, 'peekaboo');
  });
  assert.throws(() => validateVisibleEvidence({...nativeEvidence(), row: [20, 20, -1, 30]}, id, description), /fully inside/);
});

test('a later failed verification overwrites an older success receipt', async t => {
  const f = await fixture(t);
  assert.equal((await f.verify()).status, 'verified');
  f.setNative({...nativeEvidence(), refreshed: false});
  const result = await assertIncomplete(f, /Native Commands evidence/, null);
  assert.equal(result.checks.screenshot, undefined);
});

test('rejects a capture for the wrong window or invalid PNG', async t => {
  const f = await fixture(t);
  f.setCapture({success: true, data: {window_title: 'Other'}});
  await assertIncomplete(f, /exact Commands window/);
  f.setCapture({success: true, data: {window_title: 'Codex Commands'}});
  // Even a reported capture must leave a structurally valid PNG.
  f.setScreenshotBytes(Buffer.alloc(24));
  await assertIncomplete(f, /not a PNG/);
});

test('does not reuse a previous PNG when the current capture writes no image', async t => {
  const f = await fixture(t);
  assert.equal((await f.verify()).status, 'verified');
  f.setWritesScreenshot(false);
  await assertIncomplete(f, /capture|screenshot|PNG/i);
});

test('CLI fails nonzero for invalid input without invoking live tools', async () => {
  const result = spawnSync(process.execPath, ['scripts/verify-awareness-command.mjs', '--id', 'Invalid Id'], {encoding: 'utf8'});
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /command id/i);
});
