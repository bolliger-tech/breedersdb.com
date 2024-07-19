<template>
  <p class="text-weight-bold q-mb-none q-mt-lg">
    {{ t('analyze.filter.baseFilter', { entityName }) }}
  </p>
  <QueryFilterRootNode
    :serialized-filter="initialBaseFilter"
    :base-table="props.baseTable"
    :columns="baseFilterColumns"
    :fetching="baseFilterColumnsFetching"
    @changed="$emit('baseFilterChanged', $event)"
  />

  <template v-if="attributionFilterColumns || attributionFilterColumnsFetching">
    <p class="text-weight-bold q-mb-sm q-mt-lg">
      {{ t('analyze.filter.attributionFilter') }}
    </p>
    <QueryFilterRootNode
      :serialized-filter="initialAttributionFilter"
      :base-table="BaseTable.Attributions"
      :columns="attributionFilterColumns || []"
      :fetching="attributionFilterColumnsFetching || false"
      @changed="$emit('attributionFilterChanged', $event)"
    />
  </template>
</template>

<script lang="ts" setup>
import { useI18n } from 'src/composables/useI18n';
import QueryFilterRootNode from './AnalyzeFilterRootNode.vue';
import { computed } from 'vue';
import { useEntityName } from 'src/composables/useEntityName';
import { BaseTable, FilterNode } from './filterNode';
import { FilterRuleColumn } from './filterRuleColumn';

export interface QueryFilterProps {
  baseTable: BaseTable;
  initialBaseFilter: string | undefined;
  baseFilterColumns: FilterRuleColumn[];
  baseFilterColumnsFetching: boolean;
  initialAttributionFilter: string | undefined;
  attributionFilterColumns?: FilterRuleColumn[];
  attributionFilterColumnsFetching?: boolean;
}

const props = defineProps<QueryFilterProps>();

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
