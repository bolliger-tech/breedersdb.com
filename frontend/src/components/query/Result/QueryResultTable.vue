<template>
  <!-- v-model:pagination="pagination" -->
  <q-table
    :class="{ 'query-result-table--fullscreen': fullscreen }"
    :columns="orderedColumns"
    :fullscreen="fullscreen"
    :loading="loading"
    :rows="rows"
    :rows-per-page-options="[10, 100, 1000]"
    :virtual-scroll-item-size="48"
    :virtual-scroll-sticky-size-start="48"
    :visible-columns="visibleColumns"
    :wrap-cells="true"
    binary-state-sort
    class="query-result-table"
    color="primary"
    row-key="id"
    virtual-scroll
    @request="(event) => $emit('requestData', event)"
  >
    <template #top-left>
      <div v-if="visibleColumns.length < 1" class="text-negative">
        <q-icon name="warning" />&nbsp;&nbsp;{{ t('result.noColumnError') }}
      </div>
      <div v-else-if="!dataIsFresh" class="text-negative">
        <q-icon name="warning" />&nbsp;&nbsp;{{ t('result.dataIsNotFresh') }}
      </div>
    </template>

    <template #top-right>
      <QueryResultTableColumnSelector
        v-model="visibleColumns"
        :all-columns="allColumns"
        class="q-ml-lg"
      />

      <q-btn
        :icon="fullscreen ? 'fullscreen_exit' : 'fullscreen'"
        class="q-ml-md"
        dense
        flat
        round
        @click="fullscreen = !fullscreen"
      />
    </template>

    <template #header-cell="cellProps">
      <QueryResultTableHeaderCell
        :cell-props="cellProps"
        @col-dropped="reorderColumns"
        @hide-column="hideColumn"
      />
    </template>

    <template #body-cell="cellProps">
      <QueryResultTableCell :cell-props="cellProps" />
    </template>
  </q-table>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { QTable, QTableColumn, QTableProps } from 'quasar';
import QueryResultTableColumnSelector from './QueryResultTableColumnSelector.vue';
import QueryResultTableCell from './QueryResultTableCell.vue';
import QueryResultTableHeaderCell from './QueryResultTableHeaderCell.vue';
import { QueryAttributionsViewFields } from './filterToQuery';
import { useI18n } from 'src/composables/useI18n';

export interface QueryResultTableProps {
  rows: (
    | { [key: string]: null | number | string }
    | { [key: `attributes.${number}`]: QueryAttributionsViewFields[] }
  )[];
  loading: boolean;
  allColumns: QTableColumn[];
  dataIsFresh: boolean;
}

export type QueryResultTableRequestDataParams = Parameters<
  NonNullable<QTableProps['onRequest']>
>[0];

const props = withDefaults(defineProps<QueryResultTableProps>(), {
  loading: false,
});
const visibleColumns = defineModel<string[]>('visibleColumns', {
  required: true,
});

defineEmits<{
  requestData: [data: QueryResultTableRequestDataParams];
}>();

// const ROWS_PER_PAGE = 100;

const { t } = useI18n();

const fullscreen = ref(false);

function hideColumn(name: string) {
  visibleColumns.value = visibleColumns.value.filter(
    (column) => column !== name,
  );
}

function reorderColumns(
  targetColName: string,
  moveColName: string,
  pos: 'before' | 'after',
) {
  let cols = [...visibleColumns.value];

  let moveColIdx = cols.indexOf(moveColName);
  let targetColIdx = cols.indexOf(targetColName);

  if (0 === cols.length || -1 === moveColIdx || -1 === targetColIdx) {
    cols = props.allColumns.map((col) => col.name);
    moveColIdx = cols.indexOf(moveColName);
  }

  // remove moveCol
  cols.splice(moveColIdx, 1);

  targetColIdx = cols.indexOf(targetColName);

  if ('after' === pos) {
    targetColIdx++;
  }

  cols.splice(targetColIdx, 0, moveColName);

  visibleColumns.value = cols;
}

const orderedColumns = computed(() => {
  if (0 === visibleColumns.value.length) {
    return props.allColumns;
  }

  return [...props.allColumns].sort(
    (a, b) =>
      visibleColumns.value.indexOf(a.name) -
      visibleColumns.value.indexOf(b.name),
  );
});

// const totalRowsDB = computed<number>(() => {
//   return props.result?.count || 0;
// });

// const offset = computed<number>(() => {
//   return props.result?.offset || 0;
// });

// const page = computed<number>(() => {
//   return 1 + offset.value / rowsPerPage.value;
// });

// const sortBy = computed<string>(() => {
//   return props.result?.sortBy || '';
// });

// const descending = computed<boolean>(() => {
//   return props.result?.order === 'desc';
// });

// const rowsPerPage = computed<number>(() => {
//   return props.result?.limit || ROWS_PER_PAGE;
// });

// const pagination = ref({
//   sortBy: sortBy.value,
//   descending: descending.value,
//   page: page.value,
//   rowsPerPage: rowsPerPage.value,
//   rowsNumber: totalRowsDB.value,
// });

// watch(totalRowsDB, (count) => (pagination.value.rowsNumber = count));
// watch(page, (num) => (pagination.value.page = num));
// watch(sortBy, (col) => (pagination.value.sortBy = col));
// watch(descending, (order) => (pagination.value.descending = order));
// watch(rowsPerPage, (limit) => (pagination.value.rowsPerPage = limit));
</script>

<style lang="scss">
/* Do not scope this tag, else we loose the
   sticky definitions for the header and footer */

.query-result-table {
  max-height: calc(100vh - 100px);
}

.query-result-table--fullscreen {
  height: 100vh;
}

.query-result-table thead tr:first-child th {
  /* bg color is important for th to cover rows underneath (scrolling) */
  background-color: #fff;
}
.body--dark {
  .query-result-table thead tr:first-child th {
    /* bg color is important for th to cover rows underneath (scrolling) */
    background-color: var(--q-dark);
  }
}

.query-result-table .q-table__bottom,
.query-result-table .q-table__top {
  background-color: $grey-3;
}
.body--dark {
  .query-result-table .q-table__bottom,
  .query-result-table .q-table__top {
    background-color: $grey-9;
  }
}

.query-result-table thead tr th {
  position: sticky;
  z-index: 1;
  top: 0;
}

/* this is when the loading indicator appears */
.query-result-table.q-table--loading thead tr:last-child th {
  /* height of all previous header rows */
  top: 48px;
}
</style>
