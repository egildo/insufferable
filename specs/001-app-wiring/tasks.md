# Tasks: An app's wiring, from one config

**Input**: Design documents from `specs/001-app-wiring/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: requested. The constitution asks one check per piece of logic, under `node:test` in `test/*.test.ts`.

**Organization**: by lane, since five sessions implement at once, each on its own files. A lane's tasks are in
its order; lanes run in parallel after the setup phase. The story label says which user story a task serves.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel with the other lanes (different files)
- **[Story]**: US1 build from one config, US2 mistakes by name, US3 install from the registry, US4 the font's
  name, US5 the starter

## Phase 1: Setup

- [ ] T001 Commit the own-icons round so that every lane's worktree starts from it (the author's word, "Commit"); until then the lanes share the checkout and commit nothing
- [ ] T002 Read `specs/001-app-wiring/contracts/modules.md` and `data-model.md` in every lane before writing; the signatures there are the agreement

## Phase 2: Foundational

Nothing blocks the lanes: the contracts are the foundation. The integration pass (Phase 8) wires what a lane could
not reach.

---

## Phase 3: Lane A — config and composition (US1, US2)

**Goal**: `insufferable build` reads one config, generates the theme, writes the resolver and calls the build.

**Independent Test**: `test/config.test.ts` green; `node scripts/cli.mjs build` on a temp config writes a resolver
that `@toghen/lib` loads and that resolves the app's override.

- [ ] T010 [P] [US1] Write `scripts/config.mjs` with `readConfig(path)`: parse JSON, refuse unknown keys naming the key and the accepted keys, check types, refuse `resolver` beside any key but `out`, check `prefix` (`^[a-z][a-z0-9]*$`) and each icon name (`^[a-z0-9]+(-[a-z0-9]+)*$`) naming the value and the rule, resolve every path from the config's folder and refuse a missing file naming the resolved path
- [ ] T011 [P] [US1] Write `composeResolver(config, dir, out, packageDir)` in `scripts/config.mjs` per `data-model.md`: base set by `$ref` into the package's resolver, an `app` set with the theme's palette and fonts, the app's token files and the inline `ins.font.family.icon` of `<prefix>-icons` when the prefix is not the system's, the theme modifier with the system's file, the generated theme's and the app's partials per context, the `lightDark` extension, and the `dev.insufferable` extension; every `$ref` relative to `out`; the `app` set omitted when empty; the first line of the document a `description` saying it is written by the build and not to be edited
- [ ] T012 [P] [US1] Change `generateTheme` in `scripts/theme.mjs` to take the theme object as well as a path; keep `test/theme.test.ts` green and add one case for the object form
- [ ] T013 [US1] Write `buildApp(configPath)` in `scripts/config.mjs`: `readConfig`, `generateTheme` into `theme/` when `theme` is present, write the resolver (or take `resolver` as it is), `loadSystem`, `checkOverrides` from `scripts/check.mjs` (import it; if lane E's module is not there yet, import lazily and skip with a note in the report), `writeCss(resolverPath, out)`; return the message to print
- [ ] T014 [US1] Rewrite `scripts/cli.mjs`: `build [config]` with the default `./insufferable.config.json`, `init [dir]` dispatching to `scripts/init.mjs` (lazy import, same rule), usage and exit 2 otherwise; remove `theme`
- [ ] T015 [US2] Write `test/config.test.ts`: one case per refusal in US2's scenarios 1, 2, 5 and 7 asserting the message contains the culprit; one case that a full config composes the document of `data-model.md` (deep-equal on the shape with the paths relative); one case that `load` from `@toghen/lib` reads the written document and resolves an app's radius override to the app's value with no collision in the `app` set

**Checkpoint**: a temp folder with a config and a token file builds end to end through `buildApp`, given lane B's
`writeCss`; until lane B lands, the test stops at the written resolver.

---

## Phase 4: Lane B — output layout and the font (US1, US4)

**Goal**: one layout for every app; the icon font named after the prefix, as woff2 and TTF; types beside scripts.

**Independent Test**: `test/build.test.ts` and `test/icons.test.ts` green; `writeCss` on the example resolver
writes the layout of `contracts/layout.md`.

- [ ] T020 [P] [US4] In `scripts/icons.mjs`, take the family name as a parameter of `iconFont` and `buildIconFont`; return `{ woff2, ttf }` from `buildIconFont`; update `test/icons.test.ts`
- [ ] T021 [P] [US4] In `tokens/type.tokens.json`, set `ins.font.family.icon` to `insufferable-icons` and reword its description; in `src/components/icon.css`, make the face's family come from the build's marker rather than a literal
- [ ] T022 [US4] In `scripts/build.mjs`, name the face, the files and the family `<prefix>-icons`: the family from the resolved `ins.font.family.icon` token (which the generated resolver sets for an app) and, for the system, `insufferable-icons`; write `fonts/<family>.woff2` and `fonts/<family>.ttf`; fail by name if the token and the prefix disagree
- [ ] T023 [US1] In `scripts/build.mjs`, make `writeCss` write the layout for every app: scripts and their `.d.ts` copied with the prefix rewritten, `icons.js` with the app's list or the system's, `icons.d.ts` beside it; only the system's own build (no resolver argument) writes `dist/`; keep the refusal of an `out` that is the package's `dist`
- [ ] T024 [US1] In `scripts/build.mjs`, return the `@toghen/lib` load result from `loadSystem` as `load`, for lane E's check, without changing the other fields
- [ ] T025 [US1] Write `test/build.test.ts`: `writeCss` on `examples/app`'s current resolver into a temp folder writes every path of `contracts/layout.md`, the stylesheet names `quince-icons` in the face and the icon rule and never `tabler-icons`, `icons.js` holds the list, each `.js` has its `.d.ts`; the system's `dist/insufferable.css` names `insufferable-icons`

**Checkpoint**: `pnpm build` writes `dist/fonts/insufferable-icons.woff2` and `.ttf`, `dev/icon.html` draws as
before in the built-in browser.

---

## Phase 5: Lane C — package and publication (US3)

**Goal**: the package installs from the registry with every path exported and typed, and is ready to publish.

**Independent Test**: `test/exports.test.ts` green; `pnpm pack` and `npm publish --dry-run` list the right files.

- [ ] T030 [P] [US3] Rewrite `exports` in `package.json`: `./styles.css`, `./resolver.json`, `./tokens/*`, `./config.schema.json`, every helper (`./color.js`, `./commands.js`, `./dates.js`, `./elements.js`, `./icons.js`, `./keys.js`) and every element (`./components/<name>.js` for each of `src/elements.ts`), each with `types` and `default` conditions pointing into `dist/`; keep the short forms `./tabs.js` and so on as aliases of `./components/<name>.js`
- [ ] T031 [P] [US3] Write `test/exports.test.ts`: every `dist/**/*.js` that is not under `fonts/` has an export, and every export's target exists after `pnpm build`; fails naming the missing one
- [ ] T032 [P] [US3] Set `version` to `0.1.0`; add `contracts/config.schema.json` (copied from `specs/001-app-wiring/contracts/` into a top-level `contracts/` folder) to `files`; confirm `src/`, `scripts/` (the five build scripts and the new `config.mjs`, `check.mjs`, `init.mjs`), `tokens/`, `dist/`, `icons/` are listed and `examples/`, `dev/`, `figcraft/`, `specs/`, `test/` are not
- [ ] T033 [US3] Run `pnpm pack --pack-destination /tmp` and `npm publish --dry-run`; write the file list into the lane's report; install the tarball into an empty temp folder with `pnpm add` and record whether `npx insufferable build` on a minimal config runs (it depends on lanes A and B; report what it does at the time)
- [ ] T034 [US3] Document the removal of the `@toghen/figma` link in the report: the steps the author takes (publish 0.1.16 in `/Volumes/dev/Codeberg/Toghen/figma`, then here `pnpm remove @toghen/figma && pnpm add -D @toghen/figma@^0.1.16`, delete `pnpm-workspace.yaml`); do not perform them

**Checkpoint**: `pnpm test` green with the exports test; the dry runs listed.

---

## Phase 6: Lane D — the example app and the documents (US1, US4)

**Goal**: the example app is a config and token files; the documents describe the new route.

**Independent Test**: the config in `examples/app` validates against `contracts/config.schema.json`; the documents
no longer show a hand-written resolver as the route.

- [ ] T040 [P] [US1] Write `examples/app/insufferable.config.json` from `app.resolver.json` and `theme.config.json`: prefix `quince`, the six icons, the theme (brand hue 38 locked to `#9a3d12`, neutral hue 80 chroma 0.005, serif Georgia), `tokens: ["shape.tokens.json"]`; delete `app.resolver.json` and `theme.config.json`; keep `shape.tokens.json`, `icons/quince-mark.svg` and `index.html`
- [ ] T041 [P] [US1] Update `.gitignore`: add `examples/app/insufferable.resolver.json`, keep the generated outputs listed; add `dist/fonts/*.ttf` only if `dist/` were not already ignored (it is; verify and leave it)
- [ ] T042 [P] [US1] Rewrite the "Make it yours" section of `guide.md`: step one the CSS override as today; step two the config, with the example config inline, `insufferable init` and `insufferable build`, the layout, the checks that stop the build and what they say, the icons section folded in, the font's name and how a designer installs the TTF; step three the escape hatch `resolver`; remove the hand-written resolver example and the `theme` command
- [ ] T043 [P] [US1] Rewrite in `specs.md` the sections "Theming an app", "Building an app's own stylesheet" and "Generating a theme": the config, the generated resolver and why composition is ours (the standard's limit on overlays, from research.md), the `app` set, the checks, the layout, the font's name; keep the CSS-override route; update the Icon section's mention of the family name
- [ ] T044 [P] [US1] Append the dated ruling to `decisions.md`: the proposal of 7 November 2026 (five moves), the Toghen finding, the research decisions, what the lanes changed, what was checked in the quickstart and what was not
- [ ] T045 [P] [US1] Update `CLAUDE.md`'s commands table: `node scripts/cli.mjs build [config]`, `node scripts/cli.mjs init [dir]`, no `theme`; add the Spec Kit note: features live in `specs/NNN-name/`, the constitution in `.specify/memory/constitution.md`

**Checkpoint**: the documents read as one; the example folder holds no resolver of its own.

---

## Phase 7: Lane E — the checks and the starter (US2, US5)

**Goal**: the token-path check and `init`, each with its test, ready for lane A to import.

**Independent Test**: `test/check.test.ts` and `test/init.test.ts` green on their own.

- [ ] T050 [P] [US2] Write `scripts/check.mjs` with `checkOverrides(origins, systemDir)`: for every path whose origins include a file outside `systemDir`, if the path is under the `ins` group it must also have an origin inside `systemDir`, else throw naming the path, the app file and the rule ("a path under ins must exist in the system; an app's own tokens take the app's own group"); first verify the key form `@toghen/lib` uses in `origins` for an `ins.*` path (research.md records `palette.gray.25` for a top-level group) and write what you found in a comment
- [ ] T051 [P] [US2] Write `test/check.test.ts`: `load` a temp resolver that lists the system's base set and an app file; `ins.radius.3` throws naming the path and the file; `ins.radius.1` passes; `acme.card.padding` passes
- [ ] T052 [P] [US5] Write `scripts/init.mjs` with `init(dir)`: writes `insufferable.config.json` (prefix `app`, a theme with brand hue 38 and neutral hue 80 chroma 0.005, no icons, no tokens), `icons/.gitkeep`, and `index.html` linking `insufferable.css`, importing `components/tabs.js` and `components/icon.js`, showing a heading, a paragraph, a `button.solid` and a tabs element as `dev/tabs.html` writes one; refuses naming the config when it exists; returns the files written
- [ ] T053 [P] [US5] Write `test/init.test.ts`: in a temp folder `init` writes the three files and the config validates against `contracts/config.schema.json` by the rules in `data-model.md` (no schema library: check the keys and patterns directly); a second `init` throws naming the file
- [ ] T054 [P] [US5] Keep `specs/001-app-wiring/contracts/config.schema.json` current with anything the lane learns; note any change in the report

**Checkpoint**: both modules import cleanly; no other file touched.

---

## Phase 8: Integration and polish

Run by the session that started the lanes, after all five report.

- [ ] T060 Merge the five branches, or take the shared checkout as it stands; wire `checkOverrides` and `init` into `config.mjs` and `cli.mjs` where lane A left a lazy import
- [ ] T061 Run quickstart steps 1 to 6; fix what breaks in the file that owns it
- [ ] T062 Compare `examples/app/index.html` in the built-in browser with the screenshot of 7 November 2026 (the Quince notebook with the quince mark)
- [ ] T063 Report to the author: what changed by file, what the quickstart showed, what was not checked (Figma, the publish itself, the `@toghen/figma` link's removal), and the two actions that are his: "Commit", and the two publishes

---

## Dependencies & Execution Order

- **Setup**: the commit of the own-icons round comes first if the lanes use worktrees; with a shared checkout it
  can wait, and the lanes commit nothing.
- **Lanes A to E**: independent files; all five start together. Lane A's `buildApp` calls lane B's `writeCss` and
  lane E's `checkOverrides`; until those land, A's test stops at the written resolver, and the integration pass
  finishes the chain.
- **Integration**: after all five.

## Parallel Example

```text
Session A: T010–T015   scripts/config.mjs, scripts/cli.mjs, scripts/theme.mjs, test/config.test.ts, test/theme.test.ts
Session B: T020–T025   scripts/build.mjs, scripts/icons.mjs, src/components/icon.css, tokens/type.tokens.json, test/build.test.ts, test/icons.test.ts
Session C: T030–T034   package.json, pnpm-lock.yaml, test/exports.test.ts, contracts/config.schema.json (copy)
Session D: T040–T045   examples/app/*, .gitignore, guide.md, specs.md, decisions.md, CLAUDE.md
Session E: T050–T054   scripts/check.mjs, scripts/init.mjs, test/check.test.ts, test/init.test.ts, specs/001-app-wiring/contracts/config.schema.json
```

## Implementation Strategy

The MVP is lanes A and B together: a config builds a layout. C makes it installable, D makes it understood, E makes
it loud and gives it a first page. Integration proves the six quickstart steps.

## Notes

- A lane that must touch another lane's file stops and says so in its report; the integration pass does it.
- No lane commits, publishes or pushes.
- Identifiers above are Spec Kit's, for its tooling; in prose, name the task.
