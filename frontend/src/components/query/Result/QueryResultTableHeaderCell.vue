<template>
  <q-th
    :props="cellProps"
    :draggable="dragging"
    class="query-result-table-header-cell"
    @dragend="dragEnd"
    @dragstart="dragStart"
  >
    <div class="query-result-table-header-cell__content">
      <q-btn
        dense
        flat
        icon="drag_indicator"
        round
        size="sm"
        class="text-primary query-result-table-header-cell__drag-handle"
        @mousedown="dragging = true"
        @mouseup="dragging = false"
        @click.prevent.stop=""
      />
      <div class="column align-center">
        <div class="text-muted">{{ colLabelParts.table }}</div>
        {{ colLabelParts.column }}
        <AggregationLabelChip v-if="colLabelParts.aggregation" class="q-mt-xs">
          {{ colLabelParts.aggregation }}
        </AggregationLabelChip>
      </div>
      <q-btn
        dense
        flat
        icon="close"
        round
        size="xs"
        class="text-primary"
        @click.stop="$emit('hideColumn', colName)"
      />
    </div>
    <template v-if="possibleDropTarget">
      <div
        class="query-result-table-header-cell__drop-zone query-result-table-header-cell__drop-zone--before"
        :class="{
          'query-result-table-header-cell__drop-zone-active':
            dragOverBefore && !dragging,
        }"
        @dragenter="dragOverBefore = true"
        @dragleave="dragOverBefore = false"
        @drop.prevent="(e) => drop(e, 'before')"
        @dragover.prevent="setDropEffectMove"
      ></div>
      <div
        class="query-result-table-header-cell__drop-zone query-result-table-header-cell__drop-zone--after"
        :class="{
          'query-result-table-header-cell__drop-zone-active':
            dragOverAfter && !dragging,
        }"
        @dragenter="dragOverAfter = true"
        @dragleave="dragOverAfter = false"
        @drop.prevent="(e) => drop(e, 'after')"
        @dragover.prevent="setDropEffectMove"
      ></div>
    </template>
  </q-th>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { QTableSlots } from 'quasar';
import AggregationLabelChip from 'src/components/Query/Result/AggregationLabelChip.vue';

export interface QueryResultTableHeaderCellProps {
  cellProps: Parameters<QTableSlots['header-cell']>[0];
  possibleDropTarget: boolean;
}

const props = defineProps<QueryResultTableHeaderCellProps>();

const emit = defineEmits<{
  hideColumn: [colName: string];
  colDropped: [
    thisColName: string,
    droppedColName: string,
    pos: 'before' | 'after',
  ];
  dragStart: [colName: string];
  dragEnd: [colName: string];
}>();

const dragging = ref(false);
const dragOverBefore = ref(false);
const dragOverAfter = ref(false);

const colName = computed<string>(() => {
  return props.cellProps.col.name;
});

const colLabelParts = computed<{
  table: string;
  column: string;
  aggregation?: string;
}>(() => {
  const [table, column, aggregation] = props.cellProps.col.label.split(' > ');
  return { table, column, aggregation };
});

function dragStart(e: DragEvent) {
  if (!e.dataTransfer) {
    throw new Error('No dataTransfer object found');
  }
  e.dataTransfer.dropEffect = 'move';
  e.dataTransfer.setData('text/plain', colName.value);
  emit('dragStart', colName.value);
}

function dragEnd() {
  dragging.value = false;
  emit('dragEnd', colName.value);
}

function drop(e: DragEvent, pos: 'before' | 'after') {
  dragOverBefore.value = false;
  dragOverAfter.value = false;

  if (!e.dataTransfer) {
    throw new Error('No dataTransfer object found');
  }

  const droppedColName = e.dataTransfer.getData('text/plain');
  emit('colDropped', colName.value, droppedColName, pos);
}

function setDropEffectMove(e: DragEvent) {
  if (!e.dataTransfer) {
    throw new Error('No dataTransfer object found');
  }
  e.dataTransfer.dropEffect = 'move';
}
</script>

<style lang="scss">
.query-result-table-header-cell {
  white-space: nowrap;
  height: 72px; /* must correspond to next rule */
}

.query-result-table.q-table--loading thead tr:last-child th {
  top: 72px !important; /* must correspond to previous rule */
}

.query-result-table-header-cell__content {
  display: inline-flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  transform: translateX(-8px);
}

.query-result-table-header-cell__drag-handle {
  cursor: grab;
}

.query-result-table-header-cell__drag-handle:hover {
  color: var(--q-primary);
}

.query-result-table-header-cell__drop-zone {
  height: 48px;
  width: 50%;
  border: 0 solid transparent;
  display: inline-block;
  position: absolute;
  top: 0;
}

.query-result-table-header-cell__drop-zone--before {
  left: 0;
  border-left-width: 4px;
}

.query-result-table-header-cell__drop-zone--after {
  right: 0;
  border-right-width: 4px;
}

.query-result-table-header-cell__drop-zone-active {
  border-color: var(--q-primary);
  background: color-mix(in srgb, var(--q-primary) 20%, transparent);
}

.q-table__sort-icon {
  position: absolute;
  top: calc(50% - 8px);
  right: 8px;
}
.q-table__sort-icon:hover {
  color: var(--q-primary);
}
</style>
