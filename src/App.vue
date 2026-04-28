<script setup lang="ts">
import { useTranslation } from '@/utils/i18n';
const { t } = useTranslation();
</script>

<template>
  <h1 class="text-3xl font-bold underline">{{ t('test_translation') }}</h1>
</template>