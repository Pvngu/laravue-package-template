import type { App, Plugin } from 'vue'
import { I18N_SYMBOL, type TranslateFunction } from './utils/i18n'

export interface VueProjectOptions {
  translate?: TranslateFunction
}

export const VueProjectI18n: Plugin = {
  install(app: App, options: VueProjectOptions = {}) {
    const translate = options.translate

    if (translate) {
      app.provide(I18N_SYMBOL, translate)
      app.config.globalProperties.$visT = translate
    }
  }
}

export default VueProjectI18n