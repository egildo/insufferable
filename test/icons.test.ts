import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import opentype from 'opentype.js';
// @ts-expect-error the build script is plain JavaScript
import { buildIconFont, iconFont } from '../scripts/icons.mjs';
// @ts-expect-error the build script is plain JavaScript
import { iconCharacters } from '../scripts/build.mjs';

const FAMILY = 'insufferable-icons';
const shipped = () => iconCharacters().map(({ name, code }: { name: string; code: string }) => ({ name, code: Number.parseInt(code, 16) }));

test('the icon font is drawn from the SVGs, at the weight asked', () => {
  const light = buildIconFont(shipped(), 1.25, [], FAMILY);
  const heavy = buildIconFont(shipped(), 2, [], FAMILY);
  assert.equal(light.woff2.subarray(0, 4).toString(), 'wOF2');
  assert.ok(light.woff2.length > 0 && heavy.woff2.length > 0);
  assert.notDeepEqual(light.woff2, heavy.woff2);
});

test('the font comes as woff2 and as TTF, and calls itself by the family asked', () => {
  const { woff2, ttf } = buildIconFont([{ name: 'check', code: 0xea5e }], 1.5, [], 'quince-icons');
  assert.equal(woff2.subarray(0, 4).toString(), 'wOF2');
  const font = opentype.parse(ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.byteLength));
  assert.equal(font.names.unicode.fontFamily.en, 'quince-icons');
  assert.equal(font.charToGlyph(String.fromCodePoint(0xea5e)).name, 'check');
  assert.throws(() => iconFont([{ name: 'check', code: 0xea5e }], 1.5), /familyName/);
});

test('an icon is a ligature of its name, the longest name first', () => {
  // opentype.js's own shaper breaks a word at a hyphen, so the hyphenated names are checked in a browser, not here.
  const font = opentype.parse(iconFont([{ name: 'check', code: 0xea5e }, { name: 'checkbox', code: 0xeba6 }, { name: 'x', code: 0xeb55 }], 1.5, [], FAMILY).toArrayBuffer());
  const names = (text: string) => font.stringToGlyphs(text).map((glyph) => glyph.name);
  assert.deepEqual(names('check'), ['check']);
  assert.deepEqual(names('checkbox'), ['checkbox']);
  assert.deepEqual(names('x'), ['x']);
  assert.deepEqual(names('checkx'), ['check', 'x']);
  assert.equal(font.charToGlyph('c').advanceWidth, 0);
});

test('an app names its icons: Tabler’s keep their characters, its own SVGs take the private plane', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ins-icons-'));
  writeFileSync(join(dir, 'acme-mark.svg'), '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/></svg>');
  const characters = iconCharacters(['home', 'acme-mark'], [dir]);
  assert.equal(characters[0].code, 'eac1');
  assert.equal(characters[1].code, 'f0000');
  assert.ok(buildIconFont(characters.map(({ name, code }: { name: string; code: string }) => ({ name, code: Number.parseInt(code, 16) })), 1.5, [dir], FAMILY).woff2.length > 0);
  assert.throws(() => iconCharacters(['no-such-icon'], [dir]), /no-such-icon/);
});

test('an icon with no SVG, or a name a ligature cannot carry, fails the build, by name', () => {
  assert.throws(() => buildIconFont([{ name: 'no-such-icon', code: 0xf0000 }], 1.5, [], FAMILY), /no-such-icon/);
  assert.throws(() => buildIconFont([{ name: 'Not_A_Name', code: 0xf0000 }], 1.5, [], FAMILY), /Not_A_Name/);
});
