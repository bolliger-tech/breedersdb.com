<template>
  <BaseMessage v-if="rule && rule.isValid" type="info" class="text-body2">
    <strong>{{ t('analyze.filter.explainer.title') }}</strong>
    {{ explainer }}
  </BaseMessage>
  <BaseMessage
    v-else
    type="error"
    :message="t('analyze.filter.explainer.invalidRule')"
    class="text-body2"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { FilterRule } from './filterRule';
import { useI18n } from 'src/composables/useI18n';
import { useEntityName } from 'src/composables/useEntityName';
import { ColumnTypes } from 'src/utils/columnTypes';
import { BaseTable } from './filterNode';
import BaseMessage from 'src/components/Base/BaseMessage.vue';

interface AnalyzeFilterRuleExplainerProps {
  rule?: FilterRule | undefined;
  baseTable: BaseTable;
}

const props = defineProps<AnalyzeFilterRuleExplainerProps>();

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
    case ColumnTypes.Citext:
    case ColumnTypes.Integer:
    case ColumnTypes.Rating:
    case ColumnTypes.Float:
    case ColumnTypes.Enum:
      return props.rule?.term?.value || '';
    case ColumnTypes.Date:
      try {
        return new Date(props.rule?.term?.value as string).toLocaleDateString();
      } catch {
        return '';
      }
    case ColumnTypes.DateTime:
      try {
        return new Date(props.rule?.term?.value as string).toLocaleString();
      } catch {
        return '';
      }
    case ColumnTypes.Time:
      try {
        return new Date(props.rule?.term?.value as string).toLocaleTimeString();
      } catch {
        return '';
      }
    default:
      return '';
  }
});

const { getEntityName } = useEntityName();
const entityName = computed(() => {
  if (props.rule?.tableName === 'cached_attributions') {
    return t('base.entityName.attribution', 2);
  }
  return getEntityName({ table: props.baseTable, plural: true });
});

const explainer = computed(() => {
  const args = {
    entity: entityName.value,
    column: column.value,
    operator: operator.value,
    term: term.value,
  };

  if (props.rule?.isAttribute) {
    if (props.baseTable === BaseTable.Cultivars) {
      args.entity = t('analyze.filter.entities.cultivarAndSubentities');
    } else if (props.baseTable === BaseTable.PlantGroups) {
      args.entity = t('analyze.filter.entities.groupAndSubentities');
    }
  }

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
