<template>
  <div v-if="isEmpty">
    <div
      class="filter-tree-root__dummy-filter"
      data-test="filter-tree-root__dummy-filter"
    >
      {{ t('filter.noFilter', { entity: entityName }) }}
    </div>
    <QueryFilterRuleAddButton :node="filter" :operand="FilterOperand.And" />
  </div>

  <template v-else>
    <div v-if="isSimplifiable" class="filter-tree-root__notification--error">
      <q-icon name="warning" />
      {{ t('filter.simplifiable') }}
      <button class="filter-tree-root__simplify" @click="simplify()">
        {{ t('filter.simplify') }}
      </button>
    </div>
    <div v-else-if="!isValid" class="filter-tree-root__notification--error">
      <q-icon name="warning" />
      {{ t('filter.invalid') }}
    </div>
    <div v-else class="filter-tree-root__notification--success">
      <q-icon name="check" />
      {{ t('filter.valid') }}
    </div>

    <QueryFilterTree
      :node="filter"
      :operand="filter.getChildrensOperand() || FilterOperand.And"
      :options="options"
    />
  </template>
</template>

<script lang="ts" setup>
import QueryFilterRuleAddButton from './QueryFilterRuleAddButton.vue';
import QueryFilterTree from './QueryFilterTree.vue';
import { FilterOperand, FilterType } from './filterTypes';
import { computed, watch } from 'vue';
import { FilterNode } from './filterNode';
import { useI18n } from 'src/composables/useI18n';
import { PropertySchema } from './filterOptionSchema';
import { useQueryStore } from './queryStore';
import useQueryLocalStorageHelper from './queryLocalStorageHelper';
import { BaseTable } from './query';

const { t } = useI18n();
const store = useQueryStore();
const localStorageHelper = useQueryLocalStorageHelper();

export interface QueryFilterTreeRootProps {
  filter: FilterNode;
  options: PropertySchema[];
}

const props = defineProps<QueryFilterTreeRootProps>();

const isSimplifiable = computed(() => props.filter.isSimplifiable());
const isEmpty = computed(() => !props.filter.hasChildren());
const isValid = computed(() => props.filter.isValid());

const entityName = computed(() => {
  if (props.filter.getFilterType() === FilterType.Mark) {
    return t('filter.marks');
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
      localStorageHelper.setMarkFilter(filter);
    }
  },
);
</script>

<style lang="scss">
.filter-tree-root__notification--error {
  color: $negative;
}

.filter-tree-root__notification--success {
  color: $positive;
}

.filter-tree-root__simplify {
  color: $negative;
  background: none;
  padding: 0;
  border: none;
  text-decoration: underline;
  cursor: pointer;
}

.filter-tree-root__simplify:hover,
.filter-tree-root__simplify:focus {
  filter: brightness(125%);
  text-decoration: none;
}

.filter-tree-root__dummy-filter {
  background: $grey-3;
  width: 100%;
  min-height: 48px;
  border-left: solid 3px var(--q-primary);
  display: flex;
  align-items: center;
  padding: 4px 12px;
}

.body--dark {
  .filter-tree-root__dummy-filter {
    background: $grey-9;
  }
}
</style>
