<template>
  <PageLayout :title="t('plants.title', 2)">
    <ExamplePlantsTable />
  </PageLayout>
</template>

<script setup lang="ts">
import ExamplePlantsTable from 'src/components/ExamplePlantsTable.vue';
import PageLayout from 'src/layouts/PageLayout.vue';
import { useI18n } from 'src/composables/useI18n';

const { t } = useI18n();
</script>
