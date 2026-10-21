# Agent instructions

`@scope/my-lib` is a Vue 3 component library published to npm. Apps install it and use its components, so it must
never change an app's own styles, state or dependencies. (It was created from laravue-package-template.)

## Stack

- Vue 3 with `<script setup lang="ts">`; TypeScript checked with vue-tsc.
- UI building blocks: shadcn-vue on reka-ui, generated into `src/components/ui/`; icons from `@lucide/vue`.
- Styling: Tailwind CSS 4 with the class prefix `ml` (`ml:flex`). The stylesheet is injected by the JavaScript.
- Translations: a small JSON-based i18n in `src/lib/i18n.ts` (not vue-i18n).
- Build: Vite 8 in library mode, two passes: the ES build leaves Vue, reka-ui and the runtime dependencies to the app;
  the UMD build (`--mode umd`) bundles everything except Vue, for `<script>` tags and `require()`.
- Quality: Vitest with Vue Test Utils, ESLint, Prettier, a class-prefix check and GitHub Actions CI.

## Layout

- `src/index.ts`: the public API. Export only from here; `tests/plugin.test.ts` lists every export.
- `src/components/`: the package's components. `src/components/ui/`: generated shadcn-vue primitives.
- `src/lib/`: helpers (`utils.ts` with `cn()`, `i18n.ts`). `src/plugin.ts`: the i18n plugin.
- `src/locales/*.json`: translations. `src/styles/lib.css`: the shipped stylesheet (prefix, tokens, scoped reset).
- `playground/`: the dev app (`npm run dev`). Not part of the package; it imports from `@/index` like an app would.
- `tests/`: Vitest. `scripts/`: the class-prefix check, the package check and the declarations guard.

## Conventions

- Prefix every Tailwind class with `ml:` as its first part (`ml:hover:flex`, not `hover:ml:flex`), also inside `cn()`,
  `cva()` and `:class`. Use theme tokens (`ml:bg-background`, `ml:text-muted-foreground`) rather than fixed colours, so
  theming and dark mode work. Tokens are `--ml-*` variables in `src/styles/lib.css`.
- Space `p`, headings, lists, `blockquote`, `pre`, `figure` and `hr` with margins or padding on the elements themselves,
  or `ml:flex`/`ml:grid` with `ml:gap-*`: the stylesheet's reset beats `ml:space-x-*`/`ml:space-y-*` on them.
- Add shadcn-vue components with `npx shadcn-vue@2.8.2 add <name>` (a fixed version: update it deliberately):
  `components.json` makes them land in `src/components/ui/` with prefixed classes. Leave their formatting as the CLI
  wrote it. Afterwards, check what else it changed: dependencies it added to package.json (runtime libraries belong in
  `dependencies`, reka-ui stays a peer dependency) and `git diff src/styles/lib.css`, which must keep its prefix,
  tokens and reset. Never run `shadcn-vue init` or apply a theme from its CLI: they rewrite the stylesheet.
- Never hard-code user-facing text: add the key to every file in `src/locales/` and read it with `useTranslation()`.
  Placeholders are `{name}` (letters, digits and `_`).
- Document everything exported from `src/index.ts` with JSDoc (`/** … */`), including props and option fields: it's
  what apps see in their editor, and it ships in the `.d.ts` files. `//` comments are for maintainers only.
- Dependencies: `vue` and `reka-ui` are peer dependencies; libraries the components use at runtime are
  `dependencies`; everything else is a dev dependency. A peer range is the oldest version the code needs: don't raise
  it just because the dev dependency was updated.
- Packages are client-only (no SSR): never touch `window` or `document` at import time, and guard with
  `typeof window !== 'undefined'` where needed.
- Keep event handlers in templates to a single statement (`@click="open = true"`); move longer ones into a function.
  Prettier removes the semicolons Vue needs to parse multi-statement handlers, so ESLint rejects them.
- Keep components small and focused; split UI and logic into reusable pieces.

## Quality checks

- Run `npm run check` before finishing a change: type-check, ESLint and the class-prefix check, Prettier, the tests
  with coverage, the build (which fails on type-declaration errors) and the package check. CI runs the same steps.
- Add or update Vitest tests in `tests/` for behaviour changes. Any Vue warning or console error fails a test.
- Record user-facing changes in `CHANGELOG.md` under "Unreleased".
