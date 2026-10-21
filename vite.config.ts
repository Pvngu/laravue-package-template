import { readFileSync, readdirSync, rmdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, normalize, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import dts from 'vite-plugin-dts'
import { publicDeclarations } from './scripts/publicDeclarations.ts'

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url))
const pkg = JSON.parse(readFileSync(fromRoot('./package.json'), 'utf8'))

// Bundle file names come from the package name: @scope/my-lib → dist/my-lib.es.js, .umd.cjs and .iife.js
const FILE_NAME = pkg.name.replace(/^@[^/]+\//, '')
// .cjs: in a "type": "module" package, Node reads a .js file as ESM, which breaks require(). CDNs serve a .cjs file with
// a type browsers may refuse to run, so <script> tags get the .iife.js file.
const EXTENSIONS: Record<string, string> = { es: 'es.js', umd: 'umd.cjs', iife: 'iife.js' }
// The browser global of the UMD and IIFE builds: window.MyLib
const GLOBAL_NAME = 'MyLib'

// What the ES build leaves to the app: Vue, reka-ui (one shared copy, so the package's dialogs and popovers nest with
// the app's) and the runtime dependencies (installed with the package, deduplicated and tree-shaken by the app)
const shared = Object.keys({ ...pkg.peerDependencies, ...pkg.dependencies })
const isShared = (id: string) => shared.some((name) => id === name || id.startsWith(`${name}/`))

// Publish only the declarations the types entry reaches, and fail when one imports a package apps don't install with
// this one: its types would quietly turn into `any`. The rest can't be imported through the package's exports anyway.
// Relative imports get their `.js` extension, which apps on `moduleResolution: nodenext` need.
function keepPublicDeclarations(emitted: Map<string, string>) {
  const files = new Map(
    [...emitted].filter(([path]) => path.endsWith('.d.ts')).map(([path, content]) => [normalize(path), content]),
  )
  const { reached, problems, rewritten } = publicDeclarations(files, fromRoot(pkg.types), shared)
  if (problems.length > 0) {
    const root = fromRoot('.')
    throw new Error(`Published types would break in apps:\n${problems.map((p) => `  ${relative(root, p)}`).join('\n')}`)
  }
  for (const [path, content] of rewritten) writeFileSync(path, content)

  const outDir = fromRoot('./dist')
  const folders = new Set<string>()
  for (const path of files.keys()) {
    if (reached.has(path)) continue
    rmSync(path)
    for (let folder = dirname(path); folder.startsWith(outDir) && folder !== outDir; folder = dirname(folder)) {
      folders.add(folder)
    }
  }
  // Deepest first, so a folder whose subfolders are gone is empty by the time it's checked
  for (const folder of [...folders].sort((a, b) => b.length - a.length)) {
    if (readdirSync(folder).length === 0) rmdirSync(folder)
  }
}

// https://vite.dev/config/
// `npm run build` runs this twice: the ES build (for bundlers, with the type declarations), then `--mode umd`
// (self-contained files that need only Vue: .umd.cjs for require(), .iife.js for <script> tags and CDNs).
export default defineConfig(({ command, mode }) => {
  const umd = mode === 'umd'

  return {
    // The UMD pass bundles reka-ui, which keeps `process.env.NODE_ENV` dev checks that crash in a browser without a
    // bundler: resolve them at build time. The ES build leaves them to the app's bundler, like any library.
    define: command === 'build' && umd ? { 'process.env.NODE_ENV': JSON.stringify('production') } : {},
    plugins: [
      vue(),
      tailwindcss(),
      cssInjectedByJsPlugin(),
      command === 'build' &&
        !umd &&
        dts({
          tsconfigPath: './tsconfig.app.json',
          entryRoot: 'src',
          exclude: ['playground/**'],
          // Declaration errors (e.g. an exported function returning a non-exported type) only print a warning by
          // default and leave holes in the published types; fail the build instead
          afterDiagnostic: (diagnostics) => {
            if (diagnostics.length > 0) {
              throw new Error(`Type declarations failed with ${diagnostics.length} error(s), see above`)
            }
          },
          afterBuild: keepPublicDeclarations,
        }),
    ],
    resolve: {
      alias: {
        '@': fromRoot('./src'),
      },
    },
    build: {
      // public/ (the favicon) is for the dev server only, not the package
      copyPublicDir: false,
      // The UMD pass adds its file next to the ES build's output
      emptyOutDir: !umd,
      lib: {
        entry: fromRoot('./src/index.ts'),
        name: GLOBAL_NAME,
        formats: umd ? ['umd', 'iife'] : ['es'],
        fileName: (format) => `${FILE_NAME}.${EXTENSIONS[format]}`,
      },
      rolldownOptions: {
        external: umd ? ['vue'] : isShared,
        output: {
          exports: 'named',
          globals: { vue: 'Vue' },
        },
      },
    },
  }
})
