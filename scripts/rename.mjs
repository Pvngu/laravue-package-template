// Renames the template's placeholders for a new package, in every text file, then removes the template's own setup
// (this script, its npm script and the README section about starting a package):
//   npm run rename -- @acme/date-picker                 (DatePicker and the prefix dp are derived)
//   npm run rename -- @acme/date-picker DatePicker dp   (or given explicitly)
//
// Placeholder        becomes (for @acme/date-picker)
//   @scope/my-lib    @acme/date-picker        package name
//   my-lib           date-picker              bundle file names, i18n key, repository URL
//   MyLib            DatePicker               UMD global, MyLibI18n, MyLibI18nOptions
//   myLib            datePicker               $myLibT
//   ml               dp                       class prefix (ml:flex), CSS tokens (--ml-*), tailwind-merge
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const self = fileURLToPath(import.meta.url)
const [name, pascalArg, prefixArg] = process.argv.slice(2)

const usage = 'Usage: npm run rename -- <package-name> [PascalName] [prefix]   e.g. npm run rename -- @acme/date-picker'
if (!name || !/^(@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(name)) {
  console.error(usage)
  process.exit(1)
}
const fail = (message) => {
  console.error(`${message}\n${usage}`)
  process.exit(1)
}

const kebab = name.replace(/^@[^/]+\//, '')
const words = kebab.split(/[^a-z0-9]+/).filter(Boolean)
const pascal = pascalArg ?? words.map((word) => word[0].toUpperCase() + word.slice(1)).join('')
const camel = pascal[0].toLowerCase() + pascal.slice(1)
// The initials (date-picker: dp), or the first two letters of a one-word name (charts: ch)
const letters = words.map((word) => word.replace(/[^a-z]/g, '')).filter(Boolean)
const initials = letters.map((word) => word[0]).join('')
const prefix = prefixArg ?? (initials.length >= 2 ? initials : letters.join('').slice(0, 2))

if (!/^[A-Z][A-Za-z0-9]*$/.test(pascal)) fail(`"${pascal}" isn't a PascalCase name: pass one after the package name.`)
// Tailwind only accepts lowercase letters; one letter collides too easily with other packages' prefixes
if (!/^[a-z]{2,}$/.test(prefix)) fail(`The class prefix "${prefix}" must be two or more lowercase letters a-z.`)

// A prefix named like a variant (md, sm, dark, hover, …) would give the package classes such as `md:flex`, which the
// package's stylesheet would then apply unconditionally to the app's own `md:flex` elements
let loadDesignSystem
try {
  ;({ __unstable__loadDesignSystem: loadDesignSystem } = await import('@tailwindcss/node'))
} catch {
  fail('Run npm install first.')
}
const designSystem = await loadDesignSystem("@import 'tailwindcss';", { base: root })
if (designSystem.getVariants().some((variant) => variant.name === prefix)) {
  fail(`The class prefix "${prefix}" is the name of a Tailwind variant (as in ${prefix}:flex): choose another one.`)
}

// One pass over each file, so a new name that contains a placeholder (@acme/my-lib-pro) isn't renamed twice
const values = new Map([
  ['@scope/my-lib', name],
  ['MyLib', pascal],
  ['myLib', camel],
  ['my-lib', kebab],
  ['ml:', `${prefix}:`],
  ['--ml-', `--${prefix}-`],
  ['prefix(ml)', `prefix(${prefix})`],
  ["prefix: 'ml'", `prefix: '${prefix}'`],
  ['"prefix": "ml"', `"prefix": "${prefix}"`],
  ['`ml`', `\`${prefix}\``],
])
// The class prefix only where it is one: never inside words such as "html:"
const PLACEHOLDER =
  /@scope\/my-lib\b|\bMyLib|\bmyLib|\bmy-lib\b|(?<![\w-])ml:|--ml-|prefix\(ml\)|prefix: 'ml'|"prefix": "ml"|`ml`/g

// The template's own setup, removed from the new package
const cleanups = new Map([
  ['README.md', (text) => text.replace(/<!-- template:start -->[\s\S]*?<!-- template:end -->\n+/, '')],
  [
    'package.json',
    (text) => {
      const pkg = JSON.parse(text)
      delete pkg.scripts.rename
      return `${JSON.stringify(pkg, null, 2)}\n`
    },
  ],
])

const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', '.git'])
const TEXT = new Set(['.ts', '.vue', '.js', '.mjs', '.cjs', '.json', '.css', '.md', '.html', '.yml', '.yaml', ''])

// Regular text files only: symlinks (e.g. a linked node_modules) and folders in SKIP_DIRS are left alone
function* files(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* files(path)
    } else if (entry.isFile() && TEXT.has(extname(entry.name)) && path !== self) {
      yield path
    }
  }
}

// Work out every change first and write them all at the end, so a failure leaves nothing half-renamed
const changes = []
let renamed = 0
for (const path of files(root)) {
  const before = readFileSync(path, 'utf8')
  const replaced = before.replace(PLACEHOLDER, (match) => values.get(match))
  if (replaced !== before) renamed++
  const after = cleanups.get(relative(root, path))?.(replaced) ?? replaced
  if (after !== before) changes.push({ path, after })
}

if (renamed === 0) fail('No placeholders found: this package was already renamed.')

for (const { path, after } of changes) writeFileSync(path, after)
rmSync(self)

// Longer or shorter names change line lengths: let the project's Prettier re-wrap what was renamed
try {
  const prettier = join(root, 'node_modules/prettier/bin/prettier.cjs')
  const paths = changes.map(({ path }) => path)
  execFileSync(
    process.execPath,
    [prettier, '--write', '--log-level=warn', '--no-error-on-unmatched-pattern', ...paths],
    {
      stdio: 'inherit',
    },
  )
} catch {
  console.warn('Prettier failed: run npm run format.')
}

console.log(`Renamed to ${name} (${pascal}, $${camel}T, prefix ${prefix}:) in ${renamed} files:`)
for (const { path } of changes) console.log(`  ${relative(root, path)}`)
console.log(`Removed scripts/rename.mjs, the "rename" npm script and the template section of README.md.

Next:
  1. npm install                (refreshes package-lock.json)
  2. Fill in package.json (description, author, repository), the holder in LICENSE and the README's first lines
  3. Replace the example HelloCard with your components. It appears in:
       src/components/HelloCard.vue and tests/components/HelloCard.test.ts
       src/index.ts (its export) and tests/plugin.test.ts (the list of exports)
       playground/App.vue, the README's Usage section, and the hello.* keys in src/locales/*.json
  4. npm run check
  5. On GitHub: Settings > Advanced Security, turn on Dependabot alerts and security updates`)
