import assert from 'node:assert/strict';
import { test } from 'node:test';
import { comboboxAction, matches, nextIndex, splitterValue, treeAction, typeAhead } from '../src/keys.ts';

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

test('a splitter moves where the arrow points, whichever side its pane is', () => {
  assert.equal(splitterValue('ArrowRight', 50, true, 50), 55);
  assert.equal(splitterValue('ArrowRight', 50, false, 50), 45);
  assert.equal(splitterValue('ArrowLeft', 2, true, 50), 0);
});

test('a splitter goes to its ends, and Enter collapses and restores', () => {
  assert.equal(splitterValue('Home', 40, true, 40), 0);
  assert.equal(splitterValue('End', 40, true, 40), 100);
  assert.equal(splitterValue('Enter', 40, true, 40), 0);
  assert.equal(splitterValue('Enter', 0, true, 40), 40);
  assert.equal(splitterValue('a', 40, true, 40), null);
});

const closed = { open: false, active: -1, enabled: [true, false, true], hasText: false };
const showing = { ...closed, open: true };

test('a combobox opens on Down at the first option and on Up at the last, passing over a disabled one', () => {
  assert.deepEqual(comboboxAction('ArrowDown', false, closed), { open: true, active: 0 });
  assert.deepEqual(comboboxAction('ArrowUp', false, closed), { open: true, active: 2 });
  assert.deepEqual(comboboxAction('ArrowDown', false, { ...showing, active: 0 }), { active: 2 });
  assert.deepEqual(comboboxAction('ArrowDown', false, { ...showing, active: 2 }), { active: 0 });
  assert.deepEqual(comboboxAction('ArrowUp', false, { ...showing, active: 0 }), { active: 2 });
});

test('Alt with an arrow opens or closes the list without moving the active option', () => {
  assert.deepEqual(comboboxAction('ArrowDown', true, closed), { open: true });
  assert.equal(comboboxAction('ArrowDown', true, showing), null);
  assert.deepEqual(comboboxAction('ArrowUp', true, showing), { open: false, active: -1 });
});

test('Enter chooses the active option, and is the form\'s when there is none', () => {
  assert.deepEqual(comboboxAction('Enter', false, { ...showing, active: 2 }), { accept: 2, open: false, active: -1 });
  assert.equal(comboboxAction('Enter', false, showing), null);
  assert.equal(comboboxAction('Enter', false, closed), null);
});

test('Escape closes the list, then empties the field', () => {
  assert.deepEqual(comboboxAction('Escape', false, { ...showing, hasText: true }), { open: false, active: -1 });
  assert.deepEqual(comboboxAction('Escape', false, { ...closed, hasText: true }), { clear: true });
  assert.equal(comboboxAction('Escape', false, closed), null);
});

test('Tab closes an open list, and typing, Home and End are the field\'s', () => {
  assert.deepEqual(comboboxAction('Tab', false, showing), { open: false, active: -1 });
  assert.equal(comboboxAction('Tab', false, closed), null);
  for (const key of ['a', 'Home', 'End', 'ArrowLeft']) assert.equal(comboboxAction(key, false, showing), null);
});

test('a combobox with nothing to choose does not open', () => {
  assert.equal(comboboxAction('ArrowDown', false, { ...closed, enabled: [] }), null);
  assert.equal(comboboxAction('ArrowUp', false, { ...closed, enabled: [false] }), null);
});

test('typing narrows the options, in any case and without accents', () => {
  const texts = ['Mela', 'Pera', 'Pèsca', 'Ananas'];
  assert.deepEqual(matches('pe', texts), [1, 2]);
  assert.deepEqual(matches('PESCA', texts), [2]);
  assert.deepEqual(matches('an', texts), [3]);
  assert.deepEqual(matches('  ', texts), [0, 1, 2, 3]);
  assert.deepEqual(matches('zz', texts), []);
});
