<template>
  <h3>{{ t('analyze.result.title') }}</h3>

  <BaseGraphqlError v-if="error" :error="error" />

  <template v-else>
    <AnalyzeResultTable
      v-model:visible-columns="visibleColumns"
      v-model:pagination="pagination"
      :loading="fetching || fetchingColumns || debouncedFetching"
      :rows="rows"
      :all-columns="availableColumns"
      :data-is-fresh="isValid"
      :base-table="props.baseTable"
      :is-exporting="isExporting"
      :export-progress="exportProgress"
      @export="onExport"
    />
    <div v-if="lastRefreshDate" class="text-caption">
      {{
        t('analyze.result.lastRefresh', {
          date: lastRefreshDate?.toLocaleString(),
        })
      }}
    </div>

    <div style="display: none">
      <!-- leave for testing and debugging -->
      <pre data-test="query">{{ query }}</pre>
      <pre data-test="variables">{{ variables }}</pre>
    </div>
  </template>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import AnalyzeResultTable, {
  AnalyzeResultTableProps,
} from 'components/Analyze/Result/AnalyzeResultTable.vue';
import { BaseTable, FilterConjunction, FilterNode } from '../Filter/filterNode';
import {
  AnalyzeAttributionsViewFields,
  AnalyzeResult,
  AnalyzeResultEntityField,
  AnalyzeResultEntityRow,
  filterToQuery,
  attributionToXlsx,
} from './filterToQuery';
import { useQuery } from '@urql/vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { type QTableColumn, useQuasar } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import { debounce } from 'quasar';
import { AttributionAggregation } from './attributionAggregationTypes';
import { useRefreshAttributionsView } from 'src/composables/useRefreshAttributionsView';
import {
  ExportDataValue,
  TransformDataArgs,
  useExport,
} from 'src/composables/useExport';

export interface AnalyzeResultProps {
  baseTable: BaseTable;
  availableColumns: QTableColumn[];
  fetchingColumns: boolean;
  baseFilter: FilterNode | undefined;
  attributionFilter: FilterNode | undefined;
  initialVisibleColumns: string[] | undefined;
}

const props = defineProps<AnalyzeResultProps>();

const emit = defineEmits<{
  'visible-columns-changed': [columns: string[] | undefined];
}>();

const PAGINATION_PROPS_STORAGE_KEY = `breedersdb-analyze__pagination--${props.baseTable}`;
type DefaultPaginationProps = {
  sortBy: string | null;
  descending: boolean;
  rowsPerPage: number;
};

const { t } = useI18n();

const isValid = computed(
  () =>
    (props.baseFilter?.isValid() ?? true) &&
    (props.attributionFilter?.isValid() ?? true),
);

const selectedColumns = ref<string[]>([]);
const defaultColumns = computed(() => {
  return props.availableColumns.slice(0, 5).map((c) => c.name);
});
const validInitialVisibleColumns = computed(() =>
  props.initialVisibleColumns?.filter((vc) =>
    props.availableColumns.find((ac) => ac.name === vc),
  ),
);
const visibleColumns = computed({
  get: () =>
    selectedColumns.value.length > 0
      ? selectedColumns.value
      : validInitialVisibleColumns.value ?? defaultColumns.value,
  set: (cols: string[]) => {
    selectedColumns.value = cols;
  },
});

const columnsToFetch = ref<string[]>([]);
// use watch() instead of setting it in the visible columns setter
// to avoid starting empty
watch(
  visibleColumns,
  (newCols, oldCols) => {
    // fetch raw values for aggregation columns
    // e.g. `attributes.123.count` -> `attributes.123`
    const colsWithoutAggregates = newCols.map((c) => {
      const parts = c.split('.');
      const last = parts[parts.length - 1];
      return (Object.values(AttributionAggregation) as string[]).includes(last)
        ? parts.slice(0, -1).join('.')
        : c;
    });
    const uniqueNewCols = [...new Set(colsWithoutAggregates)];

    if (
      !oldCols ||
      uniqueNewCols.length > oldCols.length ||
      !uniqueNewCols.every((c) => oldCols.includes(c))
    ) {
      // only update columnsToFetch if columns were added but not if the order
      // changed or columns were removed. so a refetch is only triggered
      // when really needed.
      columnsToFetch.value = uniqueNewCols;
    }

    emit('visible-columns-changed', newCols);
  },
  { immediate: true },
);

const { sessionStorage } = useQuasar();
const defaultPagination = sessionStorage.getItem<DefaultPaginationProps>(
  PAGINATION_PROPS_STORAGE_KEY,
);
const pagination = ref<AnalyzeResultTableProps['pagination']>({
  sortBy: null,
  descending: false,
  page: 1,
  rowsPerPage: 100,
  rowsNumber: 0,
  ...defaultPagination,
});
watch(
  pagination,
  (newPagination) => {
    sessionStorage.set(PAGINATION_PROPS_STORAGE_KEY, newPagination);
  },
  { deep: true },
);

const { executeMutation: refreshDbView } = useRefreshAttributionsView();
const { data: lastRefresh, error: refreshError } = await refreshDbView({});

const lastRefreshDate = computed(() => {
  return lastRefresh?.refresh_attributions_view[0]?.last_refresh
    ? new Date(lastRefresh.refresh_attributions_view[0].last_refresh as string)
    : null;
});

const emptyBaseFilter = FilterNode.FilterRoot({
  childrensConjunction: FilterConjunction.And,
  baseTable: props.baseTable,
});

const emptyAttributionFilter = FilterNode.FilterRoot({
  childrensConjunction: FilterConjunction.And,
  baseTable: BaseTable.Attributions,
});

// debounce fetch queries
const debouncedFetching = ref(false);
const queryData = ref(
  filterToQuery({
    baseFilter: props.baseFilter || emptyBaseFilter,
    attributionFilter: props.attributionFilter || emptyAttributionFilter,
    columns: columnsToFetch.value,
    pagination: pagination.value,
  }),
);
watch(
  [
    () => props.baseFilter,
    () => props.attributionFilter,
    columnsToFetch,
    pagination,
    () => lastRefresh,
  ],
  () => {
    debouncedFetching.value = true;
    debounce(() => {
      queryData.value = filterToQuery({
        baseFilter: props.baseFilter || emptyBaseFilter,
        attributionFilter: props.attributionFilter || emptyAttributionFilter,
        columns: columnsToFetch.value,
        pagination: pagination.value,
      });
      debouncedFetching.value = false;
    }, 500)();
  },
  { deep: true },
);

const query = computed(() => queryData.value.query);
const variables = computed(() => queryData.value.variables);

const {
  data,
  fetching,
  error: queryError,
} = await useQuery<AnalyzeResult>({
  query,
  variables,
});

const fixDataRowKeys = (row: AnalyzeResultEntityRow) => {
  // replace double underscores (which were added for graphql
  // compatibility) with dots so the columns have the same name as in
  // `prop.availableColumns`
  // e.g. `plants__plant_rows__name` -> `plants.plant_rows.name`
  const entries = Object.entries(row);
  const renamed = entries.map(([key, value]) => [
    key === '__typename' ? key : key.replaceAll('__', '.'),
    value,
  ]);
  return Object.fromEntries(renamed);
};

const rows = computed(() => {
  if (!data?.value) {
    return [];
  }
  return data.value[props.baseTable].map(
    fixDataRowKeys,
  ) as AnalyzeResultTableProps['rows'][0][];
});

const error = computed(() => refreshError || queryError.value);

const totalResults = computed(() => {
  if (!data?.value) return 0;
  return data.value[`${props.baseTable}_aggregate`].aggregate.count;
});
watch(
  totalResults,
  (newCount) => {
    pagination.value.rowsNumber = newCount;
  },
  { immediate: true },
);

// unnests attributions and parse for export
// eg. { id: 1, label_id: "123", attributes: [{ id: 1, text_value: "a" }, { id: 2, boolean_value: true }] }
// -> [
//     { id: 1, label_id: "123", attribution__id: 1, attribution__value: "a" },
//     { id: 1, label_id: "123", attribution__id: 2, attribution__value: true }
// ]
function unnestAttributions({
  data,
  visibleColumns,
}: TransformDataArgs<AnalyzeResultEntityRow>) {
  // keys in data that point to arrays of attributions
  const attributionsColumnNames = visibleColumns.filter((col) =>
    col.startsWith('attributes.'),
  );

  const dataUnnested: ({
    [key: string]: ExportDataValue;
  } & {
    [key: `attribution__${string}`]: ExportDataValue;
  })[] = [];
  for (const _row of data) {
    // replace double underscores (which were added for graphql)
    const row = fixDataRowKeys(_row) as {
      [key: `${string}`]: AnalyzeResultEntityField;
    } & {
      [key: `attributes.${number}`]: AnalyzeAttributionsViewFields[];
    };

    // copy of row without attributions
    const rowWithoutAttributions = Object.fromEntries(
      Object.entries(row).filter(
        ([key]) => !attributionsColumnNames.includes(key),
      ),
    ) as { [key: string]: AnalyzeResultEntityField };

    // unnest all attributions
    let attributionFound = false;
    for (const attributionColumnName of attributionsColumnNames) {
      const attributions = row[attributionColumnName as `attributes.${number}`];
      for (const attribution of attributions) {
        attributionFound = true;

        const exportedAttribution = attributionToXlsx(attribution);

        // prefix keys with attribution__
        const attributionWithPrefixedKeys = {
          ...Object.fromEntries(
            Object.entries(exportedAttribution).map(([k, v]) => [
              `attribution__${k}`,
              v,
            ]),
          ),
        };

        // add row with unnested attribution
        dataUnnested.push({
          ...rowWithoutAttributions,
          ...attributionWithPrefixedKeys,
        });
      }
    }
    if (!attributionFound) {
      dataUnnested.push(rowWithoutAttributions);
    }
  }
  return {
    data: dataUnnested,
    visibleColumns: [
      ...visibleColumns.filter((c) => !attributionsColumnNames.includes(c)),
      ...attributionsExportColums.map((c) => c.name),
    ],
  };
}

const attributionsExportColums = [
  {
    name: 'attribution__id',
    field: 'attribution__id',
    label: t('attributions.columns.id'),
  },
  {
    name: 'attribution__attribution_form_id',
    field: 'attribution__attribution_form_id',
    label: t('attributions.columns.attributionFormId'),
  },
  {
    name: 'attribution__attribute_id',
    field: 'attribution__attribute_id',
    label: t('attributions.columns.attributeId'),
  },
  {
    name: 'attribution__attributed_object_type',
    field: 'attribution__attributed_object_type',
    label: t('attributions.columns.attributedObjectType'),
  },
  {
    name: 'attribution__attributed_object_name',
    field: 'attribution__attributed_object_name',
    label: t('attributions.columns.attributedObjectName'),
  },
  {
    name: 'attribution__attribute_name',
    field: 'attribution__attribute_name',
    label: t('attributions.columns.attributeName'),
  },
  {
    name: 'attribution__value',
    field: 'attribution__value',
    label: t('attributions.columns.value'),
  },
  {
    name: 'attribution__date_attributed',
    field: 'attribution__date_attributed',
    label: t('attributions.columns.dateAttributed'),
  },
  {
    name: 'attribution__text_note',
    field: 'attribution__text_note',
    label: t('attributions.columns.textNote'),
  },
  {
    name: 'attribution__photo_note',
    field: 'attribution__photo_note',
    label: t('attributions.columns.photoNote'),
  },
  {
    name: 'attribution__author',
    field: 'attribution__author',
    label: t('attributions.columns.author'),
  },
  {
    name: 'attribution__exceptional_attribution',
    field: 'attribution__exceptional_attribution',
    label: t('attributions.columns.exceptionalAttribution'),
  },
  {
    name: 'attribution__created',
    field: 'attribution__created',
    label: t('attributions.columns.dateCreated'),
  },
].map((c) => ({
  ...c,
  label: `${t('attributions.exportPrefix')} > ${c.label}`,
}));

const { exportDataAndWriteNewXLSX, isExporting, exportProgress } = useExport<
  AnalyzeResultEntityRow,
  typeof query.value,
  typeof variables.value
>({
  entityName: props.baseTable,
  query,
  variables,
  visibleColumns: computed(() =>
    // aggregation columns are included as their non-aggregated version
    //    ["plants.id", "attributes.246", "attributes.244.count"]
    // -> ["plants.id", "attributes.246", "attributes.244"]
    Array.from(
      new Set(
        visibleColumns.value.map((key) => key.split('.').slice(0, 2).join('.')),
      ),
    ),
  ),
  columns: computed(() => [
    ...props.availableColumns,
    ...attributionsExportColums,
  ]),
  title: t('analyze.result.title', 2),
  transformDataFn: unnestAttributions,
});

async function onExport() {
  const result = await exportDataAndWriteNewXLSX();
  console.log('Exported:', result);
}
</script>
