<template>
  <q-toggle v-model="store.explain" :label="t('filter.showExplanation')" />
  <p class="text-overline q-mb-none q-mt-lg">
    {{ t('filter.baseFilter', { entityName }) }}
  </p>
  <BaseGraphqlError
    v-if="baseFilterColumnsError"
    :error="baseFilterColumnsError"
  />
  <QueryFilterRootNode
    v-else
    :filter="baseFilter"
    :options="baseTableColumnsWithAttributes"
    :fetching="baseFilterColumnsFetching"
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
    :filter="attributionFilter"
    :options="attributionFilterColumns"
    :fetching="attributionFilterColumnsFetching"
  />
</template>

<script lang="ts" setup>
import { useI18n } from 'src/composables/useI18n';
import QueryFilterRootNode from './QueryFilterRootNode.vue';
import { useAttributesAsColumns } from './ColumnDefinitions/useAttributesAsColumns';
import { computed } from 'vue';
import { useQueryStore } from '../useQueryStore';
import { useEntityName } from 'src/composables/useEntityName';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { useColumnDefinitions } from './ColumnDefinitions/useColumnDefinitions';
import { onMounted, watch } from 'vue';
import { BaseTable, FilterConjunction, FilterNode } from './filterNode';
import { useQuasar } from 'quasar';

export interface QueryFilterProps {
  baseTable: BaseTable;
}

const { t } = useI18n();
const store = useQueryStore();
const $q = useQuasar();

const props = defineProps<QueryFilterProps>();
const { getEntityName } = useEntityName();
const entityName = computed(() =>
  getEntityName({ table: props.baseTable, plural: true }),
);

const {
  activate: fetchAttributesAsColumns,
  data: attributesAsColumns,
  error: attributesAsColumnsError,
  fetching: fetchingAsColumnsAttributes,
} = useAttributesAsColumns();
onMounted(() => fetchAttributesAsColumns());

const baseTableColumnDefinitions = useColumnDefinitions({
  table: props.baseTable,
});
if (!baseTableColumnDefinitions.value) {
  throw new Error('Base table not found');
}
const {
  activate: fetchBaseTableColumns,
  data: baseTableColumns,
  error: baseTableColumnsError,
  fetching: fetchingBaseTableColumns,
} = baseTableColumnDefinitions.value;
onMounted(() => fetchBaseTableColumns());

const baseFilterColumnsFetching = computed(
  () => fetchingBaseTableColumns.value || fetchingAsColumnsAttributes.value,
);
const baseFilterColumnsError = computed(
  () => baseTableColumnsError.value || attributesAsColumnsError.value,
);

const baseTableColumnsWithAttributes = computed(() => [
  ...baseTableColumns.value,
  ...attributesAsColumns.value,
]);

const baseTableColumnsWithAttributesIsLoaded = computed(
  () =>
    baseTableColumns.value.length > 0 &&
    attributesAsColumns.value.length > 0 &&
    baseTableColumnsWithAttributes.value.length ===
      baseTableColumns.value.length + attributesAsColumns.value.length,
);

watch(baseTableColumnsWithAttributesIsLoaded, initBaseFilter);

function initBaseFilter() {
  const json = $q.localStorage.getItem<string>(
    `base_filter--${props.baseTable}`,
  );
  if (json) {
    store.baseFilter = FilterNode.FromJSON(
      json,
      null,
      baseTableColumnsWithAttributes.value,
    );
  } else {
    store.baseFilter = FilterNode.FilterRoot({
      childrensConjunction: FilterConjunction.And,
      baseTable: props.baseTable,
    });
  }
}

const baseFilter = computed(() => store.baseFilter as FilterNode | undefined);

watch(
  baseFilter,
  (filter) => {
    if (filter)
      $q.localStorage.set(`base_filter--${props.baseTable}`, filter.toJSON());
  },
  { deep: true },
);

const attributionColumnDefinitions = useColumnDefinitions({
  table: BaseTable.Attributions,
});
if (!attributionColumnDefinitions.value) {
  throw new Error('Attributions table not found');
}
const {
  activate: fetchAttributionViewColumns,
  data: attributionFilterColumns,
  error: attributionViewColumnsError,
  fetching: attributionFilterColumnsFetching,
} = attributionColumnDefinitions.value;
onMounted(() => fetchAttributionViewColumns());

const attributionFilterColumnsIsLoaded = computed(
  () => attributionFilterColumns.value.length > 0,
);

watch(attributionFilterColumnsIsLoaded, initAttributionFilter);

function initAttributionFilter() {
  const json = $q.localStorage.getItem<string>('attribution_filter');
  if (json) {
    store.attributionFilter = FilterNode.FromJSON(
      json,
      null,
      attributionFilterColumns.value,
    );
  } else {
    store.attributionFilter = FilterNode.FilterRoot({
      childrensConjunction: FilterConjunction.And,
      baseTable: BaseTable.Attributions,
    });
  }
}

const attributionFilter = computed(() => store.attributionFilter as FilterNode);

watch(
  attributionFilter,
  (filter) => {
    if (filter) $q.localStorage.set('attribution_filter', filter.toJSON());
  },
  { deep: true },
);
</script>
