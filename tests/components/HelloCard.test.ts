import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import HelloCard from '@/components/HelloCard.vue'
import { setLocale } from '@/lib/i18n'

describe('HelloCard', () => {
  it('greets by name, or anyone', () => {
    expect(mount(HelloCard, { props: { name: 'Ada' } }).text()).toContain('Hello, Ada!')
    expect(mount(HelloCard).text()).toContain('Hello there!')
  })

  it('speaks the current language', async () => {
    setLocale('es')
    expect(mount(HelloCard, { props: { name: 'Ada' } }).text()).toContain('¡Hola, Ada!')
  })

  it('counts and emits waves', async () => {
    const wrapper = mount(HelloCard)
    await wrapper.find('button').trigger('click')
    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('wave')).toEqual([[1], [2]])
    expect(wrapper.text()).toContain('Waved 2 times')
  })

  it('uses only prefixed classes, so it never matches an app’s own Tailwind classes', () => {
    const root = mount(HelloCard).element as HTMLElement
    const classes = [root, ...root.querySelectorAll('[class]')].flatMap((el) => [...el.classList])
    expect(classes.length).toBeGreaterThan(0)
    // Lucide marks its icons with its own `lucide` / `lucide-*` classes, which no stylesheet targets
    expect(classes.filter((cls) => !cls.startsWith('ml:') && !/^lucide(-|$)/.test(cls))).toEqual([])
  })
})
