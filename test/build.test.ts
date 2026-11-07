import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { before, test } from 'node:test';
import { elements } from '../src/elements.ts';
// @ts-expect-error the build script is plain JavaScript
import { loadSystem, writeCss } from '../scripts/build.mjs';

const ICONS = ['check', 'quince-mark'];

/**
 * An app's resolver in a temp folder, of the shape the example app's has and the generated one will have. It is written
 * here rather than copied from the example, whose hand-written resolver gives way to a config. `family` is the inline
 * source that sets the icon font's token, left out to see the build refuse.
 */
function app(extension: object | undefined, family?: string) {
  const dir = mkdtempSync(join(tmpdir(), 'ins-build-'));
  const tokens = relative(dir, resolve('tokens'));
  mkdirSync(join(dir, 'icons'));
  writeFileSync(join(dir, 'icons/quince-mark.svg'), '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/></svg>');
  const sources: object[] = [{ $ref: `${tokens}/insufferable.resolver.json#/sets/base` }];
  if (family) sources.push({ ins: { font: { family: { icon: { $value: [family] } } } } });
  const path = join(dir, 'app.resolver.json');
  writeFileSync(path, JSON.stringify({
    version: '2025-11-01',
    name: 'insufferable',
    ...(extension && { $extensions: { 'dev.insufferable': extension } }),
    sets: { base: { sources } },
    resolutionOrder: [{ $ref: '#/sets/base' }, { $ref: '#/modifiers/theme' }],
    modifiers: {
      theme: {
        default: 'light',
        contexts: {
          light: [{ $ref: `${tokens}/theme.light.tokens.json` }],
          dark: [{ $ref: `${tokens}/theme.dark.tokens.json` }],
        },
        $extensions: { 'com.toghen': { css: { lightDark: { light: 'light', dark: 'dark' } } } },
      },
    },
  }));
  return { path, out: join(dir, 'out') };
}

/** Every file under a folder, by its path from there. */
const files = (dir: string) => (readdirSync(dir, { recursive: true }) as string[]).filter((file) => /\.\w+$/.test(file));

let quince: string;
let css: string;

before(async () => {
  const { path, out } = app({ prefix: 'quince', icons: ICONS }, 'quince-icons');
  await writeCss(path, out);
  quince = out;
  css = readFileSync(join(out, 'insufferable.css'), 'utf8');
});

test('an app gets every path of the layout', () => {
  const expected = [
    'insufferable.css',
    'fonts/quince-icons.woff2',
    'fonts/quince-icons.ttf',
    'fonts/archivo-latin-standard-normal.woff2',
    'fonts/fraunces-latin-full-normal.woff2',
    ...['color', 'commands', 'dates', 'elements', 'icons', 'keys', ...elements.map((name) => `components/${name}`)].flatMap((name) => [`${name}.js`, `${name}.d.ts`]),
  ];
  for (const path of expected) assert.ok(existsSync(join(quince, path)), `${path} was not written`);
});

test('each script has its types, and both carry the app\'s prefix', () => {
  const scripts = files(quince).filter((file) => file.endsWith('.js'));
  for (const script of scripts) assert.ok(existsSync(join(quince, script.replace(/\.js$/, '.d.ts'))), `${script} has no types`);
  for (const file of ['components/icon.js', 'components/icon.d.ts']) {
    const text = readFileSync(join(quince, file), 'utf8');
    assert.match(text, /quince-icon/, file);
    assert.doesNotMatch(text, /insufferable-icon/, file);
  }
});

test('the stylesheet names the app\'s font in the face and the icon rule, and no other', () => {
  assert.match(css, /font-family: "quince-icons"/);
  assert.match(css, /url\("\.\/fonts\/quince-icons\.woff2"\)/);
  assert.match(css, /--ins-font-family-icon: quince-icons/);
  assert.match(css, /quince-icon\[name='quince-mark'\]::before/);
  assert.doesNotMatch(css, /tabler-icons|insufferable-icons/);
});

test('the app\'s list is in icons.js and in icons.d.ts', async () => {
  const { icons } = await import(join(quince, 'icons.js'));
  assert.deepEqual(icons, ICONS);
  const types = readFileSync(join(quince, 'icons.d.ts'), 'utf8');
  assert.match(types, /"quince-mark"/);
  assert.doesNotMatch(types, /adjustments-horizontal/);
});

test('an app that chooses neither prefix nor icons gets the same layout, with the system\'s list', async () => {
  const { path, out } = app(undefined);
  await writeCss(path, out);
  for (const file of ['fonts/insufferable-icons.woff2', 'fonts/insufferable-icons.ttf', 'components/tabs.js', 'components/tabs.d.ts', 'icons.d.ts']) {
    assert.ok(existsSync(join(out, file)), `${file} was not written`);
  }
  const { icons } = await import(join(out, 'icons.js'));
  assert.ok(icons.includes('adjustments-horizontal'));
});

test('a token and a prefix that disagree on the font fail the build, by name', async () => {
  const { path, out } = app({ prefix: 'quince' });
  await assert.rejects(writeCss(path, out), /ins\.font\.family\.icon.*insufferable-icons.*quince-icons/);
});

test('an app\'s files are never written into the system\'s dist', async () => {
  const { path } = app(undefined);
  await assert.rejects(writeCss(path, 'dist'), /dist/);
  await assert.rejects(writeCss(path), /dist/);
});

test('the system\'s own build names its font insufferable-icons', () => {
  const system = readFileSync('dist/insufferable.css', 'utf8');
  assert.match(system, /font-family: "insufferable-icons"/);
  assert.match(system, /--ins-font-family-icon: insufferable-icons/);
  assert.doesNotMatch(system, /tabler-icons/);
  for (const file of ['insufferable-icons.woff2', 'insufferable-icons.ttf']) assert.ok(existsSync(join('dist/fonts', file)), `${file} was not written`);
});

test('the system loads with @toghen/lib\'s own result beside its fields', async () => {
  const { load, prefix, name } = await loadSystem();
  assert.equal(prefix, 'insufferable');
  assert.equal(name, 'insufferable');
  assert.ok(load.origins instanceof Map);
});
