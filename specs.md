# insufferable — Specifications

> **Audience:** developers and AI coding agents changing the design system. The history, the rulings and the open questions are in [decisions.md](./decisions.md).

---

## Purpose

insufferable is a lean design system of UI elements, used in Egildo's own tools. It is obsessed with the platform and the W3C: where a standard or a native feature exists, it uses that and nothing else.

It ships elements, never a store. An app manages its state however it wants. What insufferable removes is the need for a framework.

Every element it ships is described under [Elements](#elements).

## Principles

1. **Tokens are W3C design tokens.** They are written in the [Format](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/) and the [Resolver](https://www.w3.org/community/reports/design-tokens/CG-FINAL-resolver-20251028/), and read and resolved by `@toghen/lib`.
2. **The stylesheet is written with `@toghen/postcss`.** The tokens become custom properties, cascade layers and mixins at build time.
3. **The selectors are the states themselves.** A state is styled by the ARIA attribute that means it, or by the native pseudo-class where the element is native: `:checked` on a checkbox, `[aria-selected='true']` on a tab. Never a class: a class says what kind of thing an element is, not what state it is in. One attribute is both the meaning and the look.
4. **A native element first.** A custom element only where script is needed, and then it wraps native markup that already works without script. This is the pattern known as HTML Web Components.
5. **A native element is styled by its element name,** in the components layer: `details`, not a class on it. The page's HTML stays bare, and an app's own unlayered rules win over the layer. A custom element is styled by its own name, as `insufferable-tabs`.
6. **A variant is a class.** HTML asks a class to say what the content is, and keeps `data-*` for data no other attribute fits; a kind of button is what `class` is for, and CSS has its own syntax for it. A variant has no ARIA meaning, so it does not borrow one. The stylesheet pairs each class with its element, as `button.solid`, so an app's class of the same name elsewhere is left alone, and `data-*` stays the app's.
7. **ARIA is written as attributes.** ARIA set through `ElementInternals` creates no attribute, so no selector could read it.
8. **Light DOM.** An Invoker command's `commandfor` finds its target by id in the same tree, so a control inside a shadow root could not name an element of the app. The cascade reaches every element for the same reason.
9. **The elements are written in TypeScript,** with no framework.
10. **The FigCraft datasheets are built with the design system,** from the same tokens and components, as `sibardoc-prototype` builds its library: a library of the tokens and the elements first, then a datasheet per element in the library's own look, its prose the element's section here. Each element has a component file beside it (`*.component.kdl`, Toghen's format), and `pnpm figcraft` syncs them with the tokens into `figcraft/insufferable.figcraft` through `@toghen/figma`, with no app open. The datasheets are not built yet: see [the ruling](./decisions.md#the-figcraft-datasheets).
11. **The references are the specifications, MDN and the APG.** An element's markup, roles and keyboard follow the WHATWG and W3C specifications (HTML, CSS, WAI-ARIA, the design token format), [MDN](https://developer.mozilla.org/) for how the platform behaves today, and the [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) for a widget's pattern. A design system's own habit is prior art, never the reference.

## The element contract

> Attributes in, commands out. The element applies its own default unless the app cancels it.

Every element follows it.

- **In: attributes.** The app sets states as ARIA attributes and variants as classes. The element reads them; it keeps no state of its own beyond what the attributes say.
- **Out: commands,** through the [Invoker Commands API](https://developer.mozilla.org/en-US/docs/Web/API/Invoker_Commands_API). A control names its target with `commandfor` and its intent with `command`. An insufferable command starts with `--`, as the platform requires of a custom command.
- **The default.** The element listens for `command` on itself. If the event is not cancelled, it applies its default: a tabs element sets `aria-selected` on the tab chosen. A page with no state management works.
- **Controlled.** An app that owns the state cancels the event and writes the attributes itself.
- **The one exception: a value.** A command carries only its name and its source, so it cannot say how much. The splitter, whose state is a number, speaks as the platform's own range control does: `input` while its value moves, `change` once it settles, the value in `.value`. An app that owns the value writes `aria-valuenow`, and the element follows.

The `command` event does not bubble, but it passes through the capture phase. One listener at the root hears every command before the element does:

```js
document.addEventListener('command', (event) => {
  event.preventDefault();                                 // the app owns this state
  state = update(state, event.command, event.source);
  render(state);                                          // writes the ARIA attributes
}, { capture: true });
```

`event.source` is the control that sent the command. Its `value` carries the payload.

### What the platform keeps

State the platform already holds stays with the platform: whether a popover or a dialog is open, focus, the text being typed into a field. Built-in commands such as `show-modal` and `toggle-popover` go straight to their element. An app that wants to know reads the platform's own events, such as `toggle` and `close`.

## What it holds

```
insufferable/
├── tokens/                          the resolver document and its token files
│   ├── insufferable.resolver.json   one set, its sources in this order, then the theme modifier
│   ├── vocabulary.tokens.json       the states, and how CSS spells them
│   ├── palette.tokens.json          the palette, written by gosfuig from palette.config.json
│   ├── scales.tokens.json           the quanta, then space, border, radius, size, shadow
│   ├── type.tokens.json             the font primitives and the text styles
│   ├── theme.light.tokens.json      the colour roles, light: the theme's default context
│   ├── theme.dark.tokens.json       the colour roles, dark
│   └── page, link, divider, table, callout, tabs, disclosure, icon, button, field, listbox, choice, segmented, dialog, menu, toolbar, count, tag, chips, choices, properties, status, log, tree, shell, progress, spinner, meter, slider, breadcrumb, pagination, card, tooltip, toast, combobox, popover, avatar, skeleton, empty, drawer, calendar .tokens.json   one per element
├── src/
│   ├── index.css                    the layers, the mixins and the imports
│   ├── tokens.css                   the token layer
│   ├── commands.ts                  the command vocabulary
│   ├── keys.ts                      the keyboard rules, as pure functions
│   ├── icons.ts                     the shipped icons, by Tabler's names
│   ├── base.css                     the page's text, in the house fonts
│   └── components/                  one stylesheet per element, and a module where it needs script
├── scripts/build.mjs                writes dist/insufferable.css and dist/fonts/
├── dev/                             one demo page per element
└── test/
```

The shape follows `@toghen/ui`, written in TypeScript. `tsc` writes the modules and their types into `dist/`; the build script writes the stylesheet beside them.

## Tokens

Three tiers in one group, `ins`: primitives (`ins.quanta`, then `ins.space`, `ins.border`, `ins.radius`, `ins.size`, `ins.font`, `ins.motion`), the semantic tier (the colours under `ins.color`, and the text styles `ins.typography`), and one group per element keyed by CSS property, whose values refer to the tiers above. No component token holds a literal.

A state is a part: a subgroup named after its value, such as `ins.tabs.tab.selected`. The vocabulary in the `com.toghen` extension of `ins` spells each value as the platform does:

| Axis | Value | Spelled as |
|---|---|---|
| `variant` | `solid`, `plain`, `danger` | `.solid`, `.plain`, `.danger` |
| `selection` | `selected`, `pressed`, `current` | `:is([aria-selected='true'], :checked)`, `[aria-pressed='true']`, `[aria-current='page']` |
| `disclosure` | `open` | `[open]` |
| `validity` | `invalid` | `:is(:user-invalid, [aria-invalid='true'])` |
| `pointer` | `hover`, `active` | `:hover`, `:active` |
| `focus` | `focus` | `:focus-visible` |
| `availability` | `disabled` | `:is(:disabled, [aria-disabled='true'])` |

A later axis wins over an earlier one, so a disabled tab stays grey under the pointer. Within an axis a later value wins where both match: a control held down is under the pointer too, and `active` comes after `hover`. A variant comes first, and its own states nest under it, as `ins.button.solid.hover`.

A group may spell a value its own way, in its own `com.toghen` extension: a label holding a checkbox is disabled when its input is, `:has(> input:is(:disabled, [aria-disabled='true']))`.

### Quanta

Every dimension is cut from one ladder, `ins.quanta`, in two rows that interleave: Fibonacci, `ins.quanta.fi`, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987; and Lucas, `ins.quanta.lu`, 4, 7, 11, 18, 29, 47, 76, 123, 199, 322, 521. Both grow by the golden ratio, so any two steps two apart stand in proportion. The key is the number itself, in pixels at the browser's default size; the value is written in rem, so the reader's font size scales every dimension. Hairlines, `ins.border`, stay px. This is sibardoc's ladder.

A quantum is pure: it means nothing on screen until a role names it. A role in `ins.space`, `ins.radius`, `ins.size`, `ins.font.size` or `ins.shadow` refers to one; no element token does, and none holds a literal. A step is chosen for the proportion it keeps with its neighbours, and a near miss is moved to it: the side pane's rest width is 322, once 320.

| Role | Quantum | Role | Quantum |
|---|---|---|---|
| `space.1` · `2` · `3` · `4` · `5` | 5 · 8 · 13 · 21 · 34 | `size.control` | 34 |
| `radius.1` · `2` | 8 · 13 | `size.dock` | 55 |
| `size.track` | 29 | `size.side` · `sideMin` · `sideMax` | 322 · 233 · 521 |
| `size.dot` | 8 | `size.measure` | 521 |
| `size.shellNarrow` · `shellPhone` | 987 · 610 | `size.box` | 1rem, the body's size |

The raised shadow is two layers, offsets 2 and 8 with blurs 5 and 21.

### Colours

The colours are in two tiers. **The palette**, `palette` in `tokens/palette.tokens.json`, is five families of twelve steps, `25` to `950`, written by [gosfuig](https://codeberg.org/Toghen/gosfuig) from `tokens/palette.config.json` with `pnpm palette`, in OKLCH with a hex fallback. It is never edited by hand: change the config and run the command. The grey is warm, chroma 0.005 at hue 80, a trace that turns white into paper and black into a deep umber, and its curve is tuned to land on the greys below; the blue and the red are pinned at `600` to the accent and the danger; the green and the amber, for the statuses, are the generator's own.

**The roles**, `ins.color`, are what the elements read. They live in the `theme` modifier, one whole file per context: `tokens/theme.light.tokens.json`, the default, and `tokens/theme.dark.tokens.json`. Each role refers to a step in both:

| Role | Light | Dark | What it is |
|---|---|---|---|
| `ins.color.text.1` · `2` · `3` | `gray.950` · `600` · `400` | `gray.50` · `400` · `600` | Text, quieter text, disabled text |
| `ins.color.surface` | `#fdfcfa`, paper | `gray.950` | The page, a field, a dialog |
| `ins.color.fill` | `gray.25` | `gray.900` | A control under the pointer, a disabled field |
| `ins.color.line` | `gray.100` | `gray.800` | A divider, a disabled edge |
| `ins.color.lineStrong` | `gray.500` | `gray.500` | A control's edge: at least 3:1 on the surface, as WCAG asks of a control's boundary |
| `ins.color.accent` · `accentStrong` · `accentDeep` | `blue.600` · `700` · `800` | `blue.400` · `300` · `200` | The accent, under the pointer, and pressed |
| `ins.color.accentTint` | `blue.25` | `blue.900` | A ground tinted with the accent: a callout |
| `ins.color.onAccent` | white | `gray.950` | Text on the accent |
| `ins.color.danger` | `red.600` | `red.300` | An invalid field |
| `ins.color.dangerTint` | `red.25` | `red.900` | A ground tinted with the danger: a callout that warns |
| `ins.color.desk` | `gray.50` | `#0f0e0d` | The ground an application's panes sit on |
| `ins.color.ok` · `warn` | `green.500` · `amber.500` | `green.300` · `amber.300` | A status in order, a status that needs a look: 4.5:1 on the page |
| `ins.color.raised` | `#fffefd` | `gray.900` | What sits above the page: a menu, a dialog |
| `ins.color.shadow` | black at 9% | clear | A raised surface's shadow: in dark the lighter ground sets it apart |
| `ins.color.shade` | black at 40% | black at 60% | What a modal dialog lays over the page |
| `ins.color.clear` | nothing | nothing | A colour that is not there |

Paper, white, the dark desk and nothing are written as values: none is a step of a family, and a reference cannot change a colour's opacity. In dark the accent is lighter and the text on it dark, so the accent also reads as text on the dark page.

### Themes

The scheme is the element's `color-scheme`. The theme modifier is written with `light-dark()` (`lightDark` in the resolver, read by Toghen), so every role is one declaration holding both colours, and it takes the used scheme of the element it is read on. The page says `color-scheme: light dark`, so the system chooses with no script and no attribute; an app chooses by setting `color-scheme` to `light` or `dark` on the page or on any container, a subtree included. The platform draws its own controls, the select's list and the scrollbars in the same scheme. Only colours can take part, and the theme files hold nothing else; the raised shadow follows because it reads the shadow colour. A modifier needs two contexts: the W3C Resolver forbids one.

### Theming an app

An app themes insufferable with its own CSS after the stylesheet. The stylesheet's rules are in the layers `ins.tokens`, `ins.base` and `ins.components`, and an unlayered rule beats every layered one, so an app's `:root` rule wins with no `!important` and no knowledge of the order. It sets a role, and everything that reads the role follows, since every element's token refers to a role and never a literal.

```css
:root {
  --ins-color-accent: light-dark(#9a3d12, #f0a070);
  --ins-color-accent-strong: light-dark(#7c2f0b, #f5b88f);
  --ins-radius-1: 0;
}
```

`light-dark()` is the platform's way to give one colour for each scheme in one declaration; it reads the page's `color-scheme`, which the base sets to `light dark`. An app's own `light-dark()` colours follow `color-scheme` set on `:root` or on one container, as the stock roles do. `dev/theme.html` is the demo page restyled this way: a terracotta accent in both schemes, with square corners, in ten lines.

What an app may set: any role under `ins.color`, `ins.radius`, `ins.space`, `ins.size` and `ins.font`, by its custom property. What it should set together: a role and its companions (the accent with its strong, deep, tint and the text on it), since the system names them apart so that each pair can be measured. This route does not measure for the app, and it does not regenerate a palette: a brand colour is chosen by hand, and its contrast checked by hand. A derived theme, from a hue and a warmth, with the contrast gate, is `insufferable theme`, below.

#### Building an app's own stylesheet

The deeper route: the app rebuilds the stylesheet from its own tokens, with `insufferable build app.resolver.json`. The app's resolver is a W3C Resolver document that lists the system's base set, then token files of its own, which win by coming later; and the theme modifier, whose two contexts list the system's theme file, then the app's partial one. A partial file names only the roles it changes, so an app need not restate the rest. It may change anything a role names: the radii, the ladder, the fonts, the palette; the build writes `insufferable.css` and its `fonts/` beside the resolver.

The resolver keeps the name `insufferable`. The stylesheet refers to every token, and its two directives, by that name, and the build stops with a message when an app's resolver has another. `examples/app` is the example: the demo page, square, with a terracotta accent and Georgia for the headings, from one resolver and three small token files.

An app may also choose the prefix of the elements: `"$extensions": { "dev.insufferable": { "prefix": "quince" } }` in its resolver. The build then writes `quince-tabs` for `insufferable-tabs`, in the stylesheet and in the element scripts, which it writes into `components/` beside the stylesheet so that the app imports them as before. The rename is made from the list in `src/elements.ts`, the nine elements, and touches only a whole element name: not `--ins-icon-button`, nor the ids the elements generate. A prefix is lower case letters and digits starting with a letter, so that `prefix-name` is a valid custom element name. Custom properties, the token group, commands and classes keep their names; the prefix is for elements.

#### Generating a theme

An app need not write its palette and roles. `insufferable theme theme.config.json` writes them from a small config:

```json
{ "brand": { "hue": 38, "lock": "#9a3d12" }, "neutral": { "hue": 80, "chroma": 0.005 }, "fonts": { "serif": "Georgia" } }
```

The brand is a hue, and optionally a colour pinned to the `600` step, as the system pins its own blue. The neutral is the hue and chroma of the grey. The fonts are family names, each with the system's fallbacks after it; the app loads the faces. The command writes four files into `theme/` beside the config, which the app's resolver lists: `palette.tokens.json`, `fonts.tokens.json`, and `light.tokens.json` and `dark.tokens.json`, the partial role files.

The palette is gosfuig's: the system's own families with the neutral changed and a `brand` family in place of the blue. The roles are not a second table. They are the system's own theme files with every reference to the blue pointed at the brand, so a change to the system's roles reaches every generated theme. Three roles are written values tied to the neutral, and are computed from it in OKLCH: the paper and the raised surface in light, and the desk in dark.

**The gate.** The generator measures every pair of roles the elements use, in both themes: text on surface, raised and fill; the edge of a control, 3:1; the accent on surface, fill and its tint; the text on the accent; danger, ok and warn. The pairs and the ratios they owe are in `scripts/color.ts`. A brand role that falls short moves along the ramp, darker in light and lighter in dark, a step at a time, and the generator says how far; a theme that cannot hold is refused, with every pair named, and nothing is written. The stock system passes unmoved.

The component files for FigCraft refer to tokens by the same names, so an app overrides tokens and does not rename them.

### Typography

A text style is a W3C `typography` token: font family, size, weight, letter spacing and line height, each referring to a primitive under `ins.font`. A component reads a style whole, under the key `font`, and the build writes it as the `font` shorthand and `letter-spacing` (the plugin's `typography: 'font'`).

| Style | Family | Size | Weight | Line height | Read by |
|---|---|---|---|---|---|
| `ins.typography.body` | Archivo | 1rem | 400 | 1.375 | the page (`html`) |
| `ins.typography.label` | Archivo | 13 | 500 | 1.17 | a tab, a summary, a button, a field's label |
| `ins.typography.small` | Archivo | 13 | 400 | 1.375 | small print and a caption (`small`, `figcaption`) |
| `ins.typography.tag` | Archivo | 11 | 600 | 1.375 | a tag and a group's heading, in capitals, tracked 0.5px |
| `ins.typography.dock` | Archivo | 11 | 500 | 1.17 | a word under an icon: a dock button |
| `ins.typography.heading` | Archivo | 21 | 600 | 1.17 | a heading within a section (`h3`) |
| `ins.typography.title` | Fraunces | 29 | 600 | 1.17 | a section's heading (`h2`), a dialog's title |
| `ins.typography.display` | Fraunces | 47 | 600 | 1.17 | the top heading (`h1`) |
| `ins.typography.icon` | tabler-icons | 21 | 400 | 1 | an icon |

The sizes are quanta, in pixels at the default size: `ins.font.size.xs` to `xxl` are 11, 13, 16, 18, 21 and 29, and `display` is 47. Body keeps 1rem, which is on no ladder: it is the browser's own ground, and the user's setting. The smallest is for a tag and a word under an icon; 18 is for a lead and is read by no style yet. `h4` to `h6` take no style of their own: the body style in bold (600). Code takes `ins.font.family.mono`, the platform's `ui-monospace` then `monospace`, and keeps the size of the text around it: a W3C dimension cannot say "the size around it", so code has a family and no style.

### The house fonts

Two variable fonts, installed from npm as Fontsource packages (OFL), with every axis each has:

| Family | Token | Axes | Falls back to |
|---|---|---|---|
| Archivo | `ins.font.family.sans` | weight 100–900, width 62–125% | `system-ui`, `sans-serif` |
| Fraunces | `ins.font.family.serif` | optical size, weight 100–900, softness, wonk | `ui-serif`, `serif` |

Each ships in normal and italic, split into three character sets (Latin, Latin Extended, Vietnamese), each its own file under a `unicode-range`: a page downloads only the sets its text uses. The build copies Fontsource's own face rules into the stylesheet, renamed to the families' own names, and the files into `dist/fonts/`. Fraunces' optical size follows the text size by itself, through the platform's `font-optical-sizing: auto`.

The base layer sets, by element name:

- **The page** in the body style, the text colour and the surface (`ins.page`), in either colour scheme.
- **Every heading** with 24px above it and 8px below, in the body style in bold (`ins.heading`); `h1`, `h2` and `h3` then take the display, title and heading styles (`ins.heading.h1` to `h3`).
- **Small print and a caption** in the small style (`ins.small`), and **code, `kbd`, `samp` and `pre`** in the monospace (`ins.code`).

Everything else inherits, and keeps the browser's own margins: paragraphs, lists, quotes. The base sets no line length; that is the page's. The type page in `dev/` shows the styles, both families across their axes, and an article that uses them all.

## Elements

### Tabs

`<insufferable-tabs>` holding `<button>`s, each naming its panel with `aria-controls`. The panels sit anywhere in the page.

```html
<insufferable-tabs aria-label="Fruit">
  <button aria-controls="apple">Apple</button>
  <button aria-controls="pear">Pear</button>
</insufferable-tabs>
<div id="apple">An apple.</div>
<div id="pear">A pear.</div>
```

- **It writes:** `role="tablist"` on itself; on each tab `role="tab"`, `commandfor`, `command="--select"` unless the tab names another, `aria-selected`, and the roving `tabindex`; on each panel `role="tabpanel"`, `aria-labelledby`, `tabindex="0"` unless it has one, and `hidden` on all but the selected tab's panel. It gives itself an id when it has none.
- **It reads:** `aria-selected`, `disabled` and `aria-disabled` on the tabs, and watches them, so an app that writes them is followed.
- **It sends:** `--select` from the tab chosen, by a click or by the keyboard.
- **Its default:** selects the tab that sent `--select`, unless the tab cannot be chosen.
- **The keyboard:** the arrows move and select (automatic activation), and wrap; Home and End go to the ends; a disabled tab is passed over; right to left, the arrows follow the reading direction. The keyboard's choice is a click on the tab, so it reaches the app as a command like any other.
- **No tab marked:** the first enabled tab is shown.
- **Without script:** every panel shows and the buttons do nothing.

**Pill tabs,** `<insufferable-tabs class="pill">`: the same element, keyboard and commands, drawn without the strip. Each tab is a pill; the selected one sits on the accent's tint, in the accent, 5:1 in light and in dark. Disabled, a tab is grey and clear under the pointer; selected and disabled, it keeps the line's grey ground, so the choice still shows. A count follows a tab's name.

```html
<insufferable-tabs class="pill" aria-label="Pane">
  <button aria-controls="structure">Structure <data value="26">26</data></button>
  <button aria-controls="log">Print log <data value="2">2</data></button>
</insufferable-tabs>
```

Not built: manual activation, a vertical tab list.

### Icon

`<insufferable-icon>` naming a [Tabler icon](https://tabler.io/icons) in its `name` attribute.

```html
<insufferable-icon name="x"></insufferable-icon>
<insufferable-icon name="heart" aria-label="Favourite"></insufferable-icon>
```

- **It reads:** `name`, and `aria-label` or `aria-labelledby`. With a label it is an image with that name (`role="img"`); without one it is decoration (`aria-hidden="true"`).
- **It sends:** nothing.
- **The stylesheet draws it,** with one rule per shipped icon from its name to its character in Tabler's font. The icon draws without script; the script only says what it means, and warns in the console about a name that is not shipped, which draws an empty box.
- **Its colour** is the text colour around it; its size is the icon style's, 1.25rem.
- **Its box** is one em square and clips, and sits on the middle of the text around it.

### The shipped icons

`src/icons.ts` lists the icons insufferable ships, by Tabler's names. The build reads each one's character from Tabler's own stylesheet, fails on a name Tabler does not have, subsets Tabler's font to those characters alone with `subset-font` (HarfBuzz, as WebAssembly), and writes the rules. Ten icons make a font of 1.8 KB; the whole font is 495 KB. To ship an icon, add its name to the list. The list also exports the type `IconName`.

### Disclosure

The native `<details>` and its `<summary>`. There is no custom element and no command.

```html
<details>
  <summary>What is a quince?</summary>
  A hard, fragrant fruit, eaten cooked.
</details>
```

- **The platform does the rest:** it opens and closes the details on a click, Enter or Space, works without script, and keeps one open in a group that shares a `name`.
- **Open is `[open]`,** the platform's own attribute, and the details' `open` part reads it.
- **An app that wants to know** listens for the platform's `toggle` event. It does not bubble; one listener at the root, in the capture phase, hears every one, as it hears commands. It fires after the change and cannot be cancelled: whether a details is open is the platform's state.
- **The selectors are the element names,** `details` and `details > summary`, as every native element is styled.

### Link

The native `<a>` with an `href`, which `:any-link` matches. An `a` with no `href` is no link to the platform, and stays text.

```html
<p>A quince is the fruit of <a href="/cydonia">Cydonia oblonga</a>.</p>
```

- **In the accent, always underlined.** In dark the accent is 2.57:1 against the text around it, under the 3:1 colour alone would need, so the line is what sets a link apart. On the page it is 5.28:1 in light and 5.77:1 in dark.
- **Under the pointer** the strong accent, and the line thickens from 1px to 2px, so the change is not the colour's alone.
- **Focus** is the button's ring, 2px outside.
- **Its font** is the text's around it.
- **Visited** has no colour of its own: the platform lets a page change only a visited link's colour, and a tool rarely needs it.

Not built: a link drawn as a button, a mark for a link that leaves the site.

### Divider

The native `<hr>`, a thematic break: a line across in the line colour, `ins.space.4` above and below. The browser's inset border is cleared.

### Table

The native `<table>`, its cells and its caption, by element name.

```html
<table>
  <caption>Quinces in store</caption>
  <thead><tr><th scope="col">Variety</th><th scope="col">Kilograms</th></tr></thead>
  <tbody><tr><td>Champion</td><td>12</td></tr></tbody>
</table>
```

- **Rows are divided by a line,** and the borders collapse.
- **A header cell, `th`,** is quieter (`text.2`), in the label style, over a stronger line (`lineStrong`). A row's header is one too.
- **Cells start where the text starts,** in either direction, and sit at the top of their row.
- **The caption** is quieter, in the label style, at the start.

Not built: numbers aligned to the end, a row under the pointer. Sorting and selecting a row, and a header that stays at the top, are the table element's, below.

#### Sort and select

`<insufferable-table>` wraps a native `<table>`; without script it is a table whose sort buttons do nothing and whose boxes check.

```html
<insufferable-table>
  <table>
    <thead><tr>
      <th scope="col"><input type="checkbox" aria-label="Select all"></th>
      <th scope="col" aria-sort="none"><button>Variety</button></th>
      <th scope="col" aria-sort="none"><button>Kilograms</button></th>
    </tr></thead>
    <tbody>
      <tr><td><input type="checkbox" aria-label="Select Champion"></td><td>Champion</td><td>12</td></tr>
    </tbody>
  </table>
</insufferable-table>
```

- **A column sorts when its header cell has `aria-sort`** and a `<button>` holds its title, as the Authoring Practices' sortable table has it (https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/). The element writes `commandfor` and `command="--sort"` on the button.
- **`--sort` sets `aria-sort`** on the header that sent it, `ascending` then `descending` at each press, and `none` on the others, and puts the rows of each `<tbody>` in that order. A cell is read as the `value` of a `<data>` or the `datetime` of a `<time>` it holds, else as its text; two numbers sort as numbers, and any other text in the page's language, digits by value, in any case. The sort is stable. An app that holds its rows elsewhere cancels the command, sorts, and writes `aria-sort`.
- **The mark** after the title is a glyph of the icon font: two chevrons while unsorted, an arrow up, an arrow down. The sorted column's title is in the text colour, the others' in the header's quieter one.
- **Selecting is the platform's.** A row is selected by a checkbox in it. The checkbox in the header checks and unchecks the others and shows, as a checkbox does, that only some are checked (`indeterminate`). A row with its box checked takes the accent's tint (`ins.tableRow`, by `:has(:checked)`). The element sends nothing: the checkboxes' own `change` is heard, and the app reads which are checked. `aria-selected` is not written on a row, since it is not allowed on a row of a table; the checkbox says it.
- **The element is a box** that scrolls sideways when the table is wider than it is, and up when the app gives it a height; the header stays at the top of it (`position: sticky`).
- **Not built:** a grid in the Authoring Practices' sense, with the arrows moving from cell to cell and cells that are edited; a column that is resized, moved or hidden; sorting by more than one column; virtual scrolling. Whether any of them is a table or another element is open.

### Callout

A note set apart from the text around it, styled by its role. There is no native element for it: `<aside>` is a landmark, too heavy for a note in the flow.

```html
<div role="note"><p>A quince is too hard to eat raw.</p></div>
<div role="note" class="danger"><p>Do not eat the seeds.</p></div>
<div role="alert" class="danger"><p>The recipe has no title.</p></div>
```

- **`role="note"`** for a note that is part of the page; **`role="alert"`** for one that appears after an action and must be announced, as the platform announces an alert when it is added.
- **A tinted ground and a bar at the start,** in the accent; `class="danger"` in the danger. The tints are pale in light, `blue.25` and `red.25`, because on the next step a link would fall under 4.5:1; every text and link on them keeps it.
- **`class="warn"`** is the warning's tint, `warnTint` (`amber.25` in light, `amber.900` in dark) with a bar in `ins.color.warn`. Text on it is 14:1 or more in both schemes, the bar 4.9:1 or more.
- **It holds any flow content,** paragraphs, lists, an icon; its first and last child sit flush with its edges.

### Button

The native `<button>`. Its keyboard, focus and form behaviour are the platform's.

```html
<button>Keep it</button>
<button class="solid">Discard</button>
<button class="plain" aria-label="Close"><insufferable-icon name="x"></insufferable-icon></button>
```

- **Variants:** outlined by default, `solid` for the main action, `plain` for a quiet one, as its class.
- **States:** the pointer, focus, and disabled by `disabled` or `aria-disabled="true"`. The focus ring is an outline 2px outside the edge.
- **Held down** (`:active`), a button goes one step deeper than under the pointer: the line's grey where hover is the fill, the deep accent where hover is the strong one. A menu item and a segment do the same; links, tabs, the disclosure and the listbox's options do not.
- **A toggle button** has `aria-pressed`; pressed (`"true"`) it takes the accent's ground and the text on it, in any variant, the strong accent under the pointer. The fill would be 1.16:1 against the page, under the 3:1 a state's mark wants. Pressed and disabled, it keeps a grey ground, the line's, with the disabled text, so the state still shows while nothing answers the pointer.
- **Its size:** 2.25rem tall at least (`ins.size.control`), as a field is, so the two sit on one line.
- **A tab and a menu item are buttons too.** The rule sits in `@scope (:root) to (insufferable-tabs, insufferable-menu)`, so it never reaches either, and each element styles its own without undoing anything.
- **An icon button** is a button that holds an icon and is named by `aria-label`, which an icon alone needs anyway: `button[aria-label]:has(> insufferable-icon)`. It is square, as wide as it is tall (`ins.iconButton`), with no padding. Pressed, it takes the accent as any button does: a wash, as other tools draw it, would fall under the 3:1 a state's mark wants.
- **A count** after its name is a `<data>`: see [Count](#count).

Not built: sizes.

### Field

The native `<input>` that takes text, `<textarea>` and `<select>`, each named by a `<label>`.

```html
<label>Email <input type="email" required></label>
<label>Season <select><option>Autumn</option><option>Winter</option></select></label>
```

- **A label holding its field** stacks above it. A label naming its field with `for` stays where it is, in the label style.
- **Invalid** is the platform's `:user-invalid`, which waits until the person has changed the field and left it wrong, or `aria-invalid="true"` set by the app. The edge turns `danger`.
- **Disabled** is `disabled`: a grey fill and grey text.
- **A select** takes the platform's customizable look (`appearance: base-select`) where the browser has it, and stays the browser's own elsewhere.
- **The selector** is every input that takes text, `:where(input:not([type=checkbox], [type=radio], …))`, with no weight of its own.

### Listbox

The native `<select>` drawn as a list: `size` above 1, or `multiple`. No custom element and no command.

```html
<label>Fruit
  <select name="fruit" size="5">
    <option selected>Apple</option>
    <option>Pear</option>
    <option disabled>Fig</option>
  </select>
</label>
```

- **The platform does the rest:** the choice, one or several (`multiple`, with Shift and the platform's modifier), the arrows, the form's value, `change`.
- **The select is a field,** drawn by the field's rule; its options are rows, a chosen one (`:checked`) in the accent, a disabled one grey, and one both chosen and disabled on the line's grey.
- **Exactly `size` rows show.** The platform makes the list `size` rows of its own height, so an option has no room above or below, and the list measures its content box where the field measures its border box.
- **Where the platform lets an option take focus,** as Chrome's customizable select does, the arrows move focus and Space or Enter chooses; the focused option is ringed inside, in the accent, or on a chosen one in the text on the accent. Elsewhere the select takes focus whole, ringed as a field.

Not built: options holding more than text, until the customizable select reaches the list in every browser.

### Checkbox, radio, switch

The native `<input type="checkbox">` and `<input type="radio">`, drawn by the platform in the accent (`accent-color`), and the switch: a checkbox with `role="switch"`.

```html
<label><input type="checkbox" checked> Ripe</label>
<label><input type="radio" name="cook"> Baked</label>
<label><input type="checkbox" role="switch"> Notifications</label>
```

- **Checked is `:checked`,** the selection axis.
- **A label holding one** sits it beside its words, in the body style, and greys with it when it is disabled.
- **The switch** is the input alone: `appearance: none`, its track the background, its thumb a circle in the text colour drawn by a gradient, at the start and, checked, at the end. Right to left it is mirrored. `role="switch"` is both what it means and what draws it. Safari's `switch` attribute is not used: only Safari has it.

### Segmented control

A native radio group drawn as joined segments: `<fieldset class="segmented">` holding `<label>`s, each holding its `<input type="radio">`. No custom element and no command.

```html
<fieldset class="segmented">
  <legend>View</legend>
  <label><input type="radio" name="view" value="list" checked> List</label>
  <label><input type="radio" name="view" value="grid"> Grid</label>
</fieldset>
```

- **The platform does the rest:** one choice, the arrows move it, one tab stop, the form's value, and `change` for an app that wants to know.
- **Each label is a segment;** its circle is hidden and stays focusable. The checked one, `:has(> input:checked)`, takes the accent's ground; a disabled one is grey, and a checked one that is disabled, as in a disabled fieldset, keeps the line's grey ground, so the choice still shows.
- **Focus is drawn around the group,** 2px outside, while the checked segment says which; the group clips the segments to its corners.
- **The legend names the group and is hidden,** since a fieldset's border breaks around a visible one. A label shown beside the control is the page's.
- **The selector** is the stylesheet's own; `segmented` is not a value of the variant axis, which would make the token group `ins.segmented` a part of `ins`.

### Dialog

The native `<dialog>`. There is no custom element and no insufferable command: whether a dialog is open is the platform's.

```html
<button commandfor="discard" command="show-modal">Discard the draft</button>
<dialog id="discard" aria-labelledby="discard-title">
  <h2 id="discard-title">Discard the draft?</h2>
  <form method="dialog">
    <button value="keep" class="plain">Keep it</button>
    <button value="discard" class="solid">Discard</button>
  </form>
</dialog>
```

- **Opened and closed by the platform's own commands:** `show-modal`, `close`, `request-close`. Escape closes a modal one.
- **An app that wants to know** listens for `close` in the capture phase, as it hears `toggle`, and reads `returnValue`: the value of the form's button that closed it.
- **Open,** it lays out what it holds in one column, on the raised surface, `ins.size.measure` wide (32rem) unless the window is narrower. Modal, it lays `ins.color.shade` over the page (`::backdrop`).

Not built: a row for the actions, which the demo page lays out itself. A dialog pinned to an edge is the [drawer](#drawer).

### Menu

`<insufferable-menu popover>` holding `<button>`s, opened by a button whose `commandfor` names it and whose `command` is the platform's `toggle-popover`.

```html
<button commandfor="edit" command="toggle-popover">Edit <insufferable-icon name="chevron-down"></insufferable-icon></button>
<insufferable-menu id="edit" popover>
  <button commandfor="editor" command="--cut">Cut</button>
  <button commandfor="editor" command="--copy">Copy</button>
  <hr>
  <button disabled>Paste</button>
</insufferable-menu>
```

- **Open is the platform's.** The popover opens and closes on the platform's commands, closes on Escape or a click outside, and hands focus back to its button; the platform exposes the button as expanded. An app that wants to know listens for `toggle`; one that wants to refuse an opening cancels `beforetoggle`.
- **It sends no command of its own.** Each item sends what its author gives it; once one is chosen, the element closes the menu, after the item's command.
- **It writes** `role="menu"`, a label from its button (`aria-labelledby`), and `role="menuitem"` and `tabindex="-1"` on each item. It gives itself and its button an id when they have none. An `hr` inside is the platform's separator.
- **The keyboard,** after the WAI-ARIA menu button pattern: on the button, Down opens the menu on its first item and Up on its last; a click opens it on its first. In the menu, Up and Down move and wrap and pass over a disabled item, Home and End go to the ends, Tab closes it and moves on, and Escape closes it.
- **Placed by anchor positioning** under its button, at its start, flipping above when there is no room; a popover takes the button that opened it as its anchor. Without anchor positioning it opens where the browser puts a popover.
- **On the raised surface,** with a shadow in light. An item is a plain button across the menu, in the label style: under the pointer the fill, focused the accent ring inside, as a tab's, since the fill alone is 1.16:1 against the menu.
- **Without script** the popover still opens and closes, and Tab walks its buttons.

Not built: checkbox and radio items (`aria-checked`, `--check`), submenus, finding an item by its first letter.

### Toolbar

`<insufferable-toolbar>` holding `<button>`s: a row of controls with one tab stop.

```html
<insufferable-toolbar aria-label="Format">
  <button class="plain" aria-pressed="false">Bold</button>
  <button class="plain" aria-pressed="true">Italic</button>
  <button class="plain">Clear</button>
</insufferable-toolbar>
```

- **It writes:** `role="toolbar"`; on each button with `aria-pressed`, `commandfor` naming the toolbar and `command="--press"` unless it names another; on each button with `aria-expanded` and `aria-controls`, a disclosure button after the [APG disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/), `commandfor` and `command="--expand"`, and `hidden` on the element it names while it is closed, or, for a popover, shows and hides it, and turns `aria-expanded` back when the platform closes it; the roving `tabindex`, held by the button last focused. It gives itself an id when it has none.
- **It reads:** `aria-pressed`, `aria-expanded`, `disabled` and `aria-disabled` on its buttons, and `aria-orientation` on itself, and watches them.
- **It sends:** `--press` from a toggle button and `--expand` from a disclosure button, on a click, Enter or Space.
- **Its default:** turns the button's `aria-pressed` or `aria-expanded` over, unless the app cancels the command, and shows or hides what a disclosure button names.
- **The keyboard,** after the WAI-ARIA toolbar pattern: the arrows move between the buttons and wrap, following the reading direction, Home and End go to the ends, a disabled button is passed over. With `aria-orientation="vertical"`, the arrows are Up and Down. Moving presses nothing.
- **Its buttons are buttons,** styled as any: the demo writes `class="plain"`. A button that is neither a toggle nor a disclosure is left alone.
- **Without script** the buttons are ordinary buttons in the tab order, and nothing toggles.

### Count

A number after a control's name: `<data value="26">26</data>` inside a `button`, a tab, a `summary`, a `label` or a `legend`. `data` is the platform's element for a value a machine can read.

```html
<button>Messages <data value="3">3</data></button>
```

- **The colour around it.** A count keeps its control's colour, so it keeps that colour's contrast on every ground, the solid button's and the selected tab's included. It is set apart by its weight, regular beside the label's medium (`ins.count`), and its figures are tabular, so a count that changes does not move the name.
- **Only inside a control.** A `data` in running text is left alone.

### Tag

A kind or a status beside a name: `<small class="tag">`. Small capitals on the fill, in the tag's text style (`ins.typography.tag`: 0.75rem, semibold, tracked 0.5px), 12:1 in light and in dark.

```html
<code>cliente</code> <small class="tag">String</small>
```

- **The capitals are the stylesheet's,** `text-transform`, so the text is written as it reads and is spoken as written. The W3C typography type has no member for the case, so it is not a token.
- **Not a control.** A tag that does something is a button.

### Chips

A list of removable values: `<ul class="chips">`, each item its text and a button that removes it.

```html
<ul class="chips" id="declarations" aria-label="Declarations">
  <li><code>hyphens: none</code>
    <button commandfor="declarations" command="--remove" value="hyphens"
            aria-label="Remove hyphens: none"><insufferable-icon name="x"></insufferable-icon></button></li>
</ul>
```

- **It is a list,** so it is announced with its count, and each value with its place.
- **Each button is named by what it removes,** in `aria-label`, since every one draws the same ×.
- **It sends `--remove`** to the list, with the value in the button's `value`. The app, hearing it at the root, removes the value, and moves the focus to the next button or the one before, since the one that had it is gone.
- **No default and no script.** A list that removed its own items would hold state the app owns, and nothing in it needs a keyboard of its own: the buttons are in the tab order.
- **The chip** is a pill on the fill with the line round it, its text in the small style; the button is a circle the size of the icon, grey, the line's grey under the pointer.

Not built: a chip that is itself a choice, a chip list the keyboard moves through with the arrows.

### Choice rows

A radio group drawn as rows: `<fieldset class="choices">` holding `<label>`s, each its `<input type="radio">`, a title in a `<span>`, what the choice reaches in a `<small>`, and a count. It is the segmented control's pattern, rows instead of segments.

```html
<fieldset class="choices">
  <legend>Amend</legend>
  <label><input type="radio" name="scope" checked> <span>This paragraph</span>
    <small><code>#riepilogo-s1-p2</code></small> <data value="1">1</data></label>
</fieldset>
```

- **The platform does the choice:** one checked, the arrows move it, one tab stop, the form's value.
- **The row is the label,** so a click anywhere on it chooses. Its states are its input's, read with `:has(> input:checked)` and `:has(> input:disabled)`: checked, the accent's tint (the description on it 4.8:1 in light, 6:1 in dark); disabled, grey; checked and disabled, the line's grey.
- **The layout** is a grid on the label: the radio button, the title over the description, the count at the end.

### Property rows

An inspector: `<fieldset class="properties">` holding a `<legend>` and `div.property` rows. A row is its mark, its name as a `<label>`, the value's control, a unit's `<select>` if it has one, and a reset button.

```html
<fieldset class="properties">
  <legend>Type</legend>
  <div class="property">
    <input type="checkbox" aria-label="Declare font-size" checked>
    <label for="size">font-size</label>
    <input id="size" inputmode="decimal" value="11">
    <select aria-label="Unit of font-size"><option>pt</option></select>
    <button type="button" class="plain" aria-label="Reset font-size"><insufferable-icon name="restore"></insufferable-icon></button>
  </div>
</fieldset>
```

- **The mark is a checkbox,** drawn as a dot: a ring when clear, filled in the accent when checked. A checked row is one the app will write as a declaration, so the mark is a choice the user makes and undoes, with its own name. The ring is 3.5:1 against the page.
- **The rows share one grid** through `subgrid`, so the names, values and units line up; the reset keeps the last column, so a row with no unit leaves its cell empty.
- **The name is in the monospace,** as a property is written.
- **The reset is an icon button,** Tabler's `restore`, disabled while the value is the one it would return to. The app enables it.
- **The value's controls are the fields,** at their own size until the density is set.
- **A notice in a row** is a callout, the last child of `div.property`, across every column, with its words in a `<p>` and its buttons in a `<div>` at the end. A conflict, another writer's value, is `<div role="alert" class="warn">`: "Changed elsewhere to" and the other value in `<data value>`, then **Take theirs**, which sends `--accept`, and **Keep mine**, which sends `--dismiss`. The buttons name the value's control in `commandfor`; the app owns the value, takes or keeps it, removes the notice and drops the control's `aria-describedby`, which names the notice while it shows. The row is in conflict because it holds the notice: nothing else marks it.

### Status

A status: `<small class="status ok">Synced</small>`, with `ok`, `warn`, `danger` or `off`. A dot: its word is read by assistive technology and not shown, so a page that wants the word seen writes it beside.

- **`new`** is the news dot on a dock button: the danger's colour, a dot. It lives on a dock button, where no other status sits, and its word is read with the button's name, so it shares the dot's shape with `ok`.
- **Each status has its own shape as well as its colour,** since colour alone says nothing to some readers (WCAG's use of colour): a dot for `ok`, a triangle for `warn`, a square for `danger`, a ring for `off`. Without a kind, a grey dot.
- **The colours** are the roles `ok` and `warn`, green and amber, and `danger`; `off` is the strong line's grey. Each is at least 3:1 against the page, in light and in dark, as a graphic must be.

### Log

The lines of something that happened, in order: `<ol class="log">`, each line a `<time datetime>`, a status and what happened, in the small style.

```html
<ol class="log">
  <li><time datetime="10:42">10:42</time> <small class="status ok">Done</small> <span>Printed 2 pages</span></li>
</ol>
```

- **The lines share one grid,** so the times and the dots line up; the times are in the monospace, with tabular figures.
- **An ordered list,** since the order is the meaning.

Not built: a log that follows new lines as they come (`role="log"` on a live region), which is the app's to add.

### Tree

A hierarchical list whose nodes open and close: `<insufferable-tree>` holding a `<ul>`, each `<li>` its row in a `<span>` and, for a parent node, its children in a `<ul>`. It follows the [APG tree view pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/): vertical, single select, selection apart from focus.

```html
<insufferable-tree aria-label="Structure">
  <ul>
    <li aria-expanded="true">
      <span><small class="tag">Section</small> <span>Paola Esempio</span> <code>.envelope</code></span>
      <ul>
        <li aria-selected="true"><span><small class="tag">Paragraph</small> <span>Paola Esempio</span> <code>.name</code></span></li>
      </ul>
    </li>
  </ul>
</insufferable-tree>
```

- **It writes:** `role="tree"` on itself and `none` on the outer list; `treeitem` on each `li`, `group` on each inner `ul`; `aria-labelledby` from each node to its row, so a node is named by its row and not by its children's text too; `aria-selected="false"` on every node not selected; `aria-expanded` on parent nodes only, `false` where the app wrote none, since the pattern says an end node must not carry it; the roving `tabindex`. Level, position and set size are the browser's, computed from the nesting, as the APG's own example shows.
- **It reads:** `aria-expanded` and `aria-selected`, and watches them, so an app that writes them is followed.
- **It sends:** `--select` when a node is chosen, by a click on its row or Enter, and `--expand` when it is opened or closed, by a click on its chevron or the arrows.
- **A node is an `li`,** which cannot send a command through `commandfor`. So the element builds the same event, `new CommandEvent('command', { command, source })`, with the node as its source, and sends it to itself: the app hears it at the root, in the capture phase, as it hears a tab's. Unless the app cancels it, the element applies it.
- **Selection apart from focus.** The arrows move focus and select nothing; the APG warns against selection following focus where selecting does work, as moving a caret does. Focus is a ring on the row, selection the accent's tint, so both show at once.
- **The keyboard, as the APG lists it:** down and up move without opening or closing, and stop at the ends; right opens a closed node, moves into an open one, and does nothing on an end node; left closes an open node, or moves to the parent; Home and End go to the first and the last visible node; Enter selects. Right to left, left and right change places. Type-ahead: a character, or several in quick succession, moves to the next node whose name starts with them, wrapping. A node is found by its own name, its row without its tags.
- **The look:** the chevron is the row's `::before`, Tabler's `chevron-right`, turned down when its node is open and mirrored right to left; an end node keeps its room, so the names line up. A group sits in by `ins.tree.indent`, with a hairline down its parent's chevron, the guide. A row's last `<code>` sits at its end, and a `<data>` count after it shows only while the node is closed, as the count of its children. A row is one line: a label written in an element of its own, `<span>Paola Esempio</span>`, is cut short with an ellipsis and leaves the tag and the code their room; bare text is clipped, since an ellipsis cannot be drawn on text that is not in an element.
- **Without script:** the nested lists, all open, with no chevron.

Not built: multi-select, `*` to open every sibling (optional in the pattern), disabled nodes, nodes loaded as they open.

### Shell

An application on a desk: `<insufferable-shell>` holding, in a row, a dock, the side panes, the main pane, the side panes and a dock. Below a width, a side pane opens over the main pane.

```html
<insufferable-shell>
  <insufferable-toolbar class="dock" aria-orientation="vertical" aria-label="Left panes">
    <button aria-expanded="true" aria-controls="structure"><insufferable-icon name="list-tree"></insufferable-icon> Structure</button>
    <button aria-expanded="false" aria-controls="log"><insufferable-icon name="printer"></insufferable-icon> Print log <small class="status new">new</small></button>
  </insufferable-toolbar>
  <aside class="pane" id="structure" aria-labelledby="structure-title">
    <header><h2 id="structure-title">Structure <data value="26">26</data></h2></header>
    …
  </aside>
  <aside class="pane" id="log" aria-labelledby="log-title">…</aside>
  <main class="pane" aria-labelledby="doc-title">
    <header><h1 id="doc-title">Bolletta della luce</h1> <code>demos/bolletta/index.html</code></header>
    …
  </main>
</insufferable-shell>
```

- **The desk** is the shell's ground, `ins.color.desk`, a step below the surface: the lightest grey in light, black in dark. The panes take the surface, so every control on them keeps the contrast it has on a page.
- **The panes are landmarks:** `aside.pane` (complementary) at a side, `main.pane` in the centre, each named by its heading, so a screen reader moves between them. A pane is a rounded surface with a hairline, and scrolls inside. A side pane is `ins.size.side` wide; the main pane takes the rest; a hidden pane takes no room.
- **The pane's head** is its `<header>`: tabs or a heading, then anything else, and its buttons at the end. Its heading, at whatever level, is in the label style.
- **A group's heading** in a pane is an `<hgroup>`, the platform's element for a heading with a line beside it: the heading in small capitals, in the tag's style, and a `<p>` at the end in small grey. An `hgroup` outside a pane is the document's and keeps its own look.
- **The dock** is the toolbar, `class="dock"` and vertical, a narrow pane of disclosure buttons, each naming its pane. Each button is its icon over its word in the dock's style (0.75rem, medium), square (`ins.size.dock`); open, the accent's tint. A status inside a button, `new`, sits at the icon's corner: the dot that says a closed pane has news, read with the button's name.
- **One pane per side is the app's.** The dock's default opens and closes each pane on its own, as the APG's accordion may; an app that keeps one pane per side hears `--expand` at the root and closes the others.
- **Narrow, a side pane opens over the main pane.** Below `ins.size.shellNarrow` (64rem) the element makes each side pane a popover (`popover="auto"`); its dock opens it, raised, with the raised shadow, between its dock and the far edge, the whole height of the desk, over the shade. The platform closes it on Escape or a click outside, hands focus back to its dock button, and keeps one open at a time; the dock hears it close and says so. Its splitter hides, and the pane takes its own width.
- **A phone, a sheet.** Below `ins.size.shellPhone` (40rem) the same popover is drawn as a sheet from the bottom, the full width, at most 85% of the height, its lower corners square.
- **The widths are read from the tokens** and shown to CSS as custom states, `:state(narrow)` and `:state(phone)`, the platform's own way for an element to show a state that is not ARIA's: a container query cannot read a custom property.
- **Going narrow, the open panes close,** so an overlay does not cover the main pane unasked; going wide, they open as they were, except that a pane open over the others takes its side's place. The element writes `aria-expanded` on their dock buttons for it, and the docks follow.
- **Without script** it is the row at every width.

Not built: the docks at phone width, which keep their room on both sides; a modal sheet, which only a `dialog` can be, with its focus held inside; the colour per pane.

### Splitter

The line between two panes that changes their sizes: `<insufferable-splitter>` between them, `aria-controls` naming the primary pane, the one it sizes. It follows the [APG window splitter pattern](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/), vertical and variable.

```html
<aside class="pane" id="structure" aria-labelledby="structure-title">…</aside>
<insufferable-splitter aria-controls="structure"></insufferable-splitter>
<main class="pane">…</main>
```

- **It writes:** `role="separator"`, `aria-orientation="vertical"`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow`, `tabindex="0"`, and `aria-labelledby` naming its pane's heading, so it takes the pane's name; `hidden` while its pane is hidden or a popover; the pane's `inline-size`, from its value.
- **Its value,** 0 to 100, is the pane's width between its `min-inline-size` and its `max-inline-size` (`ins.size.sideMin` and `sideMax`, 14rem and 32rem): 0 is the pane at its smallest. A splitter given no value starts from the pane's own width.
- **It reads:** `aria-valuenow`, and watches it, so an app that writes it, or `.value`, is followed; its pane's `hidden`.
- **It sends** what a range input sends: `input` while the value moves, `change` once it settles, with the value in `.value`. See the contract's exception.
- **The keyboard, as the APG lists it:** Left and Right move the splitter by 5 on its scale, so which of them grows the pane depends on which side of it the pane is; Home and End go to the pane's smallest and largest; Enter collapses the pane to its smallest and restores it.
- **The pointer** drags it; the pane follows.
- **The look:** the splitter takes over the desk's gap, its negative margins giving the gap back, so panes sit as far apart with a splitter as without. The whole gap answers the pointer. Its grip is a short line in the strong line's grey, longer and darker under the pointer, longer and in the accent while held or focused.

Not built: a horizontal splitter, a fixed one (the APG's two-position kind), F6 between panes.

### Progress, spinner, meter

The native `<progress>`, `<progress class="spinner">` and `<meter>`, each drawn by the stylesheet, none needing script.

```html
<label>Upload <progress value="40" max="100"></progress></label>
<progress class="spinner" aria-label="Loading"></progress>
<label>Disk used <meter min="0" max="100" low="60" high="85" optimum="0" value="72"></meter></label>
```

- **Progress** is a track (`ins.progress`) and its done part (`ins.progressValue`) in the accent, as wide as its container. Without a `value` it is busy (`:indeterminate`) and a light travels along the track once in `ins.motion.sweep`.
- **The spinner** is the same element without a value, drawn as a ring (`ins.spinner`) with one arc in the accent, a `box` across, and turning once in `ins.motion.spin`. A progress without a value is what the platform means by "busy", so it is announced as such; it takes its name from `aria-label` or from the words beside it.
- **Reduced motion.** Where the person asks for less, the light and the ring stand still (`prefers-reduced-motion`). The ring still shows its arc, and the words beside it say what is happening.
- **Meter** is a measure in a known range. The platform's own `low`, `high` and `optimum` sort the value into the best part (`ins.meterOptimum`, `ok`), the middle (`ins.meterSuboptimum`, `warn`) and the worst (`ins.meterWorst`, `danger`). The length says how much and the colour only which part, so the number is written beside it. Each engine names the parts its own way, so each has its own rule; Chrome cannot resolve a percentage height for them, so they take the track's height from its token.
- **Contrast.** The value against the track is 3.5:1 or more in light and in dark (progress 4.0 and 3.5, the three meter parts from 3.6 up). The track against the page is about 1.3 to 1.7: it frames the value and carries nothing the value does not.

### Slider

The native `<input type="range">`: a track (`ins.sliderTrack`) and a round thumb (`ins.sliderThumb`) in the accent. Horizontal only.

```html
<label>Volume <input type="range" min="0" max="100" value="40"></label>
```

- **The platform does the rest:** the value, the arrows, Home and End, Page Up and Down, `step`, `input` and `change`, the form's value.
- **The thumb takes the input's colour** (`currentColor`), so the hover (`accentStrong`) and the disabled (`lineStrong`) are the input's own states. The thumb against the page is 5.1:1 in light and 5.8:1 in dark.
- **The focus ring is round the input,** not the thumb, since a thumb is not an element a stylesheet can ring in every engine.
- **The track is not filled.** The engines do not all draw a filled part, and a bar filled in one and not in another would say two things.

### Breadcrumb

A trail of where the page sits: `<nav aria-label="Breadcrumb">` holding an `<ol class="breadcrumb">`, as the WAI-ARIA Authoring Practices describe it (https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/).

```html
<nav aria-label="Breadcrumb">
  <ol class="breadcrumb">
    <li><a href="/notebook">Notebook</a></li>
    <li><a href="/notebook/recipes">Recipes</a></li>
    <li><a href="#" aria-current="page">Quince paste</a></li>
  </ol>
</nav>
```

- **The page itself is last,** `aria-current="page"`, in the text colour and a medium weight (`ins.breadcrumbCurrent`), with no underline.
- **The mark between two steps** is the tree's chevron (a glyph of the icon font, `ins.breadcrumbSeparator`), drawn by the stylesheet with empty alternative text so nobody hears it, and mirrored right to left. It sits at the end of its step, so a trail that wraps never starts a line with one.
- **No script.**

### Pagination

Pages of a list: `<nav aria-label="Pagination">` holding a `<ul class="pagination">`, an item for each page.

```html
<nav aria-label="Pagination">
  <ul class="pagination">
    <li><a href="?p=1" aria-label="Previous page" aria-disabled="true"><insufferable-icon name="chevron-left"></insufferable-icon></a></li>
    <li><a href="?p=1" aria-current="page">1</a></li>
    <li><a href="?p=2">2</a></li>
    <li><a href="?p=2" aria-label="Next page"><insufferable-icon name="chevron-right"></insufferable-icon></a></li>
  </ul>
</nav>
```

- **A link or a button** per page: a link where each page is an address, a button where the app swaps the page itself. Both are drawn alike (`ins.paginationItem`), square at `control`, a wash under the pointer.
- **The current page** has `aria-current="page"` and takes the accent, with the text on it 5.3:1 in light and 5.8:1 in dark. It is the app that says which page is current: the element keeps no state, and which pages to show, ellipsis included, is the app's.
- **A page out of reach** is `aria-disabled="true"` and goes grey.
- **Right to left.** The previous and next icons are the app's to choose; the stylesheet does not turn them.

### Card

A surface that holds its own content: `<section class="card">`, `<article class="card">`, or a `<div>`.

```html
<article class="card" aria-labelledby="quince">
  <h2 id="quince">Quince paste</h2>
  <p>Hard and sour raw, rose-red cooked.</p>
</article>
```

- **The raised colour with a hairline** (`ins.card`), no shadow: the shadow belongs to what floats, the menu and the dialog.
- **Its children are spaced by the card's gap** and keep no margin of their own, so a heading, a paragraph and a row of buttons sit the same way in any card.
- **A card that stands for a region** is named by its heading, `aria-labelledby`.
- **Not interactive.** A card that is a link or a button is a link or a button that holds a card's content; that is the app's.

### Tooltip

A short hint beside the control that explains it: `<insufferable-tooltip popover="hint">`, named by `interestfor` on the control.

```html
<button class="plain" aria-label="Search" interestfor="search-hint"><insufferable-icon name="search"></insufferable-icon></button>
<insufferable-tooltip id="search-hint" popover="hint">Search the notebook</insufferable-tooltip>
```

- **Never where a person learns something they need.** The control keeps its own name; a tooltip adds to it, and a touch screen may never show it.
- **Where the platform has hints** (`interestfor` and `popover="hint"`, in Chrome since 142), it shows and hides the tooltip, with the delays of the control's `interest-delay`, which are tokens (`ins.tooltipTrigger`, 377 ms before showing and 144 ms before hiding, written on every control with `interestfor`). The element only writes `role="tooltip"` and `aria-describedby` on each control that names it.
- **Where it has not,** the element is the fallback: the tooltip becomes a manual popover, and the element shows it, with the same delays, when the pointer rests on the control or focus reaches it, and hides it when either leaves or on Escape. A touch is ignored. This is the only fallback code the kit carries; it stands there until the platform has the feature in every browser, and is then deleted.
- **The surface** is the inverse of the page: the text colour for the ground and the page's for the text (`ins.tooltip`), small, at most `ins.size.hint` wide. It sits under its control, centred, and flips above when there is no room.
- **No transition:** a tooltip appears at once.

### Toast

A message that comes and goes without being asked for: a region, `<div class="toasts" role="status">`, and its items, `<div class="toast">`.

```html
<div class="toasts" role="status"></div>
<!-- the app puts one in: -->
<div class="toast" id="saved">
  <p>Quince paste saved.</p>
  <button class="plain">Undo</button>
  <button class="plain" aria-label="Dismiss" commandfor="saved" command="--dismiss"><insufferable-icon name="x"></insufferable-icon></button>
</div>
```

- **The region sits in the page from the start, empty,** so that what is put into it is announced, politely. A toast that must interrupt is `role="alert"`, and `class="danger"` makes it an error.
- **No element, and no state.** The app puts each toast in and takes it out, as it does a chip. The time-out is the app's, and it must stop while the pointer or focus is on the toast (WCAG 2.2.1). The close button sends `--dismiss`, which the app hears at the root.
- **Placement:** fixed to the end corner of the window (`ins.toasts`), `ins.size.toast` wide, its toasts one above another, and the region lets the pointer through everywhere but on a toast.
- **The surface** is the card's raised colour with the menu's shadow and a bar at the start, in the accent, or in the danger (`ins.toast`).
- **Not in the top layer.** A menu open over it covers it, and a modal dialog makes everything outside the dialog inert, a toast included: a toast a dialog raises goes in a region inside that dialog.
- **Motion:** a toast comes in with a fade and a short rise, `ins.motion.toast` (233 ms), from `@starting-style`. It leaves at once, since the app removes it. Where motion is reduced, it simply appears.

### Combobox

A text field with suggestions under it, for a value the person may also write themselves: `<insufferable-combobox>` holding an `<input>` that names a `<datalist>`. An editable combobox with list autocomplete, as the WAI-ARIA Authoring Practices describe it (https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

```html
<insufferable-combobox results="{n} results" empty="No matches">
  <label>Variety <input list="variety" name="variety"></label>
  <datalist id="variety"><option value="Champion"><option value="Vranja"></datalist>
</insufferable-combobox>
```

- **To pick one from a fixed list, use a `<select>`:** the platform draws and keeps it, and the field's customizable look (`appearance: base-select`) already styles it. The combobox is for the other case, a value that is free.
- **Without script it is the platform's own datalist.** With script, the element reads the options, takes the `list` attribute off the field, and draws its own list: a popover under the field, as wide as the field, on the menu's raised surface (`ins.combobox`), flipping above when there is no room. It puts the attribute back if the element is removed.
- **Focus stays in the field.** The option a key has reached is `aria-selected` and the field's `aria-activedescendant`; it takes the accent (`ins.comboboxOption`), and the option under the pointer the fill. The element writes `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, and `autocomplete="off"` so the browser's own list does not cover this one.
- **The keyboard.** Down and Up open the list and move the active option, wrapping and passing over a disabled one; Alt with an arrow opens or closes it without moving; Enter chooses the active option, and is the form's when there is none; Escape closes the list, then empties the field; Tab closes it and moves on; Home, End and the caret are the field's. The rules are pure functions in `keys.ts`, tested.
- **Filtering.** The element narrows the datalist by what is typed, in any case and with or without accents (`matches`, tested), over the option's text and its value. An app that narrows the options itself, from a server, says `filter="none"` and rewrites the datalist; the element follows, also while the list is open.
- **Events out are the platform's.** `input` while the person types; when an option is chosen, `input` then `change`, with the value in the field's `.value`. The element keeps no state: the field's value is the value, and the app owns the rest. It speaks as an input does, as the splitter does, since a command could not carry a value.
- **The words are the app's.** `results` is the phrase announced as the list changes, `{n}` for the number; `empty` is the line shown when nothing matches. The element ships no words, so an app in another language is never half in English. With none, nothing is announced and an empty list is not shown, which is a gap an app should not leave. One phrase has one form: a language with plural forms sets the attribute as the count changes.
- **Not in this version:** option groups and rich options (a datalist cannot hold them), multi-select and a tag input (compose chips beside the field, in the app), creating an option, a strict mode that refuses a value that is not listed, and virtual scrolling. Whether the platform will grow an editable combobox of its own is open (Open UI's explainer, https://open-ui.org/components/combobox.explainer); when it does, this element becomes a stylesheet.

### Popover

The native `popover` attribute on a `<div>` or a `<section>`: a panel of any content, under the button that opens it. There is no custom element and no insufferable command.

```html
<button commandfor="share" command="toggle-popover">Share</button>
<div id="share" popover aria-labelledby="share-title">
  <h3 id="share-title">Share the recipe</h3>
  <label>Send to <input type="email" name="to"></label>
  <button class="solid">Send</button>
</div>
```

- **Opened and closed by the platform:** `toggle-popover`, `show-popover` and `hide-popover` commands, light dismiss, Escape, and focus handed back to the button. An app that wants to know listens for `toggle`.
- **The surface** is the menu's, wider and padded (`ins.popover`): raised, a hairline, the raised shadow, at most `ins.size.measure` wide. What it holds is laid out in one column, spaced by its gap, its children with no margin of their own.
- **Placed by anchor positioning** under its button, at its start, flipping above when there is no room, as the menu is.
- **A panel that must be answered is a dialog,** and a list of actions a menu; the popover is for what a person may glance at and leave: a form of two fields, a colour, a definition.
- **An `aside` is left alone.** The shell makes its side panes popovers below a width and draws them itself.
- **Named** by its heading, `aria-labelledby`, or by `aria-label`. It has no role of its own: an app that opens it as a dialog says `role="dialog"`.

### Avatar

A person or a thing, as a picture or as its initials: `<img class="avatar">`, or `<span class="avatar" role="img" aria-label="Paola Esempio">PE</span>`.

```html
<ul class="avatars" aria-label="Editors: Paola Esempio and Giulio Rossi">
  <li><span class="avatar" role="img" aria-label="Paola Esempio">PE</span></li>
  <li><img class="avatar" alt="Giulio Rossi" src="giulio.jpg"></li>
</ul>
```

- **A circle the height of a control** (`ins.avatar`). A picture fills it, cropped to the middle; initials sit centred in the label style, on the accent's tint.
- **Named once.** The picture by `alt`, the initials by `aria-label` on a `role="img"`, so a screen reader says the person, not the letters.
- **A group** is a list, `ul.avatars`: each avatar overlaps the one before by `ins.space.2` and is set off by a ring of `ins.avatars`, in the page's colour. On a card or any other surface the app sets the ring's colour to that surface. A count of the ones left out, `+2`, is an avatar with `aria-hidden`, and the list's `aria-label` names them all.
- **One size.** A smaller or a larger avatar is a size the app asks for; the kit has one control height.

### Skeleton

What stands where content will be while it loads: `<div class="skeleton" aria-hidden="true">`.

```html
<article class="card" aria-busy="true">
  <div class="skeleton circle" aria-hidden="true"></div>
  <div class="skeleton" aria-hidden="true"></div>
  <div class="skeleton" aria-hidden="true" style="inline-size: 70%"></div>
</article>
```

- **A quiet bar,** `ins.size.box` tall, as wide as the space it is given, in the line colour; `class="circle"` is a round one the size of an avatar. The app gives a bar the width of the line it stands for.
- **It is decoration.** It is hidden from assistive technology; the region that loads says so with `aria-busy="true"`, and the app takes that off, with the skeletons, when the content is there. The element keeps no state.
- **It pulses** once in `ins.motion.sweep` (1597 ms), the opacity down to half and back; where motion is reduced, it stands still.
- **Not built:** a shimmer that travels, which is a gradient animated per element and costs more than a pulse does.

### Empty state

A place that has nothing in it yet: `<section class="empty">`, or a `<div class="empty">`.

```html
<section class="empty" aria-labelledby="none">
  <insufferable-icon name="inbox"></insufferable-icon>
  <h2 id="none">No recipes yet</h2>
  <p>Write down the first one, or bring them in from a file.</p>
  <button class="solid">New recipe</button>
</section>
```

- **An icon, a heading, words and the action that fills the place,** each of them optional, centred in a dashed hairline (`ins.empty`). The words are quieter, the heading in the text colour. Its children are spaced by its gap and keep no margin of their own.
- **The dashed line says the place is waiting,** where the card's solid one says it holds something.
- **A place that stands for a region** is named by its heading, `aria-labelledby`.
- **The words are the app's.** The element ships none.

### Drawer

The native `<dialog class="drawer">`, pinned to the end edge of the window and as tall as it. There is no custom element and no insufferable command: whether it is open is the platform's, as for any dialog.

```html
<button commandfor="filters" command="show-modal">Filters</button>
<dialog id="filters" class="drawer" aria-labelledby="filters-title">
  <h2 id="filters-title">Filters</h2>
  <button class="plain" aria-label="Close" commandfor="filters" command="close"><insufferable-icon name="x"></insufferable-icon></button>
</dialog>
```

- **`class="start"`** pins it to the other edge. Right to left turns both.
- **The dialog's surface** (`ins.drawer`): raised, a hairline on the edge that faces the page, the raised shadow, `ins.size.side` wide (20 rem) or the window's width if that is less, the dialog's padding and gap. Modal, it lays `ins.color.shade` over the page.
- **It scrolls** when what it holds is taller than the window.
- **It slides in from its edge and out again,** and the shade fades with it, in `ins.motion.drawer` (377 ms), from `@starting-style` and with `transition-behavior: allow-discrete`, so the platform keeps it drawn until it has left. Where motion is reduced it simply appears.
- **A drawer that is not modal** is opened by `show` and has no shade. The same markup holds, but focus is not kept inside it: use it for a panel the page can be read beside.
- **Not built:** a drawer from the top or the bottom (a sheet: the shell draws one at a phone's width), a drawer that is resized, and one that is pushed in beside the page.

### Calendar

A month of days, one of them chosen: `<insufferable-calendar>`. The date picker grid of the Authoring Practices (https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/), drawn inline.

```html
<insufferable-calendar value="2026-11-02" previous="Previous month" next="Next month"></insufferable-calendar>
```

- **To pick a date in a form, use `<input type="date">`:** the platform draws and keeps it. The calendar is for a month that is on the page, to look at and to choose from; with a popover, an app composes a date picker from the two.
- **The element draws it.** A heading with the month's name between two buttons, and a table of the weeks under the weekdays, a day to a cell, a button in each. Without script there is nothing to see, since the markup is the element's own, as the combobox's list is.
- **Attributes in.** `value` is the chosen date, `YYYY-MM-DD`; `month` is the month shown, `YYYY-MM`, the value's when it is not set and today's when there is no value; `min` and `max` bound the days that can be chosen, a day outside them being `aria-disabled`; `firstday` is the first day of the week, 1 Monday to 7 Sunday, the language's when it is not set. The language is the nearest `lang`: the month, the weekdays and the numerals are written in it by `Intl`, and the weeks follow its week info.
- **The words are the app's.** `previous` and `next` name the two buttons; the element ships none, and warns once in the console when they are missing.
- **Commands out.** A day sends `--select`, with its date in its `value`; the two buttons send `--show`, with the month they lead to, `YYYY-MM`. Unless the app cancels the command, the element writes `value`, or `month`. An app that owns the state cancels and writes the attributes itself; the element draws again.
- **The keyboard** follows the Authoring Practices: the arrows move a day or a week (Left and Right follow the reading direction), Home and End go to the week's ends, Page Up and Page Down a month, with Shift a year; Enter and Space choose. Only the focused day is in the tab order. A move into the neighbouring month goes through `--show` as the button's click does, so an app that owns the month hears it; a move by a year writes `month` itself. The rules are pure functions in `dates.ts`, tested.
- **It writes:** `role="grid"` on the table and `aria-labelledby` naming the heading, `aria-selected` on each cell, `aria-current="date"` on today, the weekday's full name as `abbr` on its heading, and a full date as each day's `aria-label`, so a screen reader says the weekday and the month, not a bare number. The heading is a polite live region, so a change of month is announced.
- **The look.** A day is a button the size of a control: the fill under the pointer, the accent for the chosen day, a ring in the accent for today, a quiet colour for a day out of range. The table's own cell rules, the line under a row and the padding, are taken off inside it.
- **Not built:** a range, several chosen days, a week number, a day that carries something (a dot, a count), a year and a month list to jump by, other calendars than the Gregorian (`Intl` writes them, but the grid is Gregorian's), and a day outside the month drawn dimmed in the first and last week.

### Motion

The system's first motion, kept to what a spinner and a busy bar cannot do without: `ins.motion.spin` (987 ms) and `ins.motion.sweep` (1597 ms), then a toast's entrance (`toast`, 233 ms), a drawer's slide (`drawer`, 377 ms) and a hint's two delays (`hintShow`, 377 ms, and `hintHide`, 144 ms): Fibonacci numbers in milliseconds, on the same ladder as the dimensions. They are `duration` tokens, which FigCraft has no variable for, so the library skips them. The skeleton's pulse takes the sweep's duration. There are no other transitions: a state changes at once. Every animation stands still where the person asks for less motion.

## Commands

A command is named after the ARIA state it sets, as a verb: `aria-selected` gives `--select`, `aria-expanded` gives `--expand` (a tree node's; not the menu's, since a popover's open state is the platform's), `aria-pressed` `--press`, `aria-checked` `--check`. A command that sets no state is named after what it asks for, and has no default: `--remove`. One that changes what an element shows, with no ARIA state to name it, is named after that and has a default all the same: `--show` writes the calendar's `month`. No prefix: a command reaches one target, and the app tells the elements apart by `event.target`. Ruled 27 October 2026; see [decisions.md](./decisions.md#the-first-command-select).

| Command | Sent by | Sets |
|---|---|---|
| `--select` | a tab, a tree node | `aria-selected="true"` on the tab, `false` on its siblings |
| `--press` | a toggle button in a toolbar | `aria-pressed` on the button, turned over |
| `--expand` | a tree node, a disclosure button in a toolbar | `aria-expanded` on the node, turned over |
| `--remove` | a chip's button | nothing: it asks the app to remove the value, and has no default |
| `--dismiss` | a toast's close button, a conflict's "Keep mine" | nothing: it asks the app to put the notice away, and has no default |
| `--accept` | a notice's button, a conflict's "Take theirs" | nothing: it asks the app to take the value the notice offers, and has no default |
| `--sort` | a sortable column's button | `aria-sort` on its header, `none` on the others, and the rows in that order |
| `--show` | a calendar's month buttons | the calendar's `month`, from the button's `value` |

`src/commands.ts` exports them as `commands`, so an app reads the names from one place.

## Open questions

- **Tabler's other cuts.** Tabler ships its icons in stroke weights 200 and 300 and filled, each a font of its own. Only the regular cut ships; the others could be faces of the same family at their weights.
- **The house fonts' other axes.** Archivo's width and Fraunces' softness and wonk are not tokens; the W3C typography type has no member for them.
