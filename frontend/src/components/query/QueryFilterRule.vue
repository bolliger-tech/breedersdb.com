<template>
  <div class="filter-rule" :class="{ 'filter-rule--invalid': isInvalid }">
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
        <QueryFilterRuleColumn
          :model-value="column"
          :options="options"
          @update:model-value="updateColumn"
          @valid="columnIsValid = true"
          @invalid="columnIsValid = false"
        />
        <QueryFilterRuleComparator
          :schema="column?.schema"
          :disabled="column === undefined"
          :model-value="comparator"
          @update:model-value="updateComparator"
          @valid="comparatorIsValid = true"
          @invalid="comparatorIsValid = false"
        />
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
    }
    if (filterRule.value) {
      filterRule.value.comparator = undefined;
    }
  },
);
</script>

<style scoped lang="scss">
.filter-rule {
  padding: 4px 3px 4px 1px;
  background: $grey-3;
}

.filter-rule--invalid {
  background: lighten($negative, 53%);
}

.body--dark {
  .filter-rule {
    background: $grey-9;
  }

  .filter-rule--invalid {
    background: darken($negative, 16%);
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
