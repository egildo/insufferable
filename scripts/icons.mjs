/**
 * The icon font, built from SVG. Each icon is an SVG of strokes on a 24px grid (Tabler's own, or one of ours in
 * `icons/`); the build draws every stroke at the weight the system's `ins.border.icon` token gives, turns the strokes
 * into outlines (a glyph is a filled shape), joins each icon into one shape, and writes the shapes as a font. The
 * weight is therefore the system's to choose, and an app's own build can choose another.
 *
 * A glyph sits on Tabler's own metrics (1000 units to the em, 900 above the baseline), so the font is a drop-in for
 * Tabler's: the same characters, in the same place.
 */

import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import paper from 'paper';
import { PaperOffset } from 'paperjs-offset';
import ttf2woff2 from 'ttf2woff2';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const tabler = dirname(createRequire(import.meta.url).resolve('@tabler/icons/outline/check.svg'));

/** The grid the icons are drawn on, and the em the font is cut to. */
const GRID = 24;
const EM = 1000;
const ASCENT = 900;

/** An icon's SVG: ours in `icons/` when there is one, else Tabler's outline. */
export function iconSource(name) {
  for (const file of [join(root, 'icons', `${name}.svg`), join(tabler, `${name}.svg`)]) {
    if (existsSync(file)) return readFileSync(file, 'utf8');
  }
  throw new Error(`No SVG for the icon "${name}": neither icons/${name}.svg nor Tabler's outline set has it`);
}

paper.setup(new paper.Size(GRID, GRID));

/** The attributes of an element's tag, as an object. */
const attributes = (tag) => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, name, value]) => [name, value]));

/** An element's shape as path data: a path as it is, the basic shapes as the paths they stand for. */
function shapeData(name, a) {
  const n = (key) => Number(a[key] ?? 0);
  switch (name) {
    case 'path': return a.d;
    case 'line': return `M${n('x1')} ${n('y1')}L${n('x2')} ${n('y2')}`;
    case 'polyline': return `M${a.points}`;
    case 'polygon': return `M${a.points}Z`;
    case 'rect': {
      const [x, y, w, h] = [n('x'), n('y'), n('width'), n('height')];
      const r = Math.min(n('rx') || n('ry'), w / 2, h / 2);
      return r
        ? `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${2 * r - w}a${r} ${r} 0 0 1 ${-r} ${-r}v${2 * r - h}a${r} ${r} 0 0 1 ${r} ${-r}z`
        : `M${x} ${y}h${w}v${h}h${-w}z`;
    }
    case 'circle': case 'ellipse': {
      const [cx, cy, rx, ry] = [n('cx'), n('cy'), n('rx') || n('r'), n('ry') || n('r')];
      return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0z`;
    }
    default: throw new Error(`An icon holds a <${name}>, which the icon font build does not read`);
  }
}

/**
 * One icon as a single filled shape: every stroke offset to an outline by half the weight (the ends and the corners
 * round, as Tabler draws them), every fill kept, all united. The frame Tabler draws first has neither and is skipped.
 */
function outline(svg, weight) {
  let shape = null;
  for (const [, name, tag] of svg.matchAll(/<(path|line|polyline|polygon|rect|circle|ellipse)\b([^>]*)>/g)) {
    const a = attributes(tag);
    const filled = a.fill && a.fill !== 'none';
    const stroked = a.stroke !== 'none' && a['stroke-width'] !== '0';
    if (!filled && a.stroke === 'none') continue;
    const source = new paper.CompoundPath({ pathData: shapeData(name, a), insert: false });
    const part = filled
      ? source
      : stroked && PaperOffset.offsetStroke(source, weight / 2, { cap: 'round', join: 'round' });
    if (part) shape = shape ? shape.unite(part, { insert: false }) : part;
  }
  if (!shape) throw new Error('An icon with nothing drawn in it');
  return shape;
}

/** A paper path or compound path as an opentype path, from the grid (y down) to the font's units (y up). */
function glyphPath(shape) {
  const path = new opentype.Path();
  const point = ({ x, y }) => [(x * EM) / GRID, ASCENT - (y * EM) / GRID];
  for (const child of shape.children ?? [shape]) {
    const { segments } = child;
    if (!segments.length) continue;
    const [x0, y0] = point(segments[0].point);
    path.moveTo(x0, y0);
    const curves = child.closed ? segments.length : segments.length - 1;
    for (let i = 0; i < curves; i += 1) {
      const a = segments[i];
      const b = segments[(i + 1) % segments.length];
      const [c1x, c1y] = point(a.point.add(a.handleOut));
      const [c2x, c2y] = point(b.point.add(b.handleIn));
      const [x, y] = point(b.point);
      if (a.handleOut.isZero() && b.handleIn.isZero()) path.lineTo(x, y);
      else path.curveTo(c1x, c1y, c2x, c2y, x, y);
    }
    if (child.closed) path.close();
  }
  return path;
}

/**
 * The font, as woff2, for `icons`: `{ name, code }` with the character as a code point. `weight` is the stroke, in
 * grid units.
 */
export function buildIconFont(icons, weight) {
  const glyphs = [
    new opentype.Glyph({ name: '.notdef', unicode: 0, advanceWidth: EM, path: new opentype.Path() }),
    ...icons.map(({ name, code }) =>
      new opentype.Glyph({ name, unicode: code, advanceWidth: EM, path: glyphPath(outline(iconSource(name), weight)) })),
  ];
  const font = new opentype.Font({
    familyName: 'tabler-icons',
    styleName: 'Regular',
    unitsPerEm: EM,
    ascender: ASCENT,
    descender: ASCENT - EM,
    glyphs,
  });
  return Buffer.from(ttf2woff2(Buffer.from(font.toArrayBuffer())));
}
