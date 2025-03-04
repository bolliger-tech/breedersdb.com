<template>
  <div
    class="analyze-filter-node"
    :class="{ 'analyze-filter-node--dragging': !!dragging }"
    :draggable="!!dragging"
    @dragstart="dragStart"
    @dragend="dragEnd"
  >
    <AnalyzeFilterRuleDropZone
      :active="dragActive && canBeTarget"
      :color="dropConjunction === FilterConjunction.And ? 'primary' : 'accent'"
      :dragging="!!dragObj"
      class="analyze-filter-rule-tree__drop--before"
      @drop.prevent="onDrop('before')"
    />

    <AnalyzeFilterRule
      v-if="node.isLeaf()"
      :columns="columns"
      :node="node"
      :conjunction="conjunction"
      @drag-mouse-down="setDragObj(node)"
      @drag-mouse-up="setDragObj(undefined)"
    />

    <div v-else>
      <div class="row items-stretch">
        <div
          class="analyze-filter-node__drag-bg row items-center"
          :class="{
            'analyze-filter-node__drag-bg--and':
              conjunction === FilterConjunction.And,
            'analyze-filter-node__drag-bg--or':
              conjunction === FilterConjunction.Or,
            'analyze-filter-node__drag-bg--root': node.isRoot(),
          }"
        >
          <q-icon
            name="drag_indicator"
            size="md"
            class="analyze-filter-node__drag-handle"
            @mousedown="setDragObj(node)"
            @mouseup="setDragObj(undefined)"
          />
        </div>
        <div class="col">
          <template
            v-for="(tree, idx) in node.getChildren()"
            :key="tree.getId()"
          >
            <AnalyzeFilterNode
              :node="tree"
              :columns="columns"
              :conjunction="
                tree.getChildrensConjunction() ||
                node.getChildrensConjunction() ||
                FilterConjunction.And
              "
            />
            <div
              v-if="idx + 1 < node.getChildCount()"
              class="analyze-filter-node__conjunction"
              :class="{
                'analyze-filter-node__conjunction--and':
                  conjunction === FilterConjunction.And,
                'analyze-filter-node__conjunction--or':
                  conjunction === FilterConjunction.Or,
              }"
            >
              {{
                conjunction === FilterConjunction.And
                  ? t('analyze.filter.operators.and')
                  : t('analyze.filter.operators.or')
              }}
            </div>
          </template>
        </div>
      </div>
      <FilterRuleButtonAdd :conjunction="conjunction" :node="node" />
    </div>

    <AnalyzeFilterRuleDropZone
      :active="dragActive && canBeTarget"
      :color="dropConjunction === FilterConjunction.And ? 'primary' : 'accent'"
      :dragging="!!dragObj"
      class="analyze-filter-rule-tree__drop--after"
      @drop.prevent="onDrop('after')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { moveNode } from './filterNodeActions';
import { useI18n } from 'src/composables/useI18n';
import AnalyzeFilterRule from './AnalyzeFilterRule.vue';
import FilterRuleButtonAdd from './AnalyzeFilterRuleAddButton.vue';
import { FilterNode, FilterConjunction } from './filterNode';
import AnalyzeFilterRuleDropZone from './AnalyzeFilterRuleDropZone.vue';
import type { FilterRuleColumn } from './filterRuleColumn';
import { useFilterDragNode } from './useFilterDragNode';

export interface AnalyzeFilterNodeProps {
  node: FilterNode;
  columns: FilterRuleColumn[];
  conjunction: FilterConjunction;
}

const props = defineProps<AnalyzeFilterNodeProps>();

const { t } = useI18n();

const dragging = ref<FilterNode | undefined>(undefined);

const { inject: injectDragObj } = useFilterDragNode();
const dragObj = injectDragObj();

const dragActive = computed(() => {
  const currentNodeType = props.node.getBaseTable();
  const draggedNodeType = dragObj.value ? dragObj.value.getBaseTable() : false;
  return currentNodeType === draggedNodeType;
});

const canBeTarget = computed(() => {
  const subject = dragObj.value;
  const target = props.node;

  if (!(subject instanceof FilterNode)) {
    throw new Error('Subject is not a FilterNode');
  }

  return (
    !target.isDescendantOf(subject) && subject !== target && !target.isRoot()
  );
});

const dropConjunction = computed(() => {
  if (props.node.isLeaf()) {
    return props.conjunction;
  }

  return props.node.getParent()?.getChildrensConjunction();
});

function setDragObj(node: FilterNode | undefined) {
  dragging.value = node;
  dragObj.value = node;
}

function dragStart(event: DragEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.dropEffect = 'move';
  } else {
    throw new Error('Data transfer not supported');
  }
}

function dragEnd() {
  setDragObj(undefined);
}

function onDrop(position: 'before' | 'after') {
  if (canBeTarget.value && dragObj.value instanceof FilterNode) {
    moveNode(dragObj.value, props.node, position);
  }

  dragEnd();
}
</script>

<style scoped lang="scss">
.analyze-filter-node {
  position: relative;
}

.analyze-filter-node--dragging {
  opacity: 0.4;
}

.analyze-filter-node__drag-bg {
  border-right-width: 3px;
  border-right-style: solid;
  background: var(--q-shade);
}

.analyze-filter-node__drag-bg--and {
  border-color: var(--q-primary);
}

.analyze-filter-node__drag-bg--or {
  border-color: var(--q-accent);
}

.analyze-filter-node__drag-bg--root {
  width: 0;
  overflow: hidden;
}

.analyze-filter-node__drag-handle {
  color: var(--q-text-muted);
  cursor: grab;
}

.analyze-filter-node__drag-handle:hover {
  color: var(--q-primary);
}

.analyze-filter-node__conjunction {
  text-transform: uppercase;
  font-size: 0.75rem;
  margin-left: 5px;
  font-weight: bold;
}

.analyze-filter-node__conjunction--and {
  color: var(--q-primary);
}

.analyze-filter-node__conjunction--or {
  color: var(--q-accent);
}

.analyze-filter-rule-tree__drop--before {
  top: -18px;
}

.analyze-filter-rule-tree__drop--after {
  bottom: -18px;
}
</style>
