<template>
  <div
    class="filter-tree"
    :class="{ 'filter-tree--dragging': !!dragging }"
    :draggable="!!dragging"
    @dragstart="dragStart"
    @dragend="dragEnd"
  >
    <QueryFilterRuleDropZone
      :active="dragActive && canBeTarget"
      :color="dropOperand === FilterOperand.And ? 'primary' : 'accent'"
      :dragging="!!dragObj"
      class="filter-rule__drop--before"
      @drop.prevent="onDrop('before')"
    />

    <QueryFilterRule
      v-if="node.isLeaf()"
      :options="options"
      :node="node"
      :operand="operand"
      @drag-mouse-down="setDragObj(node)"
      @drag-mouse-up="setDragObj(false)"
    />

    <div v-else>
      <div class="row items-stretch">
        <div
          class="filter-tree__drag-bg row items-center"
          :class="{
            'filter-tree__drag-bg--and': operand === FilterOperand.And,
            'filter-tree__drag-bg--or': operand === FilterOperand.Or,
            'filter-tree__drag-bg--root': node.isRoot(),
          }"
        >
          <q-icon
            name="drag_indicator"
            size="md"
            class="filter-tree__drag-handle"
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
              :operand="
                tree.getChildrensOperand() ||
                node.getChildrensOperand() ||
                FilterOperand.And
              "
            />
            <div
              v-if="idx + 1 < node.getChildCount()"
              class="filter-tree__operand"
              :class="{
                'filter-tree__operand--and': operand === FilterOperand.And,
                'filter-tree__operand--or': operand === FilterOperand.Or,
              }"
            >
              {{
                operand === FilterOperand.And
                  ? t('filter.operands.and')
                  : t('filter.operands.or')
              }}
            </div>
          </template>
        </div>
      </div>
      <FilterRuleButtonAdd :operand="operand" :node="node" />
    </div>

    <QueryFilterRuleDropZone
      :active="dragActive && canBeTarget"
      :color="dropOperand === FilterOperand.And ? 'primary' : 'accent'"
      :dragging="!!dragObj"
      class="filter-rule__drop--after"
      @drop.prevent="onDrop('after')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, PropType, ref } from 'vue';
import useFilterNodeActions from './filterNodeActions';
import { useI18n } from 'src/composables/useI18n';
import QueryFilterRule from './QueryFilterRule.vue';
import FilterRuleButtonAdd from './QueryFilterRuleButtonAdd.vue';
import { FilterNode } from './filterNode';
import { FilterOperand } from './filterTypes';
import { useQueryStore } from './queryStore';
import { FilterDragNode } from './query';
import QueryFilterRuleDropZone from './QueryFilterRuleDropZone.vue';
import { PropertySchema } from './filterOptionSchema';

const props = defineProps({
  node: {
    type: Object as PropType<FilterNode>,
    required: true,
  },
  options: {
    type: Object as PropType<PropertySchema[]>,
    required: true,
  },
  operand: {
    type: String as PropType<FilterOperand>,
    required: true,
  },
});

const filter = useFilterNodeActions();
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

const dropOperand = computed(() => {
  if (props.node.isLeaf()) {
    return props.operand;
  }

  return props.node.getParent()?.getChildrensOperand();
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
    filter.moveNode(dragObj.value, props.node, position);
  }

  dragEnd();
}
</script>

<style lang="scss">
.filter-tree {
  position: relative;
}

.filter-tree--dragging {
  opacity: 0.4;
}

.filter-tree__drag-bg {
  border-right-width: 3px;
  border-right-style: solid;
  background: $grey-3;
}

.body--dark {
  .filter-tree__drag-bg {
    background: $grey-9;
  }
}

.filter-tree__drag-bg--and {
  border-color: var(--q-primary);
}

.filter-tree__drag-bg--or {
  border-color: var(--q-accent);
}

.filter-tree__drag-bg--root {
  width: 0;
  overflow: hidden;
}

.filter-tree__drag-handle {
  color: var(--q-text-muted);
  cursor: grab;
}

.filter-tree__drag-handle:hover {
  color: var(--q-primary);
}

.filter-tree__operand {
  text-transform: uppercase;
  font-size: 0.75rem;
  margin-left: 5px;
  font-weight: bold;
}

.filter-tree__operand--and {
  color: var(--q-primary);
}

.filter-tree__operand--or {
  color: var(--q-accent);
}

.filter-rule__drop--before {
  top: -18px;
}

.filter-rule__drop--after {
  bottom: -18px;
}
</style>
