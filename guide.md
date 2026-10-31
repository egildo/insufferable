# insufferable — Guide

How to use insufferable in an app, and how to make it look like the app's own. The reasons it is built this way are in [specs.md](./specs.md); this is the practice. Every element has a demo page in `dev/`: serve the folder and open `dev/index.html`.

insufferable is not published yet. Until it is, install it from a checkout or a tarball:

```sh
pnpm add /path/to/insufferable          # a checkout
pnpm add ./insufferable-0.0.0.tgz       # or `pnpm pack` in the checkout
```

## Use it as it is

Link the stylesheet and import the scripts of the elements the page uses.

```html
<link rel="stylesheet" href="node_modules/insufferable/dist/insufferable.css">
<script type="module" src="node_modules/insufferable/dist/components/tabs.js"></script>
```

Most of the system is native markup with a class: `<button class="solid">`, `<div role="note" class="danger">`, `<fieldset class="segmented">`. A custom element, such as `<insufferable-tabs>`, is only there where script is needed, and wraps native markup that works without it. An element takes attributes in and sends commands out, and it never keeps your state: see the element contract in specs.md.

The page follows the system's colour scheme, light or dark, with no script. To choose the scheme in your app, set `color-scheme` on the page or on any container: `html { color-scheme: dark; }`, or `light`, or `light dark` for the system's. Every role follows it, a subtree included, so `<aside style="color-scheme: dark">` is a dark panel on a light page. A switch is your state: it sets that one property, however you keep the choice.

## Make it yours, in three steps up

**1. Override a few values.** An app's own CSS after the stylesheet wins over every layer of ours, with no `!important`. Set a role:

```css
:root {
  --ins-color-accent: light-dark(#9a3d12, #f0a070);
  --ins-radius-1: 0;
}
```

This costs nothing, and measures nothing: you check the contrast yourself. [`dev/theme.html`](./dev/theme.html) is the demo page restyled this way.

**2. Build your own stylesheet.** Write a resolver that lists our tokens, then yours, which win by coming later, and build it:

```sh
npx insufferable build app.resolver.json
```

This writes `insufferable.css` and the element scripts, in `components/`, beside the resolver. Your tokens can change the ladder, the radii, the type and the palette. [`examples/app`](./examples/app) is a complete example. A resolver of an app has this shape:

```json
{
  "version": "2025-11-01",
  "name": "insufferable",
  "sets": { "base": { "sources": [
    { "$ref": "node_modules/insufferable/tokens/insufferable.resolver.json#/sets/base" },
    { "$ref": "my.tokens.json" }
  ] } },
  "resolutionOrder": [{ "$ref": "#/sets/base" }, { "$ref": "#/modifiers/theme" }],
  "modifiers": { "theme": {
    "default": "light",
    "contexts": {
      "light": [{ "$ref": "node_modules/insufferable/tokens/theme.light.tokens.json" }, { "$ref": "my.light.tokens.json" }],
      "dark": [{ "$ref": "node_modules/insufferable/tokens/theme.dark.tokens.json" }, { "$ref": "my.dark.tokens.json" }]
    },
    "$extensions": { "com.toghen": { "css": { "lightDark": { "light": "light", "dark": "dark" } } } }
  } }
}
```

Two rules. The resolver keeps the name `insufferable`, since the stylesheet refers to every token by it. And you override tokens, you do not rename them: the FigCraft component files refer to them by name. A theme file names only the roles it changes.

**3. Generate the theme.** Write a config:

```json
{ "brand": { "hue": 38, "lock": "#9a3d12" }, "neutral": { "hue": 80, "chroma": 0.005 }, "fonts": { "serif": "Georgia" } }
```

```sh
npx insufferable theme theme.config.json
```

It writes `theme/` beside the config: a palette, the fonts, and the roles that name your brand, for light and dark. List them in your resolver after ours, as `examples/app/app.resolver.json` does, and build.

- **The brand** is a hue, and optionally a colour pinned to the `600` step.
- **The neutral** is the hue and chroma of the grey: a trace of chroma, near 0.005, is the difference between a dead grey and a paper.
- **The fonts** are family names, each followed by the system's fallbacks. You load the faces: the build only writes the names.

The command checks every pair of colours the elements use, in light and dark: 4.5:1 for text, 3:1 for the edge of a control. A brand colour that falls short moves along its ramp, darker in light and lighter in dark, and the command says how far. A theme that cannot hold is refused, with each pair named, and nothing is written.

## Choose your own prefix

The elements are `insufferable-tabs`, `insufferable-menu` and so on; the system declares that prefix once, in its own resolver. To give them your own prefix, say so in yours:

```json
"$extensions": { "dev.insufferable": { "prefix": "acme" } }
```

The build writes `acme-tabs` into the stylesheet and into the scripts in `components/`. The prefix is lower case letters and digits, starting with a letter. Custom properties, tokens, commands and classes keep their names.

## What you may change

- **Any role or primitive** by its token: the colours under `ins.color`, `ins.space`, `ins.radius`, `ins.size`, `ins.font`, `ins.shadow`.
- **The ladder.** Every dimension is cut from `ins.quanta`, the Fibonacci and Lucas numbers in rem. Change what a role names, not the numbers.
- **The prefix of the elements.**

What you should keep: a role with its companions (the accent with its strong, deep and tint, and the text on it), since they are named apart so that each pair can be measured, and the names of tokens, for the FigCraft files.

## Not yet

A density mode; a FigCraft library built from an app's own tokens; publication.
