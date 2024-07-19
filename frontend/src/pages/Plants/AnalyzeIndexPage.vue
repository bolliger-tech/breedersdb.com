<template>
  <PageLayout>
    <AnalyzeIndex
      :entity-label="t('plants.title', 2)"
      entity-path="/plants"
      base-table="PLANTS"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import AnalyzeIndex from 'src/components/Analyze/AnalyzeIndex.vue';
import { useI18n } from 'src/composables/useI18n';

const { t } = useI18n();
</script>
