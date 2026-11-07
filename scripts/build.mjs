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

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcssMixins from '@csstools/postcss-mixins';
import { load, Resolver } from '@toghen/lib';
import toghenPostcss from '@toghen/postcss';
import postcss from 'postcss';
import { validPrefix, withPrefix } from '../dist/elements.js';
import { icons } from '../dist/icons.js';
import { buildIconFont, validIconName } from './icons.mjs';

/** The folder of an installed package, found as Node finds it, so the build runs from `node_modules` as well as from a checkout. */
const pkg = (name) => dirname(createRequire(import.meta.url).resolve(`${name}/package.json`));

const at = (...parts) => resolve(fileURLToPath(new URL('../', import.meta.url)), ...parts);

/**
 * The house fonts, each with every axis it has, in normal and italic, from Fontsource's own face rules. Each
 * character set is its own file under a `unicode-range`, so a page downloads only what its text uses. The faces are
 * renamed to the families' own names, and their files are named as they will sit beside the stylesheet.
 */
const HOUSE_FONTS = [
  { family: 'Archivo', dir: pkg('@fontsource-variable/archivo'), sheets: ['standard.css', 'standard-italic.css'] },
  { family: 'Fraunces', dir: pkg('@fontsource-variable/fraunces'), sheets: ['full.css', 'full-italic.css'] },
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

/** The prefix of the system's own elements, declared once in its resolver. */
const SYSTEM_PREFIX = JSON.parse(readFileSync(at('tokens/insufferable.resolver.json'), 'utf8')).$extensions['dev.insufferable'].prefix;

const TABLER = join(pkg('@tabler/icons-webfont'), 'dist');

/**
 * Each icon of `names`, the shipped list by default, with its character, as hex. A Tabler icon keeps Tabler's own
 * character, read from Tabler's own stylesheet, since the stylesheets name some of them; any other icon, an SVG in
 * one of `dirs` or in our `icons/`, takes the next private-use character from U+F0000 on, in the order of the list.
 * Plane 15 is clear of Tabler's own characters, which fill the basic plane's private area and run on past U+10000.
 */
export function iconCharacters(names = icons, dirs = []) {
  const tabler = readFileSync(at(TABLER, 'tabler-icons.css'), 'utf8');
  let next = 0xf0000;
  return names.map((name) => {
    const match = tabler.match(new RegExp(`\\.ti-${name}:before\\s*\\{\\s*content:\\s*"\\\\([0-9a-f]+)"`));
    if (match) return { name, code: match[1] };
    if (![...dirs, at('icons')].some((dir) => existsSync(join(dir, `${name}.svg`)))) {
      throw new Error(`No icon named "${name}": not one of Tabler's, and no ${name}.svg in ${[...dirs, 'icons/'].join(' or ')}`);
    }
    return { name, code: (next++).toString(16) };
  });
}

/**
 * The icon font, drawn from the icons' SVGs at the weight of the `ins.border.icon` token and written as woff2, and
 * its rules: the face, and one rule per icon from its name to its character.
 */
function iconFont(system, names, dirs, family) {
  const characters = iconCharacters(names, dirs);
  const weight = system.collections.get('insufferable').tokens.ins.border.icon.get('light').$value.value;
  const font = buildIconFont(characters.map(({ name, code }) => ({ name, code: Number.parseInt(code, 16) })), weight, dirs, family);
  const css = [
    `@font-face {\n  font-family: "${family}";\n  font-style: normal;\n  font-weight: 400;\n  font-display: block;\n  src: url("./fonts/${family}.woff2") format("woff2");\n}`,
    ...characters.map(({ name, code }) => `${SYSTEM_PREFIX}-icon[name='${name}']::before { content: "\\${code}"; }`),
  ].join('\n');
  return { css, font };
}

/**
 * The resolved tokens of a resolver document, the system's own by default, the name the document gives itself, and
 * what its `dev.insufferable` extension chooses: the prefix of the elements, and the icons to ship, by name, which
 * are Tabler's or SVGs in `icons/` beside the resolver. `load` is `@toghen/lib`'s own result, whose `origins` say
 * which file defined each token.
 */
export async function loadSystem(resolver = at('tokens/insufferable.resolver.json')) {
  const loaded = await load(resolver, { read: (path) => readFile(path, 'utf8') });
  const { document } = loaded;
  const extension = document.$extensions?.['dev.insufferable'] ?? {};
  const prefix = extension.prefix ?? SYSTEM_PREFIX;
  if (!validPrefix(prefix)) throw new Error(`The prefix "${prefix}" cannot start a custom element name: lower case letters and digits, starting with a letter.`);
  const names = extension.icons;
  if (names !== undefined && !(Array.isArray(names) && names.length && names.every((name) => typeof name === 'string' && validIconName(name)))) {
    throw new Error('"icons" in the resolver\'s dev.insufferable extension is a list of icon names: lower case letters, digits and single hyphens between them.');
  }
  return { system: new Resolver(document).resolveContextsToDesignSystem(), name: document.name, prefix, icons: names, dir: dirname(resolve(resolver)), load: loaded };
}

/**
 * The icon font's family, `<prefix>-icons`. A design tool draws whichever installed font answers to the name, so two
 * apps on one machine must not share one. The stylesheet takes the family from the `ins.font.family.icon` token while
 * the face is written here, and a token that named another family would draw nothing, so a disagreement stops the build.
 */
function iconFamily(system, prefix) {
  const family = `${prefix}-icons`;
  const token = [system.collections.get('insufferable').tokens.ins.font.family.icon.get('light').$value].flat().join(', ');
  if (token !== family) throw new Error(`The token ins.font.family.icon is "${token}", but the prefix "${prefix}" names the icon font "${family}": the resolver sets the token to that name.`);
  return family;
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

/**
 * The stylesheet for a resolver: the system's own, or an app's that extends it. The stylesheet names its tokens by
 * the resolver's name, `insufferable`, in its directives and in every `t()`, so an app's resolver keeps the name.
 */
export async function buildCss(resolver) {
  const { system, name, prefix, icons: names, dir } = await loadSystem(resolver);
  if (name !== 'insufferable') throw new Error(`The resolver is named "${name}": an app's resolver keeps the name "insufferable", which the stylesheet refers to its tokens by.`);
  const family = iconFamily(system, prefix);
  const icon = iconFont(system, names, names ? [join(dir, 'icons')] : [], family);
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
  return { css: withPrefix(css, prefix, SYSTEM_PREFIX), iconFont: icon.font, prefix, icons: names, family };
}

/**
 * The scripts and their types, compiled by `tsc` into `dist/`, written into `out` with their elements under the app's
 * prefix and, when the app names its icons, its list in `icons.js` and `icons.d.ts`, so the icon element warns against
 * the app's icons and a name is typed against them. They keep their folders, so the imports between them still resolve.
 */
function writeScripts(out, prefix, names) {
  const copy = (dir) => {
    for (const entry of readdirSync(at('dist', dir), { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name !== 'fonts') copy(join(dir, entry.name));
      else if (/\.(js|d\.ts)$/.test(entry.name)) {
        mkdirSync(resolve(out, dir), { recursive: true });
        writeFileSync(resolve(out, dir, entry.name), withPrefix(readFileSync(at('dist', dir, entry.name), 'utf8'), prefix, SYSTEM_PREFIX));
      }
    }
  };
  copy('.');
  if (!names) return;
  const generated = '// Written by the build from the app\'s list of icons: do not edit.\n';
  writeFileSync(resolve(out, 'icons.js'), `${generated}export const icons = ${JSON.stringify(names)};\n`, 'utf8');
  writeFileSync(resolve(out, 'icons.d.ts'), `${generated}export declare const icons: readonly ${JSON.stringify(names)};\nexport type IconName = (typeof icons)[number];\n`, 'utf8');
}

/**
 * Writes the stylesheet and, beside it, the fonts it names as `./fonts/…`. The system's own build, with no resolver,
 * writes these into `dist/`, where `tsc` has put the scripts. An app's build writes the scripts and their types as
 * well, whatever its resolver chooses, so that every app has the one layout of files and imports from itself.
 */
export async function writeCss(resolver, out = at('dist')) {
  if (resolver && resolve(out) === at('dist')) throw new Error(`An app's files are written beside its config, not into the system's own ${resolve(out)}.`);
  const { css, iconFont: font, prefix, icons: names, family } = await buildCss(resolver);
  mkdirSync(resolve(out, 'fonts'), { recursive: true });
  if (resolver) writeScripts(out, prefix, names);
  writeFileSync(resolve(out, 'insufferable.css'), css, 'utf8');
  writeFileSync(resolve(out, `fonts/${family}.woff2`), font.woff2);
  writeFileSync(resolve(out, `fonts/${family}.ttf`), font.ttf);
  for (const file of houseFonts().files) copyFileSync(file, resolve(out, 'fonts', basename(file)));
  return `${resolve(out, 'insufferable.css')}  ${(Buffer.byteLength(css) / 1024).toFixed(1)} KB`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(await writeCss());
