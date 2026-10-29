/**
 * `<ins-tree>`: a hierarchical list whose nodes open and close. A tree view,
 * as the WAI-ARIA Authoring Practices describe it
 * (https://www.w3.org/WAI/ARIA/apg/patterns/treeview/): vertical, single
 * select, selection apart from focus.
 *
 * The markup is native: a `<ul>` inside the element, each `<li>` holding its
 * row in a `<span>`, then, for a parent node, its children in a `<ul>`.
 * Without script it is a nested list, all open.
 *
 * Attributes in: `aria-expanded` on a parent node says whether it is open,
 * `aria-selected` which node is selected. A parent node with neither is
 * closed.
 *
 * Commands out: a node sends `--select` when it is chosen (a click on its row,
 * or Enter) and `--expand` when it is opened or closed (a click on its
 * chevron, or the arrows). A node is an `li`, which cannot send a command
 * through `commandfor`, so the element builds the same `CommandEvent` and sends
 * it to itself, with the node as its source: the app hears it at the root, in
 * the capture phase, as it hears a tab's. Unless the app cancels it, the
 * element applies it.
 *
 * Light DOM, as every element.
 */

import { commands } from '../commands.ts';
import { treeAction, typeAhead } from '../keys.ts';

let count = 0;

/** Sets an attribute only when it differs, so the observer does not hear the element's own writes twice. */
function set(element: Element, name: string, value: string) {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

const rowOf = (node: Element) => node.querySelector<HTMLElement>(':scope > span');
const groupOf = (node: Element) => node.querySelector<HTMLElement>(':scope > ul');

export class InsTree extends HTMLElement {
  #observer = new MutationObserver(() => this.#sync());
  #typed = '';
  #typedAt = 0;

  connectedCallback() {
    if (!this.id) this.id = `ins-tree-${++count}`;
    this.addEventListener('keydown', this.#onKeydown);
    this.addEventListener('click', this.#onClick);
    this.addEventListener('focusin', this.#onFocusin);
    this.#observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-expanded', 'aria-selected'],
    });
    this.#sync();
  }

  disconnectedCallback() {
    this.removeEventListener('keydown', this.#onKeydown);
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('focusin', this.#onFocusin);
    this.#observer.disconnect();
  }

  get #nodes() {
    return [...this.querySelectorAll<HTMLLIElement>(':scope > ul li')];
  }

  /** The nodes a reader can reach: every node whose ancestors are all open. */
  get #visible() {
    return this.#nodes.filter((node) => !node.parentElement?.closest('li[aria-expanded="false"]'));
  }

  /** Writes roles, wiring and the tab stop from `aria-expanded` and `aria-selected`. */
  #sync() {
    set(this, 'role', 'tree');
    const root = this.querySelector(':scope > ul');
    if (root) set(root, 'role', 'none');

    const nodes = this.#nodes;
    nodes.forEach((node, index) => {
      set(node, 'role', 'treeitem');
      if (!node.hasAttribute('aria-selected')) node.setAttribute('aria-selected', 'false');
      const row = rowOf(node);
      if (row) {
        if (!row.id) row.id = `${this.id}-row-${index}`;
        set(node, 'aria-labelledby', row.id);
      }
      const group = groupOf(node);
      if (group) {
        set(group, 'role', 'group');
        if (!node.hasAttribute('aria-expanded')) node.setAttribute('aria-expanded', 'false');
      } else if (node.hasAttribute('aria-expanded')) {
        // An end node with aria-expanded would be announced as a parent.
        node.removeAttribute('aria-expanded');
      }
    });

    // The tab stop: the focused node if it is still reachable, else the selected one, else the first.
    const visible = this.#visible;
    const focused = visible.find((node) => node === document.activeElement);
    const selected = visible.find((node) => node.getAttribute('aria-selected') === 'true');
    const stop = focused ?? selected ?? visible[0];
    for (const node of nodes) set(node, 'tabindex', node === stop ? '0' : '-1');
  }

  /** Sends a command from a node to the element, and applies it unless the app cancels it. */
  #send(command: string, node: HTMLLIElement) {
    const event = new CommandEvent('command', { command, source: node, cancelable: true });
    this.dispatchEvent(event);
    if (event.defaultPrevented) return;
    if (command === commands.select) {
      for (const other of this.#nodes) set(other, 'aria-selected', String(other === node));
    } else if (command === commands.expand && groupOf(node)) {
      set(node, 'aria-expanded', String(node.getAttribute('aria-expanded') !== 'true'));
    }
    this.#sync();
  }

  #focus(node: HTMLLIElement) {
    for (const other of this.#nodes) set(other, 'tabindex', other === node ? '0' : '-1');
    node.focus();
  }

  #onFocusin = (event: FocusEvent) => {
    const node = (event.target as Element).closest?.('li[role="treeitem"]');
    if (node instanceof HTMLLIElement && this.contains(node)) {
      for (const other of this.#nodes) set(other, 'tabindex', other === node ? '0' : '-1');
    }
  };

  #onClick = (event: MouseEvent) => {
    const row = (event.target as Element).closest?.('li[role="treeitem"] > span');
    const node = row?.parentElement;
    if (!row || !(node instanceof HTMLLIElement) || !this.contains(node)) return;
    this.#focus(node);
    // The chevron is the row's ::before, at its start: a click there opens or closes the node.
    const box = row.getBoundingClientRect();
    const chevron = Number.parseFloat(getComputedStyle(row, '::before').inlineSize) || 0;
    const rtl = node.matches(':dir(rtl)');
    const fromStart = rtl ? box.right - event.clientX : event.clientX - box.left;
    const paddingStart = Number.parseFloat(getComputedStyle(row).paddingInlineStart) || 0;
    if (groupOf(node) && fromStart <= paddingStart + chevron) this.#send(commands.expand, node);
    else this.#send(commands.select, node);
  };

  #onKeydown = (event: KeyboardEvent) => {
    const node = event.target;
    if (!(node instanceof HTMLLIElement) || node.getAttribute('role') !== 'treeitem') return;
    const visible = this.#visible;
    const current = visible.indexOf(node);
    if (current < 0) return;

    // The arrows follow the reading direction: in a right-to-left page, left opens and right closes.
    let key = event.key;
    if (node.matches(':dir(rtl)') && (key === 'ArrowLeft' || key === 'ArrowRight')) {
      key = key === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
    }
    const rows = visible.map((each) => ({
      parent: visible.indexOf(each.parentElement?.closest('li') as HTMLLIElement),
      expanded: groupOf(each) ? each.getAttribute('aria-expanded') === 'true' : undefined,
    }));
    const action = treeAction(key, current, rows);
    if (action) {
      event.preventDefault();
      if ('focus' in action) this.#focus(visible[action.focus]);
      else if ('expand' in action) this.#send(commands.expand, visible[action.expand]);
      else this.#send(commands.select, visible[action.select]);
      return;
    }

    // Type-ahead: a printable character, alone or in quick succession.
    if (event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = event.timeStamp;
      this.#typed = now - this.#typedAt < 500 ? this.#typed + event.key : event.key;
      this.#typedAt = now;
      // A node is found by its own name: the row's text without its tags, which say what kind it is.
      const names = visible.map((each) =>
        [...(rowOf(each)?.childNodes ?? [])]
          .filter((part) => !(part instanceof Element && part.matches('small.tag')))
          .map((part) => part.textContent)
          .join(''),
      );
      const found = typeAhead(this.#typed, current, names);
      if (found >= 0) {
        event.preventDefault();
        this.#focus(visible[found]);
      }
    }
  };
}

if (!customElements.get('ins-tree')) customElements.define('ins-tree', InsTree);
