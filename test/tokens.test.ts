import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const resolver = JSON.parse(readFileSync('tokens/insufferable.resolver.json', 'utf8'));
const listed = (): string[] => {
  const refs: string[] = [];
  const walk = (node: unknown) => {
    if (Array.isArray(node)) node.forEach(walk);
    else if (node && typeof node === 'object') {
      const ref = (node as { $ref?: string }).$ref;
      if (ref) refs.push(ref);
      Object.values(node).forEach(walk);
    }
  };
  walk(resolver);
  return refs.filter((ref) => ref.endsWith('.tokens.json'));
};

test('every token file is in the resolver, so no element is left out of the stylesheet', () => {
  const files = readdirSync('tokens').filter((file) => file.endsWith('.tokens.json')).sort();
  assert.deepEqual([...new Set(listed())].sort(), files);
});

test('every component stylesheet is imported by the index', () => {
  const index = readFileSync('src/index.css', 'utf8');
  for (const file of readdirSync('src/components').filter((name) => name.endsWith('.css'))) {
    assert.ok(index.includes(`./components/${file}`), `${file} is not imported`);
  }
});
