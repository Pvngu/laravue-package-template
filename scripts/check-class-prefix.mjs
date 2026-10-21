// Fails when a Tailwind class in src/ is missing the package's class prefix, or when a prefixed class doesn't exist.
// Unprefixed classes generate no CSS (Tailwind is configured with `prefix(…)` in src/styles/lib.css), so without this
// check they would fail silently in apps.
//
// Only real class positions are checked, not every word in a file:
//   templates  class="…", :class="…" (keys of its objects included), and props named *-class / *Class;
//              in every other expression, the same as in scripts
//   scripts    strings inside cn() / cva() / clsx() calls, values of *class* variables and keys,
//              and any string that already contains a prefixed class
// A class with the prefix in the wrong place (hover:ml:flex) or another package's prefix (xy:flex) is reported too.
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { parse as parseSfc } from 'vue/compiler-sfc'
// The same design-system API Tailwind's editor tooling uses to resolve a class to CSS
import { __unstable__loadDesignSystem as loadDesignSystem } from '@tailwindcss/node'

const root = fileURLToPath(new URL('..', import.meta.url))
const srcDir = join(root, 'src')
const cssPath = join(srcDir, 'styles/lib.css')
const CLASS_NAME = /^(class|className|[\w-]*-class|\w+Class)$/
const CLASS_HELPERS = new Set(['cn', 'cva', 'clsx', 'twMerge', 'twJoin'])

// The prefix comes from the stylesheet: the `prefix(…)` on its Tailwind theme import (comments ignored)
const css = readFileSync(cssPath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const themeImport = css.match(/@import\s[^;]*\sprefix\((\w+)\)[^;]*;/)
if (!themeImport) {
  console.error(`${relative(root, cssPath)} sets no Tailwind prefix(…) on an @import, so nothing can be checked.`)
  process.exit(1)
}
const PREFIX = `${themeImport[1]}:`

// Imports in the stylesheet resolve from its own folder
const prefixed = await loadDesignSystem(css, { base: dirname(cssPath) })
const unprefixed = await loadDesignSystem(css.replace(themeImport[0], themeImport[0].replace(/\s+prefix\(\w+\)/, '')), {
  base: dirname(cssPath),
})
const generatesCss = (designSystem, token) => designSystem.candidatesToCss([token])[0] != null
const variants = new Set(unprefixed.getVariants().map((variant) => variant.name))

// If Tailwind's API changed, every class would look fine: fail instead of passing silently
if (!generatesCss(unprefixed, 'flex') || !generatesCss(prefixed, `${PREFIX}flex`) || generatesCss(prefixed, 'flex')) {
  console.error('The class check no longer understands Tailwind: check @tailwindcss/node and this script.')
  process.exit(1)
}

// Prefixed markers that style other elements instead of generating CSS themselves
const MARKERS = new RegExp(`^${themeImport[1]}:(group|peer)(/[\\w-]+)?$`)

const problems = []
let checkedStrings = 0

function checkClassString(value, file, line) {
  checkedStrings++
  for (const token of value.split(/\s+/).filter(Boolean)) {
    const message = checkToken(token)
    if (message) problems.push({ file, line, token, message })
  }
}

function checkToken(token) {
  if (token.startsWith(PREFIX)) {
    return MARKERS.test(token) || generatesCss(prefixed, token) ? null : 'unknown class'
  }
  if (generatesCss(unprefixed, token)) return `missing "${PREFIX}" prefix`
  // hover:ml:flex: the prefix goes first
  const misplaced = token.indexOf(`:${PREFIX}`)
  if (misplaced > 0) {
    const fixed = PREFIX + token.slice(0, misplaced + 1) + token.slice(misplaced + 1 + PREFIX.length)
    if (generatesCss(prefixed, fixed)) return `the prefix goes first: ${fixed}`
  }
  // xy:flex: a class with another prefix (copied from another package?) generates no CSS here
  const [, other, rest] = token.match(/^([a-z]+):(.+)$/) ?? []
  if (other && !variants.has(other) && (generatesCss(unprefixed, rest) || generatesCss(prefixed, PREFIX + rest))) {
    return `"${other}:" isn't this package's prefix "${PREFIX}"`
  }
  return null
}

// ── Scripts (TypeScript AST) ────────────────────────────────────────────────

function isComparisonOperand(node) {
  const parent = node.parent
  if (ts.isCaseClause(parent)) return true
  if (!ts.isBinaryExpression(parent)) return false
  const op = parent.operatorToken.kind
  return [
    ts.SyntaxKind.EqualsEqualsEqualsToken,
    ts.SyntaxKind.ExclamationEqualsEqualsToken,
    ts.SyntaxKind.EqualsEqualsToken,
    ts.SyntaxKind.ExclamationEqualsToken,
  ].includes(op)
}

function calleeName(call) {
  const callee = call.expression
  if (ts.isIdentifier(callee)) return callee.text
  if (ts.isPropertyAccessExpression(callee)) return callee.name.text
  return ''
}

function nameOf(node) {
  return node.name && (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) ? node.name.text : ''
}

// Where a string literal sits: inside a class helper call, under a *class* name, or nowhere special
function classContext(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (ts.isCallExpression(current) && CLASS_HELPERS.has(calleeName(current))) {
      return calleeName(current) === 'cva' ? 'cva' : 'helper'
    }
    if ((ts.isPropertyAssignment(current) || ts.isVariableDeclaration(current)) && CLASS_NAME.test(nameOf(current))) {
      return 'named'
    }
    if (ts.isFunctionLike(current) || ts.isSourceFile(current)) return null
  }
  return null
}

// `allStrings`: every string in the code is a class (a :class binding), except comparison operands
function checkScript(code, file, lineOffset, { allStrings = false } = {}) {
  const kind = /\.[jt]sx$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, kind)
  const check = (node) => {
    const { line } = source.getLineAndCharacterOfPosition(node.getStart())
    checkClassString(node.text, file, lineOffset + line)
  }
  const visit = (node) => {
    const isPropertyName = node.parent != null && ts.isPropertyAssignment(node.parent) && node.parent.name === node
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && !isComparisonOperand(node)) {
      const context = allStrings ? 'binding' : classContext(node)
      // In cva(), object keys are variant names; elsewhere (clsx-style objects) keys are classes
      const counts = isPropertyName ? context && context !== 'cva' : context || node.text.includes(PREFIX)
      if (counts && !ts.isImportDeclaration(node.parent) && !ts.isExternalModuleReference(node.parent)) check(node)
    } else if (ts.isIdentifier(node) && isPropertyName) {
      // Unquoted keys of clsx-style objects: :class="{ hidden: !open }", cn({ hidden: !open })
      const context = allStrings ? 'binding' : classContext(node.parent)
      if (context === 'binding' || context === 'helper') check(node)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
}

// ── Templates (Vue compiler AST) ────────────────────────────────────────────

const INTERPOLATION = 5
const ATTRIBUTE = 6
const DIRECTIVE = 7

// Expressions are wrapped in parentheses so an object literal parses as one; the opening one isn't on a new line
const checkExpression = (exp, file, options) => checkScript(`(${exp.content})`, file, exp.loc.start.line, options)

function checkTemplateNode(node, file) {
  if (node.type === INTERPOLATION) checkExpression(node.content, file)
  for (const prop of node.props ?? []) {
    if (prop.type === ATTRIBUTE && CLASS_NAME.test(prop.name) && prop.value) {
      checkClassString(prop.value.content, file, prop.loc.start.line)
    }
    if (prop.type === DIRECTIVE && prop.exp) {
      const isClassBinding = prop.name === 'bind' && CLASS_NAME.test(prop.arg?.content ?? '')
      checkExpression(prop.exp, file, { allStrings: isClassBinding })
    }
  }
  for (const child of node.children ?? []) checkTemplateNode(child, file)
}

// ── Files ───────────────────────────────────────────────────────────────────

function* sourceFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* sourceFiles(path)
    else if (/\.(vue|[cm]?[jt]sx?)$/.test(entry.name) && !/\.d\.[cm]?ts$/.test(entry.name)) yield path
  }
}

let fileCount = 0
for (const path of sourceFiles(srcDir)) {
  fileCount++
  const file = relative(root, path)
  const code = readFileSync(path, 'utf8')
  if (!path.endsWith('.vue')) {
    checkScript(code, file, 1)
    continue
  }
  const { descriptor } = parseSfc(code, { filename: file })
  if (descriptor.template?.ast) checkTemplateNode(descriptor.template.ast, file)
  for (const block of [descriptor.script, descriptor.scriptSetup]) {
    if (block) checkScript(block.content, file, block.loc.start.line)
  }
}

for (const { file, line, token, message } of problems) console.error(`${file}:${line}  ${token}  ${message}`)
console.log(`Checked ${checkedStrings} class strings in ${fileCount} files: ${problems.length} problem(s).`)
process.exitCode = problems.length ? 1 : 0
