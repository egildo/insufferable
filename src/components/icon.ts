/**
 * `<ins-icon name="home">`: a glyph of the icon font, Tabler Icons. The name
 * is Tabler's; the stylesheet draws it, so the icon draws without script.
 * The script only says what it means.
 *
 * Attributes in: `name` picks the icon. `aria-label` or `aria-labelledby` makes
 * it an image with that name. Without one it is decoration, hidden from
 * assistive technology.
 *
 * Commands out: none. An icon sends nothing.
 */

import { icons } from '../icons.ts';

const LABELS = ['aria-label', 'aria-labelledby'];

export class InsIcon extends HTMLElement {
  static observedAttributes = ['name', ...LABELS];

  connectedCallback() {
    this.#sync();
  }

  attributeChangedCallback() {
    this.#sync();
  }

  #sync() {
    const name = this.getAttribute('name');
    // The font holds only the shipped icons, so any other name draws an empty box.
    if (name && !(icons as readonly string[]).includes(name)) {
      console.warn(`<ins-icon name="${name}">: not one of the icons insufferable ships (src/icons.ts)`);
    }
    if (LABELS.some((label) => this.hasAttribute(label))) {
      this.setAttribute('role', 'img');
      this.removeAttribute('aria-hidden');
    } else {
      this.removeAttribute('role');
      this.setAttribute('aria-hidden', 'true');
    }
  }
}

if (!customElements.get('ins-icon')) customElements.define('ins-icon', InsIcon);
