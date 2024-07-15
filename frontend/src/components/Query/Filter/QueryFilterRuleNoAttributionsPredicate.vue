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
import { useQueryStore } from '../useQueryStore';
import { computed } from 'vue';
import { useEntityName } from 'src/composables/useEntityName';

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

const { getEntityName } = useEntityName();
const entitiesName = computed(() => {
  return getEntityName({ table: store.baseTable, plural: true });
});
</script>
