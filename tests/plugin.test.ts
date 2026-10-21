import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import * as api from '@/index'
import { MyLibI18n, currentLocale, setLocale, useTranslation, type TranslateFunction } from '@/index'
import UsesGlobalTranslate from './fixtures/UsesGlobalTranslate.vue'
import { sampleKey } from './utils'

const sample = sampleKey()

describe('MyLibI18n', () => {
  it('sets the language from the locale option', () => {
    createApp({}).use(MyLibI18n, { locale: `${sample.locale}-MX` })
    expect(currentLocale.value).toBe(sample.locale)
  })

  it('detects the language from <html lang>, unless the app already chose one', () => {
    document.documentElement.lang = sample.locale
    createApp({}).use(MyLibI18n)
    expect(currentLocale.value).toBe(sample.locale)

    setLocale('en')
    createApp({}).use(MyLibI18n)
    expect(currentLocale.value).toBe('en')
  })

  it('adds $myLibT to every template', () => {
    const wrapper = mount(UsesGlobalTranslate, {
      props: { translationKey: sample.key },
      global: { plugins: [[MyLibI18n, { locale: sample.locale }]] },
    })
    expect(wrapper.text()).toBe(sample.translated)
  })

  it("uses the app's translator everywhere, whatever the locale option", () => {
    const appTranslate: TranslateFunction = (key) => `[${key}]`
    const plugins: [[typeof MyLibI18n, api.MyLibI18nOptions]] = [
      [MyLibI18n, { translate: appTranslate, locale: sample.locale }],
    ]
    const UsesTranslation = defineComponent(() => {
      const { t } = useTranslation()
      return () => h('p', t('any.key'))
    })

    expect(mount(UsesTranslation, { global: { plugins } }).text()).toBe('[any.key]')
    expect(mount(UsesGlobalTranslate, { props: { translationKey: 'any.key' }, global: { plugins } }).text()).toBe(
      '[any.key]',
    )
    expect(currentLocale.value).toBe('en')
  })
})

// The package's runtime API. A change here is a change for every app: update the README and CHANGELOG with it.
describe('public API', () => {
  it('exports exactly these values', () => {
    expect(Object.keys(api).sort()).toEqual(
      [
        'HelloCard',
        'I18N_KEY',
        'MyLibI18n',
        'availableLocales',
        'currentLocale',
        'getBrowserLocale',
        'setLocale',
        'translate',
        'useTranslation',
      ].sort(),
    )
  })
})
