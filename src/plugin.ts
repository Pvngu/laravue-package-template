import type { App, Plugin } from 'vue'
import { I18N_SYMBOL, type TranslateFunction, setLocale, getBrowserLocale, useTranslation } from './utils/i18n'

export interface VueProjectOptions {
  translate?: TranslateFunction
  locale?: string
}

export const VueProjectI18n: Plugin = {
  install(app: App, options: VueProjectOptions = {}) {
    const { translate, locale } = options

    if (translate) {
      app.provide(I18N_SYMBOL, translate)
      app.config.globalProperties.$visT = translate
    } else {
      // Initialize internal locale
      const initialLocale = locale || getBrowserLocale()
      setLocale(initialLocale)
      
      // Also provide a way to access translation in templates
      app.config.globalProperties.$visT = (key: string, params?: Record<string, any>, fallback?: string) => {
        // Use the same internal logic as useTranslation
        const { t } = useTranslation()
        return t(key, params, fallback)
      }
    }
  }
}

export default VueProjectI18n
