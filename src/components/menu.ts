/**
 * `<ins-menu popover>`: a list of actions under the button that opens it. A
 * menu button, as the WAI-ARIA Authoring Practices describe it
 * (https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/).
 *
 * The markup is native: a popover holding `<button>`s, opened by a button
 * elsewhere whose `commandfor` names the menu and whose `command` is
 * `toggle-popover`. Without script the popover still opens and closes, and Tab
 * walks its buttons.
 *
 * Attributes in: `disabled` or `aria-disabled="true"` on an item takes it out
 * of the walk. Whether the menu is open is the platform's (`:popover-open`): an
 * app hears `toggle`, and cancels `beforetoggle` to refuse an opening.
 *
 * Commands out: none of its own. Each item sends what its author gives it;
 * once one is chosen, the element closes the menu.
 *
 * The keyboard: on the opening button, Down opens the menu on its first item and
 * Up on its last; in the menu, Up and Down move and wrap, Home and End go to the
 * ends, and Tab closes it and moves on. Escape is the platform's.
 *
 * Light DOM: the opening button finds the menu by id in the same tree.
 */

import { nextIndex } from '../keys.ts';

let count = 0;

/** Sets an attribute only when it differs, so the observer does not hear the element's own writes twice. */
function set(element: Element, name: string, value: string) {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

const isEnabled = (item: HTMLButtonElement) => !item.disabled && item.getAttribute('aria-disabled') !== 'true';

export class InsMenu extends HTMLElement {
  #observer = new MutationObserver(() => this.#sync());
  #root: Document | ShadowRoot = document;
  /** Where the next opening lands: Up on the opening button lands on the last item. */
  #land: 'first' | 'last' = 'first';

  connectedCallback() {
    if (!this.id) this.id = `ins-menu-${++count}`;
    this.#root = this.getRootNode() as Document | ShadowRoot;
    this.addEventListener('toggle', this.#onToggle);
    this.addEventListener('keydown', this.#onKeydown);
    this.addEventListener('click', this.#onClick);
    this.addEventListener('focusout', this.#onFocusout);
    // The opening button sits outside the menu, so its keys are heard from the root.
    this.#root.addEventListener('keydown', this.#onOpenerKeydown as EventListener);
    this.#observer.observe(this, { childList: true });
    this.#sync();
  }

  disconnectedCallback() {
    this.removeEventListener('toggle', this.#onToggle);
    this.removeEventListener('keydown', this.#onKeydown);
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('focusout', this.#onFocusout);
    this.#root.removeEventListener('keydown', this.#onOpenerKeydown as EventListener);
    this.#observer.disconnect();
  }

  get #items() {
    return [...this.querySelectorAll<HTMLButtonElement>(':scope > button')];
  }

  get #opener() {
    return this.#root.querySelector<HTMLElement>(`[commandfor="${CSS.escape(this.id)}"]`);
  }

  get #open() {
    return this.matches(':popover-open');
  }

  /** Writes the roles, the label from the opening button, and takes the items out of the page's tab order. */
  #sync() {
    set(this, 'role', 'menu');
    const opener = this.#opener;
    if (opener) {
      if (!opener.id) opener.id = `${this.id}-opener`;
      set(this, 'aria-labelledby', opener.id);
    }
    for (const item of this.#items) {
      set(item, 'role', 'menuitem');
      set(item, 'tabindex', '-1');
    }
  }

  #onToggle = (event: Event) => {
    if ((event as ToggleEvent).newState !== 'open') return;
    const items = this.#items;
    const enabled = items.map(isEnabled);
    const at = this.#land === 'last' ? enabled.lastIndexOf(true) : enabled.indexOf(true);
    this.#land = 'first';
    items[at]?.focus();
  };

  #onKeydown = (event: KeyboardEvent) => {
    const items = this.#items;
    const current = items.indexOf(event.target as HTMLButtonElement);
    if (current < 0) return;
    // Closing hands focus back to the opening button, and Tab then moves on from it.
    if (event.key === 'Tab') return this.hidePopover();
    const next = nextIndex(event.key, current, items.map(isEnabled), false, true);
    if (next < 0) return;
    event.preventDefault();
    items[next].focus();
  };

  #onOpenerKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const opener = event.target;
    if (!(opener instanceof HTMLElement) || opener.getAttribute('commandfor') !== this.id || this.#open) return;
    event.preventDefault();
    this.#land = event.key === 'ArrowUp' ? 'last' : 'first';
    this.showPopover({ source: opener });
  };

  #onClick = (event: MouseEvent) => {
    const item = (event.target as Element).closest('button');
    if (!item || item.parentElement !== this || !isEnabled(item)) return;
    // The item's own command goes out in the click's activation, after this listener: close once it has.
    setTimeout(() => this.#open && this.hidePopover());
  };

  #onFocusout = (event: FocusEvent) => {
    // Only focus that lands outside closes the menu. A click outside is the platform's light dismiss, and a browser
    // that does not focus a clicked button reports nowhere, which must not close the menu before the click.
    const to = event.relatedTarget;
    if (!(to instanceof Node) || this.contains(to) || to === this.#opener) return;
    if (this.#open) this.hidePopover();
  };
}

if (!customElements.get('ins-menu')) customElements.define('ins-menu', InsMenu);
