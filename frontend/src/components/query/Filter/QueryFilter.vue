<template>
  <q-toggle v-model="store.explain" :label="t('filter.showExplanation')" />
  <p class="text-overline q-mb-none q-mt-lg">
    {{ t('filter.baseFilter', { entityName }) }}
  </p>
  <BaseGraphqlError v-if="baseFilterError" :error="baseFilterError" />
  <QueryFilterRootNode
    v-else
    :filter="baseFilterDefault"
    :options="baseTableColumnsWithAttributes"
    :fetching="baseFilterFetching"
  />

  <p class="text-overline q-mb-none q-mt-lg">
    {{ t('filter.attributionFilter') }}
  </p>
  <BaseGraphqlError
    v-if="attributionViewColumnsError"
    :error="attributionViewColumnsError"
  />
  <QueryFilterRootNode
    v-else
    :filter="attributionFilterDefault"
    :options="attributionViewColumns"
    :fetching="fetchingAttributionViewColumns"
  />
</template>

<script lang="ts" setup>
import { useI18n } from 'src/composables/useI18n';
import QueryFilterRootNode from './QueryFilterRootNode.vue';
import { useAttributesAsColumns } from './ColumnDefinitions/useAttributesAsColumns';
import { computed } from 'vue';
import { useQueryStore } from '../useQueryStore';
import { useEntityName } from 'src/composables/useEntityName';
import { useAttributionViewColumns } from './ColumnDefinitions/useAttributionViewColumns';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { useColumnDefinitions } from './ColumnDefinitions/useColumnDefinitions';
import { onMounted } from 'vue';
import { BaseTable } from 'src/components/Query/queryTypes';

export interface QueryFilterProps {
  baseTable: BaseTable;
}

const { t } = useI18n();

const props = defineProps<QueryFilterProps>();
const { getEntityName } = useEntityName();
const entityName = computed(() =>
  getEntityName({ table: props.baseTable, plural: true }),
);

const store = useQueryStore();

const baseFilterDefault = computed(() => store.getBaseFilter);
const attributionFilterDefault = computed(() => store.getAttributionFilter);

const {
  activate: fetchAttributesAsColumns,
  data: attributesAsColumns,
  error: attributesAsColumnsError,
  fetching: fetchingAsColumnsAttributes,
} = useAttributesAsColumns();
onMounted(() => fetchAttributesAsColumns());

const baseTable = useColumnDefinitions({
  currentEntity: props.baseTable,
});
if (!baseTable.value) {
  throw new Error('Base table not found');
}
const {
  activate: fetchBaseTableColumns,
  data: baseTableColumns,
  error: baseTableColumnsError,
  fetching: fetchingBaseTableColumns,
} = baseTable.value;
onMounted(() => fetchBaseTableColumns());

const baseTableColumnsWithAttributes = computed(() => [
  ...baseTableColumns.value,
  ...attributesAsColumns.value,
]);

const baseFilterFetching = computed(
  () => fetchingBaseTableColumns.value || fetchingAsColumnsAttributes.value,
);
const baseFilterError = computed(
  () => baseTableColumnsError.value || attributesAsColumnsError.value,
);

const {
  activate: fetchAttributionViewColumns,
  data: attributionViewColumns,
  error: attributionViewColumnsError,
  fetching: fetchingAttributionViewColumns,
} = useAttributionViewColumns();
onMounted(() => fetchAttributionViewColumns());
</script>
