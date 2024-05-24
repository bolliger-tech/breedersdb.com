<template>
  <div v-if="isEmpty">
    <div
      class="query-filter-tree-root__dummy-filter"
      data-test="query-filter-tree-root__dummy-filter"
    >
      {{ t('filter.noFilter', { entity: entityName }) }}
    </div>
    <QueryFilterRuleAddButton
      :node="filter"
      :conjunction="FilterConjunction.And"
    />
  </div>

  <template v-else>
    <div
      v-if="isSimplifiable"
      class="query-filter-tree-root__notification--error"
    >
      <q-icon name="warning" />
      {{ t('filter.simplifiable') }}
      <button class="query-filter-tree-root__simplify" @click="simplify()">
        {{ t('filter.simplify') }}
      </button>
    </div>
    <div
      v-else-if="!isValid"
      class="query-filter-tree-root__notification--error"
    >
      <q-icon name="warning" />
      {{ t('filter.invalid') }}
    </div>
    <div v-else class="query-filter-tree-root__notification--success">
      <q-icon name="check" />
      {{ t('filter.valid') }}
    </div>

    <QueryFilterTree
      :node="filter"
      :conjunction="filter.getChildrensConjunction() || FilterConjunction.And"
      :options="options"
    />
  </template>
</template>

<script lang="ts" setup>
import QueryFilterRuleAddButton from './QueryFilterRuleAddButton.vue';
import QueryFilterTree from './QueryFilterTree.vue';
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

export interface QueryFilterTreeRootProps {
  filter: FilterNode;
  options: FilterRuleColumn[];
}

const props = defineProps<QueryFilterTreeRootProps>();

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
      localStorageHelper.setBaseFilter(filter);
    } else {
      localStorageHelper.setAttributionFilter(filter);
    }
  },
);
</script>

<style scoped lang="scss">
.query-filter-tree-root__notification--error {
  color: $negative;
}

.query-filter-tree-root__notification--success {
  color: $positive;
}

.query-filter-tree-root__simplify {
  color: $negative;
  background: none;
  padding: 0;
  border: none;
  text-decoration: underline;
  cursor: pointer;
}

.query-filter-tree-root__simplify:hover,
.query-filter-tree-root__simplify:focus {
  filter: brightness(125%);
  text-decoration: none;
}

.query-filter-tree-root__dummy-filter {
  background: $grey-3;
  width: 100%;
  min-height: 48px;
  border-left: solid 3px var(--q-primary);
  display: flex;
  align-items: center;
  padding: 4px 12px;
}

.body--dark {
  .query-filter-tree-root__dummy-filter {
    background: $grey-9;
  }
}
</style>
