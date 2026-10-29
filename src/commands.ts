/**
 * The commands insufferable's elements send, one vocabulary for every element.
 *
 * A command is named after the ARIA state it sets, as a verb: `--select` sets
 * `aria-selected`, `--press` sets `aria-pressed`. It starts with `--`, as the
 * platform requires of a custom command. An app hears them all with one
 * `command` listener at the root, in the capture phase, and cancels one to own
 * the state itself.
 */
export const commands = {
  /** Makes the sending tab the selected one: `aria-selected="true"` on it, `false` on its siblings. */
  select: '--select',
  /** Turns the sending toggle button over: `aria-pressed` from `false` to `true`, or back. */
  press: '--press',
} as const;

export type Command = (typeof commands)[keyof typeof commands];
