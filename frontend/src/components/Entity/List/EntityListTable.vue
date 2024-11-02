<template>
  <q-table
    v-model:pagination="pagination"
    :class="{ 'entity-list-table--fullscreen': fullscreen }"
    :columns="orderedColumns"
    :fullscreen="fullscreen"
    no-route-fullscreen-exit
    :loading="loading"
    :rows="rows"
    :rows-per-page-options="[10, 100, 200]"
    :visible-columns="visibleColumns"
    :wrap-cells="true"
    binary-state-sort
    class="entity-list-table"
    color="primary"
    row-key="id"
    flat
    @request="(event) => (pagination = event.pagination)"
    @row-click="(_, row) => $emit('row-click', row)"
  >
    <template #top-left>
      <BaseMessage
        v-if="visibleColumns.length < 1 || !dataIsFresh"
        class="q-mr-md"
        type="warning"
        :message="
          visibleColumns.length < 1
            ? t('entity.list.noColumnError')
            : t('entity.list.dataIsNotFresh')
        "
      />
    </template>

    <template #top-right>
      <div class="row align-center no-wrap" style="gap: clamp(8px, 3vw, 16px)">
        <EntityListTableColumnSelector
          v-model="visibleColumns"
          :all-columns="allColumns"
        >
          <template #option="columnSelectorOptionProps">
            <slot
              name="column-selector-option"
              v-bind="columnSelectorOptionProps"
            ></slot>
          </template>
        </EntityListTableColumnSelector>

        <EntityExportButton
          v-if="onExport"
          :is-exporting="isExporting"
          :export-progress="exportProgress"
          @export="onExport"
        />
        <q-btn dense flat no-caps @click="fullscreen = !fullscreen">
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
      </div>
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

    <template
      v-for="slotName in bodyCellSlotNames"
      :key="slotName"
      #[`body-cell-${slotName}`]="slotProps"
    >
      <slot :name="`body-cell-${slotName}`" v-bind="slotProps"></slot>
    </template>

    <template
      v-for="col in allColumns
        .filter((c) => c.maxWidth || c.timestamp)
        .filter(
          (col) =>
            !bodyCellSlotNames.find((s) => s === `body-cell-${col.name}`),
        )"
      :key="col.name"
      #[`body-cell-${col.name}`]="cellProps"
    >
      <q-td
        :props="cellProps"
        :style="col.maxWidth && `max-width: ${col.maxWidth}`"
      >
        <div
          v-if="col.ellipsis"
          style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap"
        >
          {{ n2semicolon(cellProps.value) }}
        </div>
        <template v-else-if="col.timestamp && cellProps.value">
          {{ d(cellProps.value, 'Ymd') }}<br />
          <span class="text-muted">{{ d(cellProps.value, 'His') }}</span>
        </template>
        <template v-else>
          {{ cellProps.value }}
        </template>
      </q-td>
    </template>
  </q-table>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import type { QSelectSlots, QTable, QTableProps, QTableSlots } from 'quasar';
import EntityListTableColumnSelector from './EntityListTableColumnSelector.vue';
import EntityListTableHeaderCell from './EntityListTableHeaderCell.vue';
import { useI18n } from 'src/composables/useI18n';
import { useQueryArg } from 'src/composables/useQueryArg';
import BaseMessage from 'src/components/Base/BaseMessage.vue';
import EntityExportButton from 'src/components/Entity/EntityExportButton.vue';
import type { EntityExportButtonProps } from 'src/components/Entity/EntityExportButton.vue';
import { EntityListTableColum } from './types';
import { n2semicolon } from 'src/utils/stringUtils';

export interface EntityListTableProps extends EntityListTablePropsWithoutModel {
  pagination?: QTableProps['pagination'];
  visibleColumns: string[];
}

type EntityListTablePropsWithoutModel = {
  rows: QTableProps['rows'];
  loading?: boolean;
  allColumns: EntityListTableColum[];
  dataIsFresh?: boolean;
  headerHeight?: string;
} & EntityExportButtonProps;

const props = withDefaults(defineProps<EntityListTablePropsWithoutModel>(), {
  loading: false,
  dataIsFresh: true,
  headerHeight: undefined,
  rowClick: undefined,
  isExporting: false,
  exportProgress: 0,
  onExport: undefined,
});
const visibleColumns = defineModel<string[]>('visibleColumns', {
  required: true,
});
const pagination = defineModel<QTableProps['pagination']>('pagination');

defineEmits<{
  'row-click': [row: QTableProps['rows'][0]];
  export: [];
}>();

const slots = defineSlots<{
  'body-cell': QTableSlots['body-cell'];
  'column-selector-option': QSelectSlots['option'];
  'header-cell-label': QTableSlots['header-cell'];
  [key: `body-cell-${string}`]: QTableSlots[`body-cell-${string}`];
}>();

const bodyCellSlotNames = computed(() =>
  Object.keys(slots)
    .filter((slotName) => slotName.startsWith('body-cell-'))
    .map((slotName) => slotName.slice(10)),
);

const { t, d } = useI18n();

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
