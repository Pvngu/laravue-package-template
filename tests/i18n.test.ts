import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, isReadonly, nextTick, provide } from 'vue'
import { mount } from '@vue/test-utils'
import {
  I18N_KEY,
  availableLocales,
  currentLocale,
  getBrowserLocale,
  setLocale,
  translate,
  useTranslation,
  type TranslateFunction,
} from '@/lib/i18n'
import { localeFiles, localeStrings, sampleKey } from './utils'

const sample = sampleKey()

// The same placeholder syntax as interpolate() in src/lib/i18n.ts
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()

describe('locale files', () => {
  const { en: english = {}, ...others } = localeStrings

  it('are all bundled', () => {
    expect([...availableLocales].sort()).toEqual(Object.keys(localeStrings).sort())
    expect(Object.keys(localeFiles).length).toBe(availableLocales.length)
  })

  it.each(Object.entries(others))('%s.json has the same keys and placeholders as en.json', (_, strings) => {
    expect(Object.keys(strings).sort()).toEqual(Object.keys(english).sort())
    for (const [key, text] of Object.entries(english)) {
      expect(placeholders(strings[key] ?? ''), key).toEqual(placeholders(text))
    }
  })
})

describe('translate', () => {
  it('reads nested keys in the current language', () => {
    expect(translate(sample.key)).toBe(sample.english)
    setLocale(sample.locale)
    expect(translate(sample.key)).toBe(sample.translated)
  })

  it.each([
    [sample.locale.toUpperCase(), sample.locale],
    [`${sample.locale}-MX`, sample.locale],
    [`${sample.locale}_MX`, sample.locale],
    [` ${sample.locale} `, sample.locale],
    ['xx', 'en'],
    ['', 'en'],
    // Names an object has, which a plain `key in messages` check would accept
    ['constructor', 'en'],
    ['__proto__', 'en'],
  ])('matches %j to the bundled language %j', (requested, expected) => {
    setLocale(requested)
    expect(currentLocale.value).toBe(expected)
  })

  it('falls back to English, then to the given fallback, then to the key', () => {
    expect(translate('nope.missing', undefined, 'Fallback')).toBe('Fallback')
    expect(translate('nope.missing')).toBe('nope.missing')
  })

  it('treats a key that names a group, or goes past a string, as missing', () => {
    const group = sample.key.slice(0, sample.key.lastIndexOf('.'))
    expect(translate(group)).toBe(group)
    expect(translate(`${sample.key}.length`)).toBe(`${sample.key}.length`)
  })

  it('fills in every placeholder in one pass, inserting values as they are', () => {
    expect(translate('x', { a: 1 }, '{a} and {a}')).toBe('1 and 1')
    expect(translate('x', { a: "$& $$ $'" }, 'Value: {a}')).toBe("Value: $& $$ $'")
    expect(translate('x', { a: '{b}', b: 'B' }, '{a}')).toBe('{b}')
    expect(translate('x', { a: 1 }, '{a} {unknown}')).toBe('1 {unknown}')
  })
})

describe('getBrowserLocale', () => {
  it('prefers <html lang>, then the browser language', () => {
    vi.stubGlobal('navigator', { language: `${sample.locale}-XX` })
    document.documentElement.lang = 'en'
    expect(getBrowserLocale()).toBe('en')
    document.documentElement.lang = ''
    expect(getBrowserLocale()).toBe(sample.locale)
  })

  it('is English on a server, whatever the server says', () => {
    vi.stubGlobal('navigator', { language: sample.locale })
    vi.stubGlobal('window', undefined)
    expect(getBrowserLocale()).toBe('en')
  })
})

describe('useTranslation', () => {
  const Greeting = defineComponent(() => {
    const { t } = useTranslation()
    return () => h('p', t(sample.key, { name: 'Ada' }))
  })

  it('works without the plugin, without warnings', () => {
    const wrapper = mount(() => h('p', useTranslation().t('nope.missing', { name: 'Ada' }, 'Hello, {name}!')))
    expect(wrapper.text()).toBe('Hello, Ada!')
  })

  it('re-renders when the language changes', async () => {
    const withName = (text: string) => text.replaceAll('{name}', 'Ada')
    const wrapper = mount(Greeting)
    expect(wrapper.text()).toBe(withName(sample.english))
    setLocale(sample.locale)
    await nextTick()
    expect(wrapper.text()).toBe(withName(sample.translated))
  })

  it("uses the app's translator when one is provided", () => {
    const appTranslate: TranslateFunction = (key, params) => `app:${key}:${params?.name}`
    const wrapper = mount(
      defineComponent(() => {
        provide(I18N_KEY, appTranslate)
        return () => h(Greeting)
      }),
    )
    expect(wrapper.text()).toBe(`app:${sample.key}:Ada`)
  })

  it('exposes the language and the bundled ones read-only (setLocale changes it)', () => {
    expect(isReadonly(currentLocale)).toBe(true)
    expect(Object.isFrozen(availableLocales)).toBe(true)
  })
})
