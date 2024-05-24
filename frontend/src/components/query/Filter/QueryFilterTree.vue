<template>
  <div
    class="query-filter-tree"
    :class="{ 'query-filter-tree--dragging': !!dragging }"
    :draggable="!!dragging"
    @dragstart="dragStart"
    @dragend="dragEnd"
  >
    <QueryFilterRuleDropZone
      :active="dragActive && canBeTarget"
      :color="dropConjunction === FilterConjunction.And ? 'primary' : 'accent'"
      :dragging="!!dragObj"
      class="query-filter-rule-tree__drop--before"
      @drop.prevent="onDrop('before')"
    />

    <QueryFilterRule
      v-if="node.isLeaf()"
      :options="options"
      :node="node"
      :conjunction="conjunction"
      @drag-mouse-down="setDragObj(node)"
      @drag-mouse-up="setDragObj(false)"
    />

    <div v-else>
      <div class="row items-stretch">
        <div
          class="query-filter-tree__drag-bg row items-center"
          :class="{
            'query-filter-tree__drag-bg--and':
              conjunction === FilterConjunction.And,
            'query-filter-tree__drag-bg--or':
              conjunction === FilterConjunction.Or,
            'query-filter-tree__drag-bg--root': node.isRoot(),
          }"
        >
          <q-icon
            name="drag_indicator"
            size="md"
            class="query-filter-tree__drag-handle"
            @mousedown="setDragObj(node)"
            @mouseup="setDragObj(false)"
          />
        </div>
        <div class="col">
          <template
            v-for="(tree, idx) in node.getChildren()"
            :key="tree.getId()"
          >
            <QueryFilterTree
              :node="tree"
              :options="options"
              :conjunction="
                tree.getChildrensConjunction() ||
                node.getChildrensConjunction() ||
                FilterConjunction.And
              "
            />
            <div
              v-if="idx + 1 < node.getChildCount()"
              class="query-filter-tree__conjunction"
              :class="{
                'query-filter-tree__conjunction--and':
                  conjunction === FilterConjunction.And,
                'query-filter-tree__conjunction--or':
                  conjunction === FilterConjunction.Or,
              }"
            >
              {{
                conjunction === FilterConjunction.And
                  ? t('filter.operators.and')
                  : t('filter.operators.or')
              }}
            </div>
          </template>
        </div>
      </div>
      <FilterRuleButtonAdd :conjunction="conjunction" :node="node" />
    </div>

    <QueryFilterRuleDropZone
      :active="dragActive && canBeTarget"
      :color="dropConjunction === FilterConjunction.And ? 'primary' : 'accent'"
      :dragging="!!dragObj"
      class="query-filter-rule-tree__drop--after"
      @drop.prevent="onDrop('after')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, PropType, ref } from 'vue';
import { moveNode } from './filterNodeActions';
import { useI18n } from 'src/composables/useI18n';
import QueryFilterRule from './QueryFilterRule.vue';
import FilterRuleButtonAdd from './QueryFilterRuleAddButton.vue';
import { FilterNode, FilterConjunction } from './filterNode';
import { useQueryStore } from './queryStore';
import { FilterDragNode } from './queryTypes';
import QueryFilterRuleDropZone from './QueryFilterRuleDropZone.vue';
import { FilterRuleColumn } from './filterRuleColumn';

const props = defineProps({
  node: {
    type: Object as PropType<FilterNode>,
    required: true,
  },
  options: {
    type: Object as PropType<FilterRuleColumn[]>,
    required: true,
  },
  conjunction: {
    type: String as PropType<FilterConjunction>,
    required: true,
  },
});

const { t } = useI18n();
const store = useQueryStore();

const dragging = ref<FilterDragNode>(false);

const dragObj = computed(() => {
  return store.filterDragNode;
});

const dragActive = computed(() => {
  const currentNodeType = props.node.getFilterType();
  const draggedNodeType = dragObj.value ? dragObj.value.getFilterType() : false;
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

function setDragObj(node: FilterDragNode) {
  dragging.value = node;
  store.filterDragNode = node;
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
  setDragObj(false);
}

function onDrop(position: 'before' | 'after') {
  if (canBeTarget.value && dragObj.value instanceof FilterNode) {
    moveNode(dragObj.value, props.node, position);
  }

  dragEnd();
}
</script>

<style scoped lang="scss">
.query-filter-tree {
  position: relative;
}

.query-filter-tree--dragging {
  opacity: 0.4;
}

.query-filter-tree__drag-bg {
  border-right-width: 3px;
  border-right-style: solid;
  background: $grey-3;
}

.body--dark {
  .query-filter-tree__drag-bg {
    background: $grey-9;
  }
}

.query-filter-tree__drag-bg--and {
  border-color: var(--q-primary);
}

.query-filter-tree__drag-bg--or {
  border-color: var(--q-accent);
}

.query-filter-tree__drag-bg--root {
  width: 0;
  overflow: hidden;
}

.query-filter-tree__drag-handle {
  color: var(--q-text-muted);
  cursor: grab;
}

.query-filter-tree__drag-handle:hover {
  color: var(--q-primary);
}

.query-filter-tree__conjunction {
  text-transform: uppercase;
  font-size: 0.75rem;
  margin-left: 5px;
  font-weight: bold;
}

.query-filter-tree__conjunction--and {
  color: var(--q-primary);
}

.query-filter-tree__conjunction--or {
  color: var(--q-accent);
}

.query-filter-rule-tree__drop--before {
  top: -18px;
}

.query-filter-rule-tree__drop--after {
  bottom: -18px;
}
</style>
