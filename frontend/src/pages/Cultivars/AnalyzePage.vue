<template>
  <AnalyzeView :analyze-id="analyzeId" :base-table="BaseTable.Cultivars" />
</template>

<script setup lang="ts">
import AnalyzeView from 'src/components/Analyze/AnalyzeView.vue';
import { BaseTable } from 'src/components/Analyze/Filter/filterNode';

export interface AnalyzeViewPageProps {
  analyzeId: 'new' | number;
}

defineProps<AnalyzeViewPageProps>();
</script>
