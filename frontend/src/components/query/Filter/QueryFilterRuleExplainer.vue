<template>
  <template v-if="rule && rule.isValid">
    <q-icon name="info" />&nbsp;
    <span class="text-body2">
      <strong>{{ t('filter.explainer.title') }}</strong>
      {{ explainer }}
    </span>
  </template>
  <template v-else>
    <q-icon name="warning" class="text-negative" />&nbsp;
    <span class="text-body2 text-negative">
      {{ t('filter.explainer.invalidRule') }}
    </span>
  </template>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { FilterRule } from './filterRule';
import { useQueryStore } from '../useQueryStore';
import { useI18n } from 'src/composables/useI18n';
import { getEntityName } from './getEntityName';

interface QueryFilterRuleExplainerProps {
  rule?: FilterRule;
}

const props = defineProps<QueryFilterRuleExplainerProps>();

const { t } = useI18n();

const column = computed(() => {
  return props.rule?.column?.tableColumnLabel || '';
});
const operator = computed(() => {
  return props.rule?.operator?.labelKey ? t(props.rule.operator?.labelKey) : '';
});
const term = computed(() => {
  return props.rule?.term?.value || '';
});

const store = useQueryStore();
const entityName = computed(() => {
  return getEntityName({ t, table: store.baseTable, plural: true });
});

const explainer = computed(() => {
  const args = {
    entity: props.rule?.isAttribute
      ? t('filter.cultivarAndSubentities')
      : entityName.value,
    column: column.value,
    operator: operator.value,
    term: term.value,
  };
  if (props.rule?.isAttribute) {
    if (props.rule.includeEntitiesWithoutAttributions) {
      return t('filter.explainer.attributeWithNoAttributions', args);
    } else {
      return t('filter.explainer.attribute', args);
    }
  }
  return t('filter.explainer.entity', args);
});
</script>
