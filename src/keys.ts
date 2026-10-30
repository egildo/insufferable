/**
 * The keyboard, as pure functions: no element, no event, so a test can hold them.
 *
 * Tabs follow the WAI-ARIA Authoring Practices
 * (https://www.w3.org/WAI/ARIA/apg/patterns/tabs/): in a horizontal tab list
 * the arrow keys move to the next and previous tab and wrap, Home and End go to
 * the ends, and a tab that cannot be chosen is passed over. In a right-to-left
 * page the arrows follow the reading direction.
 *
 * A menu is the same walk, vertical
 * (https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/): the arrows are Up and
 * Down, and the reading direction does not turn them.
 */

/**
 * The index a key moves to, or -1 when it moves nowhere (another key, or nothing enabled).
 *
 * @param key a `KeyboardEvent.key`
 * @param current the index that has focus
 * @param enabled for each tab, whether it can be chosen
 * @param rtl whether the tab list reads right to left
 * @param vertical whether the items run down, as a menu's do: then Up and Down move, whatever the direction
 */
export function nextIndex(key: string, current: number, enabled: boolean[], rtl = false, vertical = false): number {
  if (!enabled.includes(true)) return -1;
  if (key === 'Home') return enabled.indexOf(true);
  if (key === 'End') return enabled.lastIndexOf(true);

  const forward = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
  const back = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
  const step = key === forward ? 1 : key === back ? -1 : 0;
  if (!step) return -1;

  const count = enabled.length;
  for (let i = 1; i <= count; i++) {
    const at = (((current + step * i) % count) + count) % count;
    if (enabled[at]) return at;
  }
  return -1;
}

/**
 * A tree follows the WAI-ARIA Authoring Practices
 * (https://www.w3.org/WAI/ARIA/apg/patterns/treeview/), vertical, single
 * select, selection apart from focus. The rows are the visible nodes, in
 * order: a node inside a closed one is not a row.
 */
export interface TreeRow {
  /** The row of its parent node, or -1 for a root node. */
  parent: number;
  /** Open or closed for a parent node; `undefined` for an end node. */
  expanded?: boolean;
}

/** What a key asks of a tree: focus a row, open or close one, select one, or nothing. */
export type TreeAction = { focus: number } | { expand: number } | { select: number } | null;

/**
 * What a key does on the focused row of a tree.
 *
 * @param key a `KeyboardEvent.key`
 * @param current the row that has focus
 * @param rows the visible nodes, in order
 */
export function treeAction(key: string, current: number, rows: TreeRow[]): TreeAction {
  const row = rows[current];
  if (!row) return null;
  switch (key) {
    case 'ArrowDown':
      return current < rows.length - 1 ? { focus: current + 1 } : null;
    case 'ArrowUp':
      return current > 0 ? { focus: current - 1 } : null;
    case 'Home':
      return { focus: 0 };
    case 'End':
      return { focus: rows.length - 1 };
    case 'ArrowRight':
      // A closed node opens; an open one hands focus to its first child; an end node does nothing.
      if (row.expanded === false) return { expand: current };
      if (row.expanded === true && rows[current + 1]?.parent === current) return { focus: current + 1 };
      return null;
    case 'ArrowLeft':
      // An open node closes; otherwise focus goes to the parent, if there is one.
      if (row.expanded === true) return { expand: current };
      return row.parent >= 0 ? { focus: row.parent } : null;
    case 'Enter':
      return { select: current };
    default:
      return null;
  }
}

/**
 * Type-ahead: the next row after the focused one whose name starts with what was typed, wrapping, or -1.
 *
 * @param typed the characters typed in quick succession
 * @param current the row that has focus
 * @param names each visible row's name
 */
export function typeAhead(typed: string, current: number, names: string[]): number {
  const wanted = typed.toLocaleLowerCase();
  const count = names.length;
  // A single character starts after the focused row; a string keeps the focused row if it still matches.
  const start = typed.length > 1 ? 0 : 1;
  for (let i = start; i < count + start; i++) {
    const at = (current + i) % count;
    if (names[at].trim().toLocaleLowerCase().startsWith(wanted)) return at;
  }
  return -1;
}

/**
 * A window splitter follows the WAI-ARIA Authoring Practices
 * (https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/), vertical: its
 * value, 0 to 100, is the primary pane's size between its smallest and its
 * largest. Left and Right move the splitter itself, so which of them grows the
 * pane depends on which side of the splitter the pane is.
 */

/** How far one arrow press moves a splitter, in its value's units. */
export const splitterStep = 5;

/**
 * The value a key moves a splitter to, or `null` for another key.
 *
 * @param key a `KeyboardEvent.key`
 * @param value the splitter's value, 0 to 100
 * @param paneOnLeft whether the primary pane is to the left of the splitter on screen
 * @param restore the value Enter restores after a collapse
 */
export function splitterValue(key: string, value: number, paneOnLeft: boolean, restore: number): number | null {
  const clamp = (n: number) => Math.min(100, Math.max(0, n));
  switch (key) {
    case 'ArrowLeft':
      return clamp(value + (paneOnLeft ? -splitterStep : splitterStep));
    case 'ArrowRight':
      return clamp(value + (paneOnLeft ? splitterStep : -splitterStep));
    case 'Home':
      return 0;
    case 'End':
      return 100;
    case 'Enter':
      // Collapsed, the pane goes back to where it was; otherwise it collapses.
      return value === 0 ? restore : 0;
    default:
      return null;
  }
}
