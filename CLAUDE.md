# insufferable

A lean design system of UI elements for Egildo's own tools, obsessed with the platform and the W3C. Its tokens are W3C design tokens resolved by Toghen, its CSS is written with `@toghen/postcss`, its elements are TypeScript web components, and its FigCraft datasheets are built with it. It ships elements, never a store: any app manages state however it wants, and no app needs a framework to use it.

The rules are the principles in `specs.md`. Read them before changing anything. This file holds only what is not a rule.

## The docs

| Doc | What it is |
|---|---|
| `specs.md` | Why it is built this way: principles, the element contract, open questions |
| `decisions.md` | The archive: dated rulings, what was considered and rejected, what was checked, open questions |

The demo pages in `dev/` show each element; serve the folder and open `dev/index.html`, which shows them all and links each one's own page. A `guide.md` is still to come.

## Neighbours

| Where | What it is to insufferable |
|---|---|
| `/Volumes/dev/Codeberg/Toghen/lib` | `@toghen/lib`: reads and resolves the tokens |
| `/Volumes/dev/Codeberg/Toghen/postcss` | `@toghen/postcss`: writes the tokens into the stylesheet |
| `/Volumes/dev/Codeberg/Toghen/figma` | `@toghen/figma`: syncs the tokens and the component files into the FigCraft library; its `component-files.md` is the format |
| `/Volumes/dev/Codeberg/Toghen/gosfuig` | `gosfuig`: generates the palette, in OKLCH, and checks its contrast |
| `/Volumes/dev/Codeberg/Toghen/ui` | `@toghen/ui`: the sibling design system, and the nearest prior art |
| `/Volumes/dev/GitLab/aicof-design-team/sibardoc-prototype/packages/ui/figcraft` | The FigCraft build the datasheets follow |

## Commands

```sh
pnpm build       # tsc writes dist/*.js and their types, then scripts/build.mjs writes dist/insufferable.css
pnpm typecheck
pnpm test        # node:test over test/*.test.ts, with Node's own type stripping
pnpm palette     # gosfuig writes tokens/palette.tokens.json from tokens/palette.config.json
node scripts/cli.mjs build <resolver.json>   # an app's own stylesheet from its resolver; see examples/app
pnpm figcraft    # syncs the tokens and the component files into figcraft/insufferable.figcraft, headless; --dry-run to plan
python3 -m http.server   # then open http://localhost:8000/dev/index.html
```
