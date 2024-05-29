<template>
  <PageLayout :title="t('cultivars.analyze.title')">
    <QueryContainer :base-table="BaseTable.Cultivars" />
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import QueryContainer from 'src/components/Query/QueryContainer.vue';
import { useI18n } from 'src/composables/useI18n';
import { BaseTable } from 'src/components/Query/Filter/filterNode';

const { t } = useI18n();
</script>
