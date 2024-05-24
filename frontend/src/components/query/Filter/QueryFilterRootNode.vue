<template>
  <div v-if="isEmpty">
    <div
      class="query-filter-root-node__filter-placeholder"
      data-test="query-filter-root-node__filter-placeholder"
    >
      {{ t('filter.noFilter', { entity: entityName }) }}
    </div>
    <QueryFilterRuleAddButton
      :node="filter"
      :conjunction="FilterConjunction.And"
    />
  </div>

  <template v-else>
    <div v-if="isSimplifiable" class="text-negative q-mb-sm">
      <q-icon name="warning" />
      {{ t('filter.simplifiable') }}&nbsp;&nbsp;
      <q-btn
        size="sm"
        color="negative"
        dense
        class="q-px-md"
        unelevated
        @click="simplify()"
      >
        {{ t('filter.simplify') }}
      </q-btn>
    </div>
    <div v-else-if="!isValid" class="text-negative q-mb-sm">
      <q-icon name="warning" />
      {{ t('filter.invalid') }}
    </div>
    <div v-else class="text-positive q-mb-sm">
      <q-icon name="check" />
      {{ t('filter.valid') }}
    </div>

    <QueryFilterNode
      :node="filter"
      :conjunction="filter.getChildrensConjunction() || FilterConjunction.And"
      :options="options"
    />
  </template>
</template>

<script lang="ts" setup>
import QueryFilterRuleAddButton from './QueryFilterRuleAddButton.vue';
import QueryFilterNode from './QueryFilterNode.vue';
import { computed, watch } from 'vue';
import { FilterNode, FilterConjunction, FilterType } from './filterNode';
import { useI18n } from 'src/composables/useI18n';
import { useQueryStore } from './queryStore';
import useQueryLocalStorageHelper from './useQueryLocalStorageHelper';
import { BaseTable } from './queryTypes';
import { FilterRuleColumn } from './filterRuleColumn';

const { t } = useI18n();
const store = useQueryStore();
const localStorageHelper = useQueryLocalStorageHelper();

export interface QueryFilterRootNodeProps {
  filter: FilterNode;
  options: FilterRuleColumn[];
}

const props = defineProps<QueryFilterRootNodeProps>();

const isSimplifiable = computed(() => props.filter.isSimplifiable());
const isEmpty = computed(() => !props.filter.hasChildren());
const isValid = computed(() => props.filter.isValid());

const entityName = computed(() => {
  if (props.filter.getFilterType() === FilterType.Attribution) {
    return t('filter.attributions');
  }

  switch (store.baseTable) {
    case BaseTable.Crossings:
      return t('filter.crossings');
    case BaseTable.Lots:
      return t('filter.lots');
    case BaseTable.Cultivars:
      return t('filter.cultivars');
    case BaseTable.Trees:
      return t('filter.trees');
    default:
      throw new Error('Unknown entity: ' + store.baseTable);
  }
});

function simplify() {
  let maxIterations = 10;
  while (isSimplifiable.value && maxIterations--) {
    props.filter.simplify();
  }
}

watch(
  () => props.filter,
  (filter) => {
    if (props.filter.getFilterType() === 'base') {
      // TODO: check if this should be scoped to the base entity
      localStorageHelper.setBaseFilter(filter);
    } else {
      // TODO: check if this should be scoped to the base entity
      localStorageHelper.setAttributionFilter(filter);
    }
  },
);
</script>

<style scoped lang="scss">
.query-filter-root-node__simplify {
  color: $negative;
  background: none;
  padding: 0;
  border: none;
  text-decoration: underline;
  cursor: pointer;
}

.query-filter-root-node__simplify:hover,
.query-filter-root-node__simplify:focus {
  filter: brightness(125%);
  text-decoration: none;
}

.query-filter-root-node__filter-placeholder {
  background: $grey-3;
  width: 100%;
  min-height: 48px;
  border-left: solid 3px var(--q-primary);
  display: flex;
  align-items: center;
  padding: 4px 12px;
}

.body--dark {
  .query-filter-root-node__filter-placeholder {
    background: $grey-9;
  }
}
</style>
