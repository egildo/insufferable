#!/usr/bin/env node
/**
 * The `insufferable` command.
 *
 *   insufferable build <resolver.json> [--out <dir>]
 *   insufferable theme <theme.config.json> [--out <dir>]
 *
 * Builds the stylesheet from an app's resolver, which extends the system's own tokens with its own, and writes
 * `insufferable.css` and its `fonts/` into `--out`, by default the folder beside the resolver. `theme` writes the
 * token files of a theme from a small config; see `theme.mjs`.
 */

import { dirname, resolve } from 'node:path';
import { writeCss } from './build.mjs';
import { generateTheme } from './theme.mjs';

const [command, file, ...rest] = process.argv.slice(2);
if (!['build', 'theme'].includes(command) || !file) {
  console.error('usage: insufferable build <resolver.json> [--out <dir>]\n       insufferable theme <theme.config.json> [--out <dir>]');
  process.exit(2);
}
const flag = rest.indexOf('--out');
const out = flag >= 0 ? resolve(rest[flag + 1]) : undefined;
const path = resolve(file);
try {
  if (command === 'build') console.log(await writeCss(path, out ?? dirname(path)));
  else {
    const result = generateTheme(path, out);
    console.log([`Wrote the theme into ${result.out}`, ...result.moved].join('\n'));
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
