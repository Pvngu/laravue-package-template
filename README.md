# @scope/my-lib

TODO: one or two sentences about what my-lib is for.

<!-- template:start -->

> **Starting a new package from this template** (`npm run rename` removes this section)
>
> 1. Create the repository: "Use this template" on GitHub, `gh repo create <name> --template <this repo> --clone`, or
>    clone it and start a fresh history (`rm -rf .git && git init`).
> 2. `npm install` (Node 22, see [Development](#development))
> 3. `npm run rename -- @acme/date-picker`: renames every placeholder (`@scope/my-lib`, `my-lib`, `MyLib`, `$myLibT`
>    and the class prefix `ml`), then removes the rename script and this section. The PascalCase name and the prefix
>    (the initials, `dp`) are derived; pass them after the name to choose them (`DatePicker dp`). A prefix is two or
>    more lowercase letters, and not a Tailwind variant such as `md` or `sm`.
> 4. `npm install` again (it refreshes package-lock.json), then fill in package.json (`description`, `author`,
>    `repository`), the name in LICENSE and the first lines of this README.
> 5. Replace the example `HelloCard` with your components. It appears in `src/components/HelloCard.vue`,
>    `tests/components/HelloCard.test.ts`, `src/index.ts` (its export), `tests/plugin.test.ts` (the list of exports),
>    `playground/App.vue`, the Usage section below and the `hello.*` keys in `src/locales/*.json`.
> 6. `npm run check`
> 7. On GitHub, under Settings > Advanced Security, turn on Dependabot alerts and security updates. Dependabot's
>    version updates (`.github/dependabot.yml`) and CI start on their own.

<!-- template:end -->

## Install

```bash
npm install @scope/my-lib
```

`vue` (3.5 or newer) and `reka-ui` (2.x) are peer dependencies: npm 7+ installs them if the app doesn't have them yet,
and an app that uses shadcn-vue already does. Sharing reka-ui with the app means the package's dialogs and popovers
work inside the app's, and the reverse.

The package's styles come with its JavaScript: nothing to import. This package is client-only: it doesn't support
server-side rendering.

## Usage

```ts
// main.ts
import { createApp } from 'vue'
import { MyLibI18n } from '@scope/my-lib'
import App from './App.vue'

createApp(App).use(MyLibI18n).mount('#app')
```

```vue
<script setup lang="ts">
import { HelloCard } from '@scope/my-lib'
</script>

<template>
  <HelloCard name="Ada" @wave="(count) => console.log(count)" />
</template>
```

Types ship with the package.

## Translations

The package ships in English and Spanish. Pick the language when installing the plugin, or change it at runtime:

```ts
import { MyLibI18n, setLocale } from '@scope/my-lib'

app.use(MyLibI18n) // from <html lang>, then the browser's language
app.use(MyLibI18n, { locale: 'es' }) // or explicitly; 'es-MX' and 'ES' work too
setLocale('en') // change it at any time
```

The language is one setting for the whole page. `currentLocale` and `availableLocales` tell you the language in use
and the bundled ones. In components, use `useTranslation()`; in templates, `{{ $myLibT('hello.anonymous') }}` works
too. Outside components, `translate()` reads the bundled locales.

To use the app's own i18n (vue-i18n, i18next, …) instead, pass a translator:
`app.use(MyLibI18n, { translate: (key, params, fallback) => … })`. The package's components and `$myLibT` then call
it with the package's keys, listed in [src/locales/en.json](src/locales/en.json), and the `locale` option and
`setLocale()` no longer change their language: the app's i18n does.

## Styling and theming

- Every class in the package is prefixed (`ml:flex`, `ml:hover:bg-accent`), so the app's Tailwind classes and the
  package's never affect each other. There is no global reset: a small reset applies only to the package's elements.
- Colours and radius are CSS variables (`--ml-primary`, `--ml-background`, `--ml-border`, `--ml-radius`, …). Set
  them on `:root` to restyle the package, and on `.dark` too, or the value applies in both modes. Your values win
  whatever order the stylesheets load in, whether your CSS is unlayered or in `@layer base`.
- Dark mode follows a `dark` class on an ancestor, usually `<html>`, like shadcn-vue apps.
- Text uses the app's font.
- Content you pass into the package's slots is inside its elements, so its reset applies there too: paragraphs,
  headings and lists have no margins, and on those elements the reset beats the app's own Tailwind margin and padding
  classes (wrap them in a `<div>` with the classes instead). The app's Tailwind border-colour classes don't apply
  anywhere inside the package: borders use `--ml-border`, so that a global `* { border: 0 }` in the app can't blacken
  them.
- The styles are added to the page in a `<style>` element. With a Content Security Policy, `style-src` must allow it
  (`'unsafe-inline'`, or a nonce or hash).

## Without a bundler

`dist/my-lib.iife.js` works in a `<script>` tag after Vue, and exposes `window.MyLib`. It bundles reka-ui and the other
dependencies, so it needs only Vue:

```html
<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
<script src="https://unpkg.com/@scope/my-lib"></script>
```

`require('@scope/my-lib')` loads the same self-contained build (`dist/my-lib.umd.cjs`), with its own copy of reka-ui.
Apps with a bundler get the ES build, which shares the app's.

## Developing against an app

Building the package and installing the tarball in the app is the closest to what users get:

```bash
npm run build && npm pack           # in this repo: prints the name of the .tgz it created
npm install ../my-lib/<that .tgz>   # in the app
```

`npm link` (or a `file:` dependency) is quicker to iterate with, but the linked package resolves its peer dependencies
from its own folder. `@vitejs/plugin-vue` already makes Vite use the app's Vue; add reka-ui to the app's
`vite.config.ts` so there's one copy of it too:

```ts
resolve: { dedupe: ['reka-ui'] }
```

and, for the app's type-check, `"vue": ["./node_modules/vue"]` under `compilerOptions.paths` in the tsconfig that
covers its source (`tsconfig.app.json` in a Vite app). Rebuild the package (`npm run build`) after each change: the
app loads `dist/`.

## Development

Use Node 22 (`nvm use` reads `.nvmrc`): 22.13 or newer, and the latest 22 avoids `EBADENGINE` warnings on install.

```bash
npm run dev            # the playground (playground/App.vue)
npm test               # Vitest, once (npm run test:watch while working)
npm run lint           # ESLint and the class-prefix check
npm run format         # Prettier
npm run type-check     # vue-tsc on src, playground, tests and the config files
npm run build          # dist/: the ES, UMD and IIFE bundles and the .d.ts files
npm run check          # all of the above, with coverage and the package check, as CI runs it
```

`npm publish` runs `npm run check` first. CI (`.github/workflows/ci.yml`) runs the same steps on every push to `main`
and every pull request, and Dependabot keeps the dependencies and the pinned actions current.

```
src/
  index.ts                 the public API
  plugin.ts                the i18n plugin
  components/              the package's components (HelloCard is the example)
    ui/                    shadcn-vue primitives, generated by its CLI
  lib/                     helpers: cn(), i18n
  locales/                 en.json, es.json
  styles/lib.css           the shipped stylesheet: prefix, tokens, scoped reset
playground/                the dev app, not part of the package
tests/                     Vitest (setup.ts fails a test on any Vue warning)
scripts/                   the class-prefix check, the package check, the declarations guard
```

Conventions for contributors and coding agents are in [AGENTS.md](AGENTS.md). Record user-facing changes in
[CHANGELOG.md](CHANGELOG.md).

## License

MIT
