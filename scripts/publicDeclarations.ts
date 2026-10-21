import { dirname, join, normalize, relative, sep } from 'node:path'
import ts from 'typescript'

export interface PublicDeclarations {
  // The declaration files the types entry reaches: what apps' TypeScript loads
  reached: Set<string>
  // Imports that would break those types in an app
  problems: string[]
  // The reached files whose relative imports needed a file extension, with the extension added
  rewritten: Map<string, string>
}

/**
 * Follows the imports of the package's types entry through the emitted declaration files (path → content).
 *
 * Only `packages` (the package's dependencies and peer dependencies) may be imported: anything else, like a dev
 * dependency bundled into the JavaScript, isn't installed in apps, so its types would be missing (or silently `any`).
 *
 * Relative imports get the `.js` extension of the file they point at (`./plugin` → `./plugin.js`, `./Card.vue` →
 * `./Card.vue.js`, `./button` → `./button/index.js`): in a `"type": "module"` package, apps whose TypeScript uses
 * `moduleResolution: node16` or `nodenext` can't resolve them without it. Bundler resolution reads both forms.
 */
export function publicDeclarations(files: Map<string, string>, entry: string, packages: string[]): PublicDeclarations {
  const reached = new Set<string>()
  const problems: string[] = []
  const rewritten = new Map<string, string>()
  const pending = [normalize(entry)]

  for (let file = pending.pop(); file !== undefined; file = pending.pop()) {
    if (reached.has(file)) continue
    const content = files.get(file)
    if (content === undefined) {
      problems.push(`${file}: not emitted`)
      continue
    }
    reached.add(file)

    // TypeScript's own scanner: real imports, `import('…')` types and `/// <reference types>`, not text in comments
    const { importedFiles, typeReferenceDirectives } = ts.preProcessFile(content, true, true)
    const edits: { start: number; end: number; text: string }[] = []
    for (const { fileName: specifier, pos } of [...importedFiles, ...typeReferenceDirectives]) {
      if (specifier.startsWith('.')) {
        const target = resolveDeclaration(files, join(dirname(file), specifier))
        if (!target) {
          problems.push(`${file}: "${specifier}" wasn't emitted`)
          continue
        }
        pending.push(target)
        // For an import, `pos` is the specifier's opening quote
        const withExtension = importPath(file, target)
        if (withExtension !== specifier && content.startsWith(specifier, pos + 1) && /['"]/.test(content[pos])) {
          edits.push({ start: pos + 1, end: pos + 1 + specifier.length, text: withExtension })
        }
      } else if (!packages.some((name) => specifier === name || specifier.startsWith(`${name}/`))) {
        problems.push(`${file}: imports "${specifier}", which apps don't install with this package`)
      }
    }
    // From the last one back, so each edit leaves the positions before it valid
    if (edits.length > 0) {
      const sorted = edits.sort((a, b) => b.start - a.start)
      rewritten.set(
        file,
        sorted.reduce((text, { start, end, text: value }) => text.slice(0, start) + value + text.slice(end), content),
      )
    }
  }

  return { reached, problems, rewritten }
}

// The path an import in `from` needs to reach the declaration file `to`: `./plugin.d.ts` → `./plugin.js`
function importPath(from: string, to: string): string {
  const path = relative(dirname(from), to)
    .split(sep)
    .join('/')
    .replace(/\.d\.ts$/, '.js')
  return path.startsWith('.') ? path : `./${path}`
}

function resolveDeclaration(files: Map<string, string>, base: string): string | undefined {
  const candidates = [`${base}.d.ts`, base.replace(/\.js$/, '.d.ts'), `${base}.vue.d.ts`, join(base, 'index.d.ts')]
  return candidates.find((path) => path.endsWith('.d.ts') && files.has(path))
}
