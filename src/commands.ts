/**
 * The commands insufferable's elements send, one vocabulary for every element.
 *
 * A command is named after the ARIA state it sets, as a verb: `--select` sets
 * `aria-selected`, `--press` sets `aria-pressed`. It starts with `--`, as the
 * platform requires of a custom command. An app hears them all with one
 * `command` listener at the root, in the capture phase, and cancels one to own
 * the state itself.
 *
 * A command that sets no state is named after what it asks for, and has no
 * default: `--remove` asks the app to remove a value it owns.
 */
export const commands = {
  /** Makes the sending tab the selected one: `aria-selected="true"` on it, `false` on its siblings. */
  select: '--select',
  /** Turns the sending toggle button over: `aria-pressed` from `false` to `true`, or back. */
  press: '--press',
  /** Opens or closes the sending tree node, or the element a disclosure button names: `aria-expanded` from `false` to `true`, or back. */
  expand: '--expand',
  /** Asks the app to remove the value the sending button names, by its `value`, from a chip list. No default. */
  remove: '--remove',
  /** Sets the sorted column of the sending table: `aria-sort` `ascending` or `descending` on its header, `none` on the others, and the rows in that order. */
  sort: '--sort',
  /** Shows the month the sending button names, by its `value`, `YYYY-MM`, in a calendar: the calendar's `month` attribute. */
  show: '--show',
  /** Asks the app to take the other value a notice offers, a conflict's: the one changed elsewhere. No default. */
  accept: '--accept',
  /** Asks the app to dismiss the sending notice, a toast or a conflict's: it keeps what it has. No default. */
  dismiss: '--dismiss',
} as const;

export type Command = (typeof commands)[keyof typeof commands];
