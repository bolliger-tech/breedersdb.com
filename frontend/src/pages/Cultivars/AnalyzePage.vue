<template>
  <PageLayout :title="t('cultivars.analyze.title')">
    <QueryFilter />
  </PageLayout>
</template>

<script setup lang="ts">
import QueryFilter from 'src/components/query/QueryFilter.vue';
import PageLayout from 'src/layouts/PageLayout.vue';
import { useI18n } from 'src/composables/useI18n';

const { t } = useI18n();
</script>
