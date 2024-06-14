<template>
  <q-table
    v-model:pagination="pagination"
    :class="{ 'crud-list-table--fullscreen': fullscreen }"
    :columns="orderedColumns"
    :fullscreen="fullscreen"
    :loading="loading"
    :rows="rows"
    :rows-per-page-options="[10, 100, 1000]"
    :visible-columns="visibleColumns"
    :wrap-cells="true"
    binary-state-sort
    class="crud-list-table"
    color="primary"
    row-key="id"
    @request="(event) => (pagination = event.pagination)"
  >
    <template #top-left>
      <div v-if="visibleColumns.length < 1" class="text-negative">
        <q-icon name="warning" />&nbsp;&nbsp;{{ t('crud.list.noColumnError') }}
      </div>
      <div v-else-if="!dataIsFresh" class="text-negative">
        <q-icon name="warning" />&nbsp;&nbsp;{{ t('crud.list.dataIsNotFresh') }}
      </div>
    </template>

    <template #top-right>
      <CRUDListTableColumnSelector
        v-model="visibleColumns"
        :all-columns="allColumns"
        class="q-ml-lg"
      >
        <template #option="columnSelectorOptionProps">
          <slot
            name="column-selector-option"
            v-bind="columnSelectorOptionProps"
          ></slot>
        </template>
      </CRUDListTableColumnSelector>

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
              fullscreen
                ? t('crud.list.exitFullscreen')
                : t('crud.list.fullscreen')
            }}
          </div>
        </div>
      </q-btn>
    </template>

    <template #header-cell="cellProps">
      <CRUDListTableHeaderCell
        :cell-props="cellProps"
        :possible-drop-target="
          !!draggedColumn && cellProps.col.name !== draggedColumn
        "
        :height="headerHeight"
        @col-dropped="reorderColumns"
        @hide-column="hideColumn"
        @drag-end="draggedColumn = null"
        @drag-start="draggedColumn = cellProps.col.name"
      >
        <slot name="header-cell-label" v-bind="cellProps"></slot>
      </CRUDListTableHeaderCell>
    </template>

    <template #body-cell="cellProps">
      <slot name="body-cell" v-bind="cellProps">
        {{ cellProps.value }}
      </slot>
    </template>
  </q-table>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import {
  QSelectSlots,
  QTable,
  QTableColumn,
  QTableProps,
  QTableSlots,
} from 'quasar';
import CRUDListTableColumnSelector from './CRUDListTableColumnSelector.vue';
import CRUDListTableHeaderCell from './CRUDListTableHeaderCell.vue';
import { useI18n } from 'src/composables/useI18n';

export interface CRUDListTableProps extends CRUDListTablePropsWithoutModel {
  pagination?: QTableProps['pagination'];
  visibleColumns: string[];
}

interface CRUDListTablePropsWithoutModel {
  rows: QTableProps['rows'];
  loading?: boolean;
  allColumns: QTableColumn[];
  dataIsFresh?: boolean;
  headerHeight?: string;
}

export type CRUDListTableRequestDataParams = Parameters<
  NonNullable<QTableProps['onRequest']>
>[0];

const props = withDefaults(defineProps<CRUDListTablePropsWithoutModel>(), {
  loading: false,
  dataIsFresh: true,
  headerHeight: undefined,
});
const visibleColumns = defineModel<string[]>('visibleColumns', {
  required: true,
});
const pagination = defineModel<QTableProps['pagination']>('pagination', {
  required: false,
});

defineSlots<{
  'body-cell': QTableSlots['body-cell'];
  'column-selector-option': QSelectSlots['option'];
  'header-cell-label': QTableSlots['header-cell'];
}>();

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

<style scoped lang="scss">
.crud-list-table {
  max-height: calc(100vh - 100px);
}

.crud-list-table--fullscreen {
  height: 100vh;
  max-height: 100vh;
}

:global(.crud-list-table thead tr:first-child th) {
  /* bg color is important for th to cover rows underneath (scrolling) */
  background-color: #fff;
}
:global(.body--dark .crud-list-table thead tr:first-child th) {
  /* bg color is important for th to cover rows underneath (scrolling) */
  background-color: var(--q-dark);
}

:global(.crud-list-table .q-table__bottom),
:global(.crud-list-table .q-table__top) {
  background-color: $grey-3;
}
:global(.body--dark .crud-list-table .q-table__bottom),
:global(.body--dark .crud-list-table .q-table__top) {
  background-color: $grey-9;
}

:global(.crud-list-table thead tr th) {
  position: sticky;
  z-index: 1;
  top: 0;
}
</style>
