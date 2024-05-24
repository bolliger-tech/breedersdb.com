<template>
  <div
    class="query-filter-rule-tree__drop"
    :class="{
      'query-filter-rule-tree__drop--hover': markHover,
      'query-filter-rule-tree__drop--active': active,
      'query-filter-rule-tree__drop--primary': color === 'primary',
      'query-filter-rule-tree__drop--accent': color === 'accent',
    }"
    @dragleave="mouseInDropZone = false"
    @dragenter="mouseInDropZone = true"
    @dragover.prevent="dragover"
  ></div>
</template>

<script setup lang="ts">
import { computed, PropType, ref, watch } from 'vue';

const props = defineProps({
  active: {
    type: Boolean,
    required: true,
  },
  color: {
    type: String as PropType<'primary' | 'accent'>,
    default: 'primary',
  },
  dragging: {
    type: Boolean,
    required: true,
  },
});

const mouseInDropZone = ref(false);

const markHover = computed(() => {
  return mouseInDropZone.value && props.active;
});

function dragover(event: DragEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  } else {
    throw new Error('Data transfer not available');
  }
}

watch(
  () => props.dragging,
  (dragging) => {
    if (false === dragging) {
      mouseInDropZone.value = false;
    }
  },
);
</script>

<style scoped>
.query-filter-rule-tree__drop {
  height: 18px;
  width: 100%;
  opacity: 0.25;
  display: none;
  position: absolute;
  left: 0;
  z-index: -1;
}

.query-filter-rule-tree__drop--active {
  display: block;
  z-index: 10;
}

.query-filter-rule-tree__drop--primary {
  background-color: var(--q-primary);
}

.query-filter-rule-tree__drop--accent {
  background-color: var(--q-accent);
}

.query-filter-rule-tree__drop--hover {
  opacity: 1;
}
</style>
