import { inject } from 'vue'
import en from '../locales/en.json'

export const I18N_SYMBOL = Symbol('i18n')

export type TranslateFunction = (key: string, params?: Record<string, any>, fallback?: string) => string

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
  const t = inject<TranslateFunction>(I18N_SYMBOL, (key, params, fallback) => {
    // Default internal logic if the host doesn't provide a custom translator
    const baseMessage = lookup(en, key) ?? fallback ?? key
    return interpolate(String(baseMessage), params)
  })

  return { t }
}