/**
 * The system's elements, by the name that follows the prefix: `insufferable-tabs` is `tabs`. The system's own
 * prefix is declared once, in its resolver (`$extensions["dev.insufferable"].prefix`); the build renames the
 * elements from this list when an app chooses another, so a name is never guessed from the text around it.
 */
export const elements = ['icon', 'menu', 'shell', 'splitter', 'tabs', 'toolbar', 'tooltip', 'tree'] as const;

/** A prefix a custom element name can start with: lower case, starting with a letter. */
export const validPrefix = (prefix: string) => /^[a-z][a-z0-9]*$/.test(prefix);

/**
 * Writes the elements of `text` under another prefix: every `from-tabs` that is a whole name becomes `to-tabs`,
 * so neither `--ins-icon-button` nor `from-tabs-extra` is touched.
 */
export function withPrefix(text: string, to: string, from: string) {
  const names = new RegExp(`(?<![\\w-])${from}-(${elements.join('|')})(?![\\w-])`, 'g');
  return text.replace(names, `${to}-$1`);
}
