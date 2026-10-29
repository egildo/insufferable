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
  /** Opens or closes the sending tree node: `aria-expanded` from `false` to `true`, or back. */
  expand: '--expand',
  /** Asks the app to remove the value the sending button names, by its `value`, from a chip list. No default. */
  remove: '--remove',
} as const;

export type Command = (typeof commands)[keyof typeof commands];
