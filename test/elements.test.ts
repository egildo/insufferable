import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { elements, validPrefix, withPrefix } from '../src/elements.ts';

/** The system's own prefix, declared once in its resolver. */
const prefix: string = JSON.parse(readFileSync('tokens/insufferable.resolver.json', 'utf8')).$extensions['dev.insufferable'].prefix;

const sources = (dir: string, extension: string) =>
  readdirSync(dir).filter((file) => file.endsWith(extension)).map((file) => readFileSync(`${dir}/${file}`, 'utf8'));

test('every element the sources define is in the list, and every one in the list is defined', () => {
  const defined = sources('src/components', '.ts')
    .flatMap((text) => [...text.matchAll(new RegExp(`customElements\\.define\\('${prefix}-([a-z]+)'`, 'g'))].map((match) => match[1]))
    .sort();
  assert.deepEqual(defined, [...elements].sort());
});

test('every element name in the sources and the stylesheets is in the list', () => {
  const text = [...sources('src/components', '.ts'), ...sources('src/components', '.css'), ...sources('src', '.css')].join('\n');
  const found = new Set([...text.matchAll(new RegExp(`(?<![\\w-])${prefix}-([a-z]+)(?![\\w-])`, 'g'))].map((match) => match[1]));
  for (const name of found) assert.ok((elements as readonly string[]).includes(name), `${prefix}-${name} is not in the list`);
});

test('the prefix renames whole element names only', () => {
  const css = "insufferable-tabs[x], @apply --ins-icon-button, insufferable-icon-extra, <insufferable-icon name='x'>, 'insufferable-tree'";
  assert.equal(
    withPrefix(css, 'quince', 'insufferable'),
    "quince-tabs[x], @apply --ins-icon-button, insufferable-icon-extra, <quince-icon name='x'>, 'quince-tree'",
  );
});

test('a prefix starts with a letter and is lower case', () => {
  assert.ok(validPrefix('quince') && validPrefix('a1'));
  assert.ok(!validPrefix('Quince') && !validPrefix('1a') && !validPrefix('my-app') && !validPrefix(''));
});
