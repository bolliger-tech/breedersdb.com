<template>
  <span class="text-muted" :class="{ block: orientation === 'vertical' }"
    >{{ parts.table
    }}<template v-if="orientation === 'horizontal'"
      >&nbsp;&nbsp;>&nbsp;&nbsp;</template
    ></span
  >
  {{ parts.column }}
  <span
    v-if="parts.aggregation"
    class="chip"
    :class="orientation === 'horizontal' ? 'q-ml-sm' : 'q-mt-xs'"
    >{{ parts.aggregation }}</span
  >
</template>

<script lang="ts" setup>
import { computed } from 'vue';

export interface AnalyzeResultColumnLabelProps {
  label: string;
  orientation: 'horizontal' | 'vertical';
}

const props = defineProps<AnalyzeResultColumnLabelProps>();

const parts = computed(() => {
  const [table, column, aggregation] = props.label.split(' > ');
  return { table, column, aggregation };
});
</script>

<style scoped>
.chip {
  font-weight: normal;
  border: 1px solid var(--q-text-muted);
  color: var(--q-text-muted);
  border-radius: 2em;
  font-size: 0.625rem;
  padding: 0.25em 0.6em;
  line-height: 1em;
}
</style>
