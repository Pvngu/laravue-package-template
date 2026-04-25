<script setup>
import { useTranslation } from '@utils/i18n';
const { t } = useTranslation();
</script>

<template>
  <!-- here's where an example of the package will be located -->
  <h1 class="text-3xl font-bold underline">{{ t('test_translation') }}</h1>
</template>