/**
 * The theme generator. From a small config, a brand hue, the neutrals' warmth and the fonts, it writes the token
 * files an app's resolver lists after the system's own: a palette, the roles that name the brand, and the fonts.
 *
 *   insufferable theme <theme.config.json> [--out <dir>]
 *
 * The palette is gosfuig's, the system's own families with the neutral's hue and chroma changed and a `brand`
 * family added. The roles are not a second table: they are the system's own theme files with every reference to
 * the blue family pointed at the brand, so a change to the system's roles reaches every generated theme. Three
 * roles are written values tied to the neutral, the paper, the raised surface and the dark desk, and are computed.
 * The gate then measures every pair the elements use, in both themes. A solid brand role that falls short moves
 * along the ramp until it holds, and the generator says so; a theme that cannot hold is refused, and nothing is written.
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { failures, oklchToHex } from './color.ts';

const at = (...parts) => resolve(fileURLToPath(new URL('../', import.meta.url)), ...parts);
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const write = (path, data) => writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
const color = (hex) => ({
  colorSpace: 'srgb',
  components: [1, 3, 5].map((i) => Math.round((Number.parseInt(hex.slice(i, i + 2), 16) / 255) * 10000) / 10000),
  hex,
});

/** The palette config: the system's own, the neutral changed, the brand added in place of the blue. */
function paletteConfig(config) {
  const base = read(at('tokens/palette.config.json'));
  const families = base.families.flatMap((family) => {
    if (family.name === 'gray') return [{ ...family, hue: config.neutral.hue, chroma: { kind: 'constant', value: config.neutral.chroma } }];
    if (family.name === 'blue') {
      const brand = { name: 'brand', hue: config.brand.hue };
      if (config.brand.lock) brand.locks = { 600: config.brand.lock };
      return [brand];
    }
    return [family];
  });
  return { ...base, families };
}

/** A role's colour as a hex, through the palette; a value written in the file is its own hex. */
function resolveRoles(file, palette) {
  const hexOf = (reference) => {
    const [, family, step] = /^\{palette\.([a-z]+)\.(\d+)\}$/.exec(reference) ?? [];
    return palette[family]?.[step]?.$value.hex;
  };
  const roles = {};
  const walk = (node, path) => {
    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith('$')) continue;
      if ('$value' in value) {
        const raw = value.$value;
        roles[[...path, key].join('.')] = typeof raw === 'string' ? hexOf(raw) : raw.hex;
      } else walk(value, [...path, key]);
    }
  };
  walk(file.ins.color, []);
  return roles;
}

export function generateTheme(configPath, out = resolve(dirname(configPath), 'theme')) {
  const config = read(configPath);
  const work = mkdtempSync(resolve(tmpdir(), 'insufferable-theme-'));
  try {
    write(resolve(work, 'palette.config.json'), paletteConfig(config));
    const run = spawnSync(at('node_modules/.bin/gosfuig'), [resolve(work, 'palette.config.json'), '--no-dashboard', '-o', resolve(work, 'out')], { encoding: 'utf8' });
    if (run.status !== 0 && run.status !== 1) throw new Error(`gosfuig failed:\n${run.stderr || run.stdout}`);
    const palette = read(resolve(work, 'out/tokens.json'));

    // The roles: the system's theme files, the blue's references pointed at the brand, and the three computed values.
    const { hue, chroma } = config.neutral;
    const computed = {
      light: { surface: oklchToHex(0.988, chroma * 0.5, hue), raised: oklchToHex(0.995, chroma * 0.3, hue) },
      dark: { desk: oklchToHex(0.165, chroma, hue) },
    };
    // A solid brand role that falls short moves along the ramp, darker in light and lighter in dark, until its
    // pairs hold; the generator says how far. If the ramp runs out the theme is refused.
    const steps = ['25', '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
    const solid = ['accent', 'accentStrong', 'accentDeep'];
    const partial = {};
    const moved = [];
    for (const mode of ['light', 'dark']) {
      const file = read(at(`tokens/theme.${mode}.tokens.json`));
      const direction = mode === 'light' ? 1 : -1;
      let tried;
      for (let shift = 0; shift <= 4; shift++) {
        const roles = {};
        for (const [role, value] of Object.entries(file.ins.color)) {
          if (role.startsWith('$') || typeof value.$value !== 'string') continue;
          const [, step] = /^\{palette\.blue\.(\d+)\}$/.exec(value.$value) ?? [];
          if (!step) continue;
          const at = solid.includes(role) ? Math.min(11, Math.max(0, steps.indexOf(step) + direction * shift)) : steps.indexOf(step);
          roles[role] = { $value: `{palette.brand.${steps[at]}}` };
        }
        for (const [role, hex] of Object.entries(computed[mode] ?? {})) roles[role] = { $value: color(hex) };
        const merged = structuredClone(file);
        Object.assign(merged.ins.color, roles);
        const problems = failures(resolveRoles(merged, palette.palette)).map((line) => `${mode}: ${line}`);
        tried ??= problems;
        if (!problems.length) {
          partial[mode] = { ins: { color: { $type: 'color', ...roles } } };
          if (shift) moved.push(`${mode}: the accent moved ${shift} step${shift > 1 ? 's' : ''} ${mode === 'light' ? 'darker' : 'lighter'} to hold its contrast`);
          break;
        }
      }
      if (!partial[mode]) throw new Error(`The theme does not hold its contrast, even moved along the ramp:\n  ${tried.join('\n  ')}`);
    }

    const stack = (name, ...rest) => ({ $value: [name, ...rest], $type: 'fontFamily' });
    const fonts = {
      ins: { font: { family: {
        ...(config.fonts?.sans && { sans: stack(config.fonts.sans, 'system-ui', 'sans-serif') }),
        ...(config.fonts?.serif && { serif: stack(config.fonts.serif, 'ui-serif', 'serif') }),
        ...(config.fonts?.mono && { mono: stack(config.fonts.mono, 'ui-monospace', 'monospace') }),
      } } },
    };

    mkdirSync(out, { recursive: true });
    write(resolve(out, 'palette.tokens.json'), palette);
    write(resolve(out, 'light.tokens.json'), partial.light);
    write(resolve(out, 'dark.tokens.json'), partial.dark);
    write(resolve(out, 'fonts.tokens.json'), fonts);
    return { out, moved };
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [config, ...rest] = process.argv.slice(2);
  if (!config) {
    console.error('usage: insufferable theme <theme.config.json> [--out <dir>]');
    process.exit(2);
  }
  const flag = rest.indexOf('--out');
  const { out, moved } = generateTheme(resolve(config), flag >= 0 ? resolve(rest[flag + 1]) : undefined);
  console.log([`Wrote the theme into ${out}`, ...moved].join('\n'));
}
