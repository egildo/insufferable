/**
 * The icons insufferable ships: Tabler Icons' own names (https://tabler.io/icons).
 * The build subsets the icon font to these alone and writes one rule for each,
 * so a name missing here draws nothing. Add a name here to ship its icon.
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
