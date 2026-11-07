import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { load, Resolver } from '@toghen/lib';
import { buildApp, composeResolver, readConfig } from '../scripts/config.mjs';

const CHECKOUT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const folder = () => mkdtempSync(join(tmpdir(), 'ins config test-'));
const withConfig = (config: object, dir = folder()) => {
  const path = join(dir, 'insufferable.config.json');
  writeFileSync(path, JSON.stringify(config));
  return path;
};
const refuses = (config: object, ...culprits: string[]) =>
  assert.throws(
    () => readConfig(withConfig(config)),
    (error: Error) => culprits.every((culprit) => error.message.includes(culprit)) || assert.fail(error.message),
  );

test('an unknown key is refused by name, with the keys the config accepts', () => {
  refuses({ prefx: 'quince' }, '"prefx"', 'prefix, icons, theme, tokens, light, dark, resolver, out');
});

test('an unknown key inside the theme is refused by name too', () => {
  refuses({ theme: { brand: { hue: 38, loc: '#000000' }, neutral: { hue: 80, chroma: 0 } } }, '"loc"', 'hue, lock');
});

test('a token file that is not there is refused by its path as resolved from the config folder', () => {
  const dir = folder();
  assert.throws(() => readConfig(withConfig({ tokens: ['missing.tokens.json'] }, dir)), (error: Error) => error.message.includes(join(dir, 'missing.tokens.json')));
});

test('a prefix that cannot start a custom element name is refused by its value and the rule', () => {
  refuses({ prefix: 'Quince' }, '"Quince"', '^[a-z][a-z0-9]*$');
});

test('an icon name that cannot be a ligature is refused by its value and the rule', () => {
  refuses({ icons: ['chevron down'] }, '"chevron down"', '^[a-z0-9]+(-[a-z0-9]+)*$');
});

test('a resolver beside a theme is refused, saying that the resolver replaces the composed one', () => {
  refuses({ resolver: 'mine.resolver.json', theme: { brand: { hue: 38 }, neutral: { hue: 80, chroma: 0 } } }, '"resolver"', '"theme"', 'replaces the composed one');
});

test('a valid config comes back as it was written, with its folder', () => {
  const dir = folder();
  mkdirSync(join(dir, 'icons'));
  writeFileSync(join(dir, 'icons/quince-mark.svg'), '<svg/>');
  const config = { prefix: 'quince', icons: ['check', 'quince-mark'], out: 'site' };
  assert.deepEqual(readConfig(withConfig(config, dir)), { config, dir });
});

test('a full config composes the whole document, with every path relative to the output', () => {
  const config = { prefix: 'quince', icons: ['check'], theme: { brand: { hue: 38 }, neutral: { hue: 80, chroma: 0 } }, tokens: ['shape.tokens.json'], light: ['paper.tokens.json'], dark: ['ink.tokens.json'] };
  assert.deepEqual(composeResolver(config, '/app', '/app', '/app/node_modules/insufferable'), {
    description: 'Written by insufferable build from insufferable.config.json: do not edit.',
    version: '2025-11-01',
    name: 'insufferable',
    sets: {
      base: { sources: [{ $ref: 'node_modules/insufferable/tokens/insufferable.resolver.json#/sets/base' }] },
      app: {
        sources: [
          { $ref: 'theme/palette.tokens.json' },
          { $ref: 'theme/fonts.tokens.json' },
          { $ref: 'shape.tokens.json' },
          { ins: { font: { family: { icon: { $value: ['quince-icons'] } } } } },
        ],
      },
    },
    resolutionOrder: [{ $ref: '#/sets/base' }, { $ref: '#/sets/app' }, { $ref: '#/modifiers/theme' }],
    modifiers: {
      theme: {
        default: 'light',
        contexts: {
          light: [{ $ref: 'node_modules/insufferable/tokens/theme.light.tokens.json' }, { $ref: 'theme/light.tokens.json' }, { $ref: 'paper.tokens.json' }],
          dark: [{ $ref: 'node_modules/insufferable/tokens/theme.dark.tokens.json' }, { $ref: 'theme/dark.tokens.json' }, { $ref: 'ink.tokens.json' }],
        },
        $extensions: { 'com.toghen': { css: { lightDark: { light: 'light', dark: 'dark' } } } },
      },
    },
    $extensions: { 'dev.insufferable': { prefix: 'quince', icons: ['check'] } },
  });
});

test('a config that names nothing composes no app set, and the system\'s prefix', () => {
  const document = composeResolver({}, '/app', '/app/site', '/insufferable');
  assert.deepEqual(Object.keys(document.sets), ['base']);
  assert.deepEqual(document.resolutionOrder, [{ $ref: '#/sets/base' }, { $ref: '#/modifiers/theme' }]);
  assert.equal(document.sets.base.sources[0].$ref, '../../insufferable/tokens/insufferable.resolver.json#/sets/base');
  assert.deepEqual(document.$extensions['dev.insufferable'], { prefix: 'insufferable' });
});

test('the written document loads, and an app\'s radius and icon family win with no collision in the app set', async () => {
  const dir = folder();
  writeFileSync(join(dir, 'shape.tokens.json'), JSON.stringify({ ins: { radius: { 1: { $value: { value: 0, unit: 'px' } } } } }));
  const config = { prefix: 'quince', tokens: ['shape.tokens.json'] };
  const path = join(dir, 'insufferable.resolver.json');
  writeFileSync(path, JSON.stringify(composeResolver(config, dir, dir, CHECKOUT)));

  const { document, collisions } = await load(path, { read: (file: string) => readFile(file, 'utf8') });
  assert.deepEqual(collisions.filter(({ set }) => set === 'app'), []);
  const { tokens } = new Resolver(document).resolveContextsToDesignSystem().collections.get('insufferable');
  assert.equal(tokens.ins.radius[1].get('light').$value.value, 0);
  assert.deepEqual(tokens.ins.font.family.icon.get('light').$value, ['quince-icons']);
  assert.ok(readFileSync(path, 'utf8').startsWith('{"description":"Written by insufferable build'));
});

test('a config builds whole, and a token path the system does not define stops the build before the stylesheet', async () => {
  const dir = folder();
  writeFileSync(join(dir, 'shape.tokens.json'), JSON.stringify({ ins: { radius: { 1: { $value: { value: 0, unit: 'px' } } } } }));
  await buildApp(withConfig({ prefix: 'quince', theme: { brand: { hue: 250 }, neutral: { hue: 80, chroma: 0.005 } }, tokens: ['shape.tokens.json'] }, dir));
  for (const file of ['insufferable.resolver.json', 'theme/palette.tokens.json', 'insufferable.css']) assert.ok(existsSync(join(dir, file)), file);
  assert.match(readFileSync(join(dir, 'insufferable.css'), 'utf8'), /--ins-radius-1: 0px/);

  const bad = folder();
  writeFileSync(join(bad, 'shape.tokens.json'), JSON.stringify({ ins: { radius: { 3: { $value: { value: 0, unit: 'px' } } } } }));
  await assert.rejects(buildApp(withConfig({ tokens: ['shape.tokens.json'] }, bad)), /ins\.radius\.3/);
  assert.ok(!existsSync(join(bad, 'insufferable.css')));
});
