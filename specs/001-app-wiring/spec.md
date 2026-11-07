# Feature Specification: An app's wiring, from one config

**Feature Branch**: `001-app-wiring`

**Created**: 2026-11-07

**Status**: Draft

**Input**: User description: "What is most important is to make this usable in other projects: plan what we need to render the tokens wiring very robust and straightforward."

## Context

Today an app that builds on insufferable writes a W3C resolver document by hand, about forty-five lines that mirror
the system's internals: the paths of its token files inside `node_modules`, its name, its theme modifier with both
contexts and Toghen's `lightDark` extension, and the generated theme's files in the right slots. Then it runs two
commands, `theme` and `build`, and finds the element scripts in one of two places depending on whether it chose a
prefix or its own icons. The package is not published. The icon font carries Tabler's family name, so a designer's
Mac with Tabler installed shows the wrong glyphs in FigCraft or Figma.

Toghen's resolver composition was looked at: an overlay can borrow a base's sets and modifiers but, by the standard,
cannot add a source inside a borrowed modifier's context, which is why the app must redeclare the theme modifier.
The standard's `$extends` is not implemented in `@toghen/lib`. The wiring therefore belongs in insufferable's own
command, which composes a plain, standard-valid resolver from the app's few choices and writes it out, so that Toghen
tools and the FigCraft sync read the same document.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Build an app from one config (Priority: P1)

A developer installs insufferable in a new project, writes one small config beside their page, naming at most a
prefix, a brand, a neutral, fonts, a few icons and a token file or two, and runs one command. Beside the config they
find everything the page needs, always in the same layout: the stylesheet, the fonts, the element scripts with their
types, and the list of icons. They never write a resolver, and when the system later adds a modifier or renames a
file, their config still builds.

**Why this priority**: This is the whole point of the feature. Everything else refines it.

**Independent Test**: In an empty folder with insufferable installed, write a config of under fifteen lines, run
the build, open a page that links the stylesheet and imports an element script; the page draws in the app's colours
with the app's prefix and icons.

**Acceptance Scenarios**:

1. **Given** a folder with insufferable installed and a config naming a prefix and a theme, **When** the developer
   runs the build, **Then** the stylesheet, the fonts, the scripts with their types, the icon list and a generated
   resolver appear beside the config, and a page using them draws with that prefix and those colours.
2. **Given** a config with no theme, no prefix and no icons, **When** the developer runs the build, **Then** the
   output is the system's own look, under the system's prefix, in the same layout as any other app's.
3. **Given** a config naming a token file that overrides a radius, **When** the build runs, **Then** the
   stylesheet carries the app's radius and every element that reads it follows.
4. **Given** a config naming light and dark partial files, **When** the build runs, **Then** each role named in a
   partial wins over the system's and over the generated theme's in that scheme, and the rest are untouched.
5. **Given** an existing app that wrote its own resolver, **When** its config names that resolver and nothing
   else, **Then** the build uses it as it is, as the build did before this feature.
6. **Given** the example app rebuilt from a config, **When** its page is opened beside the page built from the old
   resolver, **Then** the two look the same.

---

### User Story 2 - A mistake stops the build and names itself (Priority: P2)

A developer makes a mistake in the config: a misspelled key, a token file that is not there, a prefix with a
capital, an icon name with a space, a token path under the system's group that the system does not define. The
build stops before writing anything and says which file, key, path or name is wrong and what would be right.

**Why this priority**: A silent mistake in tokens shows up as a page that looks slightly wrong weeks later. Robust
means loud.

**Independent Test**: Each kind of mistake, made alone in an otherwise valid config, stops the build with a message
that contains the offending name; a valid config builds.

**Acceptance Scenarios**:

1. **Given** a config with an unknown key, **When** the build runs, **Then** it stops naming the key and the keys
   it accepts.
2. **Given** a config naming a token file that does not exist, **When** the build runs, **Then** it stops naming
   the path as resolved from the config's folder.
3. **Given** an app token file that defines `ins.radius.3`, which the system does not define, **When** the build
   runs, **Then** it stops naming the path and the file, and says that a path under `ins` must exist in the system
   and that an app's own tokens take the app's own group.
4. **Given** an app token file that defines `acme.card.padding`, **When** the build runs, **Then** it builds, and
   the token is a custom property in the stylesheet.
5. **Given** a config with a prefix that cannot start a custom element name or an icon name that cannot be a
   ligature, **When** the build runs, **Then** it stops naming the value and the rule.
6. **Given** a theme whose brand cannot hold the contrast, **When** the build runs, **Then** it stops as the theme
   generator does today, naming each pair, and writes nothing.
7. **Given** a config that names a resolver and also a theme, **When** the build runs, **Then** it stops saying
   that a resolver of the app's own replaces the composed one and the other keys do not apply.

---

### User Story 3 - Install it from the registry (Priority: P2)

A developer adds insufferable to a project from npm, as any package. Every element script, every helper an app's
own element would import and the stylesheet are reachable by their documented import paths, with types. The
package builds itself when packed, and what it ships is exactly what the build needs.

**Why this priority**: Without publication there are no other projects.

**Independent Test**: Pack the package, install the tarball into an empty folder, build the example config there,
import every documented path from a TypeScript file that typechecks.

**Acceptance Scenarios**:

1. **Given** the package, **When** its export map is compared with the files the build writes to `dist`, **Then**
   every element, every helper and the stylesheet are exported, and a test fails when one is missing.
2. **Given** a tarball from `pnpm pack`, **When** it is installed into an empty folder with Node 24 and the example
   config is built there, **Then** the build succeeds and the output matches a build from the checkout.
3. **Given** the package at version 0.1.0, **When** `npm publish --dry-run` runs, **Then** it lists only the
   files the build needs and no generated app output.
4. **Given** the lockfile, **When** the feature is done, **Then** it holds no link to a local checkout of
   `@toghen/figma`; the fix insufferable needs is a published version.

---

### User Story 4 - The icon font names itself (Priority: P3)

A designer installs the app's icon font on their Mac to name icons in FigCraft or Figma. Its family name is the
app's own, so it never collides with Tabler's stock font or with another app's font built by the same system. The
build writes the font in the two forms a browser and a design tool want.

**Why this priority**: Found on 7 November 2026: with Tabler's font installed, a FigCraft text layer in our font
drew the wrong weight and spelled the names out.

**Independent Test**: Build an app with prefix `quince`; the stylesheet's icon face and the icon token name
`quince-icons`; `fonts/` holds `quince-icons.woff2` and `quince-icons.ttf`; the system's own build names
`insufferable-icons`.

**Acceptance Scenarios**:

1. **Given** an app with a prefix, **When** it builds, **Then** the font family, the face file names and the icon
   typography token all carry `<prefix>-icons`.
2. **Given** the system's own build, **When** it runs, **Then** the family is `insufferable-icons` and nothing in
   the stylesheet says `tabler-icons` any more.
3. **Given** the built TTF, **When** it is installed and `home` is typed in it in FigCraft, **Then** the house
   draws at the app's weight.

---

### User Story 5 - Start a new app in one command (Priority: P3)

A developer in an empty folder runs one command that writes a starter config, an empty icons folder and a page
that links the stylesheet and shows a few elements, so the first build has something to show.

**Why this priority**: It removes the blank page, but a developer can copy the example app instead.

**Independent Test**: In an empty folder, run `init` then `build`, open the page: it draws.

**Acceptance Scenarios**:

1. **Given** an empty folder, **When** `init` runs, **Then** `insufferable.config.json`, `icons/` and `index.html`
   exist, and `build` succeeds with them unchanged.
2. **Given** a folder that already holds a config, **When** `init` runs, **Then** it refuses and names the file.

### Edge Cases

- A config that names nothing: builds the system's own look in the app's folder; this is allowed and documented.
- A theme present and also a light partial naming the accent: the partial wins, since it comes last.
- An icon name both in Tabler and in the app's `icons/`: the app's SVG wins, as the system's own `icons/` wins over
  Tabler today.
- The `out` folder is the system's own `dist`: refused, as today.
- The config is in a folder with spaces or non-ASCII characters: every path is resolved from the config's folder and
  quoted in messages.
- Two sources of one set defining the same token (an app's file overriding ours): the app's value wins and the
  build reports no collision; how this is arranged in the generated resolver is a research item of the plan.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The build MUST read one config file, `insufferable.config.json` by default, from which it composes a
  standard-valid resolver document and writes it beside the config, marked as generated.
- **FR-002**: The config MUST accept exactly these keys: `prefix`, `icons`, `theme`, `tokens`, `light`, `dark`,
  `resolver`, `out`; any other key MUST stop the build naming the key.
- **FR-003**: `theme` MUST take the shape `insufferable theme` takes today (brand, neutral, fonts) and the build
  MUST generate the theme files into `theme/` beside the config on every build, under the same contrast gate.
- **FR-004**: `tokens` MUST be listed after the system's base tokens so that the app's values win; `light` and
  `dark` MUST be listed in their contexts after the system's theme file and after the generated theme's.
- **FR-005**: The build MUST write, beside the config or in `out`, always in the same layout: `insufferable.css`,
  `fonts/`, every element script under `components/` with its types, every helper script with its types, and
  `icons.js` holding the icons the app ships.
- **FR-006**: The icon font's family, face file name and the icon typography token MUST be `<prefix>-icons`, and the
  build MUST write it as woff2 and as TTF.
- **FR-007**: A config naming `resolver` MUST use that resolver as it is and MUST refuse any other key but `out`.
- **FR-008**: Every token path under `ins` that an app's file defines MUST exist in the system's own tokens, else the
  build stops naming the path and the file; a path outside `ins` is the app's own and is written as a custom
  property.
- **FR-009**: `prefix` MUST match `^[a-z][a-z0-9]*$` and each icon name `^[a-z0-9]+(-[a-z0-9]+)*$`; a value that
  does not MUST stop the build naming the value and the rule.
- **FR-010**: The package's export map MUST name every element script, every helper and the stylesheet, and a test
  MUST fail when a script in `dist` has no export.
- **FR-011**: The package MUST build itself on pack, ship only what the build needs, and install from a tarball into
  an empty Node 24 project where the example config builds.
- **FR-012**: The `theme` command MUST be removed from the CLI, its work done by `build`; `init` MUST write a
  starter config, an `icons/` folder and a page, and refuse to overwrite.
- **FR-013**: The example app MUST be rewritten as a config and token files, with no hand-written resolver, and MUST
  look as it does today.
- **FR-014**: `guide.md`, `specs.md`, `decisions.md` and `CLAUDE.md` MUST describe the config, the layout, the
  checks and the font name, and no longer describe the hand-written resolver as the route.

### Key Entities

- **Config**: the app's choices, one JSON file. Keys above; every path relative to its own folder.
- **Generated resolver**: the standard document the build composes: the system's base set, the app's set, the
  theme modifier with the system's, the generated theme's and the app's files per context, and the
  `dev.insufferable` extension carrying prefix and icons. Written beside the config, never edited by hand.
- **Theme files**: the four files `insufferable theme` writes today, now under `theme/` beside the config.
- **Output layout**: the folder the page imports from; one shape for every app.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new app goes from an empty folder to a page drawn in its own colours in three commands (install,
  init, build) and a config of fifteen lines or fewer.
- **SC-002**: No app file names a path inside `node_modules`, the system's token file names, or the theme modifier.
- **SC-003**: Every mistake listed in User Story 2 stops the build with a message that contains the offending
  name; this is tested for each.
- **SC-004**: The example app rebuilt from a config is indistinguishable, in the built-in browser, from the one
  built from its resolver today.
- **SC-005**: The package installs from a tarball into an empty folder and builds the example config there, with
  no step by hand.
- **SC-006**: `pnpm build`, `pnpm typecheck` and `pnpm test` pass; the test count grows by at least one per
  functional requirement that has logic.

## Assumptions

- The W3C Resolver's `$extends` stays unimplemented in `@toghen/lib` for now; when it lands, the generated resolver
  may shrink and the config does not change.
- Publication is to npm under the name `insufferable`, which is free; the author publishes, the feature prepares.
- `@toghen/figma` 0.1.16 with the `node.get` fix is published by the author before the lockfile is cleaned; the
  FigCraft sync for an app's own library is a later feature.
- Own stylesheets through the build's PostCSS pass are a later feature; the config leaves room for a `sheets` key
  but this feature does not accept it.
- Node 24 or later, pnpm, as today.
