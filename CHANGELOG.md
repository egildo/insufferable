# Changelog

## 0.1.2 — 2026-11-07

- **The workflow takes its pnpm from `packageManager`.** The 0.1.1 run stopped at the pnpm setup, which refused a second version named in the workflow, so 0.1.1 is a tag with no package behind it. Nothing else changed.

## 0.1.1 — 2026-11-07

- **Released by tag.** A tag `vX.Y.Z` publishes to npm from the GitHub mirror, with provenance; `scripts/release.sh` checks that `package.json`, the tag and this file name one version, then pushes. Codeberg is the source and one push reaches both remotes.
- **A licence, MIT**, and `package.json` names the repository, the homepage and where to file a bug.

## 0.1.0 — 2026-11-07

Published by hand, the first version.

- **Elements.** Calendar, combobox, icon, menu, shell, splitter, table, tabs, toolbar, tooltip and tree as web components, with the helpers an app's own element imports: keys, commands, dates, colour.
- **One stylesheet from W3C design tokens**, resolved by Toghen and written with `@toghen/postcss`, in the layers `ins.tokens`, `ins.base` and `ins.components`, light and dark by `light-dark()`.
- **An app is wired from one `insufferable.config.json`.** `insufferable init` writes a starter; `insufferable build` composes the app's resolver over the system's, generates its palette from a brand hue, writes its stylesheet, fonts, scripts and types, and stops by name on a mistake: an unknown key, a bad prefix or icon name, a missing file, an `ins.*` token the system does not define.
- **Icons are a font cut from SVG**, Tabler's outlines through unstroke, each icon's name a ligature so it reads in Figma and FigCraft. An app names the icons it uses, adds its own SVGs beside its config, and gets `<prefix>-icons` in woff2 and TTF.
- **The FigCraft library** is synced from the tokens and the component files with `@toghen/figma`.
