import { getCurrentInstance, inject } from 'vue'
import en from '../locales/en.json'

export const I18N_SYMBOL = Symbol('vis-i18n')

export type TranslateFunction = (key: string, fallback?: string, params?: Record<string, any>) => string

const lookup = (source: any, key: string): string | undefined =>
  key.split('.').reduce((current, part) => {
    if (current && Object.prototype.hasOwnProperty.call(current, part)) {
      return current[part]
    }
    return undefined
  }, source)

const interpolate = (message: string, params?: Record<string, any>): string => {
  if (!params) return message
  return Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    message
  )
}

export function useTranslation() {
  const instance = getCurrentInstance()
  const injectedTranslate = inject<TranslateFunction | null>(I18N_SYMBOL, null)

  const t: TranslateFunction = (key, fallback, params) => {
    // 1. Try injected translate function (from plugin)
    if (injectedTranslate) {
      return injectedTranslate(key, fallback, params)
    }

    // 2. Try host app's global $visT or $t
    const globalVisT = instance?.appContext.config.globalProperties.$visT
    if (typeof globalVisT === 'function') {
      return globalVisT(key, fallback, params)
    }

    const globalT = instance?.appContext.config.globalProperties.$t
    if (typeof globalT === 'function') {
      // Note: standard vue-i18n might have different signature, but we try to match our needs
      return globalT(key, params) ?? fallback ?? key
    }

    // 3. Fallback to local en.json
    const baseMessage = lookup(en, key) ?? fallback ?? key
    return interpolate(String(baseMessage), params)
  }

  return { t }
}
