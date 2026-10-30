import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { elements, validPrefix, withPrefix } from '../src/elements.ts';

const sources = (dir: string, extension: string) =>
  readdirSync(dir).filter((file) => file.endsWith(extension)).map((file) => readFileSync(`${dir}/${file}`, 'utf8'));

test('every element the sources define is in the list, and every one in the list is defined', () => {
  const defined = sources('src/components', '.ts')
    .flatMap((text) => [...text.matchAll(/customElements\.define\('ins-([a-z]+)'/g)].map((match) => match[1]))
    .sort();
  assert.deepEqual(defined, [...elements].sort());
});

test('every element name in the sources and the stylesheets is in the list', () => {
  const text = [...sources('src/components', '.ts'), ...sources('src/components', '.css'), ...sources('src', '.css')].join('\n');
  const found = new Set([...text.matchAll(/(?<![\w-])ins-([a-z]+)(?![\w-])/g)].map((match) => match[1]));
  for (const name of found) assert.ok((elements as readonly string[]).includes(name), `ins-${name} is not in the list`);
});

test('the prefix renames whole element names only', () => {
  const css = "ins-tabs[x], @apply --ins-icon-button, ins-icon-extra, <ins-icon name='x'>, 'ins-tree'";
  assert.equal(
    withPrefix(css, 'quince'),
    "quince-tabs[x], @apply --ins-icon-button, ins-icon-extra, <quince-icon name='x'>, 'quince-tree'",
  );
});

test('a prefix starts with a letter and is lower case', () => {
  assert.ok(validPrefix('quince') && validPrefix('a1'));
  assert.ok(!validPrefix('Quince') && !validPrefix('1a') && !validPrefix('my-app') && !validPrefix(''));
});
