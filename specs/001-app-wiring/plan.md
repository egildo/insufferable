# Implementation Plan: An app's wiring, from one config

**Branch**: `001-app-wiring` | **Date**: 2026-11-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-app-wiring/spec.md`

## Summary

Replace the hand-written app resolver with one config, `insufferable.config.json`, from which `insufferable build`
composes a standard-valid resolver, writes it beside the config, generates the theme under the contrast gate, and
writes one output layout for every app: stylesheet, fonts (woff2 and TTF, the icon font named after the prefix),
element and helper scripts with their types, and the icon list. Every mistake stops the build by name. The package
gets a complete export map and is prepared for npm. The example app becomes a config and three token files; the
documents follow.

## Technical Context

**Language/Version**: TypeScript 7 for the elements and helpers (compiled by `tsc` into `dist/`), plain ES modules
for the build scripts (`scripts/*.mjs`), Node 24 or later.

**Primary Dependencies**: `@toghen/lib` (reads and resolves the tokens; `load` with `origins` and `collisions`),
`@toghen/postcss` with `postcss` and `@csstools/postcss-mixins` (writes the stylesheet), `gosfuig` (the palette),
`unstroke` and `opentype.js` and `ttf2woff2` (the icon font), `@tabler/icons` and `@tabler/icons-webfont` (Tabler's
SVGs and characters), `@fontsource-variable/*` (the house fonts). No new dependency.

**Storage**: files beside the app's config.

**Testing**: `node --test` over `test/*.test.ts` with Node's own type stripping; the built-in browser for what a
test cannot reach.

**Target Platform**: a Node build step in any project; the output is static files for the browser.

**Project Type**: library with a CLI.

**Performance Goals**: a build of the example app under five seconds on this Mac, as today.

**Constraints**: the generated resolver MUST be valid under the W3C Resolver 2025-11-01 as `@toghen/lib` reads it,
so that `toghen-figma sync` and any Toghen tool read it unchanged. The resolver keeps the name `insufferable`.

**Scale/Scope**: five scripts, one new; eight config keys; the example app; four documents.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Platform and W3C first**: the composed document is a plain W3C Resolver; no format of our own. PASS.
- **II. Shortest working change**: one new script (`config.mjs`), one new check module, one new `init`; the
  existing `buildCss`/`writeCss` and `generateTheme` keep their signatures and gain a caller. The `theme` command is
  deleted, not kept beside. PASS.
- **III. Fail loud, by name**: every check in User Story 2 names the file, key, path or value. PASS.
- **IV. One check per piece of logic**: each requirement with logic gets a test; the tarball install and the visual
  comparison are quickstart steps. PASS.
- **V. Names, not numbers**: tasks below carry their Spec Kit identifiers for the tooling, beside a name. PASS.
- **Working rules**: nothing is committed or published by an agent; documents change in the same round. PASS.

Post-design re-check: unchanged. No entry in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-app-wiring/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── config.schema.json     # the config, as JSON Schema, also shipped by the package
│   ├── cli.md                 # the commands, their arguments, their messages
│   ├── layout.md              # what the build writes, where
│   └── modules.md             # the functions the five lanes meet at
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
scripts/
├── cli.mjs          # `insufferable build [config]`, `insufferable init [dir]`
├── config.mjs       # NEW: read and validate the config, compose and write the resolver, run the theme
├── check.mjs        # NEW: the token-path check over a load result
├── init.mjs         # NEW: the starter files
├── build.mjs        # one layout always; font named after the prefix; TTF beside woff2; types copied
├── icons.mjs        # font family as a parameter
├── theme.mjs        # generateTheme takes the config object as well as a path
└── figcraft.mjs     # unchanged
src/
├── components/icon.css      # the face name comes from the build
└── …                        # unchanged
tokens/type.tokens.json      # ins.font.family.icon: insufferable-icons
package.json                 # exports complete, version 0.1.0, files include contracts/config.schema.json
examples/app/
├── insufferable.config.json # replaces app.resolver.json and theme.config.json
├── shape.tokens.json
├── icons/quince-mark.svg
└── index.html
test/
├── config.test.ts, check.test.ts, init.test.ts, build.test.ts, exports.test.ts   # NEW
└── icons.test.ts, theme.test.ts                                                 # extended
guide.md, specs.md, decisions.md, CLAUDE.md
```

**Structure Decision**: the existing single-package layout. The one new concept, the config, is one script; the
checks and the starter are their own small modules so that five lanes can write them at once without touching one
another's files (see `contracts/modules.md`).

## Phase 0: Research

See [research.md](./research.md). All unknowns resolved; one was measured against `@toghen/lib` before planning.

## Phase 1: Design

See [data-model.md](./data-model.md), [contracts/](./contracts/) and [quickstart.md](./quickstart.md).

## Lanes for parallel implementation

Five sessions, each on its own files, each ending with its tests green; an integration pass wires them and runs
the quickstart. The lanes meet only at the function signatures in `contracts/modules.md`.

| Lane | Owns | Delivers |
|---|---|---|
| A — config and composition | `scripts/config.mjs` (new), `scripts/cli.mjs`, `scripts/theme.mjs`, `test/config.test.ts`, `test/theme.test.ts` | config read and validated, resolver composed and written, theme generated inside the build, `theme` command gone, `init` wired to lane E's module |
| B — output layout and font | `scripts/build.mjs`, `scripts/icons.mjs`, `src/components/icon.css`, `tokens/type.tokens.json`, `test/build.test.ts`, `test/icons.test.ts` | one layout always, types copied, TTF beside woff2, font family `<prefix>-icons`, icon token follows |
| C — package and publication | `package.json`, `pnpm-lock.yaml` (only through `pnpm install`), `test/exports.test.ts`, `pnpm-workspace.yaml` | export map complete and tested, version 0.1.0, files list, pack dry run, publish dry run, the link's removal documented |
| D — example app and documents | `examples/app/*`, `.gitignore`, `guide.md`, `specs.md`, `decisions.md`, `CLAUDE.md` | the example as a config, the documents describing the config, the layout, the checks and the font |
| E — checks and starter | `scripts/check.mjs` (new), `scripts/init.mjs` (new), `test/check.test.ts`, `test/init.test.ts`, `contracts/config.schema.json` kept current | the token-path check, the starter files, the schema |

Integration (after all five): wire `check.mjs` and `init.mjs` into `config.mjs` and `cli.mjs` if a lane could not,
build the example app, run the quickstart, compare the example page in the browser, report.

## Complexity Tracking

None.
