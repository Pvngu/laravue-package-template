import { afterEach, beforeEach, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'
import { resetLocale } from '@/lib/i18n'
import { consoleMessages } from './utils'

// ── jsdom gaps: layout and observer APIs that reka-ui uses ─────────────────

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class IntersectionObserverStub {
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds = []
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

globalThis.ResizeObserver ??= ResizeObserverStub
globalThis.IntersectionObserver ??= IntersectionObserverStub as unknown as typeof IntersectionObserver
Element.prototype.scrollIntoView ??= () => {}
Element.prototype.scrollTo ??= () => {}
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.releasePointerCapture ??= () => {}

let objectUrlCount = 0
URL.createObjectURL ??= () => `blob:test/${++objectUrlCount}`
URL.revokeObjectURL ??= () => {}

window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  }) as MediaQueryList

// ── Console: Vue warnings and reka-ui accessibility warnings fail the test ─

beforeEach(() => {
  consoleMessages.length = 0
  for (const method of ['warn', 'error'] as const) {
    vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
      consoleMessages.push(`console.${method}: ${args.map(String).join(' ')}`)
    })
  }
  resetLocale()
})

// Registered before enableAutoUnmount so it runs after it (after-hooks run in reverse): unmount warnings count too
afterEach(() => {
  // reka-ui leaves teleported menus and dialogs behind when a test ends mid-animation
  document.body.innerHTML = ''
  // Tests set the page's language and dark mode on <html>
  document.documentElement.lang = ''
  document.documentElement.className = ''
  if (consoleMessages.length > 0) {
    throw new Error(`Unexpected console output:\n${consoleMessages.join('\n')}`)
  }
})

enableAutoUnmount(afterEach)
