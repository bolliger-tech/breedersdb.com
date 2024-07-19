<template>
  <div
    class="analyze-filter-rule"
    :class="{ 'analyze-filter-rule__tree--invalid': isInvalid }"
    data-test="analyze-filter-rule"
  >
    <div
      :class="{
        'analyze-filter-rule__tree--and': conjunction === FilterConjunction.And,
        'analyze-filter-rule__tree--or': conjunction === FilterConjunction.Or,
      }"
      class="row items-center"
    >
      <q-icon
        class="analyze-filter-rule__drag-handle"
        name="drag_indicator"
        size="md"
        @mousedown="$emit('dragMouseDown')"
        @mouseup="$emit('dragMouseUp')"
      />
      <div class="col row q-col-gutter-sm">
        <div class="col-12 col-md-4">
          <AnalyzeFilterRuleColumn
            :model-value="column"
            :options="columns"
            @update:model-value="updateColumn"
          />
        </div>
        <div class="col-12 col-md-4">
          <AnalyzeFilterRuleOperator
            :disabled="!column"
            :model-value="operator"
            :column-type="filterRule?.type"
            @update:model-value="updateOperator"
          />
        </div>
        <div class="col-12 col-md-4">
          <AnalyzeFilterRuleTerm
            :disabled="operator === undefined"
            :hide="!requiresTerm"
            :model-value="term"
            :operator-value="operator?.value"
            @update:model-value="updateTerm"
          />
        </div>
        <div v-if="isAttribute" class="text-body2 col-12">
          <AnalyzeFilterRuleNoAttributionsPredicate
            :attributeName="column?.tableColumnLabel"
            :base-table="node.getBaseTable()"
            :model-value="includeEntitiesWithoutAttributions"
            @update:model-value="updateIncludeEntitiesWithoutAttributions"
          />
        </div>
        <div v-if="explain" class="col-12">
          <AnalyzeFilterRuleExplainer
            :rule="filterRule || undefined"
            :base-table="node.getBaseTable()"
          />
        </div>
      </div>
      <q-icon
        :color="isValid ? 'positive' : 'negative'"
        :name="isValid ? 'check' : 'warning'"
        class="q-ml-sm"
        size="sm"
      />
      <q-btn
        class="analyze-filter-rule__delete-button"
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
import AnalyzeFilterRuleTerm from './AnalyzeFilterRuleTerm.vue';
import AnalyzeFilterRuleColumn from './AnalyzeFilterRuleColumn.vue';
import AnalyzeFilterRuleOperator from './AnalyzeFilterRuleOperator.vue';
import AnalyzeFilterRuleExplainer from './AnalyzeFilterRuleExplainer.vue';
import AnalyzeFilterRuleNoAttributionsPredicate from './AnalyzeFilterRuleNoAttributionsPredicate.vue';
import { FilterRuleColumn } from './filterRuleColumn';
import { FilterRuleOperator } from './filterRuleOperator';
import { FilterRuleTerm } from './filterRuleTerm';
import { createGetFilterRuleOperators } from './createFilterRuleOperators';
import { useAnalyzeStore } from '../useAnalyzeStore';

export interface AnalyzeFilterRuleProps {
  columns: FilterRuleColumn[];
  node: FilterNode;
  conjunction: FilterConjunction;
}

defineEmits<{
  dragMouseDown: [];
  dragMouseUp: [];
}>();

const props = defineProps<AnalyzeFilterRuleProps>();

const store = useAnalyzeStore();
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
  if (
    filterRule.value &&
    !filterRule.value.operator?.isValid &&
    applicableOperators.value
  ) {
    filterRule.value.operator = applicableOperators.value[0];
  }
}

function setTerm() {
  if (!filterRule.value || filterRule.value.term) {
    return;
  }
  filterRule.value.term = new FilterRuleTerm({ value: '' });
  filterRule.value.term.schema = filterRule.value.column?.schema;
}

watch(
  () => filterRule.value?.type,
  () => {
    setOperator();
    setTerm();
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.analyze-filter-rule {
  padding: 4px 3px 4px 1px;
  background: var(--q-shade);
}

.analyze-filter-rule__tree--and {
  border-left-color: var(--q-primary);
}

.analyze-filter-rule__tree--or {
  border-left-color: var(--q-accent);
}

.analyze-filter-rule__drag-handle {
  color: var(--q-text-muted);
  cursor: grab;
}

.analyze-filter-rule__drag-handle:hover {
  color: var(--q-primary);
}

.analyze-filter-rule__delete-button {
  color: var(--q-text-muted);
}

.analyze-filter-rule__delete-button:hover,
.analyze-filter-rule__delete-button:focus {
  color: var(--q-negative);
}
</style>
