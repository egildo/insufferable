/**
 * `<insufferable-table>`: a native `<table>` that sorts and selects. The table is the page's own
 * markup, and without script it is a table whose sort buttons do nothing and whose boxes check.
 *
 * Sorting. A column that sorts has `aria-sort="none"` on its header cell and a `<button>` holding
 * its title, as the WAI-ARIA Authoring Practices' sortable table has
 * (https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/). Each button sends
 * `--sort` to the element. Unless the app cancels the command, the element sets `aria-sort` on
 * that header, `ascending` and then `descending` at each press, `none` on the others, and puts
 * the rows of each `<tbody>` in that order. A cell is read as the `value` of a `<data>` or the
 * `datetime` of a `<time>` it holds, else as its text; numbers sort as numbers, and text in the
 * page's language, digits by value and any case. An app that holds its rows elsewhere cancels the
 * command, sorts, and writes `aria-sort` itself.
 *
 * Selecting. A row is selected by a checkbox in it. The checkbox in the header, in a `<thead>`,
 * checks and unchecks all of them, and shows that only some are checked as a checkbox does
 * (`indeterminate`). A row with its box checked takes the accent's tint, from the stylesheet. The
 * element writes no event of its own: the checkboxes' `change` is the platform's, and the app
 * reads which are checked.
 *
 * Light DOM: `commandfor` finds its target by id in the same tree.
 */

import { commands } from '../commands.ts';

let count = 0;

/** Sets an attribute only when it differs, so the observer does not hear the element's own writes twice. */
function set(element: Element, name: string, value: string) {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

/** What a cell stands for when it is sorted: a typed value it holds, else its text. */
function keyOf(cell: Element | undefined) {
  const typed = cell?.querySelector('data[value], time[datetime]');
  return typed?.getAttribute('value') ?? typed?.getAttribute('datetime') ?? cell?.textContent?.trim() ?? '';
}

const isNumber = (key: string) => key !== '' && Number.isFinite(Number(key));

export class InsTable extends HTMLElement {
  #observer = new MutationObserver(() => this.#sync());

  connectedCallback() {
    if (!this.id) this.id = `ins-table-${++count}`;
    this.addEventListener('command', this.#onCommand);
    this.addEventListener('change', this.#onChange);
    // The app replaces rows or headers; the buttons and the header's box follow.
    this.#observer.observe(this, { childList: true, subtree: true });
    this.#sync();
  }

  disconnectedCallback() {
    this.removeEventListener('command', this.#onCommand);
    this.removeEventListener('change', this.#onChange);
    this.#observer.disconnect();
  }

  get #headers() {
    return [...this.querySelectorAll<HTMLTableCellElement>('thead th[aria-sort]')];
  }

  get #all() {
    return this.querySelector<HTMLInputElement>('thead input[type=checkbox]');
  }

  get #boxes() {
    return [...this.querySelectorAll<HTMLInputElement>('tbody input[type=checkbox]:not(:disabled)')];
  }

  /** Wires each sort button to the element, and shows in the header's box how many rows are checked. */
  #sync() {
    for (const header of this.#headers) {
      const button = header.querySelector('button');
      if (!button) continue;
      set(button, 'commandfor', this.id);
      if (!button.hasAttribute('command')) button.setAttribute('command', commands.sort);
    }
    const all = this.#all;
    if (!all) return;
    const boxes = this.#boxes;
    const checked = boxes.filter((box) => box.checked).length;
    all.checked = boxes.length > 0 && checked === boxes.length;
    all.indeterminate = checked > 0 && checked < boxes.length;
  }

  #onCommand = (event: Event) => {
    const { command, source } = event as CommandEvent;
    if (command !== commands.sort || event.defaultPrevented) return;
    const header = source instanceof Element ? source.closest<HTMLTableCellElement>('th[aria-sort]') : null;
    if (!header || !this.contains(header)) return;
    const order = header.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
    for (const other of this.#headers) set(other, 'aria-sort', other === header ? order : 'none');
    this.#order(header, order === 'ascending' ? 1 : -1);
  };

  /** Puts the rows of each body in the order of one column. */
  #order(header: HTMLTableCellElement, direction: 1 | -1) {
    const lang = this.closest('[lang]')?.getAttribute('lang') || document.documentElement.lang || undefined;
    const collator = new Intl.Collator(lang, { numeric: true, sensitivity: 'base' });
    const compare = (a: string, b: string) => (isNumber(a) && isNumber(b) ? Number(a) - Number(b) : collator.compare(a, b));
    for (const body of header.closest('table')?.tBodies ?? []) {
      const rows = [...body.rows];
      // The sort is stable, so rows with the same key keep the order they had.
      rows.sort((a, b) => direction * compare(keyOf(a.cells[header.cellIndex]), keyOf(b.cells[header.cellIndex])));
      body.append(...rows);
    }
  }

  #onChange = (event: Event) => {
    const box = event.target;
    if (!(box instanceof HTMLInputElement) || box.type !== 'checkbox') return;
    if (box.closest('thead')) for (const row of this.#boxes) row.checked = box.checked;
    this.#sync();
  };
}

if (!customElements.get('insufferable-table')) customElements.define('insufferable-table', InsTable);
