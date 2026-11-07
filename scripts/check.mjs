/**
 * The check that stops a build on a token path the system does not define. A typo in an override, `ins.radius.3` for
 * `ins.radius.2`, would otherwise become a custom property nothing reads, and the page would look wrong without a word.
 *
 * What `@toghen/lib`'s `origins` holds, measured on 7 November 2026 against version 0.1.1, with a resolver named
 * `m` and one named `ins`: a key is the token's whole path as the file writes it, so `ins.radius.1` keeps
 * its `ins` whatever the collection is called, and groups are not keys. A file is named as its `$ref` led there, with
 * `.` and `..` folded but symbolic links kept, so a package reached through `node_modules` is named under
 * `node_modules` while `systemDir` may be its real folder: both sides are compared by their real paths. A source
 * written inline in a resolver is attributed to the resolver document, and contexts of a modifier count as any set.
 */

import { realpathSync } from 'node:fs';
import { sep } from 'node:path';

/**
 * Every `ins.*` path an app file defines must also be defined by a system file. `origins` is @toghen/lib's
 * `result.origins`; `systemDir` the package's `tokens/` folder, absolute. Throws naming the first path and file.
 */
export function checkOverrides(origins, systemDir) {
  const system = realpathSync(systemDir) + sep;
  const inSystem = (file) => realpathSync(file).startsWith(system);
  for (const [path, files] of origins) {
    if (path.startsWith('ins.') && !files.some(inSystem)) {
      throw new Error(`The token ${path} in ${files[0]} is not one of the system's: a path under ins must exist in the system; an app's own tokens take the app's own group.`);
    }
  }
}
