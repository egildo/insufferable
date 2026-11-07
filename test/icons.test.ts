import assert from 'node:assert/strict';
import { test } from 'node:test';
// @ts-expect-error the build script is plain JavaScript
import { buildIconFont } from '../scripts/icons.mjs';
// @ts-expect-error the build script is plain JavaScript
import { iconCharacters } from '../scripts/build.mjs';

test('the icon font is drawn from the SVGs, at the weight asked', () => {
  const characters = iconCharacters().map(({ name, code }: { name: string; code: string }) => ({ name, code: Number.parseInt(code, 16) }));
  const light = buildIconFont(characters, 1.25);
  const heavy = buildIconFont(characters, 2);
  assert.equal(light.subarray(0, 4).toString(), 'wOF2');
  assert.ok(light.length > 0 && heavy.length > 0);
  assert.notDeepEqual(light, heavy);
});

test('an icon with no SVG fails the build, by name', () => {
  assert.throws(() => buildIconFont([{ name: 'no-such-icon', code: 0xf000 }], 1.5), /no-such-icon/);
});
