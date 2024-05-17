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
          <QueryFilterRuleOperator
            :schema="column?.schema"
            :disabled="column === undefined"
            :model-value="operator"
            @update:model-value="updateOperator"
            @valid="operatorIsValid = true"
            @invalid="operatorIsValid = false"
          />
        </div>
        <div class="col-12 col-md-4">
          <QueryFilterRuleTerm
            :schema="column?.schema || undefined"
            :disabled="operator === undefined"
            :hide="!hasInputTerm"
            :model-value="term"
            @update:model-value="updateTerm"
            @valid="termInputIsValid = true"
            @invalid="termInputIsValid = false"
          />
        </div>
        <div v-if="isAttribute" class="text-body2 col-12">
          <QueryFilterRuleNoAttributionsPredicate
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
  FilterOperator,
  FilterOperatorOption,
  FilterTerm,
  FilterOperand,
  FilterOption,
} from './filterTypes';
import { FilterNode } from './filterNode';
import {
  AttributeSchema,
  AttributeSchemaOptionType,
} from './filterOptionSchema';
import QueryFilterRuleTerm from './QueryFilterRuleTerm.vue';
import QueryFilterRuleColumn from './QueryFilterRuleColumn.vue';
import QueryFilterRuleOperator from './QueryFilterRuleOperator.vue';
import QueryFilterRuleExplainer from './QueryFilterRuleExplainer.vue';
import QueryFilterRuleNoAttributionsPredicate from './QueryFilterRuleNoAttributionsPredicate.vue';

defineEmits<{
  (e: 'dragMouseDown'): void;
  (e: 'dragMouseUp'): void;
}>();

const props = defineProps({
  options: {
    type: Object as PropType<AttributeSchema[]>,
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
const operatorIsValid = ref<boolean>();
const termInputIsValid = ref<boolean>();

const filterRule = computed(() => props.node.getFilterRule());
const column = computed(() => filterRule.value?.column);
const operator = computed(() => filterRule.value?.operator);
const term = computed(() => filterRule.value?.term);
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

function updateOperator(value: FilterOperatorOption) {
  if (filterRule.value) {
    filterRule.value.operator = value;
  } else {
    throw new Error('Filter rule is undefined');
  }
}

function updateTerm(value: FilterTerm) {
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

const hasInputTerm = computed<boolean>(() => {
  switch (column.value?.schema.options.type) {
    case AttributeSchemaOptionType.Date:
    case AttributeSchemaOptionType.Datetime:
    case AttributeSchemaOptionType.Integer:
    case AttributeSchemaOptionType.Float:
    case AttributeSchemaOptionType.Enum:
      return true;
    case AttributeSchemaOptionType.String:
      return (
        operator.value?.value !== FilterOperator.Empty &&
        operator.value?.value !== FilterOperator.NotEmpty
      );
    default:
      return false;
  }
});

const termIsValid = computed(() => {
  if (!hasInputTerm.value) {
    return true;
  }

  return termInputIsValid.value;
});

const isInvalid = computed<boolean>(() => {
  return (
    !isValid.value &&
    column.value !== undefined &&
    operator.value !== undefined &&
    hasInputTerm.value &&
    term.value !== undefined
  );
});

const isValid = computed<boolean>(() => {
  return (
    columnIsValid.value === true && // may also be undefined
    operatorIsValid.value === true && // may also be undefined
    termIsValid.value === true
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
      filterRule.value.term = undefined;
      filterRule.value.operator = undefined;
      termInputIsValid.value = false;
      operatorIsValid.value = false;
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
