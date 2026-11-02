# insufferable — Decisions

The archive of insufferable's rulings: what was decided, what was considered and rejected, and what was checked. Sections are moved here whole. A status line under a heading says what has happened since. The current design is in [specs.md](./specs.md).

## The element contract

> **Ruled 27 October 2026.** The contract is in [specs.md](./specs.md#the-element-contract). Tabs is the first element built on it.

### The question

insufferable's elements send commands with the Invoker Commands API, and are styled by their ARIA states. Who owns those states: the design system, the app, or the platform?

### Considered and rejected

- **A store inside insufferable.** One immutable state and a reducer that changes it only through commands, in the manner of The Elm Architecture. Rejected: insufferable ships UI elements. An app manages its state however it wants; what insufferable removes is the need for a framework.
- **The app's store owns every state, the platform's included.** Only custom commands, and the app's render opens and closes dialogs and popovers. Rejected: the platform closes a popover on Escape or a click outside without asking anyone, so the store would hold a state that is no longer true.

### The ruling

Attributes in, commands out. The element applies its own default unless the app cancels it. State the platform already holds stays with the platform.

The prior art:

- **Data down, actions up,** the rule Ember named: state flows into a component, intent flows out of it.
- **Controlled and uncontrolled** components, as React calls them. Here the same element is both, and the app chooses by cancelling the event or not.
- **The Elm Architecture.** An app that wants it writes its update in one root listener; insufferable does not need to know.

### What was checked

The ruling depends on one app being able to hear every command, although the `command` event does not bubble. Checked in the browser on 27 October 2026, with a page holding one button whose `commandfor` names its parent, a capture listener and a bubble listener on `document`, and a listener on the target. The button was clicked twice, the second time with the capture listener cancelling the event. What the page printed:

```
root capture: --select two bubbles=false cancelable=true
target: defaultPrevented=false
root capture: --select two bubbles=false cancelable=true
target: defaultPrevented=true
```

The capture listener on `document` hears the command before the target. The bubble listener hears nothing. Cancelling in the capture phase reaches the target as `defaultPrevented`.

## The first element: tabs

> **Built 27 October 2026.** The element is in [specs.md](./specs.md#tabs).

### Why tabs first

Tabs test every part of the contract at once: a state in an ARIA attribute (`aria-selected`), a command per tab, a roving focus, and a keyboard whose choices must reach the app.

### What the build settled

- **The keyboard goes through the command.** An arrow key focuses the next tab and clicks it, so its choice is a `--select` like a click's. An app that owns the state owns the keyboard's choices too, with no second path to cancel.
- **The element renders from attributes, its own default included.** The default only writes `aria-selected`; one function writes the panels and the tab stop from it. An app that writes `aria-selected` itself gets the same result, which a mutation observer follows.
- **A tab marked `aria-disabled` still sends its command.** The default ignores it. The app hears it, and may decide otherwise. A tab marked `disabled` sends nothing: the platform blocks it.
- **The panels are linked by `aria-controls`,** the ARIA attribute that means it, so they sit anywhere in the page. The Authoring Practices keep them out of the tab list.

Skipped until a tool needs them: manual activation, a vertical tab list, a dark theme.

### What was checked

In the built-in browser, on `dev/tabs.html`, with real clicks and keys. The uncontrolled list selected Pear on a click, ignored Plum (`aria-disabled`), and on the right arrow from Pear passed over Fig (`disabled`) and Plum to Quince. The controlled list, whose app cancels every command and refuses Lichen, selected Star, refused Lichen on a click, and refused it again on the right arrow from Star, with the focus on Lichen and Star still selected. The root listener heard all eight commands. `pnpm test` passes the keyboard's five cases.

## The first command: `--select`

> **Ruled 27 October 2026,** as proposed below. The rule is in [specs.md](./specs.md#commands).

### The rule

A command is named after the ARIA state it sets, as a verb: `aria-selected` gives `--select`. Further commands would follow: `aria-expanded` gives `--expand`, `aria-pressed` gives `--press`, `aria-checked` gives `--check`.

### Considered

- **A prefix, as `--ins-select`.** Rejected for now: a command always reaches one target, and the app's root listener tells the elements apart by `event.target`. The platform's own commands, such as `show-modal`, carry no prefix.
- **Naming the action, as `--choose` or `--activate`.** Rejected: the state's own word ties the command to the attribute it changes, which is the one thing the app has to write when it cancels.

### Open

A command that toggles, as a disclosure does, sets `aria-expanded` to either value. Whether that is `--expand` carrying the value in the control's `value`, or `--toggle`, waits for the first element that needs it.

## The disclosure is the native `details`

> **Built 27 October 2026.** The element is in [specs.md](./specs.md#disclosure).

### The question

The disclosure was chosen to settle whether a command that sets `aria-expanded` is `--expand` or `--toggle`.

### What the build found

The platform already has the disclosure: `<details>` and `<summary>`. It opens and closes without script, keeps one open in a group that shares a `name`, and tells the page with a `toggle` event. Whether it is open is state the platform holds, so by the contract it stays with the platform: no custom element and no command. The Invoker Commands API has no command for a details, and its `toggle` event cannot be cancelled, so an app could not own that state anyway.

So the question is not settled, only narrowed. It comes back with a disclosure the platform cannot draw: a button with `aria-expanded` showing a region outside it, such as a menu button. That element will need a custom element and a command.

### What the build added

- **A `disclosure` axis in the vocabulary,** `open`, spelled `[open]`. It sits after `selection` and before `pointer`, so the pointer, the focus and availability still win over it.
- **A guard in the build.** An `@apply` of a mixin that does not exist was left in the stylesheet without a word, which the first try at the disclosure's tokens showed. The build now fails when an `@apply` or an `@toghen` directive is left.

### What was checked

In the built-in browser, on `dev/disclosure.html`. Opening Star in the group closed Peat; a click opened the quince and Enter closed it. One capture listener at the root logged all four `toggle` events: Star open, Peat closed, the quince open, then closed.

## A native element is styled by its element name

> **Ruled 27 October 2026.** The principle is in [specs.md](./specs.md#principles).

### The question

The disclosure is a native `details`. How does the stylesheet name it: by the element name, or by a class on it?

### Considered

- **A class on each native element,** as `@toghen/ui` does with `tg-` classes. The design system reaches only the elements marked for it. Rejected: the class says nothing the element name does not, and insufferable's HTML is meant to stay bare.
- **The element name, in the components layer.** The classless approach, as Pico CSS takes it. Ruled: the markup is plain HTML, and the layer keeps the design system below any rule of the app's.

### What it costs

Every `details` on a page that loads the stylesheet takes the design system's look, whether the app meant it or not. An app that wants a bare one writes its own unlayered rule, which wins over the layer.

## The icon and the text styles

> **Built 27 October 2026.** The element is in [specs.md](./specs.md#icon), the text styles in [specs.md](./specs.md#typography).
>
> **Superseded the same day for the icon font:** Material Symbols and its ligatures gave way to Tabler Icons, subset by the build. See [Tabler Icons, subset on build](#tabler-icons-subset-on-build).

### The icon draws from a ligature font

An icon is the word for it, in a font that draws the word as one glyph. The markup carries the icon's name and nothing else: no table from names to code points, no class per icon, no script to draw it. Considered and rejected: a font reached by code points through a class per icon, as `@toghen/ui` does with Phosphor, which needs a class or a map for every icon; and inline SVG, which is not a font.

The face is Material Symbols Outlined: Apache 2.0, drawn by ligatures, a variable font, and of the family `sibardoc-prototype` already uses in its Sharp cut. It is installed from npm (`material-symbols`) and copied beside the stylesheet by the build.

### Why the icon is a custom element

It draws without script. The script says what it means: an image with a name when the page gives one, decoration otherwise, and in both cases kept from translation. Without it a screen reader would read every icon's name aloud. That is the script principle 4 asks for.

### The text styles are W3C typography tokens

Each style is one `typography` token whose members refer to primitives. A component reads the style whole, as its `font`, so changing a style changes every component that reads it. Tabs and the disclosure, which read family, size and weight one by one, now read `ins.typography.label`.

### What was checked

In the built-in browser, on `dev/icon.html`. Six glyphs drew from the font, one tinted by the colour around it; the font reported loaded. Each icon is 20 by 20 pixels. The one with `aria-label` became `role="img"`; the others `aria-hidden="true"`; all `translate="no"`. Inside a tab and a summary the icons first sat above the text: a box that clips takes its bottom edge as its baseline. `vertical-align: middle` set them on the text.

### Not done

The font is not subset: 4 MB for every icon and every axis. The axes are not tokens.

## The house fonts

> **Built and ruled 27 October 2026.** The fonts are in [specs.md](./specs.md#the-house-fonts).

Archivo is the house sans and Fraunces the house serif, both variable. Archivo sets the page and every control's label; Fraunces sets the display style, read by a top heading. Which font serves which style was ruled the same day, as built.

Both come from Fontsource's npm packages, with every axis each font has, in normal and italic. Fontsource splits each into Latin, Latin Extended and Vietnamese files under `unicode-range`, so a page downloads only what its text uses. The build copies Fontsource's face rules into the stylesheet, renamed from "Archivo Variable" and "Fraunces Variable" to the families' own names, so the tokens name the families as a designer would.

With fonts to set, the stylesheet gained a base layer, between the tokens and the components: the page in the body style, a top heading in the display style.

### What was checked

In the built-in browser, on `dev/type.html`: the page reported Archivo and the heading Fraunces. Italics and the width axis drew. Of the twelve face rules, only the ones whose text appeared loaded: Archivo's Latin Extended and Vietnamese files only for the line written in those letters.

## Tabler Icons, subset on build

> **Built 27 October 2026.** The element is in [specs.md](./specs.md#icon).

Asked for: Tabler Icons as a dependency, subset by the build.

### Ligatures and subsetting do not mix

Tabler's font carries ligatures, as Material Symbols does: the word "home" in it draws the icon. A subset cannot keep them. A ligature is reached through the letters that spell it, so a subset that keeps the letters keeps every ligature they spell, which is nearly all 5,000 icons; one that drops the letters loses every ligature. So the subset keeps each shipped icon's own character, and the name moved from the element's text to its `name` attribute, which the stylesheet reads.

The cost: an icon's name is no longer the text inside it, and an icon not in the list draws an empty box. The element warns in the console about one.

### The list of icons

`src/icons.ts` is the list, in TypeScript so an app can import the names and their type. The build reads each character from Tabler's own stylesheet, so there is no copy of Tabler's map to keep up, and a name Tabler lacks fails the build. The subset is made by `subset-font`, HarfBuzz's subsetter compiled to WebAssembly, so the build needs no Python and no native tool.

Material Symbols is removed: its 4 MB variable font could not be subset by name for the same reason.

### What was checked

The build wrote a 1.8 KB font for eight icons, from Tabler's 495 KB. In the built-in browser, on `dev/icon.html`, all nine icons on the page drew from it, inside a tab and a summary too; the labelled one became `role="img"` and the others `aria-hidden="true"`.

## The FigCraft datasheets

> **Ruled 28 October 2026,** as proposed below. **The library built the same day,** by a different road than ruled: see [What the build found](#what-the-build-found). It is saved in `figcraft/insufferable.figcraft`. The datasheets are not built.

### How sibardoc-prototype builds them

Two builds, both into the FigCraft app through its control port. A library, `sibardoc-ui.figcraft`: a page of tokens and a page of components, each component a set of variants laid out as a grid. Then a datasheet per component, saved beside its code, made of instances of that library and of a second one, the bench's, which gives the datasheet its look. A component's source is its component file (`.component.kdl`), Toghen's format for a component as variants, expanded by Toghen's own reader as the Figma sync expands it. The datasheet's prose is the component's `.md`, its drawing an `.anatomy.kdl`, its specifications the component's tokens. Small scripts lay the sets out after the import.

### What carries over

- **The variables come from the resolver,** through `@toghen/lib`, where sibardoc reads them back out of its CSS: one collection with one mode while there are no themes, and the four text styles from the typography tokens.
- **One component file per element,** read by `@toghen/figma`'s reader: tabs in its states, the disclosure closed and open, the icon in the shipped icons.
- **sibardoc's layout steps are copied,** the grid, the sections, the relayout and the instance sizing. Its generator is mostly its own token pages, so insufferable writes a short one.
- **The icon is a text in Tabler Icons,** its character the one the build already reads.

### The ruling

- **The library first, then the datasheets.** A datasheet places the library's instances.
- **The datasheet wears insufferable's own look.** One library, not a second one for the datasheet: the datasheet uses the system it documents.
- **Its prose is the element's section of specs.md.** No `.md` per element: one source.
- **A command of its own, `pnpm figcraft`.** It needs the app open, so `pnpm build` stays as it is.
- **The fonts are installed on the Mac,** since FigCraft draws only installed fonts: Archivo is, Fraunces and Tabler Icons are to be installed by hand.

### Parked

sibardoc's layout steps now live in two repositories. A shared home, in Toghen or in the figcraft skill, waits until a third needs them.

### What the build found

- **Toghen syncs into FigCraft itself.** `toghen-figma sync`, from `@toghen/figma`, writes the variables, the text styles and a set per component file straight into a `.figcraft` file. sibardoc's library predates it. So nothing of sibardoc's is copied, and the parked question above is moot for insufferable.
- **It runs with no app open,** through `figcraft-cli`. `pnpm figcraft` stays apart from `pnpm build` as ruled, but no longer because it needs the app. Folding it into `pnpm build` is open.
- **The component files sit beside the elements,** `src/components/*.component.kdl`: Tab, Tabs and Disclosure. Icon's is written by `scripts/figcraft.mjs` from `src/icons.ts` into `figcraft/out/`, so the list of icons stays one list.
- **A part axis is a collection of modes.** Selection, pointer, focus, availability and disclosure each became a collection with a mode per part; the tokens sit in one collection, `insufferable`. Tab has sixteen members, one per combination.
- **The tab's outline is its outer frame.** The stylesheet draws the outline inside the box, always, clear at rest. The component does the same: an outer frame whose stroke is the outline's colour, around the face that is the button.
- **Toghen makes a text style for every typography token,** the aliases included: `ins/page/font`, `ins/tabs/tab/font` and `ins/disclosure/summary/font` beside the styles they name.

Not drawn: the summary's hover and focus, since a component takes its axes from its own group's parts and those are the summary's; and the tab's line sitting over the strip's line, a negative margin in the stylesheet.

### What was checked

Built headless into a scratch file and rendered with `figcraft-cli`: the disclosure closed and open, the tab's sixteen members with the selected line, the hover and disabled colours and the focus outline, and the strip of three tabs with Apple selected. `get_node` on the strip read its line bound to the line colour and the border width. The real file stopped at Icon, whose text style cannot be made with Tabler Icons not installed; a run that stops saves nothing.

With Fraunces and Tabler's font installed, the icon style was still skipped: the installed font calls itself `tabler-icons`, as Tabler's own stylesheet does, and the token said "Tabler Icons", a name the build had given the face. The token and the face now say `tabler-icons`, as the house fonts go by their own names. The run then built all four sets and nine text styles, and saved the file. Rendered, Icon's eight members drew their glyphs. A second run planned nothing but the four text styles whose weight Toghen writes every time, since FigCraft cannot bind a weight.


## The four native elements

> **Built 28 October 2026:** button, field, checkbox and radio and switch, and dialog. All four are native elements styled by name in the components layer, with no script and no command. Their specs are in specs.md.

### What was chosen, and why

- **Native first, all the way.** The checkbox and radio button stay the platform's, coloured with `accent-color`: the keyboard, the forced-colours mode and the platform's own look come free. Only the switch is drawn, because no browser but Safari draws one, and Safari only from its own `switch` attribute.
- **The switch is the input alone.** `appearance: none`, the track its background, the thumb a radial gradient in `currentColor`. No pseudo-element, which an input does not reliably take, and no wrapper. `role="switch"` both means it and draws it, as principle 3 asks.
- **`@scope (:root) to (ins-tabs)` keeps the button rule out of the tab list.** A tab is a `<button>`; a plain `button` rule would have reached it with a radius and a minimum height the tab would have had to undo. Rejected: `button:not(ins-tabs > button)`, whose `:not()` weighs as much as its argument and would have beaten the tab's rule. `@scope` reached the last engine with Firefox 146, by my reading; it was checked here in the built-in browser only.
- **Invalid is `:user-invalid`.** It waits until the person has changed the field and left it, so a required field is not red on arrival. `aria-invalid="true"` covers what the app decides.
- **The selection axis now reads `:checked` too:** `:is([aria-selected='true'], :checked)`, since a checkbox's checked is the same state as a tab's selected. Two new axes: `variant`, first, and `validity`.
- **A control's edge is `lineStrong`,** #8a8a8a, 3.4:1 on white. The old line, #e0e0e0, is 1.3:1, under the 3:1 WCAG asks of a control's boundary; it stays for dividers and disabled edges.
- **The dialog keeps the platform's state.** It opens on `command="show-modal"` and closes on `close` or Escape, as the ruling on what the platform keeps says. Its width is a token, `ins.size.measure`, and the browser's own `max-width` keeps it inside a narrow window.
- **The tick is Tabler's `check`,** added to the shipped icons for the FigCraft checkbox, and useful beside a menu item later.

### What the build found

- **A variant's states keep their own variables.** The button's `variant` axis folds into a collection, but its hover and disabled stay in the path, since `solid.hover` holds a value with nothing at `hover` to fold into. The plan said so. It first refused to fold `variant` at all, until `button.hover.borderColor` gave `solid.hover.borderColor` a rest value.
- **A text whose colour stays in the path must bind the group.** Since 0.1.11, Toghen warns of a token named outright that a member's part replaces. The button's label first named `{ins.button.color}` outright, so the disabled members kept black text. Bound with `tokens="{ins.button}"`, it follows each member's part.
- **That border then leaked into CSS.** `button.hover.borderColor` reached the plain button under the pointer, in the browser too; `plain.hover` now clears it.
- **A part axis makes no guard.** The switch needs `guard selected { is (input)selection selected }` written out to move its thumb. Reported, with the next finding's mirror, as two issues on Codeberg, Toghen/figma; both fixed in `@toghen/figma` 0.1.11. On 29 October 2026 insufferable moved to it: the switch now says `guard selected` alone and Toghen supplies the body. The check read the nine component files with no error and no warning, the switch built the same members (the thumb at the end in its four selected ones), and the library synced with nothing changed.
- **The outline sits outside the button,** so in FigCraft the ring is an outer frame padded by the outline's width and offset (`space.1`). A member is 8px wider and taller than the button it draws.

Not drawn in FigCraft: the placeholder, the select and the textarea; a disabled checkbox; the switch right to left; the dialog's shade. No component for a label beside its checkbox.

### What was checked

In the built-in browser: each button 36px tall, the solid one in the accent, the disabled ones grey; a tab next to them kept its square corners and no border. On `dev/field.html`, the email field turned red only after "nope" was typed and the focus left it, and the focus ring drew around the next field. The checkboxes, radio buttons and switches drew checked, unchecked and disabled, and the right-to-left switch mirrored. The dialog opened on its button's command over the shade, and Escape closed it, which the page heard at the root.

`pnpm figcraft` built Button (24 members), Checkbox (8), Switch (8), Field (8) and Dialog (1), whose buttons are instances of Button, and saved the file. Each set was exported and looked at. `pnpm typecheck` and `pnpm test` pass.

## The shape of the tokens

> **Ruled 29 October 2026,** as proposed below, in three steps, each checked before the next: the split, the palette, the theme. Toghen's own checker passed the tokens before any of it: no holes, no collisions.

The tokens were well formed but not well shaped: one file held the vocabulary, the primitives, the colours and every element; the colours were bare hex values; and there was no modifier, so a dark theme had nowhere to go.

### The ruling

1. **One file per concern, in one set,** as Toghen's running example lays them out: the vocabulary, the scales, the type, the colour roles, and one file per element. No value changes, and the resolved tokens are compared before and after.
2. **A palette under the colours.** gosfuig generates a grey, a blue and a red family from `tokens/palette.config.json` into `tokens/palette.tokens.json`, with its own command, `pnpm palette`; the output is checked in. White and black sit beside them. Each colour role refers to a step instead of holding a hex value, and keeps its name. The colours move to their nearest step; a table of every role's old and new colour and the contrast it must keep comes before the move.
3. **A `theme` modifier holds the colour roles,** with one context, `light`, the default, spelled `[data-theme='{context}']`. As `@toghen/ui` does it, and not as the running example does: there the roles sit in the base and a dark context overrides some of them, so a role a dark file forgets keeps its light value without a word. With every context a whole file, a missing role is a hole `toghen-query check` reports.

### Considered and rejected

- **The palette under `ins`.** gosfuig flattens a dotted prefix, `ins.palette`, into `ins-palette`. The palette is a top-level group, `palette`, beside `ins`.
- **gosfuig inside `pnpm build`.** The palette changes rarely, and shaping its curves is design work; its output is checked in like any token file.

### What was checked

**The split, 29 October 2026.** `base.tokens.json` became twelve files, read in this order: vocabulary, scales, type, theme.light (the colour roles, still in the base set until the theme step), page, then one per element (`choice` holds the label beside a checkbox, the checkbox and the switch; `field` holds the label above a field). Every token's written value, resolved value, type and description, and the vocabulary each of the 54 groups sees, were listed before and after through `@toghen/lib`: identical, 174 tokens. `toghen-query check` found nothing. The stylesheet's rules are identical; 44 lines of the token layer changed order, which custom properties do not care about. `pnpm figcraft --dry-run` planned no change but the four text-style weights it writes every run.

**The palette, drafted.** `tokens/palette.config.json`: a grey family with no chroma, blue and red pinned at step 600 to today's accent and danger. Each role moved to its nearest step in OKLab, every contrast pair checked; the table was shown before the move. The greys' default ramp leaves a gap at the light end, `gray.25` #f8f8f8 to `gray.50` #e3e3e3, so the fill under the pointer would get lighter. The greys were then tuned: a lightness ramp from 0.97 to 0.22, gamma 1.4, S-curve 0.2, chosen by a search over gosfuig's own ramp for the curve whose steps land nearest today's six greys while text.2 keeps 4.5:1 and lineStrong 3:1. Its steps run #f5f5f5, #eeeeee, #e0e0e0, #cfcfcf, #b9b9b9, #a1a1a1, #888888, #6e6e6e, #575757, #414141, #2d2d2d, #1b1b1b; every grey moves by at most 3 in each channel, the line lands exactly, and gosfuig's own check for the family passes (700 on 200, 4.64).


**The palette, moved, 29 October 2026.** `gosfuig` 0.2.0 is a dev dependency; `pnpm palette` writes `tokens/palette.tokens.json`, read second in the set, after the vocabulary. Its colours are W3C colour objects in OKLCH with a hex fallback, not the hex strings its `--srgb` mode writes, which the format does not allow; the stylesheet writes them as hex. Nine roles now refer to a step, as tabled. Not as ruled: white and black do not sit beside the families. Black would serve only the shade, which needs an opacity a reference cannot give; white is two roles' value, kept there with `clear` and `shade`. `toghen-query check` found nothing. Every role resolves to its tabled value, and the demo pages draw them (`getComputedStyle`: text #1b1b1b, a control's edge #888888, the line #e0e0e0). `pnpm figcraft` made the 36 steps variables and the roles their aliases, and a second run planned nothing; the button set renders as before. gosfuig's own check fails the blue and the red (700 on 200, 4.33 and 4.49), pairs insufferable does not use.


**The theme, refused, 29 October 2026.** With the roles moved into a `theme` modifier whose one context is `light`, `@toghen/lib` refused the document: `Modifier "theme" has only one context, which is equivalent to a set. Use a set instead, or add more contexts.` Its code cites the W3C Resolver: a tool must throw on a modifier of one context. So step 3 as ruled breaks the standard. The resolver went back to step 2's shape, the roles in the base set, and the tokens and the stylesheet were checked identical to step 2's. The roles move into the modifier together with a second context, `dark`; `theme.light.tokens.json` is already the whole file a context needs. Done with the dark theme, below.

### Open

- **The greys' curves.** gosfuig's default grey came out tinted and steep. Settled by the search above; the studio can still reshape them by eye.
- **`color-scheme`.** Settled with the dark theme: the page says `color-scheme: light dark`, in `base.css`.

## The dark theme

> **Ruled 29 October 2026,** as proposed below. It brings the `theme` modifier the shape of the tokens waited for: two contexts, `light` the default and `dark`, each a whole file of the colour roles.

### The ruling

- **The system chooses.** The theme follows the platform's own signal, `prefers-color-scheme`, spelled `@media (prefers-color-scheme: {context})`, whose two values are the contexts' names. No script, and the platform's controls already follow it. Rejected for now: `[data-theme='dark']`, which lets an app offer its own switch but leaves a page that sets nothing light. `@toghen/postcss` takes one spelling per context, so it is one or the other.
- **`color-scheme: light dark`** on the page, in `base.css`, so the platform draws its checkboxes, radio buttons, the select's list and the scrollbars in the theme. Written as CSS: the W3C format has no type for it.
- **Every dark role is a palette step,** no new colour. The page is `gray.950`, today's text; the text `gray.50`. The accent lightens to `blue.400` and the text on it turns dark, `gray.950`: at `blue.600` the accent as text, a summary under the pointer, would be 3.26:1 on the dark page. The shade deepens to black at 60%.

| Role | Light | Dark |
|---|---|---|
| `surface` | white | `gray.950` |
| `text.1` · `2` · `3` | `gray.950` · `600` · `400` | `gray.50` · `400` · `600` |
| `fill` | `gray.50` | `gray.900` |
| `line` · `lineStrong` | `gray.100` · `500` | `gray.800` · `500` |
| `accent` · `accentStrong` | `blue.600` · `700` | `blue.400` · `300` |
| `onAccent` | white | `gray.950` |
| `danger` | `red.600` | `red.400` |
| `shade` | black at 40% | black at 60% |

Every contrast pair that must hold holds in both: text 14.85 on the dark page, quieter text 6.67, a control's edge 4.86, the accent 5.77 as a ring, as text and under its own text, the danger's edge 5.40.

### Left for later

- **A raised surface.** In dark a dialog has the page's own colour; the shade and its border set it apart. A lighter `raised` role would be a role of its own.
- **The switch's thumb** takes the page's colour, so it is dark in dark.

### What was checked

`toghen-query` reads the theme with two modes, light the default, and finds no hole: both files hold all thirteen roles. Every token's value in light is the same as before the theme, by the same listing as the split's. The stylesheet's rules are unchanged but for `color-scheme: light dark` on the page; the token layer gained a block per context under `@media (prefers-color-scheme: …)`, which grew the sheet from 33.3 to 41.2 KB, since each block repeats every token that reads a role, not only the roles. In the built-in browser with the scheme emulated dark: the page #1b1b1b, its text #eeeeee, a control's edge #888888, the solid button #519adf with #1b1b1b text, the tab strip's line #414141; the platform drew the checkboxes, radio buttons and select dark. Emulated light, the values are the light ones.

In FigCraft the roles moved from the `insufferable` collection into a `theme` collection with two modes. The sync refused the move until told `--allow-breaking`, since it removes the old variables; only the library's own components bound them, and the sync rebound them (the checkbox, which names roles outright, took 15 steps). The file was copied aside first. A second run planned nothing. A copy with the page set to dark rendered the button, field, switch and dialog sets in the dark roles.

## Links

> **Ruled 29 October 2026,** as proposed: the native `a` with an `href`, matched by `:any-link`, in the accent and always underlined; under the pointer the strong accent and a 2px line; focus the button's ring; no colour of its own for visited.

### Why always underlined

In dark the accent is 2.57:1 against the body text, under the 3:1 at which WCAG lets colour alone mark a link; in light it is 3.26:1. The line is the mark in both, and the hover thickens it so that change is not carried by colour alone. On the page the link is 5.28:1 in light and 5.77:1 in dark, 7.88 and 7.51 under the pointer.

### The tokens

`ins.link`, in `tokens/link.tokens.json`, read after the page: `color`, `textDecorationThickness` (`border.1`, `border.2` under the pointer), `textUnderlineOffset` (`border.outset`, 2px: a gap clear of an edge, as an outline's offset is), and the outline's three keys. No new colour and no new primitive.

### What was checked

`toghen-query` finds no hole, and under `pointer=hover` the colour and the thickness are the hover's. In the built-in browser, light: a link #0a6fb8, underlined, 1px at 2px from the text; under the pointer #00548f and 2px; tabbed to, the accent ring 2px outside; an `a` with no `href` kept the text's colour and no line. Dark: a link #519adf, underlined, beside text #eeeeee.

### What the build found

- **A text style also sets the underline,** so Toghen refuses `textStyle` beside `textDecoration` on one text. The Link's label takes the body's family, size, weight and line height member by member instead.
- **The underline does not reach FigCraft.** Toghen plans `textDecoration` on each of the four members, writes it, stamps it, and plans it again on the next run; the file holds no underline, and the render draws none. FigCraft 0.10.0 takes `textDecoration` from `node.set` in a scratch copy, in either spelling, and keeps it through later writes of the font, the size, the line height, the characters and the fill. So the fault is on Toghen's side of the FigCraft write, `@toghen/figma` 0.1.11. Until it is fixed, the Link is drawn without its line, and every sync patches its four members. Reported on Codeberg, Toghen/figma, the same day. Fixed in `@toghen/figma` 0.1.13: the FigCraft writer mapped a text's alignments, case and decoration but never wrote them. With 0.1.14 the Link draws its line, and a second run plans nothing.
- **Not drawn in FigCraft:** the line's thickness and offset, which a component file cannot bind, so the hover's thicker line neither.

## Divider, table, callout

> **Built 29 October 2026,** as proposed: three elements with no script and no command. Their specs are in specs.md.

### What was chosen, and why

- **The divider is `hr`, the table is `table`,** styled by element name, as every native element is.
- **The callout is styled by its role,** `role="note"` or `role="alert"`, since no element means it: `<aside>` is a complementary landmark, and a page with three notes would have three landmarks. The role is both what it means and what draws it, as principle 3 asks. Its kind is a variant, so `danger` joins the `variant` axis.
- **Two roles, `accentTint` and `dangerTint`.** On `blue.50` in light a link is 4.26:1 and the quieter text 4.12:1, under 4.5; on `blue.25` they are 4.99 and 4.82, so the tints are the palest steps, and the bar at the start does the marking. In dark, `blue.900` and `red.900`, where the link is 5.16 and 5.31.
- **The header cell is a group of its own beside the cell's,** `ins.table.header`, not a part: being a header is what the cell is, not a state it enters. In CSS a `th` reads the cell's mixin and then the header's.

### What was checked

`toghen-query` finds no hole, and the danger callout's ground in dark resolves to `red.900`. In headless Chrome, the overview page in light and in dark: the divider, the table with its quieter header over a stronger line, the two callouts. In the built-in browser: the alert appeared on Save, in the danger; a header cell is `text.2` over `lineStrong`, a data cell `text.1` over `line`, both with 12px at the start; a right-to-left table puts its first cell at the right.

In FigCraft: Divider (one member), Callout (rest and danger), TableCell (cell and header) and Table, a header row and two rows of TableCell instances. The table cell takes its kind's group through the axis, `{ins.table.(input)kind.color}`. Each set was rendered and looked at.

## The menu

> **Ruled 29 October 2026,** as proposed: `<ins-menu popover>`, opened by a button's `command="toggle-popover"`; the element adds the roles, the keyboard and the closing after a choice, and sends no command of its own. A raised surface comes with it.

### The ruling

- **Open is the platform's.** The menu is a popover, opened and closed by the platform's own commands, light-dismissed, its focus returned to its button; the platform exposes the button as expanded. An app that wants to know listens for `toggle`, and one that wants to refuse an opening cancels `beforetoggle`. So the menu sends no `--expand` or `--toggle`: the question that waited for it stays open, for a disclosure that is not a popover.
- **The items are buttons,** each sending what its author gives it. The element closes the menu once an item has been chosen, after the item's own command.
- **The element writes** `role="menu"`, `role="menuitem"` on each button, and a label from the button that opens it.
- **The keyboard,** after the WAI-ARIA menu button pattern: on the button, Down opens on the first item and Up on the last; in the menu, Up and Down move and wrap and pass over a disabled item, Home and End go to the ends, Tab closes and moves on, Escape closes (the platform's).
- **Placed by CSS anchor positioning,** under its button, flipping above when there is no room; the button that opens a popover is its anchor. Without anchor positioning the menu opens where the browser puts a popover, in the middle of the window.
- **A raised surface,** `ins.color.raised`: white in light, `gray.900` in dark, for the menu and the dialog. In light a shadow sets it off the page; in dark the lighter ground does, and the shadow's colour is clear.
- **An item** is a plain button across the menu, in the label style. Under the pointer the fill; focused, the accent ring drawn inside, as a tab's is: the fill alone is 1.16:1 against the menu, under the 3:1 a focus indicator wants.

Not built: checkbox and radio items, submenus, finding an item by its first letter. Open UI's proposed menu elements would replace the element if they ship.

### What was checked

`toghen-query` finds no hole; the raised shadow resolves to black at 12% in light. In the built-in browser, light: a click opened the menu 4px under its button, at its start, `role="menu"` labelled by the button, each item a `menuitem`, the shadow drawn. From the button Down opened it on Cut and Up on Select all; Down twice from Cut passed over the disabled Paste to Select all; Enter on it sent `--select-all` to the editor, closed the menu and gave focus back to Edit, all heard at the root; Tab from inside closed it and moved to the button after Edit. Dark: the menu `#2d2d2d` over the page `#1b1b1b`, the focused item ringed in `#519adf`. The first click of a session left focus on the button; a second, and a click from script, landed on Cut: the pane taking focus on its first click, as far as was seen. `pnpm test` adds the vertical walk, six pass.

In FigCraft: MenuItem, eight members over pointer, focus and availability, its ring the item's own stroke; Menu, two items, a separator, a disabled one and a last, on the raised surface with the raised shadow as an effect. Rendered in light and, from a copy set to dark, in dark. The shadow falls outside the set's bounds, so the export does not show it. The Icon set gained `chevron-down`.

## The segmented control and the toolbar

> **Ruled 29 October 2026,** as proposed: the segmented control is a native radio group styled as segments, with no script and no command; `<ins-toolbar>` holds toggle buttons and brings the second command, `--press`.

### The ruling

- **A segmented control is a radio group.** Choosing one of a few is what radio buttons mean, so the platform gives one choice, the arrows, one tab stop, the form's value and `change`. `fieldset[data-variant="segmented"]`: each label a segment, its circle hidden, the checked one read by `:has(> input:checked)`. No custom element, no command: checked is the platform's state, as a checkbox's.
- **A toolbar sends `--press`.** A button with `aria-pressed` is a toggle; the toolbar wires it to send `--press` to itself, and unless the app cancels, flips `aria-pressed`. One tab stop, the arrows walk it after the WAI-ARIA toolbar pattern, and moving does not press. Plain buttons in it are left alone.
- **`pressed` is a value of the selection axis,** spelled `[aria-pressed=true]`, so any toggle button, in a toolbar or not, takes its look from `ins.button.pressed`.

### Not as proposed

- **The pressed and checked looks are the accent.** Proposed: a pressed button in the fill with the strong accent's text, a checked segment on the raised ground with a stronger line. The fill against the page is 1.16:1, and WCAG wants 3:1 of what shows a state (1.4.11). Both now take the accent's ground and the text on it, 5.28:1 against the page in light and 5.77:1 in dark, as a solid button does; under the pointer the strong accent.

### What the build found

- **A variant value shares its name with every group.** `segmented` as a value of the variant axis made `ins.segmented` the "segmented" part of `ins`, so Toghen took `ins` for a component and SegmentedOption lost its axes; the sync stopped and saved nothing. The model says it: part keys and child keys share one namespace. The control's selector, `fieldset[data-variant=segmented]`, is the stylesheet's own and needs no vocabulary value, so it has none.
- **Pressed moved the button's colours.** With `selection` now an axis of the button, the button's rest colours fold into a `selection` collection: five variables moved from `variant`, and the Button set was rebuilt, 48 members for 24. The sync needed `--allow-breaking`; the file was copied aside first, and only the library's own sets bound them.
- **The toolbar's buttons are not made plain by the toolbar.** Proposed as "the plain button variant", it is the author's `data-variant="plain"`: an element writes roles and wiring, not looks.
- **The legend is hidden.** A fieldset's border breaks around its legend; the segmented control's border is the fieldset's, so the legend is visually hidden and still names the group.

### What was checked

`toghen-query` finds no hole; under `variant=plain, selection=pressed, pointer=hover` the button takes `pressed.hover`, and a checked segment under the pointer `selected.hover`. In the built-in browser: the segmented control, a click on Grid and Left back to List, the form's value logged each time; the checked segment `#0a6fb8` with white text, the disabled one grey, the ring around the group, the corners clipped; right to left, the first segment at the right. The toolbar: one tab stop, `--press` wired on the three toggles and not on Clear; a click pressed Bold; Right twice from Bold passed over the disabled Underline to Clear; Left and Space turned Italic over; in the controlled toolbar the app's refusal kept Strike unpressed; every `--press` heard at the root. `pnpm typecheck` and `pnpm test` pass.

In FigCraft: SegmentedOption (8 members), Segmented (rest and focus), Toolbar of Button instances, and the Button set rebuilt with its selection axis. Rendered; a second run planned nothing but the Link's underline.

## The listbox

> **Ruled 29 October 2026:** the native `<select>` with `size` above 1 or `multiple`, styled; no element and no command. Rejected for now: `<ins-listbox>` reusing `--select`, whose only gain is options holding more than text.

### What the build found

- **`size` counts the platform's rows.** In Chrome's customizable select the list was 120px for five rows of 24px, and the field's padding and border-box sizing hid the last. An option has no block padding, and the list measures its content box: five rows then end exactly at the list's inner edge.
- **In the customizable list, options take focus.** Down after a click moved focus from Pear past the disabled Fig to Quince and left the choice on Pear; Space chose Quince. The platform's own behaviour, kept. The focused option had the platform's thin outline; it now takes the house ring inside, in the text on the accent when chosen.
- **Toghen 0.1.11's new warning caught the ring.** The option's ring named its rest colour outright, which the focused members replace. A stroke cannot bind a group, so the focused members name it through `guard focus`, the one-word guard 0.1.11 supplies; selection folds into its modes, so a chosen option's ring follows.
- **FigCraft draws a disabled option under the pointer with the hover's fill.** The tokens say the disabled ground applies (`applies` gives `disabled.backgroundColor`), and the browser draws it so. In Figma the pointer stays in the path, so the hover's ground is a variable of its own, and it has no disabled mode for the folded availability to pick. A member then disagrees with CSS where a part left in the path meets a later folded axis that the path's token lacks. Reported on Codeberg, Toghen/figma, the same day; fixed in 0.1.14, where a member binds the variable that carries the token `applies` picks over every part, folded ones included. The hovered, disabled option now binds the rest's ground and pins `availability=disabled`. The same fix redrew two Button members and one SegmentedOption member, the same case.

### What was checked

`toghen-query` finds no hole. In the built-in browser, Chrome's customizable select: five rows exactly for `size="5"`; a chosen option `#0a6fb8` with white text and the platform's tick; Fig grey; a click on Pear logged the form's value; Down moved focus to Quince, ringed `#0a6fb8` 2px inside, and Space chose it; dark drew the list on the dark field. In FigCraft: ListboxOption (16 members), Listbox of five instances. Not checked in Safari or Firefox, where the list is the browser's own.

## `@toghen/figma` 0.1.14

> **Moved 29 October 2026,** from 0.1.11. Two issues insufferable reported are fixed in it: the underline that never reached FigCraft (0.1.13), and a member binding a path-kept part where a folded one outranks it (0.1.14).

Checked first on a copy of the library from Toghen's own checkout, then on the library itself: the check reads the 21 files with no error; the sync redrew the Link's four members with their line, two of the Button's, two of ListboxOption's and one of SegmentedOption's; a second run planned nothing, the Link included.

## The active state

> **Ruled 29 October 2026,** as proposed: a control held down goes one step deeper than under the pointer. The state is `active`, the second value of the pointer axis, spelled `:active`; "pressed" was already the toggle button's `aria-pressed`.

### The ruling

- **Buttons, outlined and plain:** the line's grey (`ins.color.line`) where hover is the fill. Solid, and a pressed toggle in any variant: a new role, `ins.color.accentDeep`, `blue.800` in light and `blue.200` in dark, where hover is the strong accent. Text on it is 11.50:1 in light and 9.46:1 in dark.
- **A menu item and a segment** do the same: the line's grey, and a checked segment the deep accent.
- **Left out:** links, tabs and the disclosure answer the pointer with colour, not a ground, and a press adds nothing there; a native select's options do not report `:active` reliably.
- **No contrast rule for it.** It lasts as long as the press, so the 3:1 a state's mark wants does not apply.

### What the build found

- **The base active needed a border.** The solid and pressed active looks set the border, and the button's own active did not, so Toghen could not fold the variant and the selection: the dry run planned moving every button colour between collections. The base active now names `lineStrong`, as hover does, and plain's active the clear border, as plain's hover does. The fold is then as before, with no breaking move.
- **A pressed toggle that is also disabled takes the accent under the pointer,** with the disabled grey text on it. `pressed.hover` and now `pressed.active` have two parts and beat `disabled`'s one, in the browser and in FigCraft alike. It predates this ruling; not fixed here.
- **The style plan always shows four updates,** with or without this change. Rerun noise in the text styles, not looked into.

### What was checked

`toghen-query` finds no hole. In headless Chrome, a real mouse held down on each control in both themes, colours read while held and released away so no click went out: outlined and plain `#eeeeee` under the pointer, `#e0e0e0` held (dark `#2d2d2d`, `#414141`); solid, a pressed toggle and a checked segment `#00548f` then `#073b66` (dark `#76b0e9`, `#9bc4ef`); a menu item and a segment the greys; the disabled button unchanged. In FigCraft: 24 new Button members, 4 MenuItem, 4 SegmentedOption; rendered; a second run planned nothing but the style noise. Not checked in Safari, where a tap has needed a touch listener before it shows `:active`.

## Selected and disabled

> **Ruled 29 October 2026,** as proposed: a pressed toggle, a checked segment and a chosen listbox option keep a grey ground when disabled: the line's grey (`gray.100` in light, `gray.800` in dark), the disabled text, and on the button the line for its border. Rejected: the disabled solid button's fill, `gray.50`, 1.04:1 against the page, where the selection would vanish again.

### Why

`toghen-query` showed one flaw in three controls. At rest, disabled (one part, on the later axis) beat selected (one part), so a disabled fieldset hid the segmented control's choice, and a pressed toggle or a chosen option looked unselected. Under the pointer, selected and hover (two parts) beat disabled, so they took the strong accent with the disabled text on it. The checkbox and the switch were spared: their tick and knob show the state. The new tokens, `ins.button.pressed.disabled`, `ins.segmented.option.selected.disabled` and `ins.listbox.option.selected.disabled`, have two parts and the later axis, so they win at rest, under the pointer and held down, in any variant.

### What the build found

- **The sync moved variables between collections.** With the new tokens, the button's disabled colours fold under `selection`, and the segment and the option keep availability in the path: seven breaking moves. The file was copied aside and the sync run with `--allow-breaking`.
- **A breaking move leaves members looking hand-edited.** Removing the old variables unbound the members that used them, and the next run read the missing bindings as changes made in Figma and left them: the pressed and disabled toggle drew white, the plain one clear, a checked and disabled segment clear. Toghen's notes said so, under the run's other notes. `--overwrite-drift` on the three component files alone rebound them; a rerun then plans nothing for them.
- **The Checkbox and the Dialog carry the same leftover drift** from earlier breaking moves (14 and 4 notes in the committed library). Not touched here; settled with `@toghen/figma` 0.1.15.

### What was checked

`toghen-query` finds no hole, and `applies` gives the new token for every combination of variant, pointer and focus. In headless Chrome, with the markup added to the overview page and a real mouse: a disabled pressed toggle, a plain pressed one with `aria-disabled`, a checked segment in a disabled fieldset and a chosen disabled option all `#e0e0e0` with `#a1a1a1` text at rest, under the pointer and held (dark `#414141` and `#6e6e6e`); an unpressed disabled toggle and an unchecked disabled segment unchanged. In FigCraft, every disabled member sampled from the renders: pressed, solid and pressed, plain and pressed, and a checked segment `#e0e0e0` in all three pointer states; ListboxOption rendered and looked at.

## `@toghen/figma` 0.1.15

> **Moved 29 October 2026,** from 0.1.14. The issue insufferable reported is fixed in it: a binding lost to a breaking variable move is now written again, not kept as a hand edit, and a set's summary line counts the fields it kept as drift.

A stamp written before 0.1.15 does not record what its fields were bound to, so the drift already in the library stayed, as the release says. Its new count named it: Checkbox 14 fields, Dialog 4. One run with `--overwrite-drift` on those two files settled it.

- **The Checkbox** had lost the bindings of its Box's fill and stroke and its Tick's and Dot's fill, the case the fix covers.
- **The Dialog was another case.** Its Keep and Discard buttons were instances of two Button members that no longer existed, left over from a rebuild of the Button set, and Toghen read each as a swap made by hand. The fix does not cover an instance whose main the sync deleted. Added to the same issue on Codeberg, Toghen/figma.

### What was checked

The library was copied aside first. After the run, the saved file binds every Box, Tick and Dot fill again, and the two instances use the plain and the solid Button at rest. Rendered: the checkbox and the radio in their eight states, the dialog with a plain Keep it and a solid Discard. A dry run of every file then planned nothing and counted no drift.

## The base typography

> **Ruled 29 October 2026,** as proposed: three new text styles, `title` (Fraunces, 1.5rem, 600) for `h2`, `heading` (Archivo, 1.25rem, 600) for `h3` and `small` (Archivo, 0.875rem, 400) for `small` and `figcaption`; `h4` to `h6` in the body style in bold; code in the platform's monospace; 24px above every heading and 8px below; and the type page rebuilt as a specimen. It closes the open question of the base layer, which styled only the page and a top heading.

### The ruling

- **The sizes are five steps,** 0.875, 1, 1.25, 1.5 and 2rem. The new 1.5rem needed a name between `lg` and `xl`, so the 2rem size became `xxl` and `xl` is now 1.5rem. *Rejected:* a name out of order for the new step.
- **The serif for the top two levels, the sans below.** Fraunces is a display face, at its best large; at 1.25rem and under, a heading reads better in the text's own family.
- **Code has a family, not a style.** Inline code should keep the size of the text around it, and a W3C dimension has no unit for that (`em` is not in the format). The family is `ui-monospace, monospace`, with no font shipped.
- **Only headings get margins.** Paragraphs, lists and quotes keep the browser's `1em`. No line length in the base: the page sets its own.

### What the build found

- **The heading group nests by level.** `ins.heading` holds the shared margins and the bold body; `ins.heading.h1` to `h3` hold only their style, applied after it. The base rule writes `font` before `font-weight`, so the bold survives the shorthand.
- **The dialog's title is an `h2`,** so it now takes the title style in the browser; its component file names the same style, so FigCraft draws it in Fraunces too.
- **Renaming a size made the display style read as hand-edited.** The display style was bound to `xl`; the variable sync gave `xl` its new value, the style followed it to 1.5rem, and the style sync then found a size it had not written, and left it. One run with `--overwrite-drift` rebound it to `xxl`. The same family as the bug fixed in `@toghen/figma` 0.1.15, on the style side. Reported on Codeberg, Toghen/figma, the same day.
- **FigCraft's text styles are all Regular.** Every style in the library, the label's 500 and the display's 600 included, reads `Regular` in the file, as it did before this change, so a component text in one of them draws at 400 in FigCraft. The fault is Toghen's, `@toghen/figma` 0.1.15: it takes a text style's name from a `fontStyle` member of the token, which the W3C typography type does not have, and never reads `fontWeight`, so a token written to the format always gets Regular. FigCraft lists the faces (Archivo Medium and SemiBold, Fraunces SemiBold) and keeps a SemiBold style written by hand. Reported on Codeberg, Toghen/figma, the same day. Until it is fixed, the library's text styles are all at 400. The style plan, which showed four updates on every run, now shows seven, one per text style; it may be the same cause, and is mentioned in the same report, but was not traced.

### What was checked

`toghen-query` finds no hole; typecheck and tests pass. In the built-in browser, light and dark, computed on the article: `h1` Fraunces 32px 600 on 40px, `h2` Fraunces 24px 600, `h3` Archivo 20px 600, `h4` Archivo 16px 600, each 24px above and 8px below; `p` 16px 400 on 24px; `small` and `figcaption` 14px on 21px; `code` in the monospace at 16px, with no shrink from the browser's monospace default; `kbd` inside `small` at 14px. Both families loaded, upright and italic. In FigCraft: three new styles and two new size variables, the dialog's title in Fraunces at 1.5rem, and a second run with nothing to write but the style plan's updates.

## A variant is a class

> **Ruled 29 October 2026,** and made the same day: every variant moved from `data-variant` to a class. The principle is in [specs.md](./specs.md#principles).

### The question

The variants were written `data-variant="solid"`, on the reading that a variant has no ARIA meaning and so belongs in a `data-*` attribute. Egildo asked whether `class` would do, used for what a thing is: CSS has its own syntax for it.

### What the platform says

HTML asks authors to use class values that describe the nature of the content, not its look, and keeps custom data attributes for data private to the page "for which there are no more appropriate attributes or elements". A kind of button, a kind of note, a radio group drawn as segments: each is the nature of its element, which is what `class` is for. So `data-*` was the less fitting attribute, not the more careful one.

### The ruling

- **Each attribute has one job.** The element name says what a thing is; an ARIA attribute or a native pseudo-class says its state; a class says its kind; `data-*` is left to the app.
- **Never a class for a state.** The earlier principle stands for states: `aria-pressed`, not `.pressed`.
- **A class is paired with its element.** The stylesheet reads `button.solid`, `fieldset.segmented`, a note's `.danger` under its role, never a bare `.solid`, so an app's own class of the same name elsewhere is left alone. The components layer keeps any rule of the app's above them.
- **Not a class that names the element.** The ruling on the disclosure stands: a class that says only what the element name says is still rejected.

### What changed

The vocabulary spells the variant axis `.solid`, `.plain`, `.danger`; the segmented control's own selector is `fieldset.segmented`; the stylesheets' comments, two token descriptions, every demo page and specs.md's markup follow. The coming parts are written as classes from the start: pill tabs, the tag, the chip list.

### What was checked

The built stylesheet holds no `data-variant`, and its variant rules read `:where(.solid)`, `:where(.plain)` and `:where(.danger)` nested under their elements. `toghen-query` finds no hole; typecheck and tests pass. In the built-in browser, on the index: the solid button in the accent, the outlined one clear, the plain one with no border, the danger note in its own tint beside the plain one, the segmented control laid out with its legend hidden. A FigCraft dry run plans no change to the variables or the components, since the sync reads the token names, not the selectors.

## The small parts

> **Ruled 29 October 2026,** as the first batch of the coverage that `beltype-studio-experiment`'s FigCraft file asks for, and built the same day: the icon button, the count, pill tabs, the tag and the chip list. Their specs are in specs.md.

### Where it comes from

The studio file draws an application: a desk of panes, docks, pill tabs with counts, trees, inspector rows, chips, logs. insufferable held the parts of a document. The coverage is built first, in four batches (the small parts; the rows; the shell; the studio screen rebuilt as a benchmark), at today's look; the style is studied after, and changes token values, not markup.

### The ruling

- **Icon button:** the plain button holding only an icon, named by `aria-label`, drawn square. No new markup.
- **Count:** `<data value>` inside a control.
- **Pill tabs:** `ins-tabs class="pill"`, the same element.
- **Tag:** `<small class="tag">`.
- **Chip list:** `<ul class="chips">`, each item's button sending `--remove` to the list; no script of insufferable's.

### What the build found

- **The icon button keeps the accent when pressed.** The proposal had it pressed as the studio draws it, the ink on a wash. The button's own ruling refused that ground already: the fill is 1.16:1 against the page, under the 3:1 a state's mark wants. So the icon button differs from the button only in its square.
- **The icon button is found by its markup:** `button[aria-label]:has(> ins-icon)`. An icon alone needs a name, so the selector asks for what the page must write anyway. A button with words and an `aria-label` is already a fault, since its spoken name would not be its visible one.
- **A count keeps the colour around it.** Studio draws the count in the same ink at 70%; on the solid button and the selected tab that falls under 4.5:1. insufferable's count takes the colour of its control whole and is set apart by its weight, regular beside the label's medium, and by tabular figures.
- **The tag's text is the strongest grey.** The second grey on the fill measured 4.39:1, under 4.5 for text; the first is 12:1 in light and in dark.
- **`--remove` sets no state.** The command rule names a command after the ARIA state it sets; removing a value sets none. The rule now says that a command that sets no state is named after what it asks for, and has no default. `src/commands.ts` lists it.
- **A disabled pill tab needed its own ground.** The pill's hover fill came through on a disabled tab, since the pill's hover outranks the tab's disabled; the pill now says disabled is clear, and selected and disabled keeps the line's grey, as the button's pressed and disabled does.
- **The stylesheet grew 9.6 KB,** to 88 KB, mostly the chip list's nested remove button with its three states. Its size stays an open item.
- **FigCraft:** five new sets, IconButton (72 members, the button's), PillTab (8), PillTabs, Tag and Chip; 35 new variables and three text styles (the tag's style, its alias, the size and tracking it needs). The first run's 50 variable updates changed no existing variable's value: a run into a scratch copy, compared variable by variable with the file before, found none changed. A second run plans nothing for the variables.
- **The tag is patched on every run.** Its label's case is written over its text style, which has none, and each run then rewrites the style and the case. The text draws in capitals all the same. Not traced; it may share a cause with the style plan's standing updates.

### What was checked

`toghen-query` finds no hole; typecheck and tests pass. In the built-in browser, light and dark: the icon buttons 36px square, the pressed one in the accent; the counts at 400 with tabular figures beside 500 labels; the pill tabs with the selected one at 5:1 on its tint in light and in dark, the disabled one grey; the tags in capitals at 12px; the chip list removing a value through `--remove` heard at the root, the focus moving to the next button, the remove icon 4.4:1 on the chip in light and 5.3:1 in dark. The demo page uses all five. In FigCraft, rendered: the pill tab's eight members, the icon button's grid, the tag in capitals, the chip with its ×.

## The rows

> **Ruled 29 October 2026,** as the second batch of the coverage, in two halves: the rows with no script (choice rows, property rows, status, log) built the same day, the tree to follow. Their specs are in specs.md. The references are now a principle: the specifications, MDN and the WAI-ARIA Authoring Practices Guide.

### The ruling

- **Choice rows:** `fieldset.choices`, labels holding radio buttons, as the segmented control is built.
- **Property rows:** `fieldset.properties` with `div.property` rows on a subgrid. The studio's "marked" dot is a checkbox, since its own words say only the marked rows become declarations: a choice the user makes, with a state the platform already has.
- **Status:** `small.status` with a kind, a dot whose word is read and not shown.
- **Log:** `ol.log`, a time, a status and the line.
- **File rows** are columns, so they are a table, which exists. The group header moved to the shell's batch, as the pane's heading.

### What the build found

- **Two new hues.** The statuses needed a green and an amber, so the palette has five families. gosfuig made both from the hue alone (150 and 70); the grey, the blue and the red are unchanged step for step. Its contract check passes both, and still fails the blue and the red at 700 on 200, as before. The roles: `ok` and `warn`, `500` in light and `300` in dark, each at least 4.5:1 on the page.
- **Warn needed its own shape.** As proposed, ok and warn were both dots told apart by colour alone, which WCAG's use of colour refuses. Warn is a triangle, a clip path in the stylesheet.
- **The status is drawn by its own ground and ring tokens,** not by the text colour, so the FigCraft set binds them and its kinds fold into modes.
- **The status's kinds join the shared variant collection.** `ok`, `warn` and `off` are values of the status's own variant axis, and Toghen folds every variant into one collection, so the button's and the callout's variables gained three modes holding their rest values. Nothing draws differently. A status axis of its own would need its own name for `danger`, since a key cannot be a value of two axes.
- **Two icons:** Tabler's `restore` for the reset, and `chevron-right` for the tree to come.
- **The IconButton set gained a glyph property,** so an instance can show any icon; the property row's reset is one.
- **The stylesheet is 103.7 KB,** 15.7 KB more for the four parts and the two colour roles.

### What was checked

`toghen-query` finds no hole; typecheck and tests pass. In the built-in browser, light and dark: the choice rows with the checked one on the tint (its description 4.8:1 in light, 6:1 in dark), the disabled one grey; the property rows lined up on one grid, the mark a ring at 3.5:1 and a filled dot in the accent, the resets disabled where the value is unchanged; the four statuses as a dot, a triangle, a square and a ring, each above 3:1 in light and in dark; the log's times and dots lined up. In FigCraft, rendered: ChoiceRow's eight members with a radio button instance, PropertyRow marked and clear, Status's five kinds, LogLine. A second sync plans nothing but the standing style updates and the tag's patch. The library's variables were compared before and after the sync: no value changed except the variant collection's three new modes.

## The tree

> **Ruled 29 October 2026,** as the second half of the rows' batch, after reading the APG's tree view pattern and its file directory example, and built the same day. Its spec is in specs.md.

### The ruling

- **The APG's markup:** nested lists, the `li` the node, its row a `span`, its children a `ul`.
- **Single select, selection apart from focus.** The arrows move; Enter or a click selects. The APG's guidance on selection following focus warns against it where selecting does work; in the studio, selecting a node moves the caret in the document.
- **The keyboard as the APG lists it,** with type-ahead, which it recommends for every tree. Not built: `*`, which it calls optional, and multi-select.
- **Two commands:** `--select` sets `aria-selected`; `--expand` turns `aria-expanded` over. The command rule had named `--expand` before any element sent it.
- **The element sends the command itself.** A node is an `li`, and only a button sends a command through `commandfor`; putting a button in each node would nest a control in a composite. So the element builds `new CommandEvent('command', { command, source })` with the node as the source and sends it to itself. The app hears it at the root in the capture phase, cancels it to own the state, exactly as with a tab.

### What the build found

- **A node is named by its row.** A `treeitem` takes its name from its content, and a parent node's content is its children too; the element points `aria-labelledby` at the row. The APG's example leaves this to the browser, with a row that holds only a word.
- **Type-ahead looks past the tags.** Matched against the whole row, "i" found nothing, since every row begins with its kind ("Section Informazioni utili"). A node is now found by its row's text without its `small.tag`s.
- **The chevron is the icon font's,** `chevron-right` from the subset, written as its code point in the stylesheet and turned 90 degrees when open, so FigCraft draws the same glyph (`chevron-down` there, since a component cannot turn a glyph by its state).
- **A click on the chevron opens and closes, a click on the rest of the row selects.** The chevron is a pseudo-element, which no event targets, so the element measures where the click fell: within the row's start padding and the chevron's width.
- **The row's states are its node's.** The selected and focused parts are spelled `:is([aria-selected=true] > *)` and `:is(:focus-visible > *)`, so the span reads the state of the `li` it sits in; the focus ring is drawn on the row, since the node holds its children.
- **A parent the app leaves unmarked is closed,** as in the APG's examples. Without script, every node is open, so a tree drawn before its script loads closes when it arrives.

### What was checked

The keyboard rules are pure functions, `treeAction` and `typeAhead` in `src/keys.ts`, with five new tests; eleven pass. In the built-in browser, on `dev/tree.html`, by real key presses: down, left to the parent, left to close it, down twice, right to open a closed section, right into it, Enter to select, "i" and later "v" for type-ahead, wrapping; the log heard `--select` and `--expand` at the root for each. A click on a chevron opened a node without selecting it; a click on its row selected it; with the app cancelling `--expand`, a click on the chevron changed nothing. One tab stop throughout; no end node carries `aria-expanded`; each node's name is its row. Light and dark: the focus ring and the selected tint show together on two rows. In FigCraft: TreeRow's 24 members, closed, open and end by selection, pointer and focus, rendered; the library's existing variables unchanged after the sync, and a second run plans nothing new.

## The shell

> **Ruled 29 October 2026,** as the first half of the shell's batch, and built the same day: the desk and its panes, the pane's head, the group header and the dock. The splitter and the narrow layouts are its second half. Their specs are in specs.md.

### The ruling

- **Desk and panes:** `div.shell` on the desk, `aside.pane` and `main.pane` as landmarks.
- **The pane's head:** its `header`, its buttons at the end.
- **The group header:** an `hgroup` inside a pane, the platform's element for a heading with a line beside it, styled only there.
- **The dock:** no new element. The toolbar, vertical, learns disclosure buttons after the APG's disclosure pattern; one pane per side is the app's.
- **The news dot:** a status of a new kind, `new`.

### What the build found

- **The panes take the surface; only the desk is new.** A pane role beside the surface would have been the same white in light, and in dark the raised grey, which is also the fill a control takes under the pointer, so a hover on a pane would not show. So the panes are the surface, and the desk sits a step below it: `gray.25` in light, black in dark. The warm values wait for the style study.
- **A pane's display hid nothing.** The pane is a flex column, and `display` outranks the browser's own rule for `hidden`; a closed pane showed. The pane now says `hidden` is `display: none`, as the choice rows had to.
- **A pane's heading is in the label style.** Its level is the document outline's, so the centre's `h1` would have been the display style; a heading in a pane's head is in the label style at any level.
- **The dock's icons** are seven more of Tabler's: `list-tree`, `folder`, `printer`, `adjustments-horizontal`, `stack-2`, `code` and `moon`. The shipped list is kept in order.
- **A text style for the dock,** `ins.typography.dock`: 0.75rem, medium, the word under an icon.
- **`new` joins the variant collection** as the other statuses did: one more mode on the button's and the callout's variables, holding their rest values.
- **Two component files re-patch their case on every run,** the tag and now the group header: both write `textCase` over a text style. This is the cause the tag's note left untraced.
- **The stylesheet is 119.5 KB.**

### What was checked

`toghen-query` finds no hole; typecheck and tests pass. In the built-in browser at 1400 by 860, light and dark, on `dev/shell.html`: the two docks, the structure pane with the tree, the main pane with its head (the title in the label style, the path in code, a status, the theme's icon button at the end), and the styles pane with pill tabs, group headers, a chip and choice rows. A click on Resources in the dock showed its pane and, by the demo app, hid Structure's; a second click hid it, and the main pane took the room. Down in the vertical dock moved the focus; one tab stop per dock. The news dot sits at the printer's corner, and the button reads "Print log new". In FigCraft: Dock, DockButton (four members, open by pointer), Pane with a slot, and GroupHeader, rendered. The news dot is placed at the glyph's corner by hand (`layoutPositioning=ABSOLUTE`, 14 and 0, its mark not clipping), as the stylesheet places it by percentages. After the sync, the library's variables are unchanged except the variant collection's new mode.

## The splitter

> **Ruled 30 October 2026,** as the second half of the shell's batch, and built the same day. Its spec is in specs.md. The narrow layouts, the other half of the ruling, did not fit as proposed; see the last finding below, and [The narrow shell](#the-narrow-shell).

### The question

The proposal had the splitter send `--resize`, named after what it asks for. Building it showed that a command carries only its name and its source: a tab's or a tree node's needs no more, since its source is the choice, but a splitter's must say how wide, or an app that cancels it cannot decide. Two ways were put to Egildo: speak as the platform's own range control does, with `input`, `change` and `.value`; or keep `--resize` and put the size asked for on a property of the splitter before sending it.

### The ruling

**Like a range input.** The splitter sends `input` while its value moves and `change` once it settles, the value in `.value`; an app that owns the size writes `aria-valuenow`. It is the element contract's one exception, and the contract says so: a value is a number, and a range control is the platform's own model for one.

### What the build found

- **The value is the APG's,** 0 to 100 between the pane's smallest and largest width, which the pane's own stylesheet gives: `ins.size.sideMin` and `sideMax`, 14rem and 32rem. So the splitter reads the range from the pane, not from attributes of its own.
- **Left and Right move the splitter, not the pane.** Which of them grows the pane depends on which side of the splitter the pane is on screen, so the rule takes that side and holds in either direction of reading. `splitterValue` in `src/keys.ts`, with two tests.
- **A hidden pane's width is its stylesheet's.** A splitter whose pane started hidden read a width of 0 and shrank the pane to its smallest; it now reads the pane's computed `inline-size`, which a hidden pane still has.
- **One splitter per pane.** A side holds several panes, one shown at a time; each pane has its own splitter, hidden with it, so each keeps its own size.
- **The splitter takes over the desk's gap,** with negative margins the gap's width, so panes sit 12px apart with a splitter between them as without.
- **The narrow layouts do not fit as proposed.** An overlay and a sheet were to be a popover and a modal dialog. But a pane is in the shell's row at a wide width, and an element in the top layer leaves the row whatever its style: one element cannot be both. Put to Egildo with two ways: an element that makes the side panes popovers below a width, or CSS alone, with Escape and a click outside left to the app.

### What was checked

Thirteen tests pass. In the built-in browser at 1400 by 860, on `dev/shell.html`: each splitter a separator, vertical, 0 to 100, named after its pane, starting at 33 from the pane's 20rem; two presses of Right grew Structure from 319 to 348px; Enter collapsed it to 224px (14rem) and Enter restored it; End took it to 512px (32rem); a drag of 200px to the left took it to 313px, with `input` on each move and one `change` at the end; Right on the splitter before the styles pane shrank that pane, to 28; a hidden pane's splitter is hidden, and shows with it. In FigCraft: Splitter's six members, the grip long under the pointer, held and focused, in the accent when held or focused, rendered.

## The narrow shell

> **Ruled 30 October 2026:** an element, `ins-shell`, that makes the side panes popovers below a width. Built the same day. Its spec is in specs.md, under Shell.

### The ruling

The shell becomes an element. Below a width it adds `popover` to each side pane, so its dock opens it over the main pane and the platform gives Escape, a click outside, and the focus back to the dock. At phone width the same popover is drawn as a sheet; it is not modal, since only a `dialog` is.

### What the build found

- **`div.shell` is now `<ins-shell>`.** The element measures its own width with a `ResizeObserver`.
- **The widths are tokens,** `ins.size.shellNarrow` (64rem) and `ins.size.shellPhone` (40rem). A container query cannot read a custom property, and the build writes a token as one, so the element reads them and shows the answer to CSS as custom states, `:state(narrow)` and `:state(phone)`: the platform's way for a custom element to show a state that is not ARIA's.
- **The toolbar learns popovers.** A disclosure button whose target is a popover shows and hides it (`showPopover({ source })`, so the platform knows its invoker and hands focus back), and hears its `toggle` to turn `aria-expanded` back when the platform closes it.
- **The pane's display hid the popover.** As with `hidden`, a pane's flex outranks the browser's rule that hides a closed popover; the pane now says so itself.
- **The anchor did not take.** The overlay was to sit beside its dock button through anchor positioning, the button being its source; in the built-in browser it fell back. It is placed instead by the dock's own size: the shell's padding, the dock's buttons, padding and hairline, and the gap, all tokens.
- **A popover is as tall as its content,** by the browser's own style; the overlay stretches to the desk's height.
- **The splitter steps aside.** A pane that is a popover hides its splitter and drops the width the splitter gave it, so the sheet spans the screen; back in the row, the splitter sizes it again from its value.
- **Going narrow closes, going wide restores.** Without it, an open pane would cover the main pane the moment the window narrowed. The element remembers the open panes, closes them by writing `aria-expanded="false"` on their dock buttons, and opens them again when the shell widens. A pane open over the others at that moment takes its side's place.
- **A late `toggle` undid the restore.** Closing a popover by removing its `popover` fires its `toggle` after the element had reopened the pane in the row, and the dock read it as the user's. The toolbar now ignores a `toggle` from an element that is no longer a popover.

### What was checked

Typecheck and tests pass. In the built-in browser: at 1400 by 860, the row, Structure and Styles open, no popover. At 900 by 700, `:state(narrow)`: all five side panes popovers, closed, every dock button saying so, no splitter. Structure from its dock: open past the dock (90px from the left edge, the dock ending at 78), the full height less the gap, over the shade at 40%; Escape closed it, its button said closed, and focus came back to the button. Styles from the right dock: 90px from the right edge; a click outside closed it. At 375 by 812, `:state(phone)`: Structure as a sheet, edge to edge, against the bottom. Widened back to 1400 after opening Resources as a sheet: Resources open in the row in Structure's place, with its splitter, and Styles as it was. In FigCraft: PaneOverlay, the pane raised with the raised shadow bound to its colour; the render crops the shadow at the frame's edge.

## The aesthetics round

> **Ruled 30 October 2026:** the dimensions come from sibardoc's Fibonacci and Lucas ladder, in rem; the neutrals take a trace of warmth. Built the same day. Its spec is in specs.md, under Quanta, Colours and Typography.

### The ruling

- **A quanta tier,** `ins.quanta.fi` and `ins.quanta.lu`, pure dimensions in rem. Space, radius, sizes, type sizes and the shadow refer to it; nothing else does.
- **Space and radius re-cut:** space 5, 8, 13, 21, 34 (was 4, 8, 12, 16, 24); radius 8 and 13 (was 6 and 12). The control is 34 and the dock 55; the side pane is 233, 322 and 521; the narrow and phone widths are 987 and 610.
- **Type on the ladder:** 11, 13, body at 1rem, 18, 21, 29, 47. Line heights 1.375 for text and 1.17 for headings. Body stays at 1rem: the browser's default is the ground, and sibardoc keeps its own body off the ladder too.
- **Warm neutrals:** the grey has chroma 0.005 at hue 80. Light is paper on a warm desk; dark lifts off black, panes on a desk one step deeper.
- **The shadow is two layers,** offsets 2 and 8, blurs 5 and 21, at 9% in light.

### What the build found

- **No element token held a literal,** so every dimension moved by editing the scales and the type, and nothing else. Space grows at its top: 16 became 21 and 24 became 34, and the panes breathe more.
- **Two pairs were already under 4.5:1.** Quieter text on the hover fill measured 4.39 and danger text on a raised surface in dark 4.32. The light fill is now `gray.25` (4.67) and the dark danger is `red.300` (5.71).
- **The desk needed a step.** With a warm paper surface, `gray.25` on the desk lost the edge between pane and desk; the light desk is now `gray.50`. The dark desk is a written value, `#0f0e0d`, since the ramp has nothing darker than `gray.950`.
- **The palette contract still fails for blue and red** (700 on 200 at 4.33 and 4.49), as before; this round touched only the grey.
- **The stylesheet** grew from 123.5 to 125.4 KB, the quanta's variables.

### What was checked

Typecheck and tests pass; the FigCraft library was synced. In the built-in browser, the shell in light and dark at 1345 wide: side panes 322 wide, the narrow width read as 61.6875rem, controls 55 for a dock button; at 900 the panes became popovers as before. Text, edge, accent, danger, ok and warn contrast measured against surface, desk, fill and raised in both themes: every text pair 4.5:1 or more except the quieter text on the desk in light (4.36) and the disabled text, which WCAG exempts.

### Not done

- The quieter text on the light desk, 4.36: no text sits straight on the desk today.
- The motion durations (89, 144, 233, 377 in sibardoc) and the style study.

### The FigCraft sync

The first sync made 26 variables (the quanta, and the display size) and updated 70, then 40 text and effect styles. Read back from the file, the shadow style is bound to the quanta variables for both layers' offsets and blurs, and the colour variable at 9%. Two things did not land:

- **Three text styles kept old line heights and the display style kept a size from before its variable changed:** the next run called nine styles drifted, since they differed from what the first run wrote. A run with `--overwrite-drift` wrote the document's values: label 13 at 117%, display 47, title 29, heading 21, tag and dock 11, body 16 at 137.5%.
- **Nine styles are updated on every run,** though the variables are unchanged. The values read back are right, so it costs nothing but noise. A question for Toghen's figma sync, with the textCase and the two open issues.

A render of the library shows the warm ground, the new sizes and the tree, choice and property rows intact.

## Theming by override

> **Ruled 30 October 2026:** the first way to theme is an app's own unlayered CSS. Built the same day. Its spec is in specs.md, under Theming an app.

### The ruling

An app sets the roles it wants in its own rules after the stylesheet. It is the lightest of three ways: the other two are a theme derived from a config, with gosfuig's contrast gate, and an app-chosen scheme through `color-scheme`, which wait.

### What was checked

The layers are `ins.tokens` (with `defaults` and `theme` inside it), `ins.base` and `ins.components`; an unlayered rule wins over all of them, as the stylesheet's own header says. `dev/theme.html` is the demo page with ten lines of override: accent, strong, deep, tint and on-accent as `light-dark()` pairs, and both radii at 0. In the built-in browser in light, the selected tab, the links and the buttons took the terracotta and the corners went square; in dark the solid button read as the lighter orange with dark text, a radius of 0. Contrast of the sample: accent on the surface 6.71 in light and 8.24 in dark; text on the accent 6.88 and 8.24; text on the tint 15.27 and 11.59. The override does not measure by itself: those numbers were measured by hand.

### Open

- A derived theme, from a hue, a warmth, the fonts and a density, written by gosfuig with its contrast gate: the tool.
- An app-chosen scheme: `color-scheme` on a container with `light-dark()` is the platform's way; the build writes the roles with `@media`, so the roles themselves do not follow a container yet. The override above does.
- The density mode.

## Building an app's own stylesheet

> **Ruled 30 October 2026:** an app may rebuild the stylesheet from its own resolver, which extends the system's. Slice one built the same day: the command and an example. The theme generator and the guide are next.

### The ruling

The deeper of the two ways to ship theming. The first, an override file, changes values; this one changes tokens, so an app may change the ladder, the type and the palette, and gets a stylesheet of its own. The cost is Toghen and the build in the app, which was accepted.

### What the build found

- **Extending works by file order.** An app's resolver lists the system's base set by reference, then its own token files; the later wins. A pointer into another resolver's set resolves.
- **Partial theme files work.** The theme modifier's context lists the system's file, then the app's, which holds only the roles it changes. The risk that an app's theme file replaces ours whole did not hold.
- **The name is a coupling.** Every `t()` in the stylesheet reads `insufferable.ins.…`, and the two directives name the resolver, so an app's resolver must be named `insufferable`. The build says so and stops. Rewriting the names at build time was tried in thought and left: one rule is plainer than a substitution.
- **`buildCss` and `writeCss` take a resolver,** the system's own by default, so the system's own build is the same command.

### What was checked

The system's own build is unchanged at 125.4 KB, typecheck and tests pass. `insufferable build examples/app/app.resolver.json` writes 125.2 KB. In the built-in browser the example page, in light and dark: solid button `rgb(154, 61, 18)` with white text in light, `rgb(240, 160, 112)` in dark, radius 0, headings in Georgia.

### Not yet

- **The package.** The build needs `src/` and `scripts/` in `files`, and the build's tools as dependencies, not dev dependencies; `private` is still true. Until then the command runs inside this repository.
- **A FigCraft library for an app** from its resolver and our component files: the mechanism should work and is not tried.
- **The theme generator and `guide.md`.**

## The element prefix

> **Ruled 30 October 2026:** an app chooses the prefix of the elements, in its resolver; the tokens keep theirs. Built the same day.

### The ruling

The prefix is set by `$extensions["dev.insufferable"].prefix` in the app's resolver and applied by the build, from a list of the seven elements, to the stylesheet and to the element scripts. The custom properties and the token group are not prefixed: that would rewrite the token files, the mixins and the FigCraft component files, and the one thing it buys, two design systems on one page, is not wanted. The same mechanism can do it later.

### What the build found

- **The scripts have to be built per app.** An element defines itself under its name when its script is imported, so the name is in the script. The build copies the compiled scripts, with their folders, beside the app's stylesheet, renamed; the app imports them as before.
- **The rename is by list and by whole name.** The pattern is an element from `src/elements.ts` not preceded or followed by a word character or a hyphen, so `--ins-icon-button` and `ins-tabs-extra` stay.
- **The generated ids keep `ins-`.** An element gives itself an id such as `ins-tabs-1` when it has none. It is not an element name and is left alone.
- **A test keeps the list honest:** every element the sources define is in it, every `ins-` element name in the sources and stylesheets is in it, and the rename and the validity check are tested.
- **A build may not write over the system's own `dist/`** with renamed scripts; it says so.

### What was checked

Typecheck, 17 tests, and the system's own build unchanged at 125.4 KB. `examples/app` is built with the prefix `quince`: the stylesheet has `quince-icon`, `quince-tabs` and the rest and no `ins-` element; the scripts define `quince-menu`, `quince-toolbar`, `quince-icon`, `quince-shell`, `quince-splitter`, `quince-tabs` and `quince-tree`. In the built-in browser the page's tabs work (the Pantry tab opened and was marked selected), the icons draw, and `ins-tabs` is not defined.

### Not done

- The theme generator and `guide.md`.
- The default prefix.

## The theme generator

> **Ruled 30 October 2026:** a config of a brand hue, the neutral's warmth and the fonts, and a gate on the contrast. Built the same day.

### The ruling

`insufferable theme theme.config.json` writes the app's palette, fonts and partial role files. Its output goes in the app's resolver, after the system's own files, and `insufferable build` does the rest. Density and an app-chosen scheme were left out, as before.

### What the build found

- **The roles come from the system's own files.** Pointing every reference to the blue at a `brand` family gives the accent roles of both themes, and a change to the system's roles reaches the generated ones. This answered the open question of whether the role table would be repeated.
- **Three roles are values, not references,** the paper, the raised surface and the dark desk, written by hand for the warm neutral. A different neutral needs different ones, so they are computed in OKLCH from its hue and chroma. The paper is a little more tinted than the hand-picked one (`#fefbf8` against `#fdfcfa`), a chroma halved to keep it close.
- **A hue alone did not hold in dark.** The terracotta's `400` step measured 3.83:1 against the hover fill. The system's steps were chosen for the blue, whose ramp lands differently. So a solid brand role moves along the ramp until its pairs hold, and says so: the example's dark accent moved one step lighter. A pale yellow in light moved two steps darker.
- **The gate holds only pairs the stock theme passes.** The quieter text on the desk and the disabled text are not in it: the first is not used, the second is exempt. The list is in `scripts/color.ts`, with the ratio each pair owes.
- **A refusal is hard to reach.** A ramp always ends dark, so a role moving along it nearly always finds a step. The gate is written to refuse and the pair arithmetic is tested; I did not find a config that refuses.
- **A pinned colour is not always the accent.** The `600` step is the lock, but the light accent may move darker than it. The generator reports the move; the example's own pin held.

### What was checked

21 tests pass, typecheck passes. The stock config, the system's own hues, generates unmoved. `examples/app` is built from a config of a terracotta brand and Georgia: in the built-in browser, light and dark, the selected tab, links and the callout take the accent, the paper and the dark desk are warm, and headings are in Georgia.

### Not done

- `guide.md`.
- The package: its files and dependencies, so that the commands run outside this repository.
- Density, and the app-chosen scheme.
- A FigCraft library for an app.

## The package and the guide

> **Ruled 30 October 2026:** the commands run from an installed package; `guide.md` is the practice. Built the same day. The package is not published: `private` stays.

### What the build found

- **Node does not strip types inside `node_modules`.** The build and the generator imported `.ts` from `src/`, which works in a checkout and stops when installed. They now import the compiled `dist/` files, and the colour helpers moved from `scripts/` to `src/` so that `tsc` compiles them. A consequence: the scripts need `pnpm build` to have run, which `prepack` does.
- **Paths were the repository's.** The fonts, the icon font and gosfuig were found under the checkout's `node_modules`. They are now found as Node finds a package, which holds when a package manager hoists them: `pkg()` for the packages that export their `package.json`, and `import.meta.resolve` for gosfuig, which exports only its main file.
- **The build's tools are dependencies,** no longer dev dependencies: postcss and its mixins, Toghen's library and plugin, gosfuig, the subsetter and the two house fonts. The FigCraft sync and the compiler stay dev.
- **The files:** `tokens/`, `dist/`, `src/` (the stylesheets the build inlines) and the three scripts. The tarball is 1.1 MB, mostly the fonts.

### What was checked

A tarball made by `pnpm pack`, installed into an empty app with `pnpm add`: `insufferable theme` wrote the theme from a green brand and a font, and `insufferable build` wrote a 125.9 KB stylesheet under the prefix `acme` and the scripts, which define `acme-shell`, `acme-tree` and the rest. 21 tests, typecheck and the system's own build as before.

### Not done

- Publication: the name, the version and the licence line are a decision for later.
- The scripts' copy of `color.js`, `icons.js` and `elements.js` into an app's folder is more than the app needs; harmless.
- A density mode, an app-chosen scheme, and an app's FigCraft library.

## The app-chosen scheme

> **Ruled 31 October 2026:** the theme is written with `light-dark()`, so an app chooses the scheme with `color-scheme`. Built the same day, on Toghen 0.1.1, which added `lightDark` to the resolver.

### What changed

- **The spelling.** The theme modifier carries `css.lightDark: { light: "light", dark: "dark" }` in place of the media query, in the system's resolver and in the example app's. The plugin writes each colour role once, `light-dark(light, dark)`, and leaves out the per-context blocks. The packages moved to 0.1.1.
- **The stylesheet** is 99.7 KB, from 125.4: the dark blocks are gone.
- **Nothing else moved.** The 21 tests pass; the page in a dark system is the page as it was.

### What was checked

In the built-in browser, on `dev/demo.html` with a dark system: `color-scheme: light` on the page gave the light text, `dark` the dark one, and `dark` on the tabs alone gave them light text on a light page. The example app builds, and its generated theme still passes the gate.

### Consequences

- The system's own default is unchanged: the page says `color-scheme: light dark`, so the system chooses.
- Browsers that do not know `light-dark()` (before 2024) get no colours. The principle is the platform's current baseline.
- The generator needed no change: it writes the roles, and the resolver spells them.

## The missing common components, first slice

> **Ruled 31 October 2026:** go with the ranked list, the cheap set first. Built the same day: progress, spinner, meter, slider, breadcrumb, pagination and card, each with its own token group.

### What was missing

Measured against Open UI's component list and the WAI-ARIA Authoring Practices patterns, the kit lacked, in the order an app needs them: progress, meter and spinner; a tooltip; a toast; a slider; breadcrumb and pagination; a card; a generic popover; avatar, skeleton and empty state; a drawer. Harder: a combobox, a calendar, a data grid. This slice is the cheap set. The tooltip and the toast are the second slice, since both need a check of what the platform has settled. The combobox needs a proposal of its own.

### What was built

- **Native first.** Progress, meter and slider are the platform's own elements, restyled; the spinner is a progress without a value, so it is announced as busy; breadcrumb and pagination are a `nav` holding a list, as the Authoring Practices say; the card is a class on a section. No new custom element, so the element list and the prefix are unchanged.
- **Tokens.** One group per element, and a group for each part a stylesheet reaches by a pseudo-element: `progressValue`, `meterOptimum`, `meterSuboptimum`, `meterWorst`, `sliderTrack`, `sliderThumb`, `breadcrumbSeparator`, `breadcrumbCurrent`, `paginationItem`. Every size reuses an existing role (`dot` for a track, `box` for a thumb and a ring, `control` for a page), so the scales gained nothing.
- **The vocabulary** gained `current` on the selection axis, `[aria-current='page']`, for the current page; a link cannot take `aria-selected`.
- **The first motion.** `ins.motion.spin` and `ins.motion.sweep`, Fibonacci numbers in milliseconds, as `duration` tokens. Each animation stands still where motion is reduced. The keyframes are named `insufferable-spin` and `insufferable-sweep`, since a name starting `ins-` would read as an element to the prefix rename and to its test.
- **The icon** `chevron-left` ships for pagination.

### What was checked

In the built-in browser, light and dark: the seven demo pages; the slider moved and ringed by the keyboard; the breadcrumb mirrored and wrapped; the animations running with the durations the tokens give. Contrast of every pair is measured and written in the specs. 23 tests pass, with two new ones: every token file is in the resolver, and every component stylesheet is imported.

### What the platform taught

- **Chrome's meter parts take no percentage height.** The value drew at half the track until the parts were given the track's height from its token.
- **A slider thumb is not an element.** Its states cannot be selected the way a button's are, so it takes the input's colour and the ring goes round the input.
- **Firefox was not run.** Its meter and progress pseudo-elements (`::-moz-meter-bar`, `::-moz-progress-bar`, `::-moz-range-thumb`) are written from the documentation and not seen.

### Not done

- **FigCraft.** No component files for these elements yet, and the library is not synced. A dry run plans 59 new variables and skips the four `duration` tokens, which Figma has no variable for.
- **The second slice:** tooltip and toast. Then a proposal for the combobox.
- **A fill on the slider's track,** and a vertical slider.

## The element prefix declared once, and the second slice

> **Ruled 31 October 2026:** the system's element prefix is `insufferable`, declared once in its resolver; the tooltip as an element with a fallback; the toast as markup and a stylesheet. Built the same day.

### The prefix

- **The complaint:** `ins` is also HTML's inserted-text element, and it was spelled out in every source, so it could not be changed in one place. The earlier decision about the app's own prefix (see *The element prefix*) kept `ins` as the system's, hard-coded.
- **What changed.** The system's resolver declares it, `$extensions["dev.insufferable"].prefix: "insufferable"`. The build, the generated icon rules, and the rename for an app read it from there; an app that says nothing gets it, and one that names another is renamed from it. The sources, the demo pages and the docs were renamed from `ins-` to `insufferable-` by the same whole-name rule the app rename uses, so neither the custom properties (`--ins-…`) nor the ids the elements generate (`ins-tabs-1`) were touched. The tests read the prefix from the resolver.
- **What did not change, on purpose.** The token group is still `ins`, so every custom property keeps its name, and so do the FigCraft variables, which are made from them. The rename is of elements only. The keyframes are `ins-spin` and `ins-sweep`, in the property namespace, so the prefix rename and its test never take them for elements. Renaming the group would rename every token in the library and every app's overrides; it is a separate decision, not made.
- **Older text** in this file keeps `ins-` as it was written.

### The tooltip

- **Checked first.** In Chrome 152, by feature detection: `popover="hint"`, `interestfor` and `interest-delay`, anchor positioning with fallbacks, `@starting-style` and discrete transitions all exist. Firefox has `popover="hint"` planned for 149 and no `interestfor` found; Safari's status was a page of unknown date saying no, and WebKit was reported to object to the tooltip use. Not confirmed, and not tested here.
- **An element with a fallback,** as proposed: where the platform has both features it does the showing and the element writes the roles; where it has not, the element shows and hides a manual popover on the pointer resting, focus and Escape, with the same delays. The delays are tokens on `interestfor` controls (`ins.tooltipTrigger`), which the platform reads as `interest-delay` and the element reads as a custom property, so the two never disagree.
- **Checked:** in Chrome, hover showed it under the button, centred, with 377 ms (`interest-delay` reads 0.377 s); and with `interestForElement` removed before the script loaded, the fallback showed it on hover and hid it on leaving. The keyboard in the fallback, Escape and touch were not exercised.

### The toast, and where it differs from the proposal

- **Proposed:** a region element, a manual popover, shown while it has items. **Built:** no element, a class on a `div`. A hidden popover is `display: none`, which takes it out of the accessibility tree, so a toast put into it while it opens may not be announced; a live region has to be in the page before its content. The region is therefore always there, fixed to the corner, empty, and the app puts toasts in. This is also the kit's rule: no element where the platform and a class do it.
- **The cost:** it is not in the top layer. A menu open over it covers it, and a modal dialog makes it inert; a toast a dialog raises goes in a region of its own inside the dialog. Written in the specs.
- **Entrance:** a fade and rise from `@starting-style`, `ins.motion.toast` (233 ms), stilled where motion is reduced. The third motion token, as ruled.
- **Checked:** two toasts stacked at the corner in dark, the error with the danger bar; the close button removed one; the entrance had finished by the time the DOM was read. The live announcement was not heard with a screen reader.

### Not done

- FigCraft: no component files and no sync for any of the nine new elements' groups; `duration` tokens are skipped there.
- Firefox and Safari, for the tooltip and the toast alike.
- The combobox: a proposal of its own.

## The combobox

> **Ruled 31 October 2026,** as proposed: an element over the platform's `<input list>` and `<datalist>`, free-form values, and no words of its own. Built the same day.

### What was considered

- **Select-only needs nothing:** the customizable `<select>` is the platform's, and the field already uses it. The combobox is for a free value with suggestions.
- **Options from a datalist, or the app's own list markup.** A datalist gives the no-script fallback for nothing and keeps the markup the platform's own; the cost is that an option holds only text. Chosen.
- **Free-form or strict.** A datalist accepts what is typed, and so does the element. A strict mode is an app's validation and can be added later. Chosen: free-form.
- **Words.** The count announced as the list changes ("5 results") and the "no matches" line are words, and the kit has shipped none. Chosen: attributes `results` and `empty`, no English default. The cost is that forgetting them leaves a gap, which the specs say. One phrase has one form, so plural languages set the attribute as the count changes ("1 risultati" shows it).
- **Filtering in the element or the app.** In the element by default, over text and value, ignoring case and accents; `filter="none"` for an app that does it itself, with the datalist rewritten as the person types.
- **A listbox popover that is `manual`.** An `auto` popover would close on a click in the field, which is outside it. The element closes the list itself: on Escape, Tab, a choice, and focus leaving.

### What was built

The element, its keyboard rules and its filter as pure functions in `keys.ts` with seven new tests (30 pass), three token groups (the list, an option, the empty line), one size role (`ins.size.list`), a stylesheet, and `dev/combobox.html` with four comboboxes: English, Italian with accents, an app-filtered one answering after a delay, and a right-to-left one. The index page has a section.

### What was checked

In the built-in browser: typing narrowed the list with the count announced in the status line; Down and Up moved the active option and passed over a disabled one, wrapping; Enter chose it and sent `change`; Escape closed the list and, again, emptied the field; Alt+Down opened it; Tab closed it and moved on; a click on an option chose it; an unaccented query found an accented option; "no matches" showed the app's line; the app-filtered list followed a datalist rewritten while it was open; a real click outside closed it. Light and dark; right to left, the list aligned with its field. The list is as wide as the field after one fix (the border box).

### Not checked

Firefox and Safari. A screen reader, so the announcements are written and not heard. Touch. The browser's own datalist after the element is removed.

### Not done

Groups and rich options, multi-select, strict mode, virtual scrolling. FigCraft: no component file for the list.

## The conflict notice and the studio benchmark

> **Ruled 1 November 2026,** as the fourth batch of the studio coverage, and built the same day. Its specs are in specs.md, under Callout, Property rows and Commands.

### The ruling

- **The conflict notice is a callout in the property row,** across its columns: the other writer's value, and two buttons, **Take theirs** and **Keep mine**. No new element.
- **Two commands:** `--accept` for taking the other value, and `--dismiss`, already the toast's, for keeping one's own. Neither sets a state, so neither has a default; the app owns the value.
- **The studio screen is rebuilt as `dev/studio.html`,** from insufferable's parts alone, as the benchmark of the coverage.

### What the build found

- **The callout needed a warning.** It had the accent and the danger. A conflict is neither an error nor a note, so it is `class="warn"`, on a new colour role, `warnTint` (`amber.25` in light, `amber.900` in dark). Text on it is 14:1 or more in both schemes and the bar 4.9:1 or more.
- **`role="alert"`, not `status`.** The proposal said `status`, the polite one. The callout's rule is `note` or `alert`, and `status` is already the toast's and the combobox's own role, so styling it would have reached them. Another writer's change is announced, as an alert is.
- **`--dismiss` was in use but not in the vocabulary:** the toast sent it and `src/commands.ts` and the table did not list it. Both do now.
- **A light sheet in a dark app needs only `color-scheme: light`** on the sheet: every part resolves its colours from it. No part had to learn it.

### What the benchmark found: the gaps

At 1600 by 960, the screen assembles from the parts: the docks, the three panes, the tree, the pill tabs with counts, the rule cards with chips, the property rows with the conflict, the log, the status and the sheets. What the studio draws that the parts do not yet:

- **A tree row did not stay on one line,** and is now fixed: the row is one line, 32px, and a label written in an element of its own, `<span>Paola Esempio</span>`, is cut short with an ellipsis while the tag and the code keep their room, the code at the end. Bare text is clipped, not ellipsised: an ellipsis cannot be drawn on a text node inside a flex row, and a grid did not draw it either. The element does not wrap the text itself, so an app's own rendering is not fought; the demos now write the label in a span.
- **The tree's indent guides and closed-node count** are built since: a hairline in the line colour down each group, at the parent's chevron, and a `<data>` in the row shown only while the node is closed. The indent between levels went from 34px to 8px beside the guide, so a level now steps 17px, as the studio's does.
- **Heights differ a little:** the pane head is 34px and the tab 25px where the studio has 40 and 28. This is for the style study, since it changes token values, not markup.
- **The extension list's items are plain options,** where the studio's hold a tag beside the name: the rich options the listbox does not build.

### What was checked

Typecheck and tests pass; the stylesheet is 127.3 KB. In the built-in browser, on `dev/properties.html` and `dev/studio.html`: the notice under its row, in the warning's tint; **Take theirs** wrote the value and removed the notice, and **Keep mine** removed it and kept the value; focus returned to the field. Not checked: the light scheme in the browser (the contrast was read from the resolved colours), FigCraft (the callout's component file has no warn variant yet), a screen reader.

### The FigCraft library

Component files now exist for the elements built since the library was last synced: BreadcrumbItem, Card, Combobox and ComboboxOption, Meter (by zone), PaginationItem (24 members), Progress, Slider (8), Toast (rest and danger), Tooltip. TreeRow gained the count. The callout's warn variant is drawn, by the axis its tokens now declare. The sync was run into a scratch copy first and compared variable by variable: three existing variables changed, all intended (the callout's warn mode, bound where it held a placeholder, and the tree's indent), and the rest only gained modes (current, warn). Read back in a render: the options, the pagination states, the slider's thumb on its track, the breadcrumb's current page in the medium weight.

Not drawn: the spinner and the progress sweep, which are animations; the property row's notice, which is a Callout instance inside the row and is not yet placed there. nothing of the toast now: its bar is a frame of its own on the edge, in the accent or the danger, since a stroke is one colour; its first form, per-side strokes, drew a full outline.

## The rest of the common components, the third slice

> **Ruled 2 November 2026:** "components unbuilt, do a large sweep": build what was left of the list, on the kit's own rules. Built the same day, seven at once: popover, avatar, skeleton, empty state, drawer, calendar, and a table that sorts and selects.

### What was considered

- **Native first, again.** Popover, drawer and avatar need no element: the popover is the platform's attribute on a `div`, the drawer is the dialog with a class, the avatar is an `img` or a `span` with a class. The skeleton and the empty state are a class on a `div` or a `section`. Only the calendar and the table need script, and each is an element that draws or wraps what the platform has no element for.
- **The calendar as a form control.** `<input type="date">` is the platform's, and the specs now say to use it to pick a date in a form. The calendar is the month on the page, to look at and choose from. The date picker of the Authoring Practices is the model.
- **A data grid.** The Authoring Practices distinguish a table, which a sortable and selectable one still is, from a grid, where the arrows move from cell to cell and cells are edited. The first is built, as `<insufferable-table>`, and named a table; the second is not, since a grid is another widget with its own keyboard and the kit has no use for it yet. Recorded as open in the specs.
- **Row selection.** `aria-selected` is not allowed on a row of a plain table, so the row is selected by a checkbox in it, the platform's own control, and the stylesheet reads `:has(:checked)`. The header's checkbox is the only script: it checks the others and says `indeterminate`.
- **Sorting where the data is the page's.** The element sorts the rows in the DOM, by the `value` of a `<data>` or the `datetime` of a `<time>`, else by text, with `Intl.Collator` in the page's language and digits by value. An app that holds its rows elsewhere cancels `--sort`, as it cancels any command.
- **The calendar's two commands.** `--select` carries a date in the day button's `value`; it names the ARIA state it sets (`aria-selected` on the day) and has a default. `--show` carries a month in the button's `value` and sets no ARIA state, which the rule would give no default; it has one, since a calendar that cannot change month does nothing. The rule in the specs says so.
- **A drawer as a dialog, not a popover.** A drawer is modal as the dialog is, with the shade, the focus kept and Escape: `<dialog class="drawer">`, slid in from its edge with `@starting-style` and `allow-discrete`, so the platform keeps the closing dialog drawn until it has left.

### What was built

The seven, with token groups of their own (`popover`, `avatar` and `avatars`, `skeleton`, `empty` and `emptyHeading`, `drawer`, `calendar`, `calendarTitle`, `calendarWeekday`, `calendarDay`, and `tableSort` and `tableRow` in the table's file), one duration (`ins.motion.drawer`, 377 ms), three icons (`arrow-up`, `arrow-down`, `selector`, for the sort mark) and `inbox` for the empty state's demo, two commands (`--sort`, `--show`), two elements (`calendar`, `table`), `dates.ts` with its rules as pure functions, eight new tests, and a demo page for each, the index page showing them all. The stylesheet is 147 KB.

The button's scope now leaves out a sort header's title and a calendar's day, as it left out a tab and a menu item, so neither undoes the button's rules.

### What the build found

- **The shell's panes are popovers when narrow,** and a rule on `[popover]` would have drawn them as a panel with a shadow. The popover rule is on `div` and `section` only, and says why.
- **The keyboard of the calendar can reach a month the buttons do.** A move into the next or the previous month goes through the heading button's `--show`, so an app that owns the month hears it; a move by a year (Shift with Page Up or Down) has no button and writes `month` itself. This is the one place the element writes where the app could not cancel.
- **The Arabic calendar** starts on Saturday, as the language's week info says, reads right to left, and mirrors the two chevrons by CSS (`scale: -1 1`), as the tree's chevron does.
- **A transition the browser pane throttles:** the first measure of the drawer, 700 ms after the click, found it still off the edge; it was the page's timers in a pane that is not in front, not the stylesheet, and a measure after a frame was drawn found it in place.

### What was checked

Typecheck and tests pass (38). In the built-in browser: the calendar chose a day, crossed from the 30th of November into December by the arrow key through `--show`, kept focus, and wrote one tab stop; the Italian one bounded by `min` and `max`; the Arabic one right to left. The table sorted a column of numbers as numbers (8, 9, 12, 105), a column of dates by `datetime`, and again descending, set `aria-sort` on one header and `none` on the others, and the header's checkbox went indeterminate with two rows checked, the two rows in the tint. The popover opened under its button; the drawer opened on the end edge, 322 px wide and the window's height, and the other on the start edge. Contrast, from the resolved colours: the avatar's initials 10.9:1 light and 8.5:1 dark, today's ring and the accent against the page 5.2:1 and 5.8:1. The skeleton is 1.3:1 and 1.7:1 against the page: it is decoration, and quiet on purpose.

### The FigCraft library

New component files: Popover, Avatar, Skeleton (bar or circle), Empty, Drawer (rest and start), CalendarDay (48 members from its parts) and Calendar (November 2026, from a Monday). The icon set gained its four glyphs. The sync added 83 variables and changed none that existed, compared by mode name before and after. Not drawn: today's ring on a day (the library has one stroke, and the focus ring takes it), the empty state's dashes, the avatar group's ring, the skeleton's pulse, the shade and slide of the drawer, a sort header and a selected row in the table.

### Not checked

Firefox and Safari: `position-area`, `@starting-style` with `allow-discrete` on a dialog, and `:has(:checked)` are written from the documentation. A screen reader: the calendar's live heading, the day's full name and the sort order are written, not heard. Touch. The light scheme of the calendar and the table in the browser, which were read from the resolved colours only.

### Not done

A date range and several chosen days; days of the neighbouring months drawn dimmed; a month and year jump. A grid in the Authoring Practices' sense, a resized or moved column, sorting by two columns, virtual scrolling. A sheet from the top or the bottom; a drawer that is resized. A shimmer for the skeleton. Sizes for the avatar. `package.json` does not export `calendar.js` and `table.js`, as it exports none of the elements since the shell.

## The general dialog

> **Ruled 2 November 2026:** "a general dialog", on the proposal: one markup for every case, with no new element.

- **Parts.** `header`, body and `footer`, laid out by the stylesheet, so the action row is no longer the demo page's. The footer may sit in a `form method="dialog"`.
- **Widths** `small` and `large`, as classes; **an alert** by `role="alertdialog"`, with a bar at the start in the danger and, by the app's markup, no close button; **not modal** by `show`, floating on the shadow, read as `:not(:modal)`.
- **The drawer shares the parts.** Its demo lost its own header and footer rules.
- **Tokens.** `dialogHeader`, `dialogFooter`, `dialogSmall`, `dialogLarge`, `dialogAlert`, `dialogFloating` and two size roles. They are groups of their own, not parts of `dialog`: the first form, with `small`, `alert` and `floating` as parts, made the sync move `ins.dialog.inlineSize` into a `variant` collection and drop the old variable, which was refused as breaking.
- **FigCraft.** Dialog is now a set of 12 (size, kind, modality) with a header, a body and a footer, an alert without its close button, and a floating one with the shadow. Replacing the old single Dialog needed `--allow-breaking`; nothing used it. No existing variable changed; eight were added. Not drawn: an alert's bar, which a stroke of one colour cannot draw.
- **Checked** in the built-in browser, dark: the edit dialog with its header, close button and footer; `returnValue` heard (`save`); the alert with the red edge and no close button; small 322 px, large 610 px; not modal open with no `:modal` state and the shadow set. Typecheck and tests pass. Not checked: the light scheme, Firefox and Safari, a screen reader.

## Four icons for a format toolbar

> **Asked 2 November 2026:** the icons the BelType studio's toolbar draws.

- **The icons** `bold`, `italic`, `arrow-back-up` and `arrow-forward-up` ship: Bold, Italic, Undo and Redo, by Tabler's names. The studio names them in its own taste; insufferable says nothing of what an icon means.
- **Not done:** the FigCraft library's icon set does not have them yet.
