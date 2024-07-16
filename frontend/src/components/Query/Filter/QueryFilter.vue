<template>
  <q-toggle
    v-model="store.explain"
    :label="t('analyze.filter.showExplanation')"
  />
  <p class="text-overline q-mb-none q-mt-lg">
    {{ t('analyze.filter.baseFilter', { entityName }) }}
  </p>
  <QueryFilterRootNode
    v-model="baseFilter"
    :base-table="props.baseTable"
    :columns="baseFilterColumns"
    :fetching="baseFilterColumnsFetching"
  />

  <template v-if="attributionFilterColumns || attributionFilterColumnsFetching">
    <p class="text-overline q-mb-none q-mt-lg">
      {{ t('analyze.filter.attributionFilter') }}
    </p>
    <QueryFilterRootNode
      v-model="attributionFilter"
      :base-table="BaseTable.Attributions"
      :columns="attributionFilterColumns || []"
      :fetching="attributionFilterColumnsFetching || false"
    />
  </template>
</template>

<script lang="ts" setup>
import { useI18n } from 'src/composables/useI18n';
import QueryFilterRootNode from './QueryFilterRootNode.vue';
import { computed } from 'vue';
import { useQueryStore } from '../useQueryStore';
import { useEntityName } from 'src/composables/useEntityName';
import { BaseTable } from './filterNode';
import { FilterRuleColumn } from './filterRuleColumn';

export interface QueryFilterProps {
  baseTable: BaseTable;
  baseFilterColumns: FilterRuleColumn[];
  baseFilterColumnsFetching: boolean;
  attributionFilterColumns?: FilterRuleColumn[];
  attributionFilterColumnsFetching?: boolean;
}

const props = defineProps<QueryFilterProps>();

const baseFilter = defineModel<string | undefined>('baseFilter', {
  required: true,
});
const attributionFilter = defineModel<string | undefined>('attributionFilter');

const { t } = useI18n();
const store = useQueryStore();

const { getEntityName } = useEntityName();
const entityName = computed(() =>
  getEntityName({ table: props.baseTable, plural: true }),
);
</script>
