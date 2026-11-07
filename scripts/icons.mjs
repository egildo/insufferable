/**
 * The icon font, built from SVG. Each icon is an SVG of strokes on a 24px grid (Tabler's own, an app's in its
 * `icons/`, or ours in ours); the build draws every stroke at the weight the system's `ins.border.icon` token gives,
 * turns the strokes into one filled outline with unstroke (Tabler's own converter, a true union), and writes the
 * outlines as a font. The weight is therefore the system's to choose, and an app's own build can choose another.
 *
 * Each icon is also a ligature of its name: the font holds every letter, digit and hyphen the names use as an empty
 * glyph, and `home` typed in the font draws the icon. A design tool that cannot read a stylesheet, Figma or FigCraft,
 * names the icon that way. The longest names are registered first, so `check-circle` is never read as `check`.
 *
 * A glyph sits on Tabler's own metrics (1000 units to the em, 900 above the baseline), so the font is a drop-in for
 * Tabler's: the same characters, in the same place.
 */

import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import ttf2woff2 from 'ttf2woff2';
import { outlineSvg } from 'unstroke';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const tabler = dirname(createRequire(import.meta.url).resolve('@tabler/icons/outline/check.svg'));

/** The grid the icons are drawn on, and the em the font is cut to. */
const GRID = 24;
const EM = 1000;
const ASCENT = 900;

/** An icon's name: what a file, a CSS attribute and a ligature can all carry. */
export const validIconName = (name) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name);

/** An icon's SVG: the first of `dirs` that has `<name>.svg`, then ours in `icons/`, then Tabler's outline. */
export function iconSource(name, dirs = []) {
  for (const dir of [...dirs, join(root, 'icons'), tabler]) {
    const file = join(dir, `${name}.svg`);
    if (existsSync(file)) return readFileSync(file, 'utf8');
  }
  throw new Error(`No SVG for the icon "${name}": neither icons/${name}.svg nor Tabler's outline set has it`);
}

/** One icon as a single filled outline, as an opentype path: from the grid (y down) to the font's units (y up). */
function glyphPath(svg, weight, name) {
  const outlined = outlineSvg(svg, { strokeWidth: weight, onWarning: ({ message }) => console.warn(`${name}: ${message}`) });
  const data = [...outlined.matchAll(/<path\b[^>]*\sd="([^"]+)"/g)].map(([, d]) => d).join(' ');
  if (!data) throw new Error(`The icon "${name}" has nothing drawn in it`);
  return opentype.Path.fromSVG(data, { scale: EM / GRID, flipY: true, flipYBase: 0, y: ASCENT });
}

/**
 * The font, as an opentype.js font, for `icons`: `{ name, code }` with the character as a code point. `weight` is
 * the stroke, in grid units; `dirs` are folders of an app's own SVGs, looked in first; `family` is the name the font
 * calls itself, the one an installed copy goes by, so it follows the app's prefix.
 */
export function iconFont(icons, weight, dirs = [], family) {
  for (const { name } of icons) {
    if (!validIconName(name)) throw new Error(`"${name}" cannot name an icon: lower case letters, digits and single hyphens between them`);
  }
  const letters = [...new Set(icons.flatMap(({ name }) => [...name]))].sort();
  const glyphs = [
    new opentype.Glyph({ name: '.notdef', unicode: 0, advanceWidth: EM, path: new opentype.Path() }),
    ...letters.map((letter) => new opentype.Glyph({ name: letter, unicode: letter.codePointAt(0), advanceWidth: 0, path: new opentype.Path() })),
    ...icons.map(({ name, code }) =>
      new opentype.Glyph({ name, unicode: code, advanceWidth: EM, path: glyphPath(iconSource(name, dirs), weight, name) })),
  ];
  const font = new opentype.Font({
    familyName: family,
    styleName: 'Regular',
    unitsPerEm: EM,
    ascender: ASCENT,
    descender: ASCENT - EM,
    glyphs,
  });
  const index = (letter) => 1 + letters.indexOf(letter);
  const longestFirst = [...icons].sort((a, b) => b.name.length - a.name.length);
  // Under the default script and under Latin: a shaper that finds no Latin table falls back to the default, but
  // not every one does.
  for (const script of ['DFLT', 'latn']) {
    for (const { name } of longestFirst) {
      font.substitution.add('liga', { sub: [...name].map(index), by: 1 + letters.length + icons.findIndex((icon) => icon.name === name) }, script);
    }
  }
  return font;
}

/** The font twice over: as woff2, which the stylesheet loads, and as TTF, which macOS and the design tools install. */
export function buildIconFont(icons, weight, dirs = [], family) {
  const ttf = Buffer.from(iconFont(icons, weight, dirs, family).toArrayBuffer());
  return { woff2: Buffer.from(ttf2woff2(ttf)), ttf };
}
