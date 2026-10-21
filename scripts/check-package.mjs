// Checks what `npm publish` would upload (run after `npm run build`):
//  - only the bundles, their type declarations and the docs;
//  - every entry point in package.json pointing at a file that's actually in the package;
//  - the ES bundle importing exactly the declared dependencies and peer dependencies: an undeclared import breaks in
//    apps, and an unused dependency is installed in every app for nothing.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = fileURLToPath(new URL('..', import.meta.url))
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

// On Windows npm is a .cmd script, which Node only runs through a shell
const packOutput = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
  cwd: root,
  shell: process.platform === 'win32',
})
const [packed] = JSON.parse(packOutput)
const files = packed.files.map((file) => file.path)

const ALLOWED = [
  /^package\.json$/,
  /^README\.md$/i,
  /^LICENSE(\.md)?$/i,
  /^CHANGELOG\.md$/i,
  /^dist\/[^/]+\.(js|cjs)$/,
  /^dist\/.+\.d\.ts$/,
]
const problems = files
  .filter((file) => !ALLOWED.some((pattern) => pattern.test(file)))
  .map((file) => `unexpected file: ${file}`)

// main, module, types, the CDN fields and every exports target (nested conditions included)
const targets = new Set([pkg.main, pkg.module, pkg.types, pkg.unpkg, pkg.jsdelivr].filter(Boolean))
const collect = (value) => {
  if (typeof value === 'string') targets.add(value)
  else if (value && typeof value === 'object') Object.values(value).forEach(collect)
}
collect(pkg.exports)
for (const target of targets) {
  const path = target.replace(/^\.\//, '')
  if (!path.includes('*') && !files.includes(path))
    problems.push(`package.json points at ${target}, which isn't in the package`)
}
if (!files.some((file) => file.endsWith('.d.ts')))
  problems.push('no type declarations (dist/*.d.ts): run the build first')

// The packages the ES bundles import (`@scope/name/sub` → `@scope/name`), compared with the declared ones
const packageName = (specifier) => specifier.split('/', specifier.startsWith('@') ? 2 : 1).join('/')
const imported = new Set(
  files
    .filter((file) => /^dist\/[^/]+\.es\.js$/.test(file))
    .flatMap((file) => ts.preProcessFile(readFileSync(join(root, file), 'utf8'), true, true).importedFiles)
    .map(({ fileName }) => fileName)
    .filter((specifier) => !specifier.startsWith('.'))
    .map(packageName),
)
const declared = new Set(Object.keys({ ...pkg.peerDependencies, ...pkg.dependencies }))
for (const name of imported) {
  if (!declared.has(name)) problems.push(`the ES bundle imports ${name}, which isn't a dependency or peer dependency`)
}
for (const name of declared) {
  if (!imported.has(name)) problems.push(`${name} is a dependency, but the ES bundle doesn't import it`)
}

for (const problem of problems) console.error(problem)
console.log(
  `${packed.name}@${packed.version}: ${files.length} files, ${(packed.size / 1024).toFixed(1)} kB packed, ${problems.length} problem(s).`,
)
process.exitCode = problems.length ? 1 : 0
