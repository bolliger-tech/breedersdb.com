<template>
  <q-fab
    v-model="actionsVisible"
    data-test="query-filter-node__action-btn"
    :label="t('analyze.filter.operators.add')"
    :color="conjunction === FilterConjunction.And ? 'primary' : 'accent'"
    icon="add"
    direction="down"
    unelevated
    padding="xs"
    :hide-label="!actionButtonHover && !actionsVisible"
    class="query-filter-node__action-btn"
    :class="{ 'query-filter-node__action-btn--root': node.isRoot() }"
    vertical-actions-align="left"
    @mouseenter="actionButtonHover = true"
    @mouseleave="actionButtonHover = false"
  >
    <q-fab-action
      :label="t('analyze.filter.operators.andFilter')"
      color="primary"
      padding="xs"
      data-test="query-filter-node__action-btn-and"
      @click="addLeafToCurrentNode(FilterConjunction.And)"
    />
    <q-fab-action
      :label="t('analyze.filter.operators.orFilter')"
      color="accent"
      padding="xs"
      data-test="query-filter-node__action-btn-or"
      @click="addLeafToCurrentNode(FilterConjunction.Or)"
    />
  </q-fab>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { FilterNode, FilterConjunction } from './filterNode';
import { addLeaf } from './filterNodeActions';

export interface QueryFilterRuleAddButtonProps {
  conjunction: FilterConjunction;
  node: FilterNode;
}

const props = defineProps<QueryFilterRuleAddButtonProps>();

const { t } = useI18n();

const actionsVisible = ref(false);
const actionButtonHover = ref(false);

function addLeafToCurrentNode(conjunction: FilterConjunction) {
  addLeaf(props.node, conjunction);
}
</script>

<style scoped>
.query-filter-node__action-btn {
  transform: translateX(18px);
}

.query-filter-node__action-btn--root {
  transform: translateX(-15px);
}
</style>
