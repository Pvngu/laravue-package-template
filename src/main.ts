import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { VueProjectI18n } from './plugin'

const app = createApp(App)

// Use the new plugin architecture
// It will now automatically detect the browser language (en or es)
// or we can explicitly set it: app.use(VueProjectI18n, { locale: 'es' })
app.use(VueProjectI18n)

app.mount('#app')
