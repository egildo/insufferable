import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { init } from '../scripts/init.mjs';

const folder = () => mkdtempSync(join(tmpdir(), 'insufferable-init-'));

test('init writes the config, the icons folder and the page, and returns them', () => {
  const dir = folder();
  const written = init(dir);
  assert.deepEqual(written.sort(), ['icons/.gitkeep', 'index.html', 'insufferable.config.json'].map((name) => join(dir, name)).sort());
  for (const file of written) assert.ok(existsSync(file), file);
});

test('the config keeps the rules of the data model, with no icons and no tokens', () => {
  const dir = folder();
  init(dir);
  const config = JSON.parse(readFileSync(join(dir, 'insufferable.config.json'), 'utf8'));
  assert.deepEqual(Object.keys(config).sort(), ['prefix', 'theme']);
  assert.match(config.prefix, /^[a-z][a-z0-9]*$/);
  assert.deepEqual(Object.keys(config.theme).sort(), ['brand', 'neutral']);
  assert.deepEqual(config.theme.brand, { hue: 38 });
  assert.deepEqual(config.theme.neutral, { hue: 80, chroma: 0.005 });
});

test('the page links the stylesheet, imports the scripts and names its elements under the prefix', () => {
  const dir = folder();
  init(dir);
  const { prefix } = JSON.parse(readFileSync(join(dir, 'insufferable.config.json'), 'utf8'));
  const page = readFileSync(join(dir, 'index.html'), 'utf8');
  for (const part of ['href="insufferable.css"', 'src="components/tabs.js"', 'src="components/icon.js"', '<h1>', '<p>', 'class="solid"', `<${prefix}-tabs `]) {
    assert.ok(page.includes(part), part);
  }
  for (const id of page.matchAll(/aria-controls="([^"]+)"/g)) assert.ok(page.includes(`id="${id[1]}"`), `no panel for ${id[1]}`);
});

test('a second init refuses, naming the config', () => {
  const dir = folder();
  init(dir);
  assert.throws(() => init(dir), /insufferable\.config\.json/);
});

test('a page already in the folder is refused and left as it was, and nothing is written', () => {
  const dir = folder();
  writeFileSync(join(dir, 'index.html'), 'mine');
  assert.throws(() => init(dir), /index\.html/);
  assert.equal(readFileSync(join(dir, 'index.html'), 'utf8'), 'mine');
  assert.ok(!existsSync(join(dir, 'insufferable.config.json')));
});
