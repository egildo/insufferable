/**
 * `<ins-splitter>`: the line between two panes that changes their sizes. A
 * window splitter, as the WAI-ARIA Authoring Practices describe it
 * (https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/), vertical and
 * variable.
 *
 * The markup: the element between two panes, `aria-controls` naming the
 * primary pane, the one it sizes. Without script it is the gap between them,
 * and the pane keeps its width.
 *
 * Attributes in: `aria-valuenow`, 0 to 100, is the primary pane's size between
 * its `min-inline-size` and its `max-inline-size`, and the element sizes the
 * pane by it. A pane that is `hidden`, or a popover, hides its splitter.
 *
 * Events out, as the platform's own range control sends them: `input` while
 * the value moves, `change` once it has settled, with the value in `.value`.
 * A command could not carry the size asked for, so the splitter is the one
 * element that speaks as an input does. An app that owns the size writes
 * `aria-valuenow`, or `.value`, and the element follows.
 *
 * The keyboard: Left and Right move the splitter, Home and End go to the
 * pane's smallest and largest size, Enter collapses the pane to its smallest
 * and restores it. The pointer drags it.
 *
 * Light DOM, as every element.
 */

import { splitterValue } from '../keys.ts';

/** Sets an attribute only when it differs, so the observer does not hear the element's own writes twice. */
function set(element: Element, name: string, value: string) {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

export class InsSplitter extends HTMLElement {
  #observer = new MutationObserver(() => this.#sync());
  /** The value Enter restores after a collapse. */
  #restore = 50;
  #drag: { x: number; width: number; onLeft: boolean } | null = null;

  connectedCallback() {
    this.addEventListener('keydown', this.#onKeydown);
    this.addEventListener('pointerdown', this.#onPointerdown);
    this.addEventListener('pointermove', this.#onPointermove);
    this.addEventListener('pointerup', this.#onPointerup);
    this.addEventListener('pointercancel', this.#onPointerup);
    this.#observer.observe(this, { attributes: true, attributeFilter: ['aria-valuenow', 'aria-controls'] });
    const pane = this.#pane;
    if (pane) this.#observer.observe(pane, { attributes: true, attributeFilter: ['hidden', 'popover', 'aria-labelledby'] });
    // A splitter the app gave no value starts from the pane's own width, its stylesheet's even while it is hidden.
    if (!this.hasAttribute('aria-valuenow') && pane) {
      this.value = this.#valueOf(Number.parseFloat(getComputedStyle(pane).inlineSize) || 0);
    }
    this.#sync();
  }

  disconnectedCallback() {
    this.removeEventListener('keydown', this.#onKeydown);
    this.removeEventListener('pointerdown', this.#onPointerdown);
    this.removeEventListener('pointermove', this.#onPointermove);
    this.removeEventListener('pointerup', this.#onPointerup);
    this.removeEventListener('pointercancel', this.#onPointerup);
    this.#observer.disconnect();
  }

  /** The primary pane's size, 0 to 100 between its smallest and its largest. */
  get value() {
    return Number(this.getAttribute('aria-valuenow') ?? 50);
  }

  set value(value: number) {
    set(this, 'aria-valuenow', String(Math.round(Math.min(100, Math.max(0, value)))));
  }

  get #pane() {
    const id = this.getAttribute('aria-controls');
    return id ? (this.getRootNode() as Document | ShadowRoot).getElementById(id) : null;
  }

  /** The pane's smallest and largest width, from its own stylesheet. */
  #range(pane: HTMLElement) {
    const style = getComputedStyle(pane);
    const min = Number.parseFloat(style.minInlineSize) || 0;
    const max = Number.parseFloat(style.maxInlineSize) || min;
    return { min, max };
  }

  #valueOf(width: number) {
    const pane = this.#pane;
    if (!pane) return 0;
    const { min, max } = this.#range(pane);
    return max > min ? ((width - min) / (max - min)) * 100 : 0;
  }

  get #paneOnLeft() {
    const pane = this.#pane;
    return pane ? pane.getBoundingClientRect().left < this.getBoundingClientRect().left : true;
  }

  /** Writes the role and the range, names the splitter after its pane, and sizes the pane from the value. */
  #sync() {
    set(this, 'role', 'separator');
    set(this, 'aria-orientation', 'vertical');
    set(this, 'aria-valuemin', '0');
    set(this, 'aria-valuemax', '100');
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    const pane = this.#pane;
    if (!pane) return;
    const label = pane.getAttribute('aria-labelledby');
    if (label && !this.hasAttribute('aria-label')) set(this, 'aria-labelledby', label);
    // A pane that is hidden, or a popover over the others, has nothing beside it to size.
    this.hidden = pane.hidden || pane.hasAttribute('popover');
    if (pane.hasAttribute('popover')) {
      // Over the others, the pane takes its own width; the value waits for it to come back to the row.
      pane.style.removeProperty('inline-size');
      return;
    }
    const { min, max } = this.#range(pane);
    pane.style.inlineSize = `${min + (this.value / 100) * (max - min)}px`;
  }

  /** Moves the value, says so as an input does, and sizes the pane. */
  #move(value: number, settled: boolean) {
    const before = this.value;
    this.value = value;
    if (this.value !== before) this.dispatchEvent(new Event('input', { bubbles: true }));
    if (settled) this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  #onKeydown = (event: KeyboardEvent) => {
    const value = this.value;
    const next = splitterValue(event.key, value, this.#paneOnLeft, this.#restore);
    if (next === null) return;
    event.preventDefault();
    if (next === 0 && value > 0) this.#restore = value;
    if (next !== value) this.#move(next, true);
  };

  #onPointerdown = (event: PointerEvent) => {
    const pane = this.#pane;
    if (!pane || event.button !== 0) return;
    this.setPointerCapture(event.pointerId);
    this.#drag = { x: event.clientX, width: pane.getBoundingClientRect().width, onLeft: this.#paneOnLeft };
  };

  #onPointermove = (event: PointerEvent) => {
    if (!this.#drag) return;
    const moved = event.clientX - this.#drag.x;
    this.#move(this.#valueOf(this.#drag.width + (this.#drag.onLeft ? moved : -moved)), false);
  };

  #onPointerup = (event: PointerEvent) => {
    if (!this.#drag) return;
    this.#drag = null;
    if (this.hasPointerCapture(event.pointerId)) this.releasePointerCapture(event.pointerId);
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };
}

if (!customElements.get('ins-splitter')) customElements.define('ins-splitter', InsSplitter);
