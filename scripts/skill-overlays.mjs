#!/usr/bin/env node
// Reviewed entrypoint overlays only. Unknown versions/content fail before any write.
import { readFile, writeFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve, relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export async function inspectOverlays(pluginRoot, mode = 'preview') {
  if (!['preview', 'check', 'apply'].includes(mode)) throw new Error('Unknown overlay mode');
  const base = await realpath(pluginRoot);
  const { overlays } = JSON.parse(await readFile(resolve(root, 'manifest/skill-overlays.json'), 'utf8'));
  const plans = [];
  for (const item of overlays) {
    for (const path of [item.target, item.source]) {
      if (isAbsolute(path) || path.split(/[\\/]/).includes('..')) throw new Error('Unsafe overlay path');
    }
    const target = await realpath(resolve(base, item.target));
    if (!target.startsWith(base + sep)) throw new Error('Overlay target escapes plugin root');
    const source = await realpath(resolve(root, item.source));
    if (!source.startsWith(root + sep)) throw new Error('Overlay source escapes repository');
    const [actual, expected] = await Promise.all([readFile(target), readFile(source)]);
    if (hash(expected) !== item.overlaySha256) throw new Error(`Overlay source changed: ${item.id}`);
    const actualHash = hash(actual);
    const state = actualHash === item.overlaySha256 ? 'match' : actualHash === item.originalSha256 ? 'reviewed-original' : 'unreviewed';
    plans.push({ id: item.id, target, expected, state });
  }
  // Batch preflight prevents partial application when any target has drifted.
  if (plans.some(p => p.state === 'unreviewed')) throw new Error('Unreviewed plugin content; re-review overlays before applying');
  if (mode === 'apply') {
    for (const plan of plans) if (plan.state === 'reviewed-original') {
      await writeFile(plan.target, plan.expected);
      if (hash(await readFile(plan.target)) !== hash(plan.expected)) throw new Error(`Overlay read-back failed: ${plan.id}`);
      plan.state = 'match';
    }
  }
  return { ok: mode !== 'check' || plans.every(p => p.state === 'match'), mode,
    overlays: plans.map(({ id, target, state }) => ({ id, target: relative(base, target), state })) };
}
if (process.argv[1] && await realpath(process.argv[1]) === await realpath(fileURLToPath(import.meta.url))) {
  try {
    const args = process.argv.slice(2);
    const flags = args.filter(a => a.startsWith('--'));
    if (flags.some(a => !['--plugin-root', '--check', '--apply'].includes(a)) || (args.includes('--check') && args.includes('--apply'))) throw new Error('Use --plugin-root <installed-cache-root> [--check|--apply]');
    const index = args.indexOf('--plugin-root');
    if (index < 0 || !args[index + 1] || args[index + 1].startsWith('--')) throw new Error('--plugin-root is required');
    const result = await inspectOverlays(args[index + 1], args.includes('--apply') ? 'apply' : args.includes('--check') ? 'check' : 'preview');
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
  } catch (error) { console.error(`skill-overlays: ${error.message}`); process.exitCode = 1; }
}
