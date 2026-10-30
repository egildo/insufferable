import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { contrast, failures, oklchToHex } from '../src/color.ts';
import { generateTheme } from '../scripts/theme.mjs';

test('contrast is the WCAG ratio', () => {
  assert.equal(contrast('#000000', '#ffffff').toFixed(2), '21.00');
  assert.equal(contrast('#777777', '#ffffff').toFixed(2), '4.48');
});

test('an OKLCH colour becomes its hex, and a colour outside the gamut loses chroma', () => {
  assert.equal(oklchToHex(1, 0, 0), '#ffffff');
  assert.equal(oklchToHex(0, 0, 0), '#000000');
  assert.match(oklchToHex(0.9, 0.4, 150), /^#[0-9a-f]{6}$/);
});

test('the gate names a pair that falls short, and none that holds', () => {
  const theme = { 'text.1': '#000000', 'text.2': '#777777', surface: '#ffffff', raised: '#ffffff', fill: '#ffffff', lineStrong: '#777777', accent: '#000000', accentStrong: '#000000', onAccent: '#ffffff', accentTint: '#ffffff', danger: '#000000', dangerTint: '#ffffff', ok: '#000000', warn: '#000000' };
  const short = failures(theme);
  assert.ok(short.length > 0 && short.every((line) => line.startsWith('text.2')), short.join('\n'));
  assert.deepEqual(failures({ ...theme, 'text.2': '#000000' }), []);
});

const config = (brand: object) => {
  const path = join(mkdtempSync(join(tmpdir(), 'ins-test-')), 'theme.config.json');
  writeFileSync(path, JSON.stringify({ brand, neutral: { hue: 80, chroma: 0.005 } }));
  return path;
};

test('the generator writes a theme that holds its contrast, and moves a brand role along the ramp when it must', () => {
  assert.deepEqual(generateTheme(config({ hue: 250, lock: '#0a6fb8' })).moved, []);
  assert.ok(generateTheme(config({ hue: 95, lock: '#ffe066' })).moved.some((line) => line.startsWith('light')));
  assert.ok(generateTheme(config({ hue: 38, lock: '#9a3d12' })).moved.length > 0);
});
