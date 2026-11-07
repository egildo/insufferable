# Data Model: An app's wiring, from one config

## Config (`insufferable.config.json`)

One JSON object. Every path is relative to the config's own folder. Unknown keys are refused by name.

| Key | Type | Default | Rule |
|---|---|---|---|
| `prefix` | string | `insufferable` | `^[a-z][a-z0-9]*$`: can start a custom element name |
| `icons` | string[] | the system's list | each `^[a-z0-9]+(-[a-z0-9]+)*$`; a Tabler name, else `icons/<name>.svg` beside the config must exist |
| `theme` | object | none | `{ brand: { hue: number, lock?: hex }, neutral: { hue: number, chroma: number }, fonts?: { sans?, serif?, mono?: string } }`, as the theme generator takes today |
| `tokens` | string[] | `[]` | token files, each must exist; form the `app` set |
| `light` | string[] | `[]` | partial role files for the light scheme, each must exist |
| `dark` | string[] | `[]` | partial role files for the dark scheme, each must exist |
| `resolver` | string | none | an app's own resolver; when present, only `out` may accompany it |
| `out` | string | the config's folder | where the layout is written; never the system's own `dist` |

Validation order: unknown keys, then types, then `resolver` exclusivity, then `prefix` and `icons` rules, then
file existence. The first failure stops with its name; a message lists the accepted keys when the key is unknown.

## Generated resolver (`<out>/insufferable.resolver.json`)

```json
{
  "version": "2025-11-01",
  "name": "insufferable",
  "description": "Written by insufferable build from insufferable.config.json: do not edit.",
  "sets": {
    "base": { "sources": [{ "$ref": "<relative path to the package>/tokens/insufferable.resolver.json#/sets/base" }] },
    "app": { "sources": [
      { "$ref": "theme/palette.tokens.json" }, { "$ref": "theme/fonts.tokens.json" },
      { "$ref": "<each of tokens>" },
      { "ins": { "font": { "family": { "icon": { "$value": ["<prefix>-icons"] } } } } }
    ] }
  },
  "resolutionOrder": [{ "$ref": "#/sets/base" }, { "$ref": "#/sets/app" }, { "$ref": "#/modifiers/theme" }],
  "modifiers": { "theme": {
    "default": "light",
    "contexts": {
      "light": [{ "$ref": "<package>/tokens/theme.light.tokens.json" }, { "$ref": "theme/light.tokens.json" }, { "$ref": "<each of light>" }],
      "dark":  [{ "$ref": "<package>/tokens/theme.dark.tokens.json" },  { "$ref": "theme/dark.tokens.json" },  { "$ref": "<each of dark>" }]
    },
    "$extensions": { "com.toghen": { "css": { "lightDark": { "light": "light", "dark": "dark" } } } }
  } },
  "$extensions": { "dev.insufferable": { "prefix": "<prefix>", "icons": ["<each of icons>"] } }
}
```

- The `theme/*` references appear only when `theme` is present; the `icons` key only when given; the inline font
  source only when the prefix is not the system's.
- The package path is computed by resolving `insufferable/package.json` from the config's folder as Node would,
  then written relative to the generated file. It is a path like `node_modules/insufferable` in the common case
  and `../..` in the example app, which lives in the checkout.
- An `app` set with no sources is omitted, and so is its entry in the order.

## Theme files (`<config folder>/theme/`)

`palette.tokens.json`, `fonts.tokens.json`, `light.tokens.json`, `dark.tokens.json`: as `insufferable theme`
writes today, unchanged in content.

## Output layout (`<out>/`)

See [contracts/layout.md](./contracts/layout.md).

## State

None. Every build is from scratch; generated files are overwritten.
