import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nextIndex } from '../src/keys.ts';

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
