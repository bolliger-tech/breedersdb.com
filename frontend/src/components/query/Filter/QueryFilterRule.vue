<template>
  <div
    class="filter-rule"
    :class="{ 'filter-rule--invalid': isInvalid }"
    data-test="filter-rule"
  >
    <div
      :class="{
        'filter-rule--and': operand === FilterOperand.And,
        'filter-rule--or': operand === FilterOperand.Or,
      }"
      class="row items-center"
    >
      <q-icon
        class="drag-handle"
        name="drag_indicator"
        size="md"
        @mousedown="$emit('dragMouseDown')"
        @mouseup="$emit('dragMouseUp')"
      />
      <div class="col row q-col-gutter-sm">
        <div class="col-12 col-md-4">
          <QueryFilterRuleColumn
            :model-value="column"
            :options="options"
            @update:model-value="updateColumn"
            @valid="columnIsValid = true"
            @invalid="columnIsValid = false"
          />
        </div>
        <div class="col-12 col-md-4">
          <QueryFilterRuleComparator
            :schema="column?.schema"
            :disabled="column === undefined"
            :model-value="comparator"
            @update:model-value="updateComparator"
            @valid="comparatorIsValid = true"
            @invalid="comparatorIsValid = false"
          />
        </div>
        <div class="col-12 col-md-4">
          <QueryFilterRuleCriteria
            :schema="column?.schema || undefined"
            :disabled="comparator === undefined"
            :hide="!hasInputCriteria"
            :model-value="criteria"
            @update:model-value="updateCriteria"
            @valid="criteriaInputIsValid = true"
            @invalid="criteriaInputIsValid = false"
          />
        </div>
        <div v-if="isAttribute" class="text-body2 col-12">
          <QueryFilterRuleIncludeEntitiesWithoutAttributionsToggle
            :attributeName="column?.label"
            :model-value="includeEntitiesWithoutAttributions"
            @update:model-value="updateIncludeEntitiesWithoutAttributions"
          />
        </div>
        <div v-if="isValid && filterRule" class="col-12">
          <QueryFilterRuleExplainer :rule="filterRule" />
        </div>
      </div>
      <q-icon
        :color="isValid ? 'positive' : 'negative'"
        :name="isValid ? 'check' : 'warning'"
        class="q-ml-sm"
        size="sm"
      />
      <q-btn
        class="delete-button"
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
import { computed, onMounted, PropType, ref, watch } from 'vue';
import {
  FilterComparator,
  FilterComparatorOption,
  FilterCriteria,
  FilterOperand,
  FilterOption,
} from './filterTypes';
import { FilterNode } from './filterNode';
import { PropertySchema, PropertySchemaOptionType } from './filterOptionSchema';
import QueryFilterRuleCriteria from './QueryFilterRuleCriteria.vue';
import QueryFilterRuleColumn from './QueryFilterRuleColumn.vue';
import QueryFilterRuleComparator from './QueryFilterRuleComparator.vue';
import QueryFilterRuleExplainer from './QueryFilterRuleExplainer.vue';
import QueryFilterRuleIncludeEntitiesWithoutAttributionsToggle from './QueryFilterRuleIncludeEntitiesWithoutAttributionsToggle.vue';

defineEmits<{
  (e: 'dragMouseDown'): void;
  (e: 'dragMouseUp'): void;
}>();

const props = defineProps({
  options: {
    type: Object as PropType<PropertySchema[]>,
    required: true,
  },
  node: {
    type: Object as PropType<FilterNode>,
    required: true,
  },
  operand: {
    type: String as PropType<FilterOperand>,
    required: true,
  },
});

const columnIsValid = ref<boolean>();
const comparatorIsValid = ref<boolean>();
const criteriaInputIsValid = ref<boolean>();

const filterRule = computed(() => props.node.getFilterRule());
const column = computed(() => filterRule.value?.column);
const comparator = computed(() => filterRule.value?.comparator);
const criteria = computed(() => filterRule.value?.criteria);
const includeEntitiesWithoutAttributions = computed(
  () => filterRule.value?.includeEntitiesWithoutAttributions,
);
const isAttribute = computed(() => filterRule.value?.isAttribute);

function updateColumn(value: FilterOption) {
  if (filterRule.value) {
    filterRule.value.column = value;
  } else {
    throw new Error('Filter rule is undefined');
  }
}

function updateComparator(value: FilterComparatorOption) {
  if (filterRule.value) {
    filterRule.value.comparator = value;
  } else {
    throw new Error('Filter rule is undefined');
  }
}

function updateCriteria(value: FilterCriteria) {
  if (filterRule.value) {
    filterRule.value.criteria = value;
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

const hasInputCriteria = computed<boolean>(() => {
  switch (column.value?.schema.options.type) {
    case PropertySchemaOptionType.Date:
    case PropertySchemaOptionType.Datetime:
    case PropertySchemaOptionType.Integer:
    case PropertySchemaOptionType.Float:
    case PropertySchemaOptionType.Enum:
      return true;
    case PropertySchemaOptionType.String:
      return (
        comparator.value?.value !== FilterComparator.Empty &&
        comparator.value?.value !== FilterComparator.NotEmpty
      );
    default:
      return false;
  }
});

const criteriaIsValid = computed(() => {
  if (!hasInputCriteria.value) {
    return true;
  }

  return criteriaInputIsValid.value;
});

const isInvalid = computed<boolean>(() => {
  return (
    !isValid.value &&
    column.value !== undefined &&
    comparator.value !== undefined &&
    hasInputCriteria.value &&
    criteria.value !== undefined
  );
});

const isValid = computed<boolean>(() => {
  return (
    columnIsValid.value === true && // may also be undefined
    comparatorIsValid.value === true && // may also be undefined
    criteriaIsValid.value === true
  );
});

function setValidity() {
  if (filterRule.value) {
    if (isValid.value) {
      filterRule.value.isValid = true;
    }
    if (isInvalid.value) {
      filterRule.value.isValid = false;
    }
  } else {
    throw new Error('Filter rule is undefined');
  }
}

watch(isValid, setValidity);
watch(isInvalid, setValidity);
onMounted(setValidity);
watch(
  () => filterRule.value?.dataType,
  () => {
    if (filterRule.value) {
      filterRule.value.criteria = undefined;
      filterRule.value.comparator = undefined;
      criteriaInputIsValid.value = false;
      comparatorIsValid.value = false;
    }
  },
);
</script>

<style scoped lang="scss">
.filter-rule {
  padding: 4px 3px 4px 1px;
  background: $grey-3;
}

.body--dark {
  .filter-rule {
    background: $grey-9;
  }
}

.filter-rule--and {
  border-left-color: var(--q-primary);
}

.filter-rule--or {
  border-left-color: var(--q-accent);
}

.drag-handle {
  color: var(--q-text-muted);
  cursor: grab;
}

.drag-handle:hover {
  color: var(--q-primary);
}

.delete-button {
  color: var(--q-text-muted);
}

.delete-button:hover,
.delete-button:focus {
  color: var(--q-negative);
}
</style>
