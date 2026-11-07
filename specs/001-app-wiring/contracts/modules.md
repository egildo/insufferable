# Contract: the functions the lanes meet at

Each lane writes only its own files. These signatures are the agreement; a lane that needs more from another says
so in its report instead of editing the other's file.

## `scripts/config.mjs` (lane A)

```js
/** Reads and validates the config; throws an Error whose message names the key, value or path. */
export function readConfig(path): { config, dir }          // dir: the config's folder, absolute
/** The generated resolver document for a config, with every $ref relative to `out`. Pure. */
export function composeResolver(config, dir, out, packageDir): object
/** Runs the whole build for a config path: theme, resolver, check, stylesheet, layout. Returns the message to print. */
export async function buildApp(configPath): Promise<string>
```

`buildApp` calls, in order: `readConfig`, `generateTheme(config.theme, join(dir, 'theme'))` (lane A, `theme.mjs`),
`composeResolver` and a write, `loadSystem(resolverPath)` (lane B, `build.mjs`, unchanged signature),
`checkOverrides(...)` (lane E), `writeCss(resolverPath, out)` (lane B).

## `scripts/theme.mjs` (lane A)

```js
export function generateTheme(configOrPath, out): { out, moved }   // a path as today, or the theme object
```

## `scripts/build.mjs` (lane B)

```js
export async function loadSystem(resolver): { system, name, prefix, icons, dir, load }   // `load`: the @toghen/lib load result, for the check
export async function buildCss(resolver): { css, iconFont: { woff2, ttf }, prefix, icons, family }
export async function writeCss(resolver, out): Promise<string>     // always writes the layout for an app
export function iconCharacters(names, dirs): Array<{ name, code }>
```

## `scripts/icons.mjs` (lane B)

```js
export function iconFont(icons, weight, dirs, family): opentype.Font
export function buildIconFont(icons, weight, dirs, family): { woff2: Buffer, ttf: Buffer }
```

## `scripts/check.mjs` (lane E)

```js
/**
 * Every `ins.*` path an app file defines must also be defined by a system file. `origins` is @toghen/lib's
 * `result.origins`; `systemDir` the package's `tokens/` folder, absolute. Throws naming the first path and file.
 */
export function checkOverrides(origins: Map<string, string[]>, systemDir: string): void
```

## `scripts/init.mjs` (lane E)

```js
/** Writes the starter files into `dir`; throws naming the config when one is there. Returns the files written. */
export function init(dir): string[]
```

## `scripts/cli.mjs` (lane A)

Dispatches `build` to `buildApp` and `init` to `init`; prints usage and exits 2 otherwise.
