import type { App, Plugin } from 'vue'
import { I18N_KEY, detectLocale, setLocale, translate, type TranslateFunction } from '@/lib/i18n'

/** Options of the `MyLibI18n` plugin. */
export interface MyLibI18nOptions {
  /** The app's own translator (vue-i18n, i18next, …), used instead of the bundled locales. */
  translate?: TranslateFunction
  /**
   * A bundled language (`'en'`, `'es'`, or a regional one such as `'es-MX'`). Detected from `<html lang>`, then the
   * browser, when omitted. Ignored with `translate`: the app's translator decides the language.
   */
  locale?: string
}

declare module 'vue' {
  interface ComponentCustomProperties {
    /** Translates in any template: `{{ $myLibT('hello.anonymous') }}`. */
    $myLibT: TranslateFunction
  }
}

/**
 * Sets up the package's translations: `app.use(MyLibI18n)`, `app.use(MyLibI18n, { locale: 'es' })` or
 * `app.use(MyLibI18n, { translate })`.
 */
export const MyLibI18n: Plugin<[MyLibI18nOptions?]> = {
  install(app: App, options: MyLibI18nOptions = {}) {
    if (options.translate) app.provide(I18N_KEY, options.translate)
    else if (options.locale) setLocale(options.locale)
    else detectLocale()

    app.config.globalProperties.$myLibT = options.translate ?? translate
  },
}

export default MyLibI18n
