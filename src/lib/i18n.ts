import { computed, inject, ref, type InjectionKey } from 'vue'
import en from '@/locales/en.json'
import es from '@/locales/es.json'

/**
 * Translates a key (`'hello.greeting'`), filling its `{name}` placeholders from `params`. `fallback` is the text to use
 * when the key is missing.
 */
// `any` on purpose: an app's own translator (vue-i18n, i18next, …) must be assignable whatever its params type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TranslateFunction = (key: string, params?: Record<string, any>, fallback?: string) => string

/** The injection key of the app's own translator, when one was passed to the plugin. */
export const I18N_KEY: InjectionKey<TranslateFunction> = Symbol('my-lib:i18n')

interface Dictionary {
  [key: string]: string | Dictionary
}

// Add a language: a JSON file in src/locales with the same keys as en.json, listed here
const messages: Record<string, Dictionary> = { en, es }
const DEFAULT_LOCALE = 'en'

/** The bundled languages, such as `['en', 'es']`. */
export const availableLocales: readonly string[] = Object.freeze(Object.keys(messages))

// Bundled languages by lowercase code, so a request matches whatever its case
const LOCALES = new Map(availableLocales.map((code) => [code.toLowerCase(), code]))

// One language for the whole page (several apps on a page share it)
const locale = ref(DEFAULT_LOCALE)
let localeChosen = false

/** The language in use, one of `availableLocales`. Read-only: change it with `setLocale()`. */
export const currentLocale = computed(() => locale.value)

// The closest bundled language: 'es-MX', 'es_MX' and 'ES' all give 'es' (and 'zh-Hant-TW' would give a bundled
// 'zh-Hant' before 'zh'); anything else gives English
function resolveLocale(requested: string): string {
  const subtags = requested.trim().toLowerCase().replaceAll('_', '-').split('-')
  for (let length = subtags.length; length > 0; length--) {
    const code = LOCALES.get(subtags.slice(0, length).join('-'))
    if (code) return code
  }
  return DEFAULT_LOCALE
}

/**
 * Changes the language of every component of the package on the page. Takes a bundled language or a regional one
 * (`'es-MX'` gives `'es'`); anything else gives English.
 */
export function setLocale(requested: string) {
  locale.value = resolveLocale(requested)
  localeChosen = true
}

/**
 * The closest bundled language to the page's: its `<html lang>`, then the browser's. English during server-side
 * rendering, which the package doesn't support.
 */
export function getBrowserLocale(): string {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  return resolveLocale(document.documentElement.lang || navigator.language || DEFAULT_LOCALE)
}

/** @internal For tests: back to English, as if no language had been chosen. Not exported from the package. */
export function resetLocale() {
  locale.value = DEFAULT_LOCALE
  localeChosen = false
}

// For the plugin: detect the language, unless the app already chose one with setLocale()
export function detectLocale() {
  if (!localeChosen) setLocale(getBrowserLocale())
}

// Finds nested keys like "hello.greeting"; a key that names a group rather than a string counts as missing
function lookup(source: Dictionary | undefined, key: string): string | undefined {
  let current: string | Dictionary | undefined = source
  for (const part of key.split('.')) {
    if (typeof current !== 'object' || !Object.hasOwn(current, part)) return undefined
    current = current[part]
  }
  return typeof current === 'string' ? current : undefined
}

// Placeholders are {name}, with letters, digits and _ (tests/i18n.test.ts checks every language uses the same ones).
// One pass with a replacer function: values are inserted as-is ("$&", "{other}" and all).
const PLACEHOLDER = /\{(\w+)\}/g

function interpolate(message: string, params?: Record<string, unknown>): string {
  if (!params) return message
  return message.replace(PLACEHOLDER, (match, name: string) =>
    Object.hasOwn(params, name) ? String(params[name]) : match,
  )
}

/**
 * Translates with the bundled locales in the current language: falls back to English, then to `fallback`, then to the
 * key. Reactive: reading it while rendering re-renders when the language changes.
 */
export const translate: TranslateFunction = (key, params, fallback) =>
  interpolate(lookup(messages[locale.value], key) ?? lookup(messages[DEFAULT_LOCALE], key) ?? fallback ?? key, params)

/**
 * The translator for a component's `setup()`: the app's own when it passed one to the plugin, otherwise the bundled
 * locales. Also returns the language in use and `setLocale()`.
 */
export function useTranslation() {
  const t: TranslateFunction = inject(I18N_KEY, null) ?? translate

  return { t, locale: currentLocale, setLocale }
}
