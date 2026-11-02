/**
 * `<insufferable-calendar>`: a month of days, one of which is chosen. The date picker grid of the
 * WAI-ARIA Authoring Practices
 * (https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/), drawn
 * inline. To pick a date in a form, use `<input type="date">`: the platform draws and keeps it.
 * The calendar is for a month that is on the page, to look at and to choose from.
 *
 *   <insufferable-calendar value="2026-11-02" previous="Previous month" next="Next month"></insufferable-calendar>
 *
 * The element draws a heading with the month's name between two buttons, and a table of the weeks,
 * a day to a cell, a button in each. Without script there is nothing to see: the markup is the
 * element's own.
 *
 * Attributes in: `value` is the chosen date, `YYYY-MM-DD`; `month` is the month shown, `YYYY-MM`,
 * which is the value's when it is not set, and today's when there is no value; `min` and `max`
 * bound the days that can be chosen, and a day outside them is `aria-disabled`. `firstday` is the
 * first day of the week, 1 Monday to 7 Sunday, which is the language's when it is not set. The
 * language is the nearest `lang`, and the month, the weekdays and the numerals are written in it.
 * `previous` and `next` are the app's words for the two buttons; the element ships none.
 *
 * Commands out: a day sends `--select`, with its date in its `value`, and the two buttons send
 * `--show`, with the month they lead to. Unless the app cancels the command, the element writes
 * the date to `value`, or the month to `month`. The keyboard follows the Authoring Practices: the
 * arrows move a day or a week, Home and End to the week's ends, Page Up and Page Down a month, with
 * Shift a year; Enter and Space choose. A move to the next or the previous month goes through
 * `--show` like the button's; a move by a year writes `month` itself.
 *
 * It writes: `role="grid"` on the table, `aria-selected` on each cell, `aria-current="date"` on
 * today, and a full date as each day's name, so a screen reader says the weekday and the month.
 *
 * Light DOM: `commandfor` finds its target by id in the same tree.
 */

import { commands } from '../commands.ts';
import { addMonths, clamp, isDate, isMonth, lastDay, monthGrid, monthOf, moveDay, weekOrder, addDays } from '../dates.ts';

let count = 0;
let warned = false;

const pad = (n: number) => String(n).padStart(2, '0');

/** Today, in the reader's own clock. */
function today() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** A button of the heading, that leads to a month. */
function arrow(id: string, month: string, name: string, label: string | null, disabled: boolean) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'plain';
  if (label) button.setAttribute('aria-label', label);
  button.setAttribute('commandfor', id);
  button.setAttribute('command', commands.show);
  button.value = month;
  if (disabled) button.setAttribute('aria-disabled', 'true');
  const icon = document.createElement('insufferable-icon');
  icon.setAttribute('name', name);
  button.append(icon);
  return button;
}

export class InsCalendar extends HTMLElement {
  static observedAttributes = ['value', 'month', 'min', 'max', 'previous', 'next', 'firstday'];

  /** The date that has the tab stop: the one the person last reached. */
  #focus = '';

  connectedCallback() {
    if (!this.id) this.id = `ins-calendar-${++count}`;
    this.addEventListener('command', this.#onCommand);
    this.addEventListener('keydown', this.#onKeydown);
    this.addEventListener('focusin', this.#onFocusin);
    this.#render();
  }

  disconnectedCallback() {
    this.removeEventListener('command', this.#onCommand);
    this.removeEventListener('keydown', this.#onKeydown);
    this.removeEventListener('focusin', this.#onFocusin);
  }

  attributeChangedCallback() {
    if (this.isConnected) this.#render();
  }

  get #lang() {
    return this.closest('[lang]')?.getAttribute('lang') || document.documentElement.lang || navigator.language;
  }

  /** An attribute that holds a date, or nothing when it holds anything else. */
  #date(name: string) {
    const text = this.getAttribute(name) ?? '';
    return isDate(text) ? text : undefined;
  }

  get #value() {
    return this.#date('value');
  }

  get #month() {
    const month = this.getAttribute('month') ?? '';
    return isMonth(month) ? month : monthOf(this.#value ?? today());
  }

  get #firstDay() {
    const attribute = Number(this.getAttribute('firstday'));
    if (attribute >= 1 && attribute <= 7) return Math.trunc(attribute);
    try {
      const locale = new Intl.Locale(this.#lang) as unknown as { getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number } };
      return (locale.getWeekInfo?.() ?? locale.weekInfo)?.firstDay ?? 1;
    } catch {
      return 1;
    }
  }

  /** The date in the shown month that has the tab stop: the one last reached, else the chosen one, else today, else the 1st. */
  #stop(month: string) {
    return [this.#focus, this.#value, today()].find((date) => date && monthOf(date) === month) ?? `${month}-01`;
  }

  #render() {
    const month = this.#month;
    const [min, max] = [this.#date('min'), this.#date('max')];
    const [value, now, first] = [this.#value, today(), this.#firstDay];
    const lang = this.#lang;
    const hadFocus = this.contains((this.getRootNode() as Document | ShadowRoot).activeElement);

    const stop = this.#stop(month);
    const title = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' });
    const full = new Intl.DateTimeFormat(lang, { dateStyle: 'full', timeZone: 'UTC' });
    const numeral = new Intl.NumberFormat(lang);
    const narrow = new Intl.DateTimeFormat(lang, { weekday: 'narrow', timeZone: 'UTC' });
    const long = new Intl.DateTimeFormat(lang, { weekday: 'long', timeZone: 'UTC' });
    const at = (date: string) => new Date(`${date}T00:00:00Z`);

    const [before, after] = [addMonths(month, -1), addMonths(month, 1)];
    const previous = this.getAttribute('previous');
    const next = this.getAttribute('next');
    if ((!previous || !next) && !warned) {
      warned = true;
      console.warn('<insufferable-calendar>: set `previous` and `next`, the names of its two buttons; the element ships no words');
    }

    const heading = document.createElement('header');
    const name = document.createElement('h2');
    name.id = `${this.id}-title`;
    name.setAttribute('aria-live', 'polite');
    name.textContent = title.format(at(`${month}-01`));
    heading.append(
      arrow(this.id, before, 'chevron-left', previous, min !== undefined && `${before}-${lastDay(before)}` < min),
      name,
      arrow(this.id, after, 'chevron-right', next, max !== undefined && `${after}-01` > max),
    );

    const table = document.createElement('table');
    table.setAttribute('role', 'grid');
    table.setAttribute('aria-labelledby', name.id);
    const head = table.createTHead().insertRow();
    for (const day of weekOrder(first)) {
      const cell = document.createElement('th');
      const date = at(addDays('2024-01-01', day - 1));
      cell.scope = 'col';
      cell.abbr = long.format(date);
      cell.textContent = narrow.format(date);
      head.append(cell);
    }
    const body = table.createTBody();
    for (const week of monthGrid(month, first)) {
      const row = body.insertRow();
      for (const date of week) {
        const cell = row.insertCell();
        if (!date) continue;
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('aria-selected', String(date === value));
        const button = document.createElement('button');
        button.type = 'button';
        button.value = date;
        button.textContent = numeral.format(Number(date.slice(8)));
        button.setAttribute('aria-label', full.format(at(date)));
        button.setAttribute('commandfor', this.id);
        button.setAttribute('command', commands.select);
        button.tabIndex = date === stop ? 0 : -1;
        if (date === now) button.setAttribute('aria-current', 'date');
        if (clamp(date, min, max) !== date) button.setAttribute('aria-disabled', 'true');
        cell.append(button);
      }
    }

    this.replaceChildren(heading, table);
    if (hadFocus) this.#button(stop)?.focus();
  }

  #button(date: string) {
    return this.querySelector<HTMLButtonElement>(`td > button[value="${date}"]`);
  }

  #onCommand = (event: Event) => {
    const { command, source } = event as CommandEvent;
    if (event.defaultPrevented || !(source instanceof HTMLButtonElement) || !this.contains(source)) return;
    if (source.getAttribute('aria-disabled') === 'true') return;
    if (command === commands.select) this.setAttribute('value', source.value);
    else if (command === commands.show) this.setAttribute('month', source.value);
  };

  #onFocusin = (event: FocusEvent) => {
    const button = event.target;
    if (button instanceof HTMLButtonElement && button.closest('td')) this.#focus = button.value;
  };

  #onKeydown = (event: KeyboardEvent) => {
    const button = event.target;
    if (!(button instanceof HTMLButtonElement) || !button.closest('td') || event.altKey || event.ctrlKey || event.metaKey) return;
    const to = moveDay(event.key, event.shiftKey, button.value, this.#firstDay, this.matches(':dir(rtl)'));
    if (!to) return;
    event.preventDefault();
    const target = clamp(to, this.#date('min'), this.#date('max'));
    if (target === button.value) return;
    this.#focus = target;
    const month = monthOf(target);
    if (month === this.#month) return this.#button(target)?.focus();
    // A neighbouring month is the heading button's, so the app that owns the month hears it as it hears a click.
    const heading = this.querySelectorAll<HTMLButtonElement>('header > button');
    const lead = [...heading].find((candidate) => candidate.value === month);
    if (lead) this.dispatchEvent(new CommandEvent('command', { command: commands.show, source: lead, cancelable: true }));
    else this.setAttribute('month', month);
  };
}

if (!customElements.get('insufferable-calendar')) customElements.define('insufferable-calendar', InsCalendar);
