/**
 * The starter of a new app: a config, an empty icons folder and a page, so that the first `insufferable build` has
 * something to show. The page names its elements under the config's prefix, since the build writes them so.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const CONFIG = {
  prefix: 'app',
  theme: { brand: { hue: 38 }, neutral: { hue: 80, chroma: 0.005 } },
};

const PAGE = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>A new app on insufferable</title>
<link rel="stylesheet" href="insufferable.css">
<script type="module" src="components/tabs.js"></script>
<script type="module" src="components/icon.js"></script>
<style>
  /* Layout only: every word on the page takes its type from the base layer. */
  body { max-width: 40rem; margin: 2rem auto; padding: 0 1rem; }
  [role='tabpanel'] { padding-block: 1rem; }
</style>

<h1>A new app</h1>
<p>The look comes from <code>insufferable.config.json</code>. Change the brand's hue there, build again, and this page follows.</p>
<p><button class="solid">A button</button></p>

<app-tabs aria-label="Fruit">
  <button aria-controls="apple">Apple</button>
  <button aria-controls="pear">Pear</button>
</app-tabs>
<div id="apple">An apple.</div>
<div id="pear">A pear.</div>
</html>
`;

const FILES = {
  'insufferable.config.json': `${JSON.stringify(CONFIG, null, 2)}\n`,
  'icons/.gitkeep': '',
  'index.html': PAGE,
};

/**
 * Writes the starter files into `dir`; throws naming the config when one is there. A folder that already holds the
 * page or the icons folder's placeholder is refused the same way, since a starter has no business overwriting either,
 * and the refusal comes before anything is written. Returns the files written.
 */
export function init(dir) {
  const taken = Object.keys(FILES).map((name) => resolve(dir, name)).find((path) => existsSync(path));
  if (taken) throw new Error(`${taken} is already there: init writes a starter and overwrites nothing.`);
  return Object.entries(FILES).map(([name, text]) => {
    const path = resolve(dir, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
    return path;
  });
}
