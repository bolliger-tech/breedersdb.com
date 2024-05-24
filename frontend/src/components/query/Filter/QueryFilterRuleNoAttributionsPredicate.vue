<template>
  <q-toggle
    :model-value="modelValue"
    :label="
      t('filter.withNoAttributions', {
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
import { useQueryStore } from '../useQueryStore';
import { computed } from 'vue';
import { getEntityName } from './getEntityName';

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
  return getEntityName({ t, table: store.baseTable, plural: true });
});
</script>
