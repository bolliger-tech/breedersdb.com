<template>
  <q-table
    v-model:pagination="pagination"
    :class="{ 'entity-list-table--fullscreen': fullscreen }"
    :columns="orderedColumns"
    :fullscreen="fullscreen"
    no-route-fullscreen-exit
    :loading="loading"
    :rows="rows"
    :rows-per-page-options="[10, 100, 1000]"
    :visible-columns="visibleColumns"
    :wrap-cells="true"
    binary-state-sort
    class="entity-list-table"
    color="primary"
    row-key="id"
    flat
    v-on="handleEvents"
  >
    <template #top-left>
      <div v-if="visibleColumns.length < 1" class="text-negative">
        <q-icon name="warning" />&nbsp;&nbsp;{{
          t('entity.list.noColumnError')
        }}
      </div>
      <div v-else-if="!dataIsFresh" class="text-negative">
        <q-icon name="warning" />&nbsp;&nbsp;{{
          t('entity.list.dataIsNotFresh')
        }}
      </div>
    </template>

    <template #top-right>
      <EntityListTableColumnSelector
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
      </EntityListTableColumnSelector>

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
                ? t('entity.list.exitFullscreen')
                : t('entity.list.fullscreen')
            }}
          </div>
        </div>
      </q-btn>
    </template>

    <template #header-cell="cellProps">
      <EntityListTableHeaderCell
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
      </EntityListTableHeaderCell>
    </template>

    <template v-if="$slots['body-cell']" #body-cell="cellProps">
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
import EntityListTableColumnSelector from './EntityListTableColumnSelector.vue';
import EntityListTableHeaderCell from './EntityListTableHeaderCell.vue';
import { useI18n } from 'src/composables/useI18n';
import { RouteLocationRaw, useRouter } from 'vue-router';
import { useQueryArg } from 'src/composables/useQueryArg';

export interface EntityListTableProps extends EntityListTablePropsWithoutModel {
  pagination?: QTableProps['pagination'];
  visibleColumns: string[];
}

interface EntityListTablePropsWithoutModel {
  rows: QTableProps['rows'];
  loading?: boolean;
  allColumns: QTableColumn[];
  dataIsFresh?: boolean;
  headerHeight?: string;
  rowClickNavigatesTo?: (row: QTableProps['rows'][0]) => RouteLocationRaw;
}

export type EntityListTableRequestDataParams = Parameters<
  NonNullable<QTableProps['onRequest']>
>[0];

const props = withDefaults(defineProps<EntityListTablePropsWithoutModel>(), {
  loading: false,
  dataIsFresh: true,
  headerHeight: undefined,
  rowClickNavigatesTo: undefined,
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

const router = useRouter();
const handleEvents = computed(() => {
  const onRequest = (
    event: Parameters<NonNullable<QTableProps['onRequest']>>[0],
  ) => (pagination.value = event.pagination);

  const getUrlFn = props.rowClickNavigatesTo;
  const onRowClick = getUrlFn
    ? (...[, row]: Parameters<NonNullable<QTableProps['onRowClick']>>) =>
        router.push(getUrlFn(row))
    : undefined;
  return { request: onRequest, rowClick: onRowClick };
});

const { t } = useI18n();

const draggedColumn = ref<string | null>(null);

const { queryArg: fullscreen } = useQueryArg<boolean>({
  key: 'fullscreen',
  defaultValue: false,
});

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
    return [];
  }

  return [...props.allColumns].sort(
    (a, b) =>
      visibleColumns.value.indexOf(a.name) -
      visibleColumns.value.indexOf(b.name),
  );
});
</script>

<style scoped lang="scss">
.entity-list-table {
  max-height: calc(100vh - 100px);
}

.entity-list-table--fullscreen {
  height: 100vh;
  max-height: 100vh;
  width: 100vw;
  max-width: 100vw;
}

:global(.entity-list-table thead tr:first-child th) {
  /* bg color is important for th to cover rows underneath (scrolling) */
  background-color: #fff;
}
:global(.body--dark .entity-list-table thead tr:first-child th) {
  /* bg color is important for th to cover rows underneath (scrolling) */
  background-color: var(--q-dark);
}

:global(.entity-list-table .q-table__bottom),
:global(.entity-list-table .q-table__top) {
  background-color: var(--q-shade);
}

:global(.entity-list-table .q-table__top) {
  /* fixes safari columns shining throu */
  transform: translateY(1px);
}

:global(.entity-list-table thead tr th) {
  position: sticky;
  z-index: 1;
  top: 0;
}

:global(.body--light .entity-list-table .q-table__middle) {
  border-left: 1px solid var(--q-shade);
  border-right: 1px solid var(--q-shade);
}
</style>
