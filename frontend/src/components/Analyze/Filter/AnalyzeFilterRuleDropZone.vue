<template>
  <div
    class="analyze-filter-rule-tree__drop"
    :class="{
      'analyze-filter-rule-tree__drop--hover': markHover,
      'analyze-filter-rule-tree__drop--active': active,
      'analyze-filter-rule-tree__drop--primary': color === 'primary',
      'analyze-filter-rule-tree__drop--accent': color === 'accent',
    }"
    @dragleave="mouseInDropZone = false"
    @dragenter="mouseInDropZone = true"
    @dragover.prevent="dragover"
  ></div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

export interface AnalyzeFilterRuleDropZoneProps {
  active: boolean;
  color: 'primary' | 'accent';
  dragging: boolean;
}

const props = defineProps<AnalyzeFilterRuleDropZoneProps>();

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
.analyze-filter-rule-tree__drop {
  height: 18px;
  width: calc(100% + 3px);
  opacity: 0.25;
  display: none;
  position: absolute;
  left: 0;
  z-index: -1;
  transform: translateX(-3px);
}

.analyze-filter-rule-tree__drop--active {
  display: block;
  z-index: 10;
}

.analyze-filter-rule-tree__drop--primary {
  background-color: var(--q-primary);
}

.analyze-filter-rule-tree__drop--accent {
  background-color: var(--q-accent);
}

.analyze-filter-rule-tree__drop--hover {
  opacity: 1;
}
</style>
