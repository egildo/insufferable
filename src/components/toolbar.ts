/**
 * `<ins-toolbar>`: a row of buttons with one tab stop. A toolbar, as the
 * WAI-ARIA Authoring Practices describe it
 * (https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).
 *
 * The markup is native: `<button>`s inside the element. A button with
 * `aria-pressed` is a toggle button; any other is left as it is. Without
 * script, every button is an ordinary button in the tab order, and nothing
 * toggles.
 *
 * Attributes in: `aria-pressed` on a toggle button says whether it is pressed;
 * `disabled` or `aria-disabled="true"` takes a button out of the walk.
 *
 * Commands out: each toggle button sends `--press` to the element, unless it
 * names another command. Unless the app cancels it, the element turns the
 * button's `aria-pressed` over.
 *
 * The keyboard: the arrows move between the buttons and wrap, following the
 * reading direction, and Home and End go to the ends. Moving presses nothing.
 *
 * Light DOM: `commandfor` finds its target by id in the same tree.
 */

import { commands } from '../commands.ts';
import { nextIndex } from '../keys.ts';

let count = 0;

/** Sets an attribute only when it differs, so the observer does not hear the element's own writes twice. */
function set(element: Element, name: string, value: string) {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

const isEnabled = (button: HTMLButtonElement) => !button.disabled && button.getAttribute('aria-disabled') !== 'true';

export class InsToolbar extends HTMLElement {
  #observer = new MutationObserver(() => this.#sync());
  /** The button that holds the tab stop: the last one focused, or the first enabled. */
  #stop: HTMLButtonElement | null = null;

  connectedCallback() {
    if (!this.id) this.id = `ins-toolbar-${++count}`;
    this.addEventListener('command', this.#onCommand);
    this.addEventListener('keydown', this.#onKeydown);
    this.addEventListener('focusin', this.#onFocusin);
    this.#observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-pressed', 'aria-disabled', 'disabled'],
    });
    this.#sync();
  }

  disconnectedCallback() {
    this.removeEventListener('command', this.#onCommand);
    this.removeEventListener('keydown', this.#onKeydown);
    this.removeEventListener('focusin', this.#onFocusin);
    this.#observer.disconnect();
  }

  get #buttons() {
    return [...this.querySelectorAll<HTMLButtonElement>(':scope > button')];
  }

  /** Writes the role, wires each toggle button, and keeps one tab stop. */
  #sync() {
    set(this, 'role', 'toolbar');
    const buttons = this.#buttons;
    if (!this.#stop || !buttons.includes(this.#stop) || !isEnabled(this.#stop)) {
      this.#stop = buttons.find(isEnabled) ?? null;
    }
    for (const button of buttons) {
      if (button.hasAttribute('aria-pressed')) {
        set(button, 'commandfor', this.id);
        if (!button.hasAttribute('command')) button.setAttribute('command', commands.press);
      }
      set(button, 'tabindex', button === this.#stop ? '0' : '-1');
    }
  }

  #onCommand = (event: Event) => {
    const { command, source } = event as CommandEvent;
    if (command !== commands.press || event.defaultPrevented) return;
    if (!(source instanceof HTMLButtonElement) || !this.#buttons.includes(source) || !isEnabled(source)) return;
    set(source, 'aria-pressed', String(source.getAttribute('aria-pressed') !== 'true'));
  };

  #onKeydown = (event: KeyboardEvent) => {
    const buttons = this.#buttons;
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    if (current < 0) return;
    const next = nextIndex(event.key, current, buttons.map(isEnabled), this.matches(':dir(rtl)'));
    if (next < 0) return;
    event.preventDefault();
    buttons[next].focus();
  };

  #onFocusin = (event: FocusEvent) => {
    const button = event.target;
    if (!(button instanceof HTMLButtonElement) || button.parentElement !== this) return;
    this.#stop = button;
    this.#sync();
  };
}

if (!customElements.get('ins-toolbar')) customElements.define('ins-toolbar', InsToolbar);
