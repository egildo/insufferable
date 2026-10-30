/**
 * Colour arithmetic for the theme generator: OKLCH to a hex colour, the WCAG contrast ratio, and the gate that
 * says which pairs of a theme's roles fall under the ratio they owe.
 */

/** An OKLCH colour as an sRGB hex string, chroma reduced until it fits the gamut. */
export function oklchToHex(lightness: number, chroma: number, hue: number): string {
  const channels = (c: number) => {
    const a = c * Math.cos((hue * Math.PI) / 180);
    const b = c * Math.sin((hue * Math.PI) / 180);
    const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ];
  };
  let c = chroma;
  let linear = channels(c);
  while (linear.some((v) => v < -1e-4 || v > 1 + 1e-4) && c > 0) {
    c = Math.max(0, c - 0.001);
    linear = channels(c);
  }
  const encode = (v: number) => {
    const x = Math.min(1, Math.max(0, v));
    return Math.round((x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055) * 255);
  };
  return `#${linear.map((v) => encode(v).toString(16).padStart(2, '0')).join('')}`;
}

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** The WCAG 2 contrast ratio of two hex colours. */
export function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

/**
 * The pairs of roles the elements actually use, with the ratio each owes: 4.5 for text and for a status mark that
 * is read as text, 3 for the edge of a control (WCAG 1.4.11). Disabled text and the quieter text on the desk are
 * not here: the first is exempt, and the second is not used.
 */
export const pairs: { role: string; on: string; owes: number }[] = [
  { role: 'text.1', on: 'surface', owes: 4.5 },
  { role: 'text.2', on: 'surface', owes: 4.5 },
  { role: 'text.1', on: 'raised', owes: 4.5 },
  { role: 'text.2', on: 'raised', owes: 4.5 },
  { role: 'text.1', on: 'fill', owes: 4.5 },
  { role: 'text.2', on: 'fill', owes: 4.5 },
  { role: 'lineStrong', on: 'surface', owes: 3 },
  { role: 'accent', on: 'surface', owes: 4.5 },
  { role: 'accent', on: 'fill', owes: 4.5 },
  { role: 'accentStrong', on: 'surface', owes: 4.5 },
  { role: 'onAccent', on: 'accent', owes: 4.5 },
  { role: 'text.1', on: 'accentTint', owes: 4.5 },
  { role: 'accent', on: 'accentTint', owes: 4.5 },
  { role: 'accentStrong', on: 'accentTint', owes: 4.5 },
  { role: 'danger', on: 'surface', owes: 4.5 },
  { role: 'danger', on: 'raised', owes: 4.5 },
  { role: 'text.1', on: 'dangerTint', owes: 4.5 },
  { role: 'ok', on: 'surface', owes: 4.5 },
  { role: 'warn', on: 'surface', owes: 4.5 },
];

/** The pairs of a theme, `role -> hex`, that fall under their ratio: a line of words for each. */
export function failures(theme: Record<string, string>): string[] {
  return pairs.flatMap(({ role, on, owes }) => {
    const ratio = contrast(theme[role], theme[on]);
    return ratio < owes ? [`${role} ${theme[role]} on ${on} ${theme[on]}: ${ratio.toFixed(2)}, owes ${owes}`] : [];
  });
}
