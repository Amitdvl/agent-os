#!/usr/bin/env node
import {execFileSync} from 'node:child_process';
import {createHash, randomUUID} from 'node:crypto';
import {mkdir, readFile, stat, writeFile} from 'node:fs/promises';
import {homedir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const NATIVE = join(dirname(fileURLToPath(import.meta.url)), 'verify-awareness-command.jxa');
const runDefault = (file, args, options = {}) => execFileSync(file, args, {
  encoding: 'utf8', timeout: 45000, maxBuffer: 2 * 1024 * 1024, ...options,
});

export function validateVisibleEvidence(evidence, id, description) {
  if (evidence.window !== 'Codex Commands' || evidence.refreshed !== true ||
      evidence.label !== `/${id}` || evidence.description !== description ||
      evidence.visible !== true || !Number.isInteger(evidence.rowCount) || evidence.rowCount < 1 ||
      evidence.statusText !== `${evidence.rowCount} commands available`)
    throw new Error('Native Commands evidence does not match the requested installed entry');
  const contains = (outer, inner) => Array.isArray(outer) && Array.isArray(inner) &&
    outer.length === 4 && inner.length === 4 && [...outer, ...inner].every(Number.isFinite) &&
    outer[2] > 0 && outer[3] > 0 && inner[2] > 0 && inner[3] > 0 &&
    inner[0] >= outer[0] && inner[1] >= outer[1] &&
    inner[0] + inner[2] <= outer[0] + outer[2] && inner[1] + inner[3] <= outer[1] + outer[3];
  if (!contains(evidence.viewport, evidence.row) || !contains(evidence.windowBounds, evidence.viewport))
    throw new Error('Command row is not fully inside the Commands viewport and window');
  return evidence;
}

export async function verifyAwarenessCommand({id, output, app = join(homedir(), 'Applications', 'Awareness.app'),
  home = homedir(), codexHome = process.env.CODEX_HOME || join(home, '.codex'), run = runDefault,
  platform = process.platform} = {}) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id || '')) throw new Error('A command id containing lowercase letters, digits and hyphens is required');
  if (platform !== 'darwin') throw new Error('Awareness native verification requires macOS');
  if (!output) throw new Error('An evidence output directory is required');
  output = resolve(output);
  const receiptPath = join(output, `${id}-verification.json`);
  const receipt = {schemaVersion: 1, runId: randomUUID(), command: id, startedAt: new Date().toISOString(), status: 'incomplete', checks: {}};
  await mkdir(output, {recursive: true});
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  try {
    const catalog = JSON.parse(run(join(home, '.local', 'bin', 'agent-os'), ['status', '--catalog', '--json']));
    const entries = (catalog.classifiedCatalogue || []).filter(e => e.group === 'personal-slash-commands' && e.id === id);
    if (entries.length !== 1 || entries[0].status !== 'installed' || !entries[0].description)
      throw new Error('Catalog must contain one installed command with a description');
    const entry = entries[0];
    const installedPath = join(codexHome, 'skills', id, 'SKILL.md');
    if (entry.sourcePath !== `<CODEX_HOME>/skills/${id}/SKILL.md`)
      throw new Error('Catalog source path does not identify the installed command');
    const installed = await readFile(installedPath);
    if (!installed.length) throw new Error('Installed skill is empty');
    receipt.checks.catalog = {invocation: entry.invocation, description: entry.description, sourcePath: entry.sourcePath,
      installedSha256: createHash('sha256').update(installed).digest('hex')};
    const native = JSON.parse(run('/usr/bin/osascript', ['-l', 'JavaScript', NATIVE, resolve(app), id, entry.description]));
    receipt.checks.native = validateVisibleEvidence(native, id, entry.description);
    const screenshotPath = join(output, `${id}-commands-${receipt.runId}.png`);
    const capture = JSON.parse(run('peekaboo', ['see', '--app', resolve(app), '--window-title', 'Codex Commands',
      '--path', screenshotPath, '--json']));
    if (capture.success !== true || capture.data?.window_title !== 'Codex Commands' ||
        resolve(capture.data?.screenshot_raw || '') !== screenshotPath)
      throw new Error('Peekaboo did not capture the exact Commands window');
    const image = await readFile(screenshotPath);
    if (image.length < 24 || !image.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ||
        image.toString('ascii', 12, 16) !== 'IHDR' || image.readUInt32BE(16) === 0 || image.readUInt32BE(20) === 0)
      throw new Error('Commands screenshot is not a PNG');
    receipt.checks.screenshot = {path: screenshotPath, bytes: (await stat(screenshotPath)).size,
      sha256: createHash('sha256').update(image).digest('hex')};
    receipt.status = 'verified';
  } catch (error) {
    receipt.error = error.message;
  }
  receipt.finishedAt = new Date().toISOString();
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return {...receipt, receiptPath};
}

async function main() {
  const args = process.argv.slice(2), options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.slice(2);
    if (!args[i]?.startsWith('--') || !['id', 'output', 'app'].includes(key) || !args[i + 1] || key in options)
      throw new Error('Usage: node scripts/verify-awareness-command.mjs --id COMMAND --output DIRECTORY [--app APP_PATH]');
    options[key] = args[i + 1];
  }
  const result = await verifyAwarenessCommand(options);
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== 'verified') process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  main().catch(error => {console.error(error.message); process.exitCode = 1;});
