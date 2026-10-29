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
