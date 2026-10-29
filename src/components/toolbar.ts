/**
 * `<ins-toolbar>`: a row of buttons with one tab stop. A toolbar, as the
 * WAI-ARIA Authoring Practices describe it
 * (https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).
 *
 * The markup is native: `<button>`s inside the element. A button with
 * `aria-pressed` is a toggle button; a button with `aria-expanded` and
 * `aria-controls` is a disclosure button
 * (https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/), which shows and
 * hides the element it names; any other is left as it is. Without script,
 * every button is an ordinary button in the tab order, and nothing toggles.
 *
 * Attributes in: `aria-pressed` on a toggle button says whether it is pressed;
 * `aria-expanded` on a disclosure button whether what it names is shown, and
 * the element keeps that element's `hidden` in step; `disabled` or
 * `aria-disabled="true"` takes a button out of the walk; `aria-orientation=
 * "vertical"` on the element turns the walk to Up and Down.
 *
 * Commands out: each toggle button sends `--press` to the element, each
 * disclosure button `--expand`, unless it names another command. Unless the
 * app cancels it, the element turns the button's `aria-pressed` or
 * `aria-expanded` over.
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
      attributeFilter: ['aria-pressed', 'aria-expanded', 'aria-disabled', 'disabled', 'aria-orientation'],
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
      const kind = this.#kindOf(button);
      if (kind) {
        set(button, 'commandfor', this.id);
        if (!button.hasAttribute('command')) button.setAttribute('command', kind);
      }
      if (kind === commands.expand) {
        const target = this.#targetOf(button);
        if (target) target.hidden = button.getAttribute('aria-expanded') !== 'true';
      }
      set(button, 'tabindex', button === this.#stop ? '0' : '-1');
    }
  }

  /** The command a button sends by its kind: `--press` for a toggle button, `--expand` for a disclosure button. */
  #kindOf(button: HTMLButtonElement) {
    if (button.hasAttribute('aria-pressed')) return commands.press;
    if (button.hasAttribute('aria-expanded') && button.hasAttribute('aria-controls')) return commands.expand;
    return null;
  }

  #targetOf(button: HTMLButtonElement) {
    const id = button.getAttribute('aria-controls');
    return id ? (this.getRootNode() as Document | ShadowRoot).getElementById(id) : null;
  }

  #onCommand = (event: Event) => {
    const { command, source } = event as CommandEvent;
    if (event.defaultPrevented) return;
    if (!(source instanceof HTMLButtonElement) || !this.#buttons.includes(source) || !isEnabled(source)) return;
    const state = command === commands.press ? 'aria-pressed' : command === commands.expand ? 'aria-expanded' : null;
    if (!state || !source.hasAttribute(state)) return;
    set(source, state, String(source.getAttribute(state) !== 'true'));
    this.#sync();
  };

  #onKeydown = (event: KeyboardEvent) => {
    const buttons = this.#buttons;
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    if (current < 0) return;
    const vertical = this.getAttribute('aria-orientation') === 'vertical';
    const next = nextIndex(event.key, current, buttons.map(isEnabled), this.matches(':dir(rtl)'), vertical);
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
