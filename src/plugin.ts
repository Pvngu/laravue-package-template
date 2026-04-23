import type { App, Plugin } from 'vue'
import { I18N_SYMBOL, type TranslateFunction } from './utils/i18n'

export interface InstantSearchOptions {
  translate?: TranslateFunction
}

export const InstantSearchI18n: Plugin = {
  install(app: App, options: InstantSearchOptions = {}) {
    const translate = options.translate

    if (translate) {
      app.provide(I18N_SYMBOL, translate)
      app.config.globalProperties.$visT = translate
    }
  }
}

export default InstantSearchI18n
