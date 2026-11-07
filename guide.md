# insufferable — Guide

How to use insufferable in an app, and how to make it look like the app's own. The reasons it is built this way are in [specs.md](./specs.md); this is the practice. Every element has a demo page in `dev/`: serve the folder and open `dev/index.html`.

insufferable is not published yet. Until it is, install it from a checkout or a tarball:

```sh
pnpm add /path/to/insufferable          # a checkout
pnpm add ./insufferable-0.1.0.tgz       # or `pnpm pack` in the checkout
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

**2. Write a config.** One file holds your choices, and the build does the rest. In a new folder, `init` writes a starter config, an empty `icons/` folder and a page to look at, and refuses if a config is already there:

```sh
npx insufferable init
npx insufferable build
```

The config is `insufferable.config.json`, beside your page. [`examples/app`](./examples/app) has this one:

```json
{
  "prefix": "quince",
  "icons": ["check", "chevron-down", "quince-mark", "search", "settings", "x"],
  "theme": {
    "brand": { "hue": 38, "lock": "#9a3d12" },
    "neutral": { "hue": 80, "chroma": 0.005 },
    "fonts": { "serif": "Georgia" }
  },
  "tokens": ["shape.tokens.json"]
}
```

Every key may be left out, and a config of `{}` builds our own look in your folder. Every path is read from the config's folder. `npx insufferable build` takes the config in the current folder; name another as its argument.

- **`prefix`** names your elements: `quince-tabs` for `insufferable-tabs`, in the stylesheet and in the scripts. It is lower case letters and digits, starting with a letter. Custom properties, tokens, commands and classes keep their names.
- **`theme`** is your palette, fonts and colour roles, generated on every build into `theme/` beside the config. The brand is a hue, and optionally a colour pinned to the `600` step. The neutral is the hue and chroma of the grey: a trace of chroma, near 0.005, is the difference between a dead grey and a paper. The fonts are family names, each followed by the system's fallbacks; you load the faces, and the build only writes the names.
- **`tokens`** lists token files of yours, which win over ours. They can change the ladder, the radii and the type. Override our tokens by their own paths, and put a token of your own in a group of your own: `acme.card.padding` becomes a custom property, and a new path under `ins` stops the build.
- **`light`** and **`dark`** list partial files for one scheme. Each names only the roles it changes, and wins over ours and over the generated theme's in that scheme.
- **`icons`** names the icons you ship, below.
- **`out`** is where the build writes, when not beside the config. `theme/` stays beside the config.

The theme is measured. The build checks every pair of colours the elements use, in light and dark: 4.5:1 for text, 3:1 for the edge of a control. A brand colour that falls short moves along its ramp, darker in light and lighter in dark, and the build says how far.

**What the build writes,** always in this shape, so your page always imports from the same place:

```
insufferable.resolver.json    generated: do not edit
theme/                        generated, when the config has a theme
insufferable.css
fonts/
  quince-icons.woff2          the icon font, for the browser
  quince-icons.ttf            the icon font, to install
  archivo-*.woff2, fraunces-*.woff2
components/
  tabs.js, tabs.d.ts          every element, under your prefix
color.js, commands.js, dates.js, elements.js, keys.js, each with its .d.ts
icons.js, icons.d.ts          your icons, or ours when you name none
```

```html
<link rel="stylesheet" href="insufferable.css">
<script type="module" src="components/tabs.js"></script>
```

**A mistake stops the build,** and the message names it. A mistake in the config stops it before anything is written; a token path, once the tokens are read, stops it before the stylesheet.

- **An unknown key:** the key, and the keys it accepts.
- **A token file that is not there:** its path, as read from the config's folder.
- **A token under `ins` that the system does not define,** as `ins.radius.3`: the path and the file, and the rule that a path under `ins` must exist in the system and that your own tokens take your own group.
- **A prefix or an icon name that cannot be one:** the value and the rule.
- **An icon that is neither Tabler's nor a file of yours:** its name.
- **A theme whose brand cannot hold the contrast:** each pair that falls short, and the theme is refused.
- **A `resolver` beside other keys:** that your own resolver replaces the composed one, and the other keys do not apply.

**Your icons.** The system ships the icons its elements use, by Tabler's names. `icons` replaces that list with yours. A name Tabler has is Tabler's icon. Any other name is a file of yours, `icons/<name>.svg` beside the config: strokes on a 24px grid, as Tabler draws them, with `stroke="currentColor"` and no fill. A file of yours wins over a Tabler icon of the same name. The build draws every icon at your `ins.border.icon` weight, writes `<quince-icon name="quince-mark">` into the stylesheet and lists your icons in `icons.js`, so the icon element warns against your icons and not ours. A name is lower case letters and digits with single hyphens between them.

**The icon font, for a designer.** The font is named after your prefix, `<prefix>-icons`, so it never collides with Tabler's own font or with another app's on the same Mac. To name icons in FigCraft or Figma, install `fonts/<prefix>-icons.ttf`: open it in Font Book and choose Install. Then set a text layer's font to `quince-icons` and type an icon's name: each name is a ligature, and `search` typed in the font is the magnifying glass. Install the file again when the weight or the list of icons changes.

**3. Name your own resolver,** when the config cannot say what you need. Say so in the config, with nothing beside it but `out`:

```json
{ "resolver": "my.resolver.json" }
```

The build then reads your W3C Resolver document as it is, composes nothing and generates no theme. The document keeps the name `insufferable`, since the stylesheet refers to every token by it, and it carries the prefix and the icons in its own extension, `"$extensions": { "dev.insufferable": { "prefix": "quince", "icons": ["search"] } }`. You then keep what the config kept for you: the paths into our package, the theme modifier, and the icon font's name, `ins.font.family.icon` set to `<prefix>-icons`, which the build checks. The check on token paths holds here too. Most apps never need this.

## What you may change

- **Any role or primitive** by its token: the colours under `ins.color`, `ins.space`, `ins.radius`, `ins.size`, `ins.font`, `ins.shadow`.
- **The ladder.** Every dimension is cut from `ins.quanta`, the Fibonacci and Lucas numbers in rem. Change what a role names, not the numbers.
- **The weight of the icons,** `ins.border.icon`, the stroke on their 24px grid (1.5 by default). The build draws the icon font from the icons' SVGs at that weight, so an app's own build gets the weight it chose.
- **The icons themselves,** by name, Tabler's or your own SVGs.
- **The prefix of the elements,** and with it the name of the icon font.
- **Tokens of your own,** in a group of your own.

What you should keep: a role with its companions (the accent with its strong, deep and tint, and the text on it), since they are named apart so that each pair can be measured, and the names of tokens, for the FigCraft files.

## Not yet

A density mode; a FigCraft library built from an app's own tokens; an app's own stylesheets passed through the build; publication.
