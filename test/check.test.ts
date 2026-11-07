import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { load } from '@toghen/lib';
import { checkOverrides } from '../scripts/check.mjs';

const systemDir = resolve('tokens');
const dimension = { $type: 'dimension', $value: { value: 1, unit: 'px' } };

/** The origins of a resolver that lists the system's base set, reached by `tokens`, and an app file in a second set. */
async function originsOf(app: object, tokens = systemDir) {
  const dir = mkdtempSync(join(tmpdir(), 'insufferable-check-'));
  const file = join(dir, 'app.tokens.json');
  writeFileSync(file, JSON.stringify(app));
  const resolver = join(dir, 'app.resolver.json');
  writeFileSync(resolver, JSON.stringify({
    version: '2025-11-01',
    name: 'app',
    sets: {
      base: { sources: [{ $ref: `${tokens}/insufferable.resolver.json#/sets/base` }] },
      app: { sources: [{ $ref: 'app.tokens.json' }] },
    },
    resolutionOrder: [{ $ref: '#/sets/base' }, { $ref: '#/sets/app' }],
  }));
  const { origins } = await load(resolver, { read: async (path: string) => readFileSync(path, 'utf8') });
  return { origins, file, dir };
}

test('the key of a token under ins keeps the ins, as the check reads it', async () => {
  const { origins } = await originsOf({});
  assert.ok(origins.has('ins.radius.1'));
});

test('a path under ins the system does not define stops the build, naming the path, the file and the rule', async () => {
  const { origins, file } = await originsOf({ ins: { radius: { 3: dimension } } });
  assert.throws(() => checkOverrides(origins, systemDir), ({ message }: Error) =>
    message.includes('ins.radius.3') && message.includes(file) && message.includes('a path under ins must exist in the system'));
});

test('an override of a path the system defines passes', async () => {
  const { origins } = await originsOf({ ins: { radius: { 1: dimension } } });
  checkOverrides(origins, systemDir);
});

test("a token in the app's own group passes", async () => {
  const { origins } = await originsOf({ acme: { card: { padding: dimension } } });
  checkOverrides(origins, systemDir);
});

test('the system reached through a symbolic link is still the system', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'insufferable-link-'));
  symlinkSync(systemDir, join(dir, 'tokens'));
  const { origins } = await originsOf({ ins: { radius: { 1: dimension } } }, join(dir, 'tokens'));
  assert.ok(origins.get('ins.radius.1')?.[0].startsWith(dir), 'load names the file through the link');
  checkOverrides(origins, systemDir);
});
