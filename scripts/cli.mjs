#!/usr/bin/env node
/**
 * The `insufferable` command.
 *
 *   insufferable build [config]     the app's whole build, from insufferable.config.json by default; see `config.mjs`
 *   insufferable init [dir]         a starter config, an icons folder and a page; see `init.mjs`
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildApp } from './config.mjs';
import { init } from './init.mjs';

const USAGE = 'usage: insufferable build [config]\n       insufferable init [dir]';
const [command, argument, ...rest] = process.argv.slice(2);
if (!['build', 'init'].includes(command) || rest.length) {
  console.error(USAGE);
  process.exit(2);
}

try {
  if (command === 'build') {
    const config = resolve(argument ?? 'insufferable.config.json');
    if (!existsSync(config)) {
      console.error(`${USAGE}\n\nThere is no config at ${config}`);
      process.exit(2);
    }
    console.log(await buildApp(config));
  } else {
    console.log(['Wrote', ...init(resolve(argument ?? '.'))].join('\n  '));
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
