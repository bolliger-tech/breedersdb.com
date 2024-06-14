<template>
  <PageLayout :title="t('plants.title', 2)">
    <ExamplePlantsList />
  </PageLayout>
</template>

<script setup lang="ts">
import ExamplePlantsList from 'src/components/ExamplePlantsList.vue';
import PageLayout from 'src/layouts/PageLayout.vue';
import { useI18n } from 'src/composables/useI18n';

const { t } = useI18n();
</script>
