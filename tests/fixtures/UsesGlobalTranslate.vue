<!-- vue-tsc type-checks this template: it fails if $myLibT isn't declared on ComponentCustomProperties -->
<script setup lang="ts">
defineProps<{ translationKey: string }>()
</script>

<template>
  <p>{{ $myLibT(translationKey) }}</p>
</template>
