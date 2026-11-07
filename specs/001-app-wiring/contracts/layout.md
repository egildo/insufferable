# Contract: what the build writes

For an app, into `<out>` (the config's folder by default), every time, whatever the config says:

```
insufferable.resolver.json    # generated, marked; absent when the config names its own resolver
theme/                        # present when the config has a theme: palette, fonts, light, dark token files
insufferable.css
fonts/
  <prefix>-icons.woff2
  <prefix>-icons.ttf
  archivo-*.woff2, fraunces-*.woff2
components/
  <element>.js, <element>.d.ts  # every element, under the app's prefix
color.js, color.d.ts
commands.js, commands.d.ts
dates.js, dates.d.ts
elements.js, elements.d.ts
icons.js, icons.d.ts          # the app's list, or the system's when the config names none
keys.js, keys.d.ts
```

For the system itself (`node scripts/build.mjs`, no arguments), into `dist/` as today, with the font named
`insufferable-icons`.

`<out>` resolving to the package's own `dist` is refused, as today.
