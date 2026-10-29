import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nextIndex, treeAction, typeAhead } from '../src/keys.ts';

const all = [true, true, true];

test('the arrows move and wrap', () => {
  assert.equal(nextIndex('ArrowRight', 0, all), 1);
  assert.equal(nextIndex('ArrowRight', 2, all), 0);
  assert.equal(nextIndex('ArrowLeft', 0, all), 2);
});

test('Home and End go to the enabled ends', () => {
  assert.equal(nextIndex('Home', 1, [false, true, true]), 1);
  assert.equal(nextIndex('End', 0, [true, true, false]), 1);
});

test('a tab that cannot be chosen is passed over', () => {
  assert.equal(nextIndex('ArrowRight', 0, [true, false, true]), 2);
});

test('right to left, the arrows follow the reading direction', () => {
  assert.equal(nextIndex('ArrowLeft', 0, all, true), 1);
  assert.equal(nextIndex('ArrowRight', 0, all, true), 2);
});

test('other keys and nothing enabled move nowhere', () => {
  assert.equal(nextIndex('a', 0, all), -1);
  assert.equal(nextIndex('ArrowRight', 0, [false, false]), -1);
});

test('a menu walks down and up, whatever the direction', () => {
  assert.equal(nextIndex('ArrowDown', 2, all, false, true), 0);
  assert.equal(nextIndex('ArrowUp', 0, all, true, true), 2);
  assert.equal(nextIndex('ArrowDown', 0, [true, false, true], false, true), 2);
  assert.equal(nextIndex('ArrowRight', 0, all, false, true), -1);
});

// A tree: an open root (0) with an end node (1) and a closed node (2), then a closed root (3).
const tree = [
  { parent: -1, expanded: true },
  { parent: 0 },
  { parent: 0, expanded: false },
  { parent: -1, expanded: false },
];

test('a tree walks down and up, and stops at the ends', () => {
  assert.deepEqual(treeAction('ArrowDown', 0, tree), { focus: 1 });
  assert.equal(treeAction('ArrowDown', 3, tree), null);
  assert.equal(treeAction('ArrowUp', 0, tree), null);
  assert.deepEqual(treeAction('End', 0, tree), { focus: 3 });
});

test('right opens a closed node, enters an open one, and does nothing on an end node', () => {
  assert.deepEqual(treeAction('ArrowRight', 2, tree), { expand: 2 });
  assert.deepEqual(treeAction('ArrowRight', 0, tree), { focus: 1 });
  assert.equal(treeAction('ArrowRight', 1, tree), null);
});

test('left closes an open node, or goes to the parent', () => {
  assert.deepEqual(treeAction('ArrowLeft', 0, tree), { expand: 0 });
  assert.deepEqual(treeAction('ArrowLeft', 2, tree), { focus: 0 });
  assert.equal(treeAction('ArrowLeft', 3, tree), null);
});

test('Enter selects', () => {
  assert.deepEqual(treeAction('Enter', 1, tree), { select: 1 });
});

test('type-ahead finds the next name, wrapping', () => {
  const names = ['Section', 'Paragraph', 'Paragraph', 'Heading'];
  assert.equal(typeAhead('p', 1, names), 2);
  assert.equal(typeAhead('p', 2, names), 1);
  assert.equal(typeAhead('pa', 1, names), 1);
  assert.equal(typeAhead('x', 0, names), -1);
});
