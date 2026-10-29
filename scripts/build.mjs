/**
 * Builds `dist/insufferable.css`: the design system's stylesheet, written by Toghen.
 *
 * `src/index.css` names the layers and imports each stylesheet; this script
 * inlines the imports and writes the house fonts' faces in, then runs one PostCSS pipeline: `@toghen/postcss` writes
 * the token layer and the mixins from the resolver document, and the mixins
 * polyfill expands each `@apply`. A broken token fails the build.
 *
 *   node scripts/build.mjs
 */

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcssMixins from '@csstools/postcss-mixins';
import { load, Resolver } from '@toghen/lib';
import toghenPostcss from '@toghen/postcss';
import postcss from 'postcss';
import subsetFont from 'subset-font';
import { icons } from '../src/icons.ts';

const at = (...parts) => resolve(fileURLToPath(new URL('../', import.meta.url)), ...parts);

/**
 * The house fonts, each with every axis it has, in normal and italic, from Fontsource's own face rules. Each
 * character set is its own file under a `unicode-range`, so a page downloads only what its text uses. The faces are
 * renamed to the families' own names, and their files are named as they will sit beside the stylesheet.
 */
const HOUSE_FONTS = [
  { family: 'Archivo', dir: 'node_modules/@fontsource-variable/archivo', sheets: ['standard.css', 'standard-italic.css'] },
  { family: 'Fraunces', dir: 'node_modules/@fontsource-variable/fraunces', sheets: ['full.css', 'full-italic.css'] },
];

/** The house fonts' face rules, and the files they name. */
function houseFonts() {
  const files = [];
  const css = HOUSE_FONTS.flatMap(({ family, dir, sheets }) =>
    sheets.map((sheet) =>
      readFileSync(at(dir, sheet), 'utf8')
        .replace(/font-family: '[^']+'/g, `font-family: '${family}'`)
        .replace(/url\(\.\/files\/([^)]+)\)/g, (_, file) => {
          files.push(at(dir, 'files', file));
          return `url(./fonts/${file})`;
        }),
    ),
  ).join('\n');
  return { css, files };
}

const TABLER = 'node_modules/@tabler/icons-webfont/dist';

/** Each icon in `src/icons.ts` with its character in Tabler's font, as hex, read from Tabler's own stylesheet. */
export function iconCharacters() {
  const tabler = readFileSync(at(TABLER, 'tabler-icons.css'), 'utf8');
  return icons.map((name) => {
    const match = tabler.match(new RegExp(`\\.ti-${name}:before\\s*\\{\\s*content:\\s*"\\\\([0-9a-f]+)"`));
    if (!match) throw new Error(`Tabler has no icon named "${name}" (named in src/icons.ts)`);
    return { name, code: match[1] };
  });
}

/**
 * The icon font, subset to the icons in `src/icons.ts`, and its rules: the face, and one rule per icon from its name
 * to its character, read from Tabler's own stylesheet. A name Tabler does not have fails the build.
 */
async function iconFont() {
  const characters = iconCharacters();
  const font = await subsetFont(
    readFileSync(at(TABLER, 'fonts/tabler-icons.woff2')),
    characters.map(({ code }) => String.fromCodePoint(Number.parseInt(code, 16))).join(''),
    { targetFormat: 'woff2' },
  );
  const css = [
    `@font-face {\n  font-family: "tabler-icons";\n  font-style: normal;\n  font-weight: 400;\n  font-display: block;\n  src: url("./fonts/tabler-icons.woff2") format("woff2");\n}`,
    ...characters.map(({ name, code }) => `ins-icon[name='${name}']::before { content: "\\${code}"; }`),
  ].join('\n');
  return { css, font };
}

export async function loadSystem() {
  const { document } = await load(at('tokens/insufferable.resolver.json'), { read: (path) => readFile(path, 'utf8') });
  return new Resolver(document).resolveContextsToDesignSystem();
}

/** Inlines `@import './file.css' layer(name);` as `@layer name { …file… }`, indented one step. */
function inlineImports(entry) {
  const dir = dirname(entry);
  const indented = (text) => text.replace(/^(?=.)/gm, '  ');
  return readFileSync(entry, 'utf8').replace(
    /@import\s+['"]([^'"]+)['"]\s+layer\(([^)]+)\)\s*;/g,
    (_, file, layer) => `@layer ${layer} {\n${indented(readFileSync(resolve(dir, file), 'utf8'))}\n}`,
  );
}

export async function buildCss() {
  const system = await loadSystem();
  const icon = await iconFont();
  const input = inlineImports(at('src/index.css'))
    .replace('/*HOUSE_FONTS*/', () => houseFonts().css)
    .replace('/*ICONS*/', () => icon.css);
  const { css } = await postcss([
    toghenPostcss({ system, onUnresolved: 'throw', references: 'var', typography: 'font' }),
    postcssMixins(),
    { postcssPlugin: 'strip-comments', Once: (root) => root.walkComments((comment) => comment.remove()) },
  ]).process(input, { from: at('src/index.css') });
  // An `@apply` of a mixin that does not exist is left in place without a word: fail on it instead.
  const left = css.match(/@(apply|toghen)\b[^;]*;/);
  if (left) throw new Error(`The stylesheet still holds ${left[0]}`);
  return { css, iconFont: icon.font };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { css, iconFont: font } = await buildCss();
  mkdirSync(at('dist'), { recursive: true });
  writeFileSync(at('dist/insufferable.css'), css, 'utf8');
  // The fonts ship beside the stylesheet, which names it as `./fonts/…`.
  mkdirSync(at('dist/fonts'), { recursive: true });
  writeFileSync(at('dist/fonts/tabler-icons.woff2'), font);
  for (const file of houseFonts().files) copyFileSync(file, at('dist/fonts', basename(file)));
  console.log(`dist/insufferable.css  ${(Buffer.byteLength(css) / 1024).toFixed(1)} KB`);
}
