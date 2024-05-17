<template>
  <q-icon name="info" />&nbsp;
  <span class="text-body2">
    <strong>{{ t('filter.explainer.title') }}</strong>
    {{ explainer }}
  </span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { FilterRule } from './filterRule';
import { useQueryStore } from './queryStore';
import { useI18n } from 'src/composables/useI18n';
import { BaseTable } from './query';

interface QueryFilterRuleExplainerProps {
  rule: FilterRule;
}

const props = defineProps<QueryFilterRuleExplainerProps>();

const column = computed(() => {
  const label = props.rule.column?.label || '';
  return label.split('>')[1] || label;
});
const operator = computed(() => {
  return props.rule.operator?.label || '';
});
const criteria = computed(() => {
  return props.rule.criteria || '';
});

const { t } = useI18n();
const store = useQueryStore();

const entityName = computed(() => {
  switch (store.baseTable) {
    case BaseTable.Crossings:
      return t('filter.crossing');
    case BaseTable.Lots:
      return t('filter.lot');
    case BaseTable.Cultivars:
      return t('filter.cultivar');
    case BaseTable.Trees:
      return t('filter.tree');
    default:
      throw new Error('Unknown entity: ' + store.baseTable);
  }
});

const explainer = computed(() => {
  const args = {
    entity: props.rule.isAttribute
      ? t('filter.cultivarAndSubentities')
      : entityName.value,
    column: column.value,
    operator: operator.value,
    criteria: criteria.value,
  };
  if (props.rule.isAttribute) {
    if (props.rule.includeEntitiesWithoutAttributions) {
      return t('filter.explainer.attributeWithNoAttributions', args);
    } else {
      return t('filter.explainer.attribute', args);
    }
  }
  return t('filter.explainer.entity', args);
});
</script>
