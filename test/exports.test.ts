import assert from 'node:assert/strict';
import { existsSync, globSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

type Entry = string | Record<string, string>;

const exported: Record<string, Entry> = JSON.parse(readFileSync('package.json', 'utf8')).exports;

/** Every path the export map points at, with the export that names it. */
const targets = Object.entries(exported).flatMap(([name, entry]) =>
  (typeof entry === 'string' ? [entry] : Object.values(entry)).map((target) => ({ name, target: target.replace(/^\.\//, '') })),
);

test('every built script has an export', () => {
  const built = globSync('dist/**/*.js').filter((file) => !file.startsWith('dist/fonts/'));
  assert.ok(built.length > 0, 'dist/ holds no scripts: run pnpm build');
  const missing = built.filter((file) => !targets.some(({ target }) => target === file));
  assert.deepEqual(missing, [], `no export for ${missing.join(', ')}`);
});

test('every export points at a file that exists', () => {
  const absent = targets
    .filter(({ target }) => !existsSync(target.replace(/\*$/, '')))
    .map(({ name, target }) => `${name} -> ${target}`);
  assert.deepEqual(absent, [], `missing after pnpm build: ${absent.join(', ')}`);
});
