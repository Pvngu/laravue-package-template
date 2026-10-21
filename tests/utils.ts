// console.warn / console.error calls collected by tests/setup.ts; any left when a test ends fail it
export const consoleMessages: string[] = []

// Removes the collected messages matching `pattern` and returns them, for tests that expect a warning
export function takeConsoleMessages(pattern: RegExp): string[] {
  const matched = consoleMessages.filter((message) => pattern.test(message))
  const rest = consoleMessages.filter((message) => !pattern.test(message))
  consoleMessages.splice(0, consoleMessages.length, ...rest)
  return matched
}

// ── Locales ─────────────────────────────────────────────────────────────────

export type MessageTree = { [key: string]: string | MessageTree }

// Every locale file in src/locales (path → content), so a new language is checked as soon as it's added
export const localeFiles = import.meta.glob<MessageTree>('@/locales/*.json', { eager: true, import: 'default' })

// { 'hello.greeting': 'Hello, {name}!', … }
export function flatten(tree: MessageTree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((all, [key, value]) => {
    const path = prefix + key
    return typeof value === 'string' ? { ...all, [path]: value } : { ...all, ...flatten(value, `${path}.`) }
  }, {})
}

// Each bundled language's strings by flat key: { en: { 'hello.greeting': … }, es: { … } }
export const localeStrings: Record<string, Record<string, string>> = Object.fromEntries(
  Object.entries(localeFiles).map(([file, tree]) => [file.replace(/^.*\/|\.json$/g, ''), flatten(tree)]),
)

/**
 * A nested key whose text differs between English and another bundled language, with both texts: the i18n tests use
 * it rather than particular keys, so they keep working when the example component and its keys are replaced.
 */
export function sampleKey() {
  const english = localeStrings.en ?? {}
  for (const [locale, strings] of Object.entries(localeStrings)) {
    if (locale === 'en') continue
    const key = Object.keys(english).find(
      (candidate) => candidate.includes('.') && strings[candidate] !== english[candidate],
    )
    if (key) return { key, locale, english: english[key] ?? '', translated: strings[key] ?? '' }
  }
  throw new Error('The i18n tests need a nested key whose text differs between en.json and another locale file')
}
