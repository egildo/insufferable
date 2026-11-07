/**
 * An app's wiring, from one config. The standard does not let an overlay add a source inside a borrowed modifier's
 * context, so an app that changes a role in a scheme would have to redeclare the system's theme modifier by hand.
 * The app names its few choices in `insufferable.config.json` instead, and this module composes from them a plain,
 * standard-valid resolver, which it writes beside the output, so that every Toghen tool reads the same document.
 *
 * A mistake in the config stops the build by name, before anything is written.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validPrefix } from '../dist/elements.js';
import { loadSystem, writeCss } from './build.mjs';
import { checkOverrides } from './check.mjs';
import { iconSource, validIconName } from './icons.mjs';
import { generateTheme } from './theme.mjs';

const KEYS = ['prefix', 'icons', 'theme', 'tokens', 'light', 'dark', 'resolver', 'out'];
/** The theme's shape, as the theme generator takes it. */
const THEME = {
  brand: { required: true, keys: { hue: 'number', lock: 'string' }, needs: ['hue'] },
  neutral: { required: true, keys: { hue: 'number', chroma: 'number' }, needs: ['hue', 'chroma'] },
  fonts: { keys: { sans: 'string', serif: 'string', mono: 'string' }, needs: [] },
};
const SYSTEM_PREFIX = 'insufferable';
/** This package, wherever it runs from. */
const OWN_PACKAGE = resolve(fileURLToPath(new URL('../', import.meta.url)));

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const say = (value) => JSON.stringify(value);

function refuseUnknown(object, accepted, where) {
  for (const key of Object.keys(object)) {
    if (!accepted.includes(key)) throw new Error(`Unknown key "${key}" in ${where}: it accepts ${accepted.join(', ')}.`);
  }
}

function checkTheme(theme) {
  if (!isObject(theme)) throw new Error(`"theme" in the config is an object of brand, neutral and fonts, not ${say(theme)}.`);
  refuseUnknown(theme, Object.keys(THEME), '"theme"');
  for (const [part, { required, keys, needs }] of Object.entries(THEME)) {
    const value = theme[part];
    if (value === undefined && !required) continue;
    if (!isObject(value)) throw new Error(`"theme.${part}" in the config is an object of ${Object.keys(keys).join(', ')}, not ${say(value)}.`);
    refuseUnknown(value, Object.keys(keys), `"theme.${part}"`);
    for (const key of needs) if (value[key] === undefined) throw new Error(`"theme.${part}" in the config needs "${key}".`);
    for (const [key, type] of Object.entries(keys)) {
      if (value[key] !== undefined && typeof value[key] !== type) throw new Error(`"theme.${part}.${key}" in the config is a ${type}, not ${say(value[key])}.`);
    }
  }
}

function checkTypes(config) {
  for (const key of ['prefix', 'resolver', 'out']) {
    if (config[key] !== undefined && typeof config[key] !== 'string') throw new Error(`"${key}" in the config is a string, not ${say(config[key])}.`);
  }
  for (const key of ['icons', 'tokens', 'light', 'dark']) {
    if (config[key] !== undefined && !(Array.isArray(config[key]) && config[key].every((item) => typeof item === 'string'))) {
      throw new Error(`"${key}" in the config is a list of strings, not ${say(config[key])}.`);
    }
  }
  if (config.icons?.length === 0) throw new Error('"icons" in the config names at least one icon; leave the key out to ship the system\'s list.');
  if (config.theme !== undefined) checkTheme(config.theme);
}

/** Reads and validates the config; throws an Error whose message names the key, value or path. */
export function readConfig(path) {
  const file = resolve(path);
  if (!existsSync(file)) throw new Error(`There is no config at ${file}.`);
  let config;
  try {
    config = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`The config at ${file} is not JSON: ${error.message}`);
  }
  if (!isObject(config)) throw new Error(`The config at ${file} is a JSON object, not ${say(config)}.`);
  const dir = dirname(file);

  refuseUnknown(config, KEYS, 'the config');
  checkTypes(config);

  if (config.resolver !== undefined) {
    const others = Object.keys(config).filter((key) => key !== 'resolver' && key !== 'out');
    if (others.length) throw new Error(`"resolver" stands alone: a resolver of the app's own replaces the composed one, so ${others.map(say).join(', ')} does not apply. Only "out" may accompany it.`);
  }

  if (config.prefix !== undefined && !validPrefix(config.prefix)) {
    throw new Error(`The prefix ${say(config.prefix)} cannot start a custom element name: it must match ^[a-z][a-z0-9]*$, lower case letters and digits, starting with a letter.`);
  }
  for (const name of config.icons ?? []) {
    if (!validIconName(name)) throw new Error(`The icon name ${say(name)} cannot be a ligature: it must match ^[a-z0-9]+(-[a-z0-9]+)*$, lower case letters and digits, with single hyphens between them.`);
  }
  const out = resolve(dir, config.out ?? '.');
  if (out === join(OWN_PACKAGE, 'dist')) throw new Error(`"out" is ${out}, the system's own dist: an app writes beside its own config, or elsewhere.`);

  for (const key of ['tokens', 'light', 'dark']) {
    for (const entry of config[key] ?? []) {
      const target = resolve(dir, entry);
      if (!existsSync(target)) throw new Error(`The file ${say(entry)} in "${key}" is not there: ${target}`);
    }
  }
  if (config.resolver !== undefined && !existsSync(resolve(dir, config.resolver))) {
    throw new Error(`The file ${say(config.resolver)} in "resolver" is not there: ${resolve(dir, config.resolver)}`);
  }
  // iconSource throws naming the icon when neither the app's folder, ours nor Tabler's outline set has it.
  for (const name of config.icons ?? []) iconSource(name, [join(dir, 'icons')]);

  return { config, dir };
}

/**
 * The folder of the installed package, by Node's own lookup list, without following the link a package manager
 * makes, so that the generated document says `node_modules/insufferable` and not a path into its store, and without
 * asking the package's export map, which has no reason to name `package.json`. A config with no installed package
 * above it, inside this checkout as the example app is or in a bare folder, is served by the package that is running.
 */
function packageFolder(dir) {
  const found = createRequire(join(dir, 'insufferable.config.json')).resolve.paths('insufferable')
    ?.find((folder) => existsSync(join(folder, 'insufferable', 'package.json')));
  return found ? join(found, 'insufferable') : OWN_PACKAGE;
}

/** The generated resolver document for a config, with every $ref relative to `out`. Pure. */
export function composeResolver(config, dir, out, packageDir) {
  // A $ref is a URL-like path, with forward slashes whatever the platform says.
  const from = (path) => relative(out, path).split(sep).join('/');
  const ref = (path) => ({ $ref: from(path) });
  const mine = (entry) => ref(resolve(dir, entry));
  const system = (file) => join(packageDir, 'tokens', file);
  const theme = (file) => (config.theme ? [ref(join(dir, 'theme', file))] : []);
  const prefix = config.prefix ?? SYSTEM_PREFIX;

  const app = [
    ...theme('palette.tokens.json'),
    ...theme('fonts.tokens.json'),
    ...(config.tokens ?? []).map(mine),
    ...(prefix === SYSTEM_PREFIX ? [] : [{ ins: { font: { family: { icon: { $value: [`${prefix}-icons`] } } } } }]),
  ];
  const context = (scheme) => [
    ref(system(`theme.${scheme}.tokens.json`)),
    ...theme(`${scheme}.tokens.json`),
    ...(config[scheme] ?? []).map(mine),
  ];

  return {
    description: 'Written by insufferable build from insufferable.config.json: do not edit.',
    version: '2025-11-01',
    name: 'insufferable',
    sets: {
      base: { sources: [{ $ref: `${from(system('insufferable.resolver.json'))}#/sets/base` }] },
      ...(app.length && { app: { sources: app } }),
    },
    resolutionOrder: [{ $ref: '#/sets/base' }, ...(app.length ? [{ $ref: '#/sets/app' }] : []), { $ref: '#/modifiers/theme' }],
    modifiers: {
      theme: {
        default: 'light',
        contexts: { light: context('light'), dark: context('dark') },
        $extensions: { 'com.toghen': { css: { lightDark: { light: 'light', dark: 'dark' } } } },
      },
    },
    $extensions: { 'dev.insufferable': { prefix, ...(config.icons && { icons: config.icons }) } },
  };
}

/** Runs the whole build for a config path: theme, resolver, check, stylesheet, layout. Returns the message to print. */
export async function buildApp(configPath) {
  const { config, dir } = readConfig(configPath);
  const out = resolve(dir, config.out ?? '.');
  const packageDir = packageFolder(dir);
  const moved = config.theme ? generateTheme(config.theme, join(dir, 'theme')).moved : [];

  let resolver = config.resolver && resolve(dir, config.resolver);
  if (!resolver) {
    resolver = join(out, 'insufferable.resolver.json');
    mkdirSync(out, { recursive: true });
    writeFileSync(resolver, `${JSON.stringify(composeResolver(config, dir, out, packageDir), null, 2)}\n`, 'utf8');
  }

  const { load } = await loadSystem(resolver);
  checkOverrides(load.origins, join(packageDir, 'tokens'));
  return [await writeCss(resolver, out), ...moved].join('\n');
}
