<script setup lang="ts">
import { ref, watch } from 'vue'
import { HelloCard, availableLocales, currentLocale, setLocale } from '@/index'

const name = ref('Ada')
const waves = ref(0)
const isDark = ref(false)
watch(isDark, (dark) => document.documentElement.classList.toggle('dark', dark))
</script>

<template>
  <div class="playground">
    <!-- Playground controls: plain CSS, not part of the package -->
    <div class="playground-toolbar">
      <label>
        Language
        <select :value="currentLocale" @change="setLocale(($event.target as HTMLSelectElement).value)">
          <option v-for="code in availableLocales" :key="code" :value="code">{{ code }}</option>
        </select>
      </label>
      <label>Name <input v-model="name" /></label>
      <label><input v-model="isDark" type="checkbox" /> Dark mode</label>
      <span>Waves: {{ waves }}</span>
    </div>

    <main class="playground-stage">
      <HelloCard :name="name" @wave="waves = $event" />
    </main>
  </div>
</template>
