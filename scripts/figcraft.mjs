/**
 * Builds `figcraft/insufferable.figcraft`, the FigCraft library: the tokens as variables, the text styles, and a
 * component set per component file. Toghen's own sync writes it, headless, through figcraft-cli; the app need not
 * be open. A rebuild changes only the difference.
 *
 * The icon's component file is written here first, from `src/icons.ts`, since its variants are the shipped icons.
 *
 *   node scripts/figcraft.mjs [--dry-run]
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { iconCharacters } from './build.mjs';

const at = (...parts) => resolve(fileURLToPath(new URL('../', import.meta.url)), ...parts);

function iconFile() {
  const characters = iconCharacters();
  const glyph = (code) => String.fromCodePoint(Number.parseInt(code, 16));
  return [
    '// Icon: a glyph of Tabler Icons, one variant per shipped icon. Written by scripts/figcraft.mjs from src/icons.ts: do not edit.',
    '// The glyph is the icon\'s character in the font; its colour is the page\'s text colour, as the element takes the colour around it.',
    'component Icon',
    'description "A glyph of the icon font. Labelled, it is an image; otherwise decoration."',
    '',
    `properties {\n    VARIANT name ${characters.map((c) => c.name).join(' ')}\n}`,
    '',
    ...characters.map(({ name }) => `guard ${name} { is (input)name ${name} }`),
    '',
    'FRAME Icon layoutMode=HORIZONTAL layoutSizingHorizontal=HUG layoutSizingVertical=HUG {',
    `    TEXT Glyph tokens="{ins.icon}" characters="${glyph(characters[0].code)}" textAutoResize=WIDTH_AND_HEIGHT {`,
    '        fills "{ins.page.color}"',
    ...characters.slice(1).map(({ name, code }) => `        when ${name} characters="${glyph(code)}"`),
    '    }',
    '}',
    '',
  ].join('\n');
}

mkdirSync(at('figcraft/out'), { recursive: true });
writeFileSync(at('figcraft/out/icon.component.kdl'), iconFile(), 'utf8');

const files = [
  ...readdirSync(at('src/components')).filter((f) => f.endsWith('.component.kdl')).map((f) => at('src/components', f)),
  at('figcraft/out/icon.component.kdl'),
];
const run = spawnSync(
  at('node_modules/.bin/toghen-figma'),
  ['sync', at('tokens/insufferable.resolver.json'), ...files, '--figcraft-file', at('figcraft/insufferable.figcraft'), ...process.argv.slice(2)],
  { stdio: 'inherit' },
);
process.exit(run.status ?? 1);
