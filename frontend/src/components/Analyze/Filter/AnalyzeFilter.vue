<template>
  <AnalyzeFilterRootNode
    :title="t('analyze.filter.baseFilter', { entityName })"
    :serialized-filter="initialBaseFilter"
    :base-table="props.baseTable"
    :columns="baseFilterColumns"
    :fetching="baseFilterColumnsFetching"
    @changed="$emit('baseFilterChanged', $event)"
  />

  <AnalyzeFilterRootNode
    v-if="attributionFilterColumns || attributionFilterColumnsFetching"
    :title="t('analyze.filter.attributionFilter')"
    :serialized-filter="initialAttributionFilter"
    :base-table="BaseTable.Attributions"
    :columns="attributionFilterColumns || []"
    :fetching="attributionFilterColumnsFetching || false"
    @changed="$emit('attributionFilterChanged', $event)"
  />
</template>

<script lang="ts" setup>
import { useI18n } from 'src/composables/useI18n';
import AnalyzeFilterRootNode from './AnalyzeFilterRootNode.vue';
import { computed } from 'vue';
import { useEntityName } from 'src/composables/useEntityName';
import { BaseTable, FilterNode } from './filterNode';
import { FilterRuleColumn } from './filterRuleColumn';

export interface AnalyzeFilterProps {
  baseTable: BaseTable;
  initialBaseFilter: string | undefined;
  baseFilterColumns: FilterRuleColumn[];
  baseFilterColumnsFetching: boolean;
  initialAttributionFilter: string | undefined;
  attributionFilterColumns?: FilterRuleColumn[];
  attributionFilterColumnsFetching?: boolean;
}

const props = defineProps<AnalyzeFilterProps>();

defineEmits<{
  baseFilterChanged: [filter: FilterNode | undefined];
  attributionFilterChanged: [filter: FilterNode | undefined];
}>();

const { t } = useI18n();

const { getEntityName } = useEntityName();
const entityName = computed(() =>
  getEntityName({ table: props.baseTable, plural: true }),
);
</script>
