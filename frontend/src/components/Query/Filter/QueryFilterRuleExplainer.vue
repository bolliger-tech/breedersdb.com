<template>
  <template v-if="rule && rule.isValid">
    <q-icon name="info" />&nbsp;
    <span class="text-body2">
      <strong>{{ t('analyze.filter.explainer.title') }}</strong>
      {{ explainer }}
    </span>
  </template>
  <template v-else>
    <q-icon name="warning" class="text-negative" />&nbsp;
    <span class="text-body2 text-negative">
      {{ t('analyze.filter.explainer.invalidRule') }}
    </span>
  </template>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { FilterRule } from './filterRule';
import { useQueryStore } from '../useQueryStore';
import { useI18n } from 'src/composables/useI18n';
import { useEntityName } from 'src/composables/useEntityName';
import { ColumnTypes } from 'src/utils/columnTypes';

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
  switch (props.rule?.type) {
    case ColumnTypes.String:
    case ColumnTypes.Integer:
    case ColumnTypes.Rating:
    case ColumnTypes.Float:
    case ColumnTypes.Enum:
      return props.rule?.term?.value || '';
    case ColumnTypes.Date:
      try {
        return new Date(props.rule?.term?.value as string).toLocaleDateString();
      } catch (e) {
        return '';
      }
    case ColumnTypes.DateTime:
      try {
        return new Date(props.rule?.term?.value as string).toLocaleString();
      } catch (e) {
        return '';
      }
    case ColumnTypes.Time:
      try {
        return new Date(props.rule?.term?.value as string).toLocaleTimeString();
      } catch (e) {
        return '';
      }
    default:
      return '';
  }
});

const store = useQueryStore();
const { getEntityName } = useEntityName();
const entityName = computed(() => {
  if (props.rule?.tableName === 'attributions_view') {
    return t('base.entityName.attribution', 2);
  }
  return getEntityName({ table: store.baseTable, plural: true });
});

const explainer = computed(() => {
  const args = {
    entity: props.rule?.isAttribute
      ? t('analyze.filter.cultivarAndSubentities')
      : entityName.value,
    column: column.value,
    operator: operator.value,
    term: term.value,
  };
  if (props.rule?.isAttribute) {
    if (props.rule.includeEntitiesWithoutAttributions) {
      return t('analyze.filter.explainer.attributeWithNoAttributions', args);
    } else {
      return t('analyze.filter.explainer.attribute', args);
    }
  }
  return t('analyze.filter.explainer.entity', args);
});
</script>
