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
