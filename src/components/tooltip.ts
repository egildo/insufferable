/**
 * `<insufferable-tooltip>`: a short hint beside the control it explains, shown when the
 * pointer rests on the control or the keyboard reaches it, and hidden when it
 * leaves. A tooltip is never where a person learns something they need: the
 * control already has its name.
 *
 * The markup is native: the control carries `interestfor`, naming the tooltip
 * by id, and the tooltip is a popover of the kind made for it.
 *
 *   <button interestfor="save-hint" aria-label="Save">...</button>
 *   <insufferable-tooltip id="save-hint" popover="hint">Save the recipe</insufferable-tooltip>
 *
 * Where the platform has both (`interestfor` and `popover="hint"`), it does
 * all the showing and hiding, with the delays in the control's own custom
 * properties, and the element only writes the roles. Where it has not, the
 * element listens for the pointer resting and for focus on the controls that
 * name it, with the same delays, and shows the tooltip itself; Escape hides it
 * as it would a popover. Touch is the platform's long press, or nothing.
 *
 * It writes: `role="tooltip"`, and `aria-describedby` on each control that
 * names it, so a screen reader hears the hint as the control's description.
 *
 * Light DOM, as every element: the control finds the tooltip by id in the
 * same tree.
 */

/** Whether the platform shows a hint popover for a control that names it. */
const native = (() => {
  const probe = document.createElement('div');
  probe.setAttribute('popover', 'hint');
  return 'interestForElement' in HTMLButtonElement.prototype && probe.popover === 'hint';
})();

/** A duration custom property of the control, in milliseconds. */
function delay(control: Element, property: string) {
  const value = getComputedStyle(control).getPropertyValue(property).trim();
  return value.endsWith('ms') ? Number.parseFloat(value) : value.endsWith('s') ? Number.parseFloat(value) * 1000 : 0;
}

export class InsTooltip extends HTMLElement {
  #root: Document | ShadowRoot = document;
  #timer = 0;

  connectedCallback() {
    this.#root = this.getRootNode() as Document | ShadowRoot;
    if (!this.hasAttribute('role')) this.setAttribute('role', 'tooltip');
    // A browser without the hint kind reads `popover="hint"` as no popover at all, so it becomes a manual one.
    if (!native || !this.hasAttribute('popover')) this.setAttribute('popover', native ? 'hint' : 'manual');
    this.#describe();
    if (native) return;
    for (const type of ['pointerover', 'pointerout', 'focusin', 'focusout']) this.#root.addEventListener(type, this.#onEvent as EventListener);
    this.#root.addEventListener('keydown', this.#onKeydown as EventListener);
  }

  disconnectedCallback() {
    clearTimeout(this.#timer);
    for (const type of ['pointerover', 'pointerout', 'focusin', 'focusout']) this.#root.removeEventListener(type, this.#onEvent as EventListener);
    this.#root.removeEventListener('keydown', this.#onKeydown as EventListener);
  }

  /** The controls that name this tooltip. */
  get #controls() {
    return this.id ? [...this.#root.querySelectorAll<HTMLElement>(`[interestfor="${this.id}"]`)] : [];
  }

  #describe() {
    for (const control of this.#controls) {
      const ids = (control.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
      if (!ids.includes(this.id)) control.setAttribute('aria-describedby', [...ids, this.id].join(' '));
    }
  }

  #controlOf(event: Event) {
    const control = (event.target as Element).closest?.('[interestfor]');
    return control?.getAttribute('interestfor') === this.id ? (control as HTMLElement) : null;
  }

  #show(control: HTMLElement, wait: number) {
    clearTimeout(this.#timer);
    this.#timer = window.setTimeout(() => {
      if (!this.matches(':popover-open')) this.showPopover({ source: control });
    }, wait);
  }

  #hide(wait: number) {
    clearTimeout(this.#timer);
    this.#timer = window.setTimeout(() => {
      if (this.matches(':popover-open')) this.hidePopover();
    }, wait);
  }

  #onEvent = (event: Event) => {
    const control = this.#controlOf(event);
    if (!control) return;
    // The pointer resting is a mouse's or a pen's: a touch has no hover to rest.
    if (event instanceof PointerEvent && event.pointerType === 'touch') return;
    const entering = event.type === 'pointerover' || event.type === 'focusin';
    if (entering) this.#show(control, delay(control, '--ins-tooltip-trigger-interest-delay-start'));
    else this.#hide(delay(control, '--ins-tooltip-trigger-interest-delay-end'));
  };

  #onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.matches(':popover-open')) this.#hide(0);
  };
}

if (!customElements.get('insufferable-tooltip')) customElements.define('insufferable-tooltip', InsTooltip);
