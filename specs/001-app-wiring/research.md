# Research: An app's wiring, from one config

## Where composition belongs: our command, not Toghen

- **Decision**: `insufferable build` composes the resolver from the config and writes it as a plain W3C Resolver
  document beside the config.
- **Rationale**: `@toghen/lib`'s guide ("Build on a base: an overlay") states the two limits that come from the
  standard: an overlay cannot add a source inside a borrowed modifier's context, and only named sets and modifiers
  can be borrowed. An app that changes a role in a scheme must therefore redeclare the whole theme modifier, which is
  the boilerplate the feature removes. The standard's `$extends` is listed as future work in the lib's specs. A
  document we write is read by every Toghen tool as it is, so the FigCraft sync for an app's library later needs
  nothing new.
- **Alternatives considered**: composing in memory and writing nothing (rejected: the sync and any Toghen tool need
  the file, and a written document can be inspected); teaching Toghen an extension of its own (rejected: the project
  is obsessed with the standard, and `$extends` is coming to the standard's own lib).

## How an app's override is arranged: its own set

- **Decision**: the app's token files form a set of their own, `app`, listed in `resolutionOrder` after the
  system's base set. The theme contexts list the system's file, the generated theme's and the app's partials in
  that order inside one context.
- **Rationale**: measured 7 November 2026 against `@toghen/lib` with the example app's resolver: a later source in
  the same set does win (the app's `ins.radius.1` of 0px is the resolved value), but `load` reports every such pair
  under `collisions`. A separate set is Toghen's own overlay pattern and reports nothing. A modifier's context has no
  such split, so the partials stay in the context, in order, and their collisions are informational. The
  generated theme's palette duplicates the system's palette file entirely (`redundant: true` on every grey); in its
  own set that is no longer a collision.
- **Alternatives considered**: merging the context's files into one generated file per scheme (rejected: a second
  generated artefact for no behaviour).

## Which token paths an app may define: `ins` must exist, the rest is the app's

- **Decision**: after `load`, every path an app file defines under the `ins` group must also be defined by a
  system file; a path outside `ins` is the app's own and passes. The check reads `result.origins`, which maps each
  collection-relative path to the files that define it in document order.
- **Rationale**: a typo in an override (`ins.radius.3`) today becomes a dead custom property and the page looks
  wrong without a word. The system's own group is the system's to name.
- **Alternatives considered**: a JSON Schema of every token (rejected: it would be generated from the tokens and
  add nothing the loader does not already know).
- **To verify in the lane**: the exact key form in `origins` (the measurement showed `palette.gray.25` for a
  top-level group; confirm how an `ins.*` path is keyed and whether the `ins` prefix is kept) and that the system's
  files are told apart from the app's by path, under the package folder.

## Theme generation inside the build

- **Decision**: `generateTheme` accepts the config object (the `theme` key) as well as a path, and writes into
  `theme/` beside the config on every build. The `theme` command is removed.
- **Rationale**: one command is the whole point; the generator is deterministic and a palette takes well under a
  second; the gate refusing stops the build, which is the behaviour wanted.
- **Alternatives considered**: generating only when the theme key changes, with a hash (rejected: a cache for a
  sub-second step).

## The icon font's name follows the prefix

- **Decision**: the face, the files and the token `ins.font.family.icon` are `<prefix>-icons`: `insufferable-icons`
  for the system. The build injects the token's value for an app as an inline source in the generated resolver's
  `app` set (an inline token tree is a valid `TokenSource`), so FigCraft reads the same name.
- **Rationale**: found 7 November 2026: Tabler's stock font, installed under the family `tabler-icons`, won over
  ours in FigCraft. Two apps built by the system on one Mac would clash the same way.
- **Alternatives considered**: one fixed name `insufferable-icons` for every app (rejected: two apps still clash).

## The TTF beside the woff2

- **Decision**: the build writes both; the TTF is `font.toArrayBuffer()` before `ttf2woff2`, one line.
- **Rationale**: a browser wants woff2; macOS and the design tools install a TTF. The ligature check in FigCraft
  needed one cut by hand.

## One output layout, always

- **Decision**: `writeCss` writes the scripts and their `.d.ts` beside the stylesheet for every app, prefix or not;
  only the system's own build writes into `dist/`.
- **Rationale**: today an app imports from `node_modules/insufferable/dist/…` until it sets a prefix or an icon
  list, then from `./components/…`. One place, always, is what straightforward means.
- **Alternatives considered**: never copying and rewriting the prefix at runtime (rejected: the stylesheet is
  static and must name the elements).

## Publication

- **Decision**: npm, name `insufferable` (free as of 7 November 2026), version 0.1.0, `prepack` builds, `files` as
  today plus `contracts/config.schema.json`. The author publishes; the lane prepares and dry-runs. `@toghen/figma`
  0.1.16 is published by the author first, then the `pnpm link` and `pnpm-workspace.yaml` go.
- **Alternatives considered**: a git URL install (rejected: pnpm refuses to build a git dependency without an
  allow line, as Toghen's own guide documents; a registry package builds nothing on install).
