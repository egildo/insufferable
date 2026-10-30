/**
 * `<ins-shell>`: an application laid out on a desk, its docks, side panes and
 * main pane in a row. Below a width, a side pane no longer fits beside the
 * main one, so the element makes each side pane a popover: its dock opens it
 * over the main pane, and the platform closes it on Escape or a click outside
 * and hands focus back to the dock. Below a smaller width, the popover is
 * drawn as a sheet from the bottom.
 *
 * The widths are tokens, `ins.size.shellNarrow` and `ins.size.shellPhone`,
 * read from the stylesheet. The element shows them to CSS as custom states,
 * `:state(narrow)` and `:state(phone)`, since a container query cannot read a
 * custom property.
 *
 * Going narrow, the panes that were open close, so the overlay does not cover
 * the main pane unasked; going wide again, they open as they were, except that
 * a pane open over the others takes its side's place. The element writes
 * `aria-expanded` on their dock buttons for it, which the docks follow.
 *
 * Without script it is the row at every width.
 */

/** Sets an attribute only when it differs. */
function set(element: Element, name: string, value: string) {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

export class InsShell extends HTMLElement {
  #internals = this.attachInternals();
  #observer = new ResizeObserver(() => this.#fit());
  /** The side panes that were open when the shell went narrow. */
  #open = new Set<string>();

  connectedCallback() {
    this.#observer.observe(this);
    this.#fit();
  }

  disconnectedCallback() {
    this.#observer.disconnect();
  }

  get #panes() {
    return [...this.querySelectorAll<HTMLElement>(':scope > aside.pane[id]')];
  }

  /** A size token in pixels, read from the stylesheet's custom property. */
  #width(property: string) {
    const value = getComputedStyle(this).getPropertyValue(property).trim();
    const number = Number.parseFloat(value);
    if (value.endsWith('rem')) return number * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    return number;
  }

  #buttonsOf(pane: HTMLElement) {
    return [...document.querySelectorAll<HTMLButtonElement>(`button[aria-controls="${pane.id}"][aria-expanded]`)];
  }

  #fit() {
    const width = this.getBoundingClientRect().width;
    const narrow = width < this.#width('--ins-size-shell-narrow');
    const phone = width < this.#width('--ins-size-shell-phone');
    const states = this.#internals.states;
    phone ? states.add('phone') : states.delete('phone');
    if (narrow === states.has('narrow')) return;
    narrow ? states.add('narrow') : states.delete('narrow');

    if (!narrow) {
      // A pane open over the others when the shell widens stays open in the row, in place of its side's others.
      const main = this.querySelector(':scope > main');
      const sideOf = (pane: HTMLElement) =>
        main && pane.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING ? 'start' : 'end';
      for (const over of this.#panes.filter((pane) => pane.matches(':popover-open'))) {
        for (const pane of this.#panes) if (sideOf(pane) === sideOf(over)) this.#open.delete(pane.id);
        this.#open.add(over.id);
      }
    }

    for (const pane of this.#panes) {
      const buttons = this.#buttonsOf(pane);
      if (narrow) {
        if (!pane.hidden) this.#open.add(pane.id);
        set(pane, 'popover', 'auto');
        for (const button of buttons) set(button, 'aria-expanded', 'false');
      } else {
        pane.removeAttribute('popover');
        const open = this.#open.has(pane.id);
        pane.hidden = !open;
        for (const button of buttons) set(button, 'aria-expanded', String(open));
      }
    }
    if (!narrow) this.#open.clear();
  }
}

if (!customElements.get('ins-shell')) customElements.define('ins-shell', InsShell);
