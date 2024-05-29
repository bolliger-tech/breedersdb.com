<template>
  <div
    class="query-filter-rule"
    :class="{ 'query-filter-rule__tree--invalid': isInvalid }"
    data-test="query-filter-rule"
  >
    <div
      :class="{
        'query-filter-rule__tree--and': conjunction === FilterConjunction.And,
        'query-filter-rule__tree--or': conjunction === FilterConjunction.Or,
      }"
      class="row items-center"
    >
      <q-icon
        class="query-filter-rule__drag-handle"
        name="drag_indicator"
        size="md"
        @mousedown="$emit('dragMouseDown')"
        @mouseup="$emit('dragMouseUp')"
      />
      <div class="col row q-col-gutter-sm">
        <div class="col-12 col-md-4">
          <QueryFilterRuleColumn
            :model-value="column"
            :options="columns"
            @update:model-value="updateColumn"
          />
        </div>
        <div class="col-12 col-md-4">
          <QueryFilterRuleOperator
            :disabled="!column"
            :model-value="operator"
            :rule-type="filterRule?.type"
            @update:model-value="updateOperator"
          />
        </div>
        <div class="col-12 col-md-4">
          <QueryFilterRuleTerm
            :disabled="operator === undefined"
            :hide="!requiresTerm"
            :model-value="term"
            :operator-value="operator?.value"
            @update:model-value="updateTerm"
          />
        </div>
        <div v-if="isAttribute" class="text-body2 col-12">
          <QueryFilterRuleNoAttributionsPredicate
            :attributeName="column?.tableColumnLabel"
            :model-value="includeEntitiesWithoutAttributions"
            @update:model-value="updateIncludeEntitiesWithoutAttributions"
          />
        </div>
        <div v-if="explain" class="col-12">
          <QueryFilterRuleExplainer :rule="filterRule || undefined" />
        </div>
      </div>
      <q-icon
        :color="isValid ? 'positive' : 'negative'"
        :name="isValid ? 'check' : 'warning'"
        class="q-ml-sm"
        size="sm"
      />
      <q-btn
        class="query-filter-rule__delete-button"
        dense
        flat
        icon="delete_outline"
        rounded
        @click="deleteRule"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import { FilterNode, FilterConjunction } from './filterNode';
import QueryFilterRuleTerm from './QueryFilterRuleTerm.vue';
import QueryFilterRuleColumn from './QueryFilterRuleColumn.vue';
import QueryFilterRuleOperator from './QueryFilterRuleOperator.vue';
import QueryFilterRuleExplainer from './QueryFilterRuleExplainer.vue';
import QueryFilterRuleNoAttributionsPredicate from './QueryFilterRuleNoAttributionsPredicate.vue';
import { FilterRuleColumn } from './filterRuleColumn';
import { FilterRuleOperator } from './filterRuleOperator';
import { FilterRuleTerm } from './filterRuleTerm';
import { createGetFilterRuleOperators } from './createFilterRuleOperators';
import { useQueryStore } from '../useQueryStore';

export interface QueryFilterRuleProps {
  columns: FilterRuleColumn[];
  node: FilterNode;
  conjunction: FilterConjunction;
}

defineEmits<{
  dragMouseDown: [];
  dragMouseUp: [];
}>();

const props = defineProps<QueryFilterRuleProps>();

const store = useQueryStore();
const explain = computed(() => store.explain);

const filterRule = computed(() => props.node.getFilterRule());
const column = computed(() => filterRule.value?.column);
const operator = computed(() => filterRule.value?.operator);
const term = computed(() => filterRule.value?.term);
const includeEntitiesWithoutAttributions = computed(
  () => filterRule.value?.includeEntitiesWithoutAttributions,
);
const isAttribute = computed(() => filterRule.value?.isAttribute);

function updateColumn(value: FilterRuleColumn) {
  if (filterRule.value) {
    filterRule.value.column = value;
  } else {
    throw new Error('Filter rule is undefined');
  }
}

function updateOperator(value: FilterRuleOperator) {
  if (filterRule.value) {
    filterRule.value.operator = value;
  } else {
    throw new Error('Filter rule is undefined');
  }
}

function updateTerm(value: FilterRuleTerm) {
  if (filterRule.value) {
    filterRule.value.term = value;
  } else {
    throw new Error('Filter rule is undefined');
  }
}

function updateIncludeEntitiesWithoutAttributions(value: boolean) {
  if (filterRule.value) {
    filterRule.value.includeEntitiesWithoutAttributions = value;
  } else {
    throw new Error('Filter rule is undefined');
  }
}

function deleteRule() {
  props.node.remove();
}

const requiresTerm = computed<boolean>(() => {
  return filterRule.value?.requiresTerm || false;
});

const isValid = computed<boolean | undefined>(() => {
  return filterRule.value?.isValid;
});

const isInvalid = computed<boolean>(() => {
  return !isValid.value && typeof filterRule.value?.isValid !== 'undefined';
});

const getOperators = createGetFilterRuleOperators();
const applicableOperators = computed(() => {
  if (
    filterRule.value?.type &&
    typeof filterRule.value?.allowEmptyTerm !== 'undefined'
  ) {
    return getOperators(filterRule.value.type, filterRule.value.allowEmptyTerm);
  }
  return [];
});

function setOperator() {
  if (filterRule.value) {
    filterRule.value.operator = applicableOperators.value
      ? applicableOperators.value[0]
      : undefined;
  }
}

function setTerm() {
  if (!filterRule.value) {
    return;
  }
  if (filterRule.value.type === 'enum') {
    filterRule.value.term = new FilterRuleTerm({ value: '' });
    filterRule.value.term.schema = filterRule.value.column?.schema;
  } else {
    filterRule.value.term = undefined;
  }
}

watch(
  () => filterRule.value?.type,
  () => {
    setOperator();
    setTerm();
  },
);
</script>

<style scoped lang="scss">
.query-filter-rule {
  padding: 4px 3px 4px 1px;
  background: $grey-3;
}

.body--dark {
  .query-filter-rule {
    background: $grey-9;
  }
}

.query-filter-rule__tree--and {
  border-left-color: var(--q-primary);
}

.query-filter-rule__tree--or {
  border-left-color: var(--q-accent);
}

.query-filter-rule__drag-handle {
  color: var(--q-text-muted);
  cursor: grab;
}

.query-filter-rule__drag-handle:hover {
  color: var(--q-primary);
}

.query-filter-rule__delete-button {
  color: var(--q-text-muted);
}

.query-filter-rule__delete-button:hover,
.query-filter-rule__delete-button:focus {
  color: var(--q-negative);
}
</style>
