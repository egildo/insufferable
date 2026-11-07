# Contract: the `insufferable` command

```
insufferable build [config]     # config: a path to insufferable.config.json; default ./insufferable.config.json
insufferable init [dir]         # dir: where to write the starter; default .
```

`theme` is removed. A call with another word, or `build` with a file that is not there, prints the usage and the
missing file's resolved path and exits 2.

## `build`

1. Reads the config; stops with exit 1 on the first validation failure (see `data-model.md` for the order).
2. When `theme` is present, generates `theme/` beside the config; a refused theme stops with the gate's message.
3. Writes `<out>/insufferable.resolver.json`, or uses `resolver` as it is.
4. Loads the document; runs the token-path check; stops naming the path and the file on a failure.
5. Builds the stylesheet and writes the layout (see `layout.md`).
6. Prints the stylesheet's path and size, as today.

## `init`

Writes `insufferable.config.json`, `icons/.gitkeep` and `index.html` into `dir`. Refuses, naming the file, when
`insufferable.config.json` already exists there. The page links `insufferable.css`, imports `components/tabs.js`
and `components/icon.js`, and shows a heading, a paragraph, a solid button and a tabs element, so the first build
draws something.

## Messages

Every message names the thing: the key and the accepted keys; the path as resolved; the token path and its file;
the value and its rule. No message says only "invalid".
