/**
 * `<ins-tabs>`: which panel is in front. A tab list, as the WAI-ARIA Authoring
 * Practices describe it (https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).
 *
 * The markup is native: `<button>`s inside the element, each naming its panel
 * with `aria-controls`. The panels sit anywhere in the page. Without script,
 * every panel shows and the buttons do nothing.
 *
 * Attributes in: `aria-selected` on a tab says which one is in front, and the
 * element shows that tab's panel and hides the others. `disabled` or
 * `aria-disabled="true"` takes a tab out of the choice.
 *
 * Commands out: each tab sends `--select` to the element. Unless the app
 * cancels the command, the element selects the tab that sent it. The arrow
 * keys, Home and End move focus and select the tab they land on (automatic
 * activation), through the same command, so an app that owns the state owns the
 * keyboard's choices too.
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

const isEnabled = (tab: HTMLButtonElement) => !tab.disabled && tab.getAttribute('aria-disabled') !== 'true';

export class InsTabs extends HTMLElement {
  #observer = new MutationObserver(() => this.#sync());

  connectedCallback() {
    if (!this.id) this.id = `ins-tabs-${++count}`;
    this.addEventListener('command', this.#onCommand);
    this.addEventListener('keydown', this.#onKeydown);
    // The app replaces tabs or writes `aria-selected`; the panels and the tab stop follow.
    this.#observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-selected', 'aria-disabled', 'disabled'],
    });
    this.#sync();
  }

  disconnectedCallback() {
    this.removeEventListener('command', this.#onCommand);
    this.removeEventListener('keydown', this.#onKeydown);
    this.#observer.disconnect();
  }

  get #tabs() {
    return [...this.querySelectorAll<HTMLButtonElement>(':scope > button')];
  }

  #panelOf(tab: HTMLButtonElement) {
    const id = tab.getAttribute('aria-controls');
    return id ? (this.getRootNode() as Document | ShadowRoot).getElementById(id) : null;
  }

  /** Writes roles, wiring, the tab stop and the panels from `aria-selected`. */
  #sync() {
    set(this, 'role', 'tablist');
    const tabs = this.#tabs;
    const enabled = tabs.map(isEnabled);
    const marked = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
    // A list that marks no tab shows its first enabled one, as a native list box shows its first option.
    const selected = marked >= 0 ? marked : enabled.indexOf(true);
    const stop = enabled[selected] ? selected : enabled.indexOf(true);

    tabs.forEach((tab, index) => {
      set(tab, 'role', 'tab');
      set(tab, 'commandfor', this.id);
      if (!tab.hasAttribute('command')) tab.setAttribute('command', commands.select);
      set(tab, 'aria-selected', String(index === selected));
      set(tab, 'tabindex', index === stop ? '0' : '-1');

      const panel = this.#panelOf(tab);
      if (!panel) return;
      if (!tab.id) tab.id = `${this.id}-tab-${index}`;
      set(panel, 'role', 'tabpanel');
      set(panel, 'aria-labelledby', tab.id);
      if (!panel.hasAttribute('tabindex')) panel.tabIndex = 0;
      panel.hidden = index !== selected;
    });
  }

  #onCommand = (event: Event) => {
    const { command, source } = event as CommandEvent;
    if (command !== commands.select || event.defaultPrevented) return;
    const tabs = this.#tabs;
    if (!(source instanceof HTMLButtonElement) || !tabs.includes(source) || !isEnabled(source)) return;
    for (const tab of tabs) set(tab, 'aria-selected', String(tab === source));
    this.#sync();
  };

  #onKeydown = (event: KeyboardEvent) => {
    const tabs = this.#tabs;
    const current = tabs.indexOf(event.target as HTMLButtonElement);
    if (current < 0) return;
    const next = nextIndex(event.key, current, tabs.map(isEnabled), this.matches(':dir(rtl)'));
    if (next < 0) return;
    event.preventDefault();
    tabs[next].focus();
    // A click sends the tab's command, so the keyboard's choice goes through the app like any other.
    tabs[next].click();
  };
}

if (!customElements.get('ins-tabs')) customElements.define('ins-tabs', InsTabs);
