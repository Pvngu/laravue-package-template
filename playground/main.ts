// The dev playground: not part of the package. It uses the package exactly as an app would, through its public entry.
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { MyLibI18n } from '@/index'

// index.html has <html lang="en">, so the playground starts in English (the language menu changes it). In an app
// without a lang attribute, the browser's language is used; or set one: app.use(MyLibI18n, { locale: 'es' })
createApp(App).use(MyLibI18n).mount('#app')
