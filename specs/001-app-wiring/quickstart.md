# Quickstart: prove the wiring works

Prerequisites: Node 24, pnpm, this checkout built (`pnpm build`), a dev server for the browser checks
(`python3 -m http.server 8000` in the checkout).

## 1. The three commands pass

```sh
pnpm build && pnpm typecheck && pnpm test
```

Expected: green; the test count has grown by the new files (`config`, `check`, `init`, `build`, `exports`).

## 2. The example app builds from its config

```sh
node scripts/cli.mjs build examples/app/insufferable.config.json
```

Expected: `examples/app/` holds `insufferable.resolver.json` (generated), `theme/`, `insufferable.css`, `fonts/`
with `quince-icons.woff2` and `quince-icons.ttf`, `components/*.js` with `.d.ts`, `icons.js` listing the six
icons. Open `http://localhost:8000/examples/app/index.html`: the Quince notebook, square corners, terracotta accent,
Georgia headings, the quince mark in the heading, no console warning. Compare with a screenshot taken before the
change.

## 3. A mistake names itself

```sh
cd $(mktemp -d) && printf '{ "prefx": "x" }' > insufferable.config.json && node <checkout>/scripts/cli.mjs build
```

Expected: exit 1, the message names `prefx` and lists the accepted keys. Repeat with a missing token file, a bad
prefix, a bad icon name, and a token file defining `ins.radius.3`: each names its culprit.

## 4. It installs from a tarball

```sh
cd <checkout> && pnpm pack --pack-destination /tmp
cd $(mktemp -d) && pnpm init && pnpm add /tmp/insufferable-0.1.0.tgz && npx insufferable init && npx insufferable build
```

Expected: the starter page builds; `index.html` served from that folder draws the heading, the button and the tabs
in the system's look. `npm publish --dry-run` in the checkout lists `tokens/`, `dist/`, `src/`, `scripts/`,
`icons/`, `contracts/config.schema.json`, `package.json`, `LICENSE` and nothing from `examples/`.

## 5. The font names itself

```sh
grep -c "quince-icons" examples/app/insufferable.css   # the face and the icon token
grep -c "tabler-icons" dist/insufferable.css            # 0
```

Install `examples/app/fonts/quince-icons.ttf`, type `home` in it in FigCraft: the house, at weight 1.5.

## 6. The documents say so

`guide.md` opens the "Make it yours" section with the config; `specs.md` describes the generated resolver and the
layout; `decisions.md` has the dated ruling; `CLAUDE.md` lists `insufferable build` and `init` and no `theme`.
