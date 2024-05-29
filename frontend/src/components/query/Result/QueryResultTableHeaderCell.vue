<template>
  <q-th
    :props="cellProps"
    :draggable="dragging"
    @dragend="dragging = false"
    @dragstart="dragStart"
  >
    <div
      class="drop-zone drop-before"
      :class="{ 'drop-zone-active': dragOverBefore && !dragging }"
      @dragenter="dragOverBefore = true"
      @dragleave="dragOverBefore = false"
      @drop.prevent="(e) => drop(e, 'before')"
      @dragover.prevent="setDropEffectMove"
    ></div>
    <q-icon
      class="drag-handle"
      name="drag_indicator"
      size="xs"
      @mousedown="dragging = true"
      @mouseup="dragging = false"
      @click.prevent.stop=""
    />
    {{ cellProps.col.label }}
    <div
      class="drop-zone drop-after"
      :class="{ 'drop-zone-active': dragOverAfter && !dragging }"
      @dragenter="dragOverAfter = true"
      @dragleave="dragOverAfter = false"
      @drop.prevent="(e) => drop(e, 'after')"
      @dragover.prevent="setDropEffectMove"
    ></div>
    <q-btn
      dense
      flat
      icon="close"
      round
      size="xs"
      @click.stop="$emit('hideColumn', colName)"
    />
  </q-th>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { QTableSlots } from 'quasar';

export interface QueryResultTableHeaderCellProps {
  cellProps: Parameters<QTableSlots['header-cell']>[0];
}

const props = defineProps<QueryResultTableHeaderCellProps>();

const emit = defineEmits<{
  hideColumn: [colName: string];
  colDropped: [
    thisColName: string,
    droppedColName: string,
    pos: 'before' | 'after',
  ];
}>();

const dragging = ref(false);
const dragOverBefore = ref(false);
const dragOverAfter = ref(false);

const colName = computed<string>(() => {
  return props.cellProps.col.name;
});

function dragStart(e: DragEvent) {
  if (!e.dataTransfer) {
    throw new Error('No dataTransfer object found');
  }
  e.dataTransfer.dropEffect = 'move';
  e.dataTransfer.setData('text/plain', colName.value);
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

<style scoped>
th {
  white-space: nowrap;
}

.drag-handle {
  color: rgba(0, 0, 0, 0.4);
  cursor: grab;
}

.drag-handle:hover {
  color: var(--q-primary);
}

.drop-zone {
  height: 48px;
  width: 50%;
  border: 0 solid transparent;
  display: inline-block;
  position: absolute;
  top: 0;
}

.drop-before {
  left: 0;
  border-left-width: 4px;
}

.drop-after {
  right: 0;
  border-right-width: 4px;
}

.drop-zone-active {
  border-color: var(--q-primary);
}
</style>
