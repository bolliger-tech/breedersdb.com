<template>
  <div
    ref="containerRef"
    class="base-sortable-list-item relative-position"
    :draggable="draggable"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <div class="row items-start relative-position">
      <template v-if="!noSpaceBefore">
        <q-icon
          v-if="!notDraggable"
          name="drag_indicator"
          style="color: var(--q-text-muted); top: 0.35em"
          :style="{ cursor: draggable ? 'grabbing' : 'grab' }"
          size="md"
          class="col-auto q-mr-xs"
          @mousedown="draggable = true"
          @touchstart="draggable = true"
          @mouseup="draggable = false"
          @touchend="draggable = false"
          @click.prevent.stop=""
        />
        <div v-else style="width: 36px"></div>
      </template>
      <slot />
    </div>
    <div
      v-if="$slots.controls"
      :style="`transform: translateX(${noSpaceBefore ? '0' : '2em'})`"
    >
      <slot name="controls" />
    </div>
    <q-separator
      v-if="!last"
      style="margin: 0.5rem 0"
      :color="anyDragActive ? 'transparent' : undefined"
    />

    <div
      class="absolute-top-left drop-zone"
      :class="{
        'drop-zone--active': dropZoneActive && !draggable,
        'drop-zone--hover': overTopDropZone && !draggable,
      }"
      style="
        height: calc(50% + 0.5em);
        border-top-width: 1em;
        border-top-style: solid;
        transform: translateY(-1.25em);
      "
      @dragenter="overTopDropZone = true"
      @dragleave="overTopDropZone = false"
      @dragover.prevent="setDropEffectMove"
      @drop.prevent="$emit('drop', 'before')"
    ></div>
    <div
      class="absolute-bottom-left drop-zone"
      :class="{
        'drop-zone--active': dropZoneActive && !draggable,
        'drop-zone--hover': overBottomDropZone && !draggable,
      }"
      style="
        height: calc(50% + 0.5em);
        border-bottom-width: 1em;
        border-bottom-style: solid;
        transform: translateY(-0.25em);
      "
      @dragenter="overBottomDropZone = true"
      @dragleave="overBottomDropZone = false"
      @dragover.prevent="setDropEffectMove"
      @drop.prevent="$emit('drop', 'after')"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { useQuasar } from 'quasar';

export interface BaseSortableListItemProps {
  dropZoneActive: boolean;
  notDraggable?: boolean;
  noSpaceBefore?: boolean;
  anyDragActive?: boolean;
  last?: boolean;
}

defineProps<BaseSortableListItemProps>();

const emit = defineEmits<{
  dragstart: [];
  dragend: [];
  drop: [position: 'before' | 'after'];
}>();

const containerRef = ref<HTMLDivElement | null>(null);

const draggable = ref(false);
const overTopDropZone = ref(false);
const overBottomDropZone = ref(false);

function setDropEffectMove(e: DragEvent) {
  if (!e.dataTransfer) {
    throw new Error('No dataTransfer object found');
  }
  e.dataTransfer.dropEffect = 'move';
}

const $q = useQuasar();

async function onDragStart(e: DragEvent) {
  emit('dragstart');
  await nextTick();

  if (e.dataTransfer && containerRef.value) {
    e.dataTransfer.effectAllowed = 'move';

    // create a ghost element to be displayed while dragging to prevent
    // having overlapping elements on the dragged item (like the drop zone
    // or the modal title if element is below it)
    const ghost = containerRef.value.cloneNode(true) as HTMLDivElement;
    ghost.id = 'base-sortable-list-item-ghost';
    ghost.style.position = 'fixed';
    ghost.style.top = '-1000px';
    ghost.style.width = containerRef.value.offsetWidth + 'px';
    ghost.style.backgroundColor = $q.dark.isActive ? 'var(--q-dark)' : 'white';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
  }
}

function onDragEnd() {
  document.getElementById('base-sortable-list-item-ghost')?.remove();
  draggable.value = false;
  emit('dragend');
}
</script>

<style scoped lang="scss">
.drop-zone {
  width: 100%;
  display: none;
}

.drop-zone--active {
  border-color: color-mix(in srgb, var(--q-primary) 20%, transparent);
  display: block;
}

.drop-zone--hover {
  border-color: var(--q-primary);
}
</style>
