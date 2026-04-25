import { inject, ref, computed } from 'vue'
import en from '../locales/en.json'
import es from '../locales/es.json'

export const I18N_SYMBOL = Symbol('i18n')

export type TranslateFunction = (key: string, params?: Record<string, any>, fallback?: string) => string

const messages: Record<string, any> = { en, es }

export const currentLocale = ref('en')

/**
 * Detects the browser's language.
 */
export function getBrowserLocale(): string {
  if (typeof document !== 'undefined' && document.documentElement?.lang) {
    return document.documentElement.lang.toLowerCase().slice(0, 2)
  }

  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language.toLowerCase().slice(0, 2)
  }

  return 'en'
}

/**
 * Sets the current locale.
 */
export function setLocale(lang: string) {
  currentLocale.value = lang
}

// Helper to find nested keys like "common.add"
const lookup = (source: any, key: string): string | undefined =>
  key.split('.').reduce((current, part) => {
    if (current && Object.prototype.hasOwnProperty.call(current, part)) {
      return current[part]
    }
    return undefined
  }, source)

// Helper to replace {name} with values
const interpolate = (message: string, params?: Record<string, any>): string => {
  if (!params) return message
  return Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    message
  )
}

export function useTranslation() {
  // Inject the translation function provided by the plugin or host
  const injectedT = inject<TranslateFunction>(I18N_SYMBOL)

  const t: TranslateFunction = (key, params, fallback) => {
    // If the host provides a custom translator, use it
    if (injectedT) {
      return injectedT(key, params, fallback)
    }

    // Default internal logic using currentLocale
    const locale = currentLocale.value
    const dictionary = messages[locale] || messages.en
    const baseMessage = lookup(dictionary, key) ?? lookup(messages.en, key) ?? fallback ?? key
    return interpolate(String(baseMessage), params)
  }

  return { 
    t,
    locale: computed(() => currentLocale.value),
    setLocale
  }
}
