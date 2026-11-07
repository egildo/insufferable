# Changelog

## 0.1.0 — 2026-11-07

Published by hand, the first version.

- **Elements.** Calendar, combobox, icon, menu, shell, splitter, table, tabs, toolbar, tooltip and tree as web components, with the helpers an app's own element imports: keys, commands, dates, colour.
- **One stylesheet from W3C design tokens**, resolved by Toghen and written with `@toghen/postcss`, in the layers `ins.tokens`, `ins.base` and `ins.components`, light and dark by `light-dark()`.
- **An app is wired from one `insufferable.config.json`.** `insufferable init` writes a starter; `insufferable build` composes the app's resolver over the system's, generates its palette from a brand hue, writes its stylesheet, fonts, scripts and types, and stops by name on a mistake: an unknown key, a bad prefix or icon name, a missing file, an `ins.*` token the system does not define.
- **Icons are a font cut from SVG**, Tabler's outlines through unstroke, each icon's name a ligature so it reads in Figma and FigCraft. An app names the icons it uses, adds its own SVGs beside its config, and gets `<prefix>-icons` in woff2 and TTF.
- **The FigCraft library** is synced from the tokens and the component files with `@toghen/figma`.
