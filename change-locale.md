// In the host application's main.js
import { VueProjectI18n } from '@pvngu/laravue-package-template'

// 1. Auto-detect language
app.use(VueProjectI18n)

// 2. Or explicitly set it
app.use(VueProjectI18n, { locale: 'es' })

// 3. To change language at runtime
import { setLocale } from '@pvngu/laravue-package-template'
setLocale('en')

// In-App example

<!-- <script setup>
import { useTranslation } from '@utils/i18n';
const { t, locale, setLocale } = useTranslation();
</script>

<template>
  <div class="p-8 space-y-4">
    <h1 class="text-3xl font-bold underline">{{ t('test_translation') }}</h1>
    <p>Current Locale: <span class="font-mono bg-gray-100 p-1 rounded">{{ locale }}</span></p>
    
    <div class="flex gap-2">
      <button 
        @click="setLocale('en')" 
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
      >
        English
      </button>
      <button 
        @click="setLocale('es')" 
        class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
      >
        Español
      </button>
    </div>
  </div>
</template> -->