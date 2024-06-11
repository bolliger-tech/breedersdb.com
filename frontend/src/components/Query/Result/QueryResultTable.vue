<template>
  <q-table
    v-model:pagination="pagination"
    :class="{ 'query-result-table--fullscreen': fullscreen }"
    :columns="orderedColumns"
    :fullscreen="fullscreen"
    :loading="loading"
    :rows="rows"
    :rows-per-page-options="[10, 100, 1000]"
    :visible-columns="visibleColumns"
    :wrap-cells="true"
    binary-state-sort
    class="query-result-table"
    color="primary"
    row-key="id"
    @request="(event) => (pagination = event.pagination)"
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
        class="q-ml-md"
        dense
        flat
        no-caps
        @click="fullscreen = !fullscreen"
      >
        <div class="column items-center">
          <q-icon :name="fullscreen ? 'fullscreen_exit' : 'fullscreen'" />
          <div class="text-caption">
            {{
              fullscreen ? t('result.exitFullscreen') : t('result.fullscreen')
            }}
          </div>
        </div>
      </q-btn>
    </template>

    <template #header-cell="cellProps">
      <QueryResultTableHeaderCell
        :cell-props="cellProps"
        :possible-drop-target="
          !!draggedColumn && cellProps.col.name !== draggedColumn
        "
        @col-dropped="reorderColumns"
        @hide-column="hideColumn"
        @drag-end="draggedColumn = null"
        @drag-start="draggedColumn = cellProps.col.name"
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

export interface QueryResultTableProps
  extends QueryResultTablePropsWithoutModel {
  visibleColumns: string[];
  pagination: NonNullable<QTableProps['pagination']>;
}

interface QueryResultTablePropsWithoutModel {
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

const props = withDefaults(defineProps<QueryResultTablePropsWithoutModel>(), {
  loading: false,
});
const visibleColumns = defineModel<string[]>('visibleColumns', {
  required: true,
});
const pagination = defineModel<QTableProps['pagination']>('pagination', {
  required: true,
});

const { t } = useI18n();

const draggedColumn = ref<string | null>(null);

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
</script>

<style lang="scss">
/* Do not scope this tag, else we loose the
   sticky definitions for the header and footer */

.query-result-table {
  max-height: calc(100vh - 100px);
}

.query-result-table--fullscreen {
  height: 100vh;
  max-height: 100vh;
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
</style>
