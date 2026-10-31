/**
 * `<insufferable-combobox>`: a text field with a list of suggestions under it, narrowed
 * as the person types. An editable combobox with list autocomplete, as the
 * WAI-ARIA Authoring Practices describe it
 * (https://www.w3.org/WAI/ARIA/apg/patterns/combobox/). It is for a value the
 * person may also write themselves; to pick one from a fixed list, use a
 * `<select>`, which the platform draws and keeps.
 *
 * The markup is native: an `<input>` that names a `<datalist>`, inside the element.
 *
 *   <insufferable-combobox results="{n} results" empty="No matches">
 *     <label>Fruit <input list="fruit" name="fruit"></label>
 *     <datalist id="fruit"><option value="Apple"><option value="Pear"></datalist>
 *   </insufferable-combobox>
 *
 * Without script it is the platform's own datalist. With it, the element reads
 * the options, takes the `list` attribute off the field (and puts it back if it
 * is removed), and draws its own list as a popover under the field.
 *
 * Attributes in: `filter="none"` shows every option the datalist holds, for an
 * app that narrows them itself: it rewrites the datalist as the person types,
 * and the element follows. `results` is the phrase announced as the list
 * changes, `{n}` for the number, and `empty` the line shown when nothing
 * matches. They are the app's words: with none, nothing is announced and an empty
 * list is not shown. A datalist option that is `disabled` cannot be chosen.
 *
 * Events out, as the platform's own text field sends them: `input` while the
 * person types, and `input` then `change` when an option is chosen, with the
 * value in the field's `.value`. The element keeps no state of its own: the
 * field's value is the value, and the app owns the rest.
 *
 * The keyboard: Down and Up open the list and move the active option, and wrap;
 * Alt with an arrow opens or closes it without moving; Enter chooses the active
 * option, and is the form's when there is none; Escape closes the list, then
 * empties the field; Tab closes it and moves on. Home, End and the caret are
 * the field's.
 *
 * It writes: on the field `role="combobox"`, `aria-autocomplete="list"`,
 * `aria-expanded`, `aria-controls` and `aria-activedescendant`, with
 * `autocomplete="off"` so the browser's own list does not cover this one; a
 * listbox of options; and a status line with the count. Focus never leaves the field.
 *
 * Light DOM, as every element.
 */

import { comboboxAction, matches } from '../keys.ts';

let count = 0;

/** Sets an attribute only when it differs, so the observer does not hear the element's own writes twice. */
function set(element: Element, name: string, value: string) {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

interface Choice {
  /** What goes into the field. */
  value: string;
  /** What the list shows. */
  text: string;
  disabled: boolean;
}

export class InsCombobox extends HTMLElement {
  #id = `ins-combobox-${++count}`;
  #observer = new MutationObserver((records) => {
    // The element's own list and status are not news.
    if (records.every((record) => record.target === this.#list || this.#list.contains(record.target) || record.target === this.#status)) return;
    this.#setup();
  });
  #input: HTMLInputElement | null = null;
  #datalist: HTMLDataListElement | null = null;
  /** The datalist's id, kept for as long as the field does not carry it. */
  #listId = '';
  #list = document.createElement('ul');
  #status = document.createElement('p');
  #choices: Choice[] = [];
  /** The choices shown now, as indexes into `#choices`. */
  #shown: number[] = [];
  #active = -1;
  /** True while the element itself writes the field's value, so that its own `input` is not heard as typing. */
  #writing = false;

  connectedCallback() {
    this.#list.id = `${this.#id}-list`;
    set(this.#list, 'role', 'listbox');
    this.#list.setAttribute('popover', 'manual');
    set(this.#status, 'role', 'status');
    this.append(this.#list, this.#status);
    this.addEventListener('input', this.#onInput);
    this.addEventListener('keydown', this.#onKeydown);
    this.addEventListener('focusout', this.#onFocusout);
    this.#list.addEventListener('pointerdown', (event) => event.preventDefault());
    this.#list.addEventListener('click', this.#onClick);
    this.#observer.observe(this, { childList: true, subtree: true });
    this.#setup();
  }

  disconnectedCallback() {
    this.removeEventListener('input', this.#onInput);
    this.removeEventListener('keydown', this.#onKeydown);
    this.removeEventListener('focusout', this.#onFocusout);
    this.#observer.disconnect();
    this.#datalistObserver.disconnect();
    this.#close();
    // Without the element, the field is the platform's again.
    if (this.#input && this.#listId) this.#input.setAttribute('list', this.#listId);
    this.#list.remove();
    this.#status.remove();
  }

  #datalistObserver = new MutationObserver(() => {
    this.#read();
    if (this.#isOpen) this.#render();
  });

  get #isOpen() {
    return this.#list.matches(':popover-open');
  }

  get #unfiltered() {
    return this.getAttribute('filter') === 'none';
  }

  /** Finds the field and its datalist, and writes the field's roles. Idempotent: it runs again as the markup changes. */
  #setup() {
    const input = this.querySelector<HTMLInputElement>('input');
    if (!input) return;
    this.#input = input;
    const listId = input.getAttribute('list');
    if (listId) {
      this.#listId = listId;
      input.removeAttribute('list');
    }
    const datalist = this.#listId ? (this.getRootNode() as Document | ShadowRoot).getElementById(this.#listId) : null;
    if (datalist instanceof HTMLDataListElement && datalist !== this.#datalist) {
      this.#datalistObserver.disconnect();
      this.#datalist = datalist;
      this.#datalistObserver.observe(datalist, { childList: true, subtree: true, characterData: true, attributes: true });
    }
    set(input, 'role', 'combobox');
    set(input, 'aria-autocomplete', 'list');
    set(input, 'aria-haspopup', 'listbox');
    set(input, 'aria-controls', this.#list.id);
    set(input, 'aria-expanded', String(this.#isOpen));
    set(input, 'autocomplete', 'off');
    this.#read();
  }

  /** The datalist's options as choices. */
  #read() {
    this.#choices = [...(this.#datalist?.options ?? [])].map((option) => ({
      value: option.value,
      text: option.label || option.textContent?.trim() || option.value,
      disabled: option.disabled,
    }));
  }

  /** Works out what to show for what the field holds, and draws it. */
  #render() {
    const input = this.#input;
    if (!input) return;
    const texts = this.#choices.map((choice) => `${choice.text} ${choice.value}`);
    this.#shown = this.#unfiltered ? texts.map((_, index) => index) : matches(input.value, texts);
    this.#active = -1;
    this.#list.replaceChildren(
      ...this.#shown.map((index, position) => {
        const choice = this.#choices[index];
        const item = document.createElement('li');
        item.id = `${this.#id}-option-${position}`;
        item.setAttribute('role', 'option');
        item.textContent = choice.text;
        if (choice.disabled) item.setAttribute('aria-disabled', 'true');
        return item;
      }),
    );
    const empty = this.getAttribute('empty');
    if (!this.#shown.length && empty) {
      const line = document.createElement('li');
      line.className = 'empty';
      line.setAttribute('role', 'presentation');
      line.textContent = empty;
      this.#list.append(line);
    }
    this.#announce(this.#shown.length);
    this.#mark();
  }

  /** The count, in the app's words, for the status line. */
  #announce(total: number) {
    const phrase = this.getAttribute('results');
    this.#status.textContent = phrase && total ? phrase.replace('{n}', String(total)) : '';
  }

  /** Writes which option is active, in the field and in the list. */
  #mark() {
    const options = [...this.#list.querySelectorAll<HTMLElement>('[role=option]')];
    options.forEach((option, position) => {
      if (position === this.#active) option.setAttribute('aria-selected', 'true');
      else option.removeAttribute('aria-selected');
    });
    const input = this.#input;
    if (!input) return;
    const active = options[this.#active];
    if (active) {
      input.setAttribute('aria-activedescendant', active.id);
      active.scrollIntoView({ block: 'nearest' });
    } else input.removeAttribute('aria-activedescendant');
  }

  #open() {
    const input = this.#input;
    if (!input || this.#isOpen) return;
    // Nothing to show, and no words for saying so: the list stays shut.
    if (!this.#list.childElementCount) return;
    this.#list.showPopover({ source: input });
    set(input, 'aria-expanded', 'true');
  }

  #close() {
    if (this.#isOpen) this.#list.hidePopover();
    this.#active = -1;
    this.#status.textContent = '';
    if (this.#input) {
      set(this.#input, 'aria-expanded', 'false');
      this.#input.removeAttribute('aria-activedescendant');
    }
  }

  /** Puts a choice in the field and says so as a text field does. */
  #accept(position: number) {
    const input = this.#input;
    const choice = this.#choices[this.#shown[position]];
    if (!input || !choice || choice.disabled) return;
    this.#write(choice.value);
    input.dispatchEvent(new Event('change', { bubbles: true }));
    this.#close();
    input.setSelectionRange(input.value.length, input.value.length);
  }

  /** Sets the field's value and sends `input`, without the element taking it for typing. */
  #write(value: string) {
    const input = this.#input;
    if (!input) return;
    this.#writing = true;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    this.#writing = false;
  }

  #onInput = (event: Event) => {
    if (this.#writing || event.target !== this.#input) return;
    this.#render();
    this.#open();
    if (!this.#list.childElementCount) this.#close();
  };

  #onKeydown = (event: KeyboardEvent) => {
    const input = this.#input;
    if (event.target !== input || !input) return;
    // Opening on Down shows what the field's text matches, not what was last shown.
    if (!this.#isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) this.#render();
    const action = comboboxAction(event.key, event.altKey, {
      open: this.#isOpen,
      active: this.#active,
      enabled: this.#shown.map((index) => !this.#choices[index].disabled),
      hasText: input.value !== '',
    });
    if (!action) return;
    if (event.key !== 'Tab') event.preventDefault();
    if (action.accept !== undefined) this.#accept(action.accept);
    if (action.clear) {
      this.#write('');
      return;
    }
    if (action.open === false) this.#close();
    if (action.open === true) this.#open();
    if (action.active !== undefined && action.open !== false) {
      this.#active = action.active;
      this.#mark();
    }
  };

  #onFocusout = (event: FocusEvent) => {
    if (!this.contains(event.relatedTarget as Node | null)) this.#close();
  };

  #onClick = (event: MouseEvent) => {
    const option = (event.target as Element).closest('[role=option]');
    if (!option) return;
    this.#accept([...this.#list.querySelectorAll('[role=option]')].indexOf(option));
  };
}

if (!customElements.get('insufferable-combobox')) customElements.define('insufferable-combobox', InsCombobox);
