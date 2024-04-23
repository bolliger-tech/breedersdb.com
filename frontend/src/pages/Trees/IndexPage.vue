<template>
  <PageLayout :title="t('trees.list.title')">
    <ExampleTreesTable />
  </PageLayout>
</template>

<script setup lang="ts">
import ExampleTreesTable from 'src/components/ExampleTreesTable.vue';
import PageLayout from 'src/layouts/PageLayout.vue';
import { useI18n } from 'src/composables/useI18n';

const { t } = useI18n();
</script>
