<template>
  <EntityInput
    ref="inputRef"
    v-model="labelId"
    :label="t('plants.fields.labelId')"
    :rules="rules"
    type="text"
    autocomplete="off"
    :hint="t('plants.hints.labelId')"
    debounce="300"
    :loading="fetching"
    @blur="paddLabelId"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import EntityInput, {
  EntityInputInstance,
} from '../Entity/Edit/EntityInput.vue';
import { computed, ref } from 'vue';
import { watch } from 'vue';
import { nextTick } from 'vue';
import { graphql } from 'src/graphql';
import { useQuery } from '@urql/vue';
import { ValidationRule } from 'quasar';
import {
  isPrefixed,
  zeroFill,
  isValid as isValidLabelId,
} from 'src/utils/labelIdUtils';

export interface PlantLabelIdEditProps
  extends PlantLabelIdEditPropsWithoutModel {
  modelValue: string;
}

interface PlantLabelIdEditPropsWithoutModel {
  eliminated: boolean;
  storedLabelId: string;
}

const props = defineProps<PlantLabelIdEditPropsWithoutModel>();

const labelId = defineModel<string>({
  required: true,
});

const inputRef = ref<EntityInputInstance | null>(null);
defineExpose({
  validate: () => inputRef.value?.validate(),
});

const { t } = useI18n();

function paddLabelId() {
  if (!labelId.value) {
    return;
  }
  labelId.value = zeroFill(labelId.value);
}

const uniqueQuery = graphql(`
  query NextFreeLabelId($label_id: String!) {
    plants_next_free_label_id(args: { input_label_id: $label_id }) {
      label_id
    }
  }
`);

const queryVariables = ref({ label_id: zeroFill(labelId.value) });
const { executeQuery, fetching } = useQuery({
  query: uniqueQuery,
  variables: queryVariables,
  pause: true,
});

async function uniqueRule(newLabelId: string) {
  if (
    !newLabelId ||
    isPrefixed(newLabelId) ||
    newLabelId === props.storedLabelId
  ) {
    return true;
  }

  queryVariables.value.label_id = newLabelId;
  await nextTick(); // wait for the refs to be updated
  const { data, error } = await executeQuery();

  if (error.value || !data.value) {
    console.error(error.value || new Error('No data returned'));
    return t('plants.errors.labelIdQueryError');
  }

  const nextFreeLabelId = data.value.plants_next_free_label_id[0].label_id;
  return (
    nextFreeLabelId === newLabelId ||
    t('plants.errors.labelIdNextFree', { labelId: nextFreeLabelId })
  );
}

const rules = computed(() => {
  const rules: ValidationRule[] = [
    // not empty
    (val: string) =>
      !!val ||
      t('base.validation.xIsRequired', { x: t('plants.fields.labelId') }),

    // generally valid format
    (val: string) => isValidLabelId(val) || t('plants.errors.labelId'),

    // prefix
    (val: string) =>
      (props.eliminated ? isPrefixed(val) : !isPrefixed(val)) ||
      t('plants.errors.labelId'),
  ];

  // unique
  rules.push((val: string) => uniqueRule(zeroFill(val)));

  return rules;
});

watch(
  () => props.eliminated,
  () => nextTick(() => inputRef.value?.validate()),
);
</script>
