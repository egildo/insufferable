/**
 * The system's elements, by the name that follows the prefix: `ins-tabs` is `tabs`. The build renames them from
 * this list when an app chooses its own prefix, so a name is never guessed from the text around it.
 */
export const elements = ['icon', 'menu', 'shell', 'splitter', 'tabs', 'toolbar', 'tree'] as const;

/** A prefix a custom element name can start with: lower case, starting with a letter. */
export const validPrefix = (prefix: string) => /^[a-z][a-z0-9]*$/.test(prefix);

/**
 * Writes the elements of `text` under another prefix: every `ins-tabs` that is a whole name, so neither
 * `--ins-icon-button` nor `ins-tabs-extra` is touched.
 */
export function withPrefix(text: string, prefix: string) {
  const names = new RegExp(`(?<![\\w-])ins-(${elements.join('|')})(?![\\w-])`, 'g');
  return text.replace(names, `${prefix}-$1`);
}
