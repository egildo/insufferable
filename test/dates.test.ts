import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addDays, addMonths, clamp, isDate, isMonth, lastDay, monthGrid, moveDay, shiftMonths, weekday, weekOrder } from '../src/dates.ts';

test('a date is real or it is not', () => {
  assert.ok(isDate('2026-11-02') && isDate('2024-02-29'));
  assert.ok(!isDate('2026-02-29') && !isDate('2026-13-01') && !isDate('2026-1-1') && !isDate(''));
  assert.ok(isMonth('2026-11') && !isMonth('2026-13') && !isMonth('2026-11-02'));
});

test('weekdays are ISO: Monday is 1, Sunday is 7', () => {
  assert.equal(weekday('2026-11-02'), 1);
  assert.equal(weekday('2026-11-08'), 7);
  assert.deepEqual(weekOrder(1), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(weekOrder(7), [7, 1, 2, 3, 4, 5, 6]);
});

test('days and months add across the edges of a month and a year', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2024-03-01', -1), '2024-02-29');
  assert.equal(addMonths('2026-12', 1), '2027-01');
  assert.equal(addMonths('2026-01', -1), '2025-12');
  assert.equal(addMonths('2026-01', -13), '2024-12');
});

test('a month back from the 31st lands on the last day of a short month', () => {
  assert.equal(shiftMonths('2026-03-31', -1), '2026-02-28');
  assert.equal(shiftMonths('2024-03-31', -1), '2024-02-29');
  assert.equal(shiftMonths('2026-01-31', 12), '2027-01-31');
  assert.equal(lastDay('2026-02'), 28);
});

test('a month is weeks of seven, from the first day of the week, with no day twice', () => {
  const monday = monthGrid('2026-11', 1);
  assert.equal(monday[0].findIndex(Boolean), 6, 'the 1st of November 2026 is a Sunday: the last cell of a Monday week');
  const sunday = monthGrid('2026-11', 7);
  assert.equal(sunday[0][0], '2026-11-01');
  for (const grid of [monday, sunday]) {
    assert.ok(grid.every((week) => week.length === 7));
    const days = grid.flat().filter(Boolean);
    assert.equal(days.length, 30);
    assert.equal(new Set(days).size, 30);
  }
  assert.equal(monthGrid('2027-02', 1).length, 4, 'February 2027 starts on a Monday and has 28 days: four full weeks');
  assert.equal(monthGrid('2026-02', 1).length, 5, 'February 2026 starts on a Sunday: it spills into a fifth row');
});

test('a date is kept between the bounds', () => {
  assert.equal(clamp('2026-11-02', '2026-11-05', '2026-11-20'), '2026-11-05');
  assert.equal(clamp('2026-11-30', '2026-11-05', '2026-11-20'), '2026-11-20');
  assert.equal(clamp('2026-11-10', undefined, undefined), '2026-11-10');
});

test('the keys move the focused day as the date picker grid says', () => {
  const day = '2026-11-04';
  assert.equal(moveDay('ArrowRight', false, day, 1), '2026-11-05');
  assert.equal(moveDay('ArrowLeft', false, day, 1), '2026-11-03');
  assert.equal(moveDay('ArrowDown', false, day, 1), '2026-11-11');
  assert.equal(moveDay('ArrowUp', false, day, 1), '2026-10-28');
  assert.equal(moveDay('Home', false, day, 1), '2026-11-02');
  assert.equal(moveDay('End', false, day, 1), '2026-11-08');
  assert.equal(moveDay('Home', false, day, 7), '2026-11-01');
  assert.equal(moveDay('PageDown', false, day, 1), '2026-12-04');
  assert.equal(moveDay('PageUp', true, day, 1), '2025-11-04');
  assert.equal(moveDay('a', false, day, 1), null);
});

test('right to left turns the side arrows, not the vertical ones', () => {
  assert.equal(moveDay('ArrowRight', false, '2026-11-04', 1, true), '2026-11-03');
  assert.equal(moveDay('ArrowLeft', false, '2026-11-04', 1, true), '2026-11-05');
  assert.equal(moveDay('ArrowDown', false, '2026-11-04', 1, true), '2026-11-11');
});
