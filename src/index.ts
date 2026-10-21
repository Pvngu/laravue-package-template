import '@/styles/lib.css'

// Everything here is the package's public API; tests/plugin.test.ts lists it, so a change is deliberate.

// ── Components ──────────────────────────────────────────────────────────────
// HelloCard is an example: replace it with the package's own components
export { default as HelloCard } from '@/components/HelloCard.vue'

// ── Translations ────────────────────────────────────────────────────────────
export { default as MyLibI18n, type MyLibI18nOptions } from '@/plugin'
export {
  I18N_KEY,
  availableLocales,
  currentLocale,
  getBrowserLocale,
  setLocale,
  translate,
  useTranslation,
  type TranslateFunction,
} from '@/lib/i18n'
