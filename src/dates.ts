/**
 * The calendar's dates, as pure functions: no element, no event, so a test can hold them.
 *
 * A date is the string the platform's own date input speaks, `YYYY-MM-DD`, and a month `YYYY-MM`. They are worked
 * out in UTC, so a change of clock never moves a day. A weekday is ISO 8601's: 1 is Monday, 7 is Sunday, which is
 * also how `Intl.Locale`'s week info numbers the first day of the week.
 */

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

/** The day, in UTC, that an ISO date stands for, or null when the text is not a real date. */
function toUtc(date: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const utc = new Date(Date.UTC(year, month - 1, day));
  // `Date.UTC` rolls 31 February over into March; a real date comes back as it went in.
  return utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day ? utc : null;
}

const toIso = (utc: Date) => `${pad(utc.getUTCFullYear(), 4)}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`;

/** Whether the text is a real `YYYY-MM-DD` date. */
export const isDate = (date: string) => toUtc(date) !== null;

/** Whether the text is a `YYYY-MM` month. */
export const isMonth = (month: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(month);

/** The month a date falls in. */
export const monthOf = (date: string) => date.slice(0, 7);

/** The weekday of a date: 1 Monday to 7 Sunday. */
export function weekday(date: string): number {
  const utc = toUtc(date);
  return utc ? utc.getUTCDay() || 7 : 0;
}

/** The date `days` later, or earlier when negative. */
export function addDays(date: string, days: number): string {
  const utc = toUtc(date);
  if (!utc) return date;
  utc.setUTCDate(utc.getUTCDate() + days);
  return toIso(utc);
}

/** The month `months` later or earlier. */
export function addMonths(month: string, months: number): string {
  const [year, number] = month.split('-').map(Number);
  const total = year * 12 + (number - 1) + months;
  return `${pad(Math.floor(total / 12), 4)}-${pad((total % 12) + 1)}`;
}

/**
 * The date `months` later or earlier, on the same day of the month, or on the last day of a month that is too short:
 * the 31st of March, a month back, is the 28th of February.
 */
export function shiftMonths(date: string, months: number): string {
  const month = addMonths(monthOf(date), months);
  const day = Math.min(Number(date.slice(8, 10)), lastDay(month));
  return `${month}-${pad(day)}`;
}

/** The number of days in a month. */
export function lastDay(month: string): number {
  return new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
}

/** The seven weekdays in the order a week shows them, from its first day. */
export const weekOrder = (firstDay: number) => Array.from({ length: 7 }, (_, i) => ((firstDay - 1 + i) % 7) + 1);

/** The weeks of a month, each seven cells from the week's first day: a date, or null before the 1st and after the last. */
export function monthGrid(month: string, firstDay: number): (string | null)[][] {
  const first = `${month}-01`;
  const lead = (weekday(first) - firstDay + 7) % 7;
  const cells: (string | null)[] = [...Array<null>(lead).fill(null)];
  for (let day = 1; day <= lastDay(month); day++) cells.push(`${month}-${pad(day)}`);
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, week) => cells.slice(week * 7, week * 7 + 7));
}

/** The date, kept between `min` and `max` when they are given. */
export function clamp(date: string, min?: string, max?: string): string {
  if (min && date < min) return min;
  if (max && date > max) return max;
  return date;
}

/**
 * Where a key moves the focused day, following the WAI-ARIA Authoring Practices' date picker grid
 * (https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/): the arrows a day or a week
 * (Left and Right follow the reading direction), Home and End the week's first and last day, Page Up and Page Down
 * a month, with Shift a year. Null for any other key.
 *
 * @param key a `KeyboardEvent.key`
 * @param shift whether Shift is held
 * @param date the focused date
 * @param firstDay the first weekday of the week, 1 to 7
 * @param rtl whether the grid reads right to left
 */
export function moveDay(key: string, shift: boolean, date: string, firstDay: number, rtl = false): string | null {
  const back = rtl ? 'ArrowRight' : 'ArrowLeft';
  const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
  switch (key) {
    case back:
      return addDays(date, -1);
    case forward:
      return addDays(date, 1);
    case 'ArrowUp':
      return addDays(date, -7);
    case 'ArrowDown':
      return addDays(date, 7);
    case 'Home':
      return addDays(date, -((weekday(date) - firstDay + 7) % 7));
    case 'End':
      return addDays(date, 6 - ((weekday(date) - firstDay + 7) % 7));
    case 'PageUp':
      return shiftMonths(date, shift ? -12 : -1);
    case 'PageDown':
      return shiftMonths(date, shift ? 12 : 1);
    default:
      return null;
  }
}
