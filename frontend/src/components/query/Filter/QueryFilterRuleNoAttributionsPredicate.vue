<template>
  <q-toggle
    :model-value="modelValue"
    :label="
      t('filter.withNoAttributions', {
        entities: entitiesName,
        attribute: attributeName,
      })
    "
    size="xs"
    @update:model-value="(value) => $emit('update:modelValue', value)"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { useQueryStore } from './queryStore';
import { computed } from 'vue';
import { BaseTable } from './queryTypes';

export interface QueryFilterRuleNoAttributionsPredicateProps {
  attributeName?: string;
  modelValue?: boolean;
}

defineProps<QueryFilterRuleNoAttributionsPredicateProps>();

defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { t } = useI18n();
const store = useQueryStore();

const entitiesName = computed(() => {
  switch (store.baseTable) {
    case BaseTable.Crossings:
      return t('filter.crossings');
    case BaseTable.Lots:
      return t('filter.lots');
    case BaseTable.Cultivars:
      return t('filter.cultivars');
    case BaseTable.Trees:
      return t('filter.trees');
    default:
      throw new Error('Unknown entity: ' + store.baseTable);
  }
});
</script>
./queryTypes
