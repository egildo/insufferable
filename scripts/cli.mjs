#!/usr/bin/env node
/**
 * The `insufferable` command.
 *
 *   insufferable build <resolver.json> [--out <dir>]
 *
 * Builds the stylesheet from an app's resolver, which extends the system's own tokens with its own, and writes
 * `insufferable.css` and its `fonts/` into `--out`, by default the folder beside the resolver.
 */

import { dirname, resolve } from 'node:path';
import { writeCss } from './build.mjs';

const [command, resolver, ...rest] = process.argv.slice(2);
if (command !== 'build' || !resolver) {
  console.error('usage: insufferable build <resolver.json> [--out <dir>]');
  process.exit(2);
}
const flag = rest.indexOf('--out');
const path = resolve(resolver);
console.log(await writeCss(path, flag >= 0 ? resolve(rest[flag + 1]) : dirname(path)));
