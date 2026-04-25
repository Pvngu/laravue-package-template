import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import en from './locales/en.json'
import es from './locales/es.json'
import { VueProjectI18n } from './plugin'

const dictionaries = { en, es }

const resolveLocale = () => {
	if (typeof document !== 'undefined' && document.documentElement?.lang) {
		return document.documentElement.lang.toLowerCase().slice(0, 2)
	}

	if (typeof navigator !== 'undefined' && navigator.language) {
		return navigator.language.toLowerCase().slice(0, 2)
	}

	return 'en'
}

const lookup = (source, key) =>
	key.split('.').reduce((current, part) => {
		if (current && Object.prototype.hasOwnProperty.call(current, part)) {
			return current[part]
		}
		return undefined
	}, source)

const interpolate = (message, params) => {
	if (params == null) return message

	if (Array.isArray(params)) {
		return params.reduce(
			(text, value, index) => text.replaceAll(`{${index}}`, String(value)),
			message,
		)
	}

	if (typeof params === 'object') {
		return Object.entries(params).reduce(
			(text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
			message,
		)
	}

	return message
}

const locale = resolveLocale()
const dictionary = dictionaries[locale] || en

const app = createApp(App)

// Use the new plugin architecture
app.use(VueProjectI18n, {
    translate: (key, params, fallback) => {
        // This logic will now look into the 'es' dictionary if 'es' is the active locale
        const lookup = (source, key) =>
            key.split('.').reduce((current, part) => {
                if (current && Object.prototype.hasOwnProperty.call(current, part)) {
                    return current[part]
                }
                return undefined
            }, source)

        const baseMessage = lookup(dictionary, key) ?? lookup(en, key) ?? fallback ?? key
        
        // Simple interpolation for {name} patterns
        if (!params) return baseMessage
        return Object.entries(params).reduce(
            (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
            String(baseMessage)
        )
    }
})

app.mount('#app')
