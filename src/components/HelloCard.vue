<script setup lang="ts">
import { ref } from 'vue'
import { Hand } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'

// An example of the template's conventions: prefixed classes, a shadcn-vue primitive (src/components/ui), an icon and
// translated text. Use it as a starting point, or delete it with its test and its export in src/index.ts.
defineProps<{
  name?: string
}>()

const emit = defineEmits<{
  wave: [count: number]
}>()

const { t } = useTranslation()
const waves = ref(0)

function wave() {
  waves.value++
  emit('wave', waves.value)
}
</script>

<template>
  <div
    class="ml:flex ml:items-center ml:gap-3 ml:rounded-lg ml:border ml:bg-card ml:p-4 ml:text-card-foreground ml:shadow-xs"
  >
    <Hand class="ml:size-5 ml:shrink-0 ml:text-muted-foreground" aria-hidden="true" />
    <p class="ml:flex-1 ml:text-sm">{{ name ? t('hello.greeting', { name }) : t('hello.anonymous') }}</p>
    <span v-if="waves > 0" class="ml:text-xs ml:text-muted-foreground">{{ t('hello.waved', { count: waves }) }}</span>
    <Button size="sm" @click="wave">{{ t('hello.wave') }}</Button>
  </div>
</template>
