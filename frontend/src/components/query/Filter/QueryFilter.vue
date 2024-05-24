<template>
  <q-toggle v-model="store.explain" :label="t('filter.showExplanation')" />
  <p class="text-overline q-mb-none q-mt-lg">
    {{ t('filter.baseFilter', { entityName }) }}
  </p>
  <QueryFilterRootNode
    :filter="baseFilterDefault"
    :options="baseTableColumnsWithAttributes"
  />
  <p class="text-overline q-mb-none q-mt-lg">
    {{ t('filter.attributionFilter') }}
  </p>
  <QueryFilterRootNode
    :filter="attributionFilterDefault"
    :options="attributionColumns"
  />
</template>

<script lang="ts" setup>
import { useI18n } from 'src/composables/useI18n';
import QueryFilterRootNode from './QueryFilterRootNode.vue';
import { useAttributes } from './useAttributes';
import { computed, ref, watch } from 'vue';
import { useQueryStore } from '../useQueryStore';
import { getBaseTableColumns } from './baseTableColumns';
import { BaseTable } from './queryTypes';
import { getEntityName } from './getEntityName';

export interface QueryFilterProps {
  baseTable: BaseTable;
}

const { t } = useI18n();

const props = defineProps<QueryFilterProps>();
const entityName = computed(() =>
  getEntityName({ t, table: props.baseTable, plural: true }),
);

const store = useQueryStore();

const baseFilterDefault = computed(() => store.getBaseFilter);
const attributionFilterDefault = computed(() => store.getAttributionFilter);

const { fetchAsFilterRuleColumns: fetchAttributesAsColumns } = useAttributes({
  tableLabel: t('filter.attribute'),
});

const { data: attributesAsColumns, error } = await fetchAttributesAsColumns();

const baseTableColumnsWithAttributes = ref([
  ...getBaseTableColumns({ baseTable: store.baseTable, t }),
  ...attributesAsColumns,
]);

const attributionColumns = ref([]);

watch(error, (error) => {
  if (error) {
    throw error;
  }
});
</script>
