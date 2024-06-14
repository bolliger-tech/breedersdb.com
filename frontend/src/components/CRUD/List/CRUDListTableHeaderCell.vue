<template>
  <q-th
    :props="cellProps"
    :draggable="dragging"
    class="crud-list-table-header-cell"
    @dragend="dragEnd"
    @dragstart="dragStart"
  >
    <div
      v-ripple="props.cellProps.col.sortable"
      class="crud-list-table-header-cell__content"
    >
      <q-btn
        dense
        flat
        icon="drag_indicator"
        round
        size="sm"
        class="text-primary crud-list-table-header-cell__drag-handle"
        @mousedown="dragging = true"
        @mouseup="dragging = false"
        @click.prevent.stop=""
      />
      <div class="column align-center">
        <slot v-bind="cellProps">
          {{ cellProps.col.label }}
        </slot>
      </div>
      <q-btn
        dense
        flat
        icon="close"
        round
        size="xs"
        class="text-primary"
        @click.stop="$emit('hideColumn', cellProps.col.name)"
      />
    </div>
    <template v-if="possibleDropTarget">
      <div
        class="crud-list-table-header-cell__drop-zone crud-list-table-header-cell__drop-zone--before"
        :class="{
          'crud-list-table-header-cell__drop-zone-active':
            dragOverBefore && !dragging,
        }"
        @dragenter="dragOverBefore = true"
        @dragleave="dragOverBefore = false"
        @drop.prevent="(e) => drop(e, 'before')"
        @dragover.prevent="setDropEffectMove"
      ></div>
      <div
        class="crud-list-table-header-cell__drop-zone crud-list-table-header-cell__drop-zone--after"
        :class="{
          'crud-list-table-header-cell__drop-zone-active':
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
import { ref } from 'vue';
import { QTableSlots } from 'quasar';

export interface CRUDListTableHeaderCellProps {
  cellProps: Parameters<QTableSlots['header-cell']>[0];
  possibleDropTarget: boolean;
  height?: string;
}

const props = withDefaults(defineProps<CRUDListTableHeaderCellProps>(), {
  height: '48px',
});

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

defineSlots<{
  default: QTableSlots['header-cell'];
}>();

const dragging = ref(false);
const dragOverBefore = ref(false);
const dragOverAfter = ref(false);

function dragStart(e: DragEvent) {
  if (!e.dataTransfer) {
    throw new Error('No dataTransfer object found');
  }
  e.dataTransfer.dropEffect = 'move';
  e.dataTransfer.setData('text/plain', props.cellProps.col.name);
  emit('dragStart', props.cellProps.col.name);
}

function dragEnd() {
  dragging.value = false;
  emit('dragEnd', props.cellProps.col.name);
}

function drop(e: DragEvent, pos: 'before' | 'after') {
  dragOverBefore.value = false;
  dragOverAfter.value = false;

  if (!e.dataTransfer) {
    throw new Error('No dataTransfer object found');
  }

  const droppedColName = e.dataTransfer.getData('text/plain');
  emit('colDropped', props.cellProps.col.name, droppedColName, pos);
}

function setDropEffectMove(e: DragEvent) {
  if (!e.dataTransfer) {
    throw new Error('No dataTransfer object found');
  }
  e.dataTransfer.dropEffect = 'move';
}
</script>

<style lang="scss" scoped>
.crud-list-table-header-cell {
  white-space: nowrap;
  height: v-bind(height);
  padding-right: 25px;
}

:global(.crud-list-table.q-table--loading thead tr:last-child th) {
  top: v-bind(height) !important;
}

.crud-list-table-header-cell__content {
  display: inline-flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  transform: translateX(-8px);
}

.crud-list-table-header-cell__drag-handle {
  cursor: grab;
}

.crud-list-table-header-cell__drop-zone {
  height: v-bind(height);
  width: 50%;
  border: 0 solid transparent;
  display: inline-block;
  position: absolute;
  top: 0;
}

.crud-list-table-header-cell__drop-zone--before {
  left: 0;
  border-left-width: 4px;
}

.crud-list-table-header-cell__drop-zone--after {
  right: 0;
  border-right-width: 4px;
}

.crud-list-table-header-cell__drop-zone-active {
  border-color: var(--q-primary);
  background: color-mix(in srgb, var(--q-primary) 20%, transparent);
}

:global(.q-table__sort-icon) {
  position: absolute;
  top: calc(50% - 10px);
  right: 10px;
  transition: $generic-hover-transition;
  border-radius: 50%;
  color: var(--q-primary);
  min-height: 20px;
  min-width: 20px;
}

:global(.q-table__sort-icon:hover),
:global(.crud-list-table th.sortable:hover .q-table__sort-icon) {
  background: color-mix(in srgb, currentColor 15%, transparent);
}
</style>
