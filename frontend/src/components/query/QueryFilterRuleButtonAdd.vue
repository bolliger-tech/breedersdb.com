<template>
  <q-fab
    v-model="actionsVisible"
    :label="t('filter.operands.add')"
    :color="operand === FilterOperand.And ? 'primary' : 'accent'"
    icon="add"
    direction="down"
    unelevated
    padding="xs"
    :hide-label="!actionButtonHover && !actionsVisible"
    class="filter-tree__action-btn"
    :class="{ 'filter-tree__action-btn--root': node.isRoot() }"
    vertical-actions-align="left"
    @mouseenter="actionButtonHover = true"
    @mouseleave="actionButtonHover = false"
  >
    <q-fab-action
      :label="t('filter.operands.andFilter')"
      color="primary"
      padding="xs"
      @click="addLeaf(FilterOperand.And)"
    />
    <q-fab-action
      :label="t('filter.operands.orFilter')"
      color="accent"
      padding="xs"
      @click="addLeaf(FilterOperand.Or)"
    />
  </q-fab>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { FilterOperand } from './filterTypes';
import { FilterNode } from './filterNode';
import useFilterNodeActions from './filterNodeActions';

export interface QueryFilterRuleButtonAddProps {
  operand: FilterOperand;
  node: FilterNode;
}

const props = defineProps<QueryFilterRuleButtonAddProps>();

const { t } = useI18n();
const filter = useFilterNodeActions();

const actionsVisible = ref(false);
const actionButtonHover = ref(false);

function addLeaf(operand: FilterOperand) {
  filter.addLeaf(props.node, operand);
}
</script>

<style scoped>
.filter-tree__action-btn {
  transform: translateX(18px);
}

.filter-tree__action-btn--root {
  transform: translateX(-15px);
}
</style>
