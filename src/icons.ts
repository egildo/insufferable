/**
 * The icons insufferable ships, by name: Tabler Icons' own (https://tabler.io/icons), or an SVG of ours in
 * `icons/`. The build draws the icon font from these alone and writes one rule for each, so a name missing here
 * draws nothing. Add a name here to ship its icon, and its SVG when it is not Tabler's. An app's own build may
 * replace this list from its resolver; the build then writes the app's `icons.js` beside its scripts.
 */
export const icons = [
  'adjustments-horizontal',
  'arrow-back-up',
  'arrow-down',
  'arrow-forward-up',
  'arrow-up',
  'bold',
  'check',
  'chevron-down',
  'chevron-left',
  'chevron-right',
  'code',
  'folder',
  'heart',
  'help-circle',
  'home',
  'inbox',
  'info-circle',
  'italic',
  'list-tree',
  'mail',
  'moon',
  'printer',
  'restore',
  'search',
  'selector',
  'settings',
  'stack-2',
  'x',
] as const;

export type IconName = (typeof icons)[number];
