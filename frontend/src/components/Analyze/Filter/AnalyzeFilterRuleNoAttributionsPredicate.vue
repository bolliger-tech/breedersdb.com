<template>
  <q-toggle
    :model-value="modelValue"
    :label="
      t('analyze.filter.withNoAttributions', {
        entities: entitiesName,
        attributeName,
      })
    "
    size="xs"
    @update:model-value="(value) => $emit('update:modelValue', value)"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { computed } from 'vue';
import { useEntityName } from 'src/composables/useEntityName';
import { BaseTable } from './filterNode';

export interface AnalyzeFilterRuleNoAttributionsPredicateProps {
  attributeName?: string;
  modelValue?: boolean;
  baseTable: BaseTable;
}

const props = defineProps<AnalyzeFilterRuleNoAttributionsPredicateProps>();

defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { t } = useI18n();

const { getEntityName } = useEntityName();
const entitiesName = computed(() => {
  return getEntityName({ table: props.baseTable, plural: true });
});
</script>
