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
    :error="labelIdIsNotUnique"
    reactive-rules
    required
    trim
    @blur="paddLabelId"
  >
    <template v-if="labelIdIsNotUnique" #error>
      <i18n-t
        keypath="plants.errors.labelIdNextFree"
        :values="{ labelId: nextFreeLabelId }"
        scope="global"
      >
        <template #labelId>
          <button
            v-ripple
            class="text-negative bg-transparent no-border cursor-pointer q-pa-none plant-label-id-next-free-button"
            @click="() => (labelId = nextFreeLabelId || '')"
          >
            {{ nextFreeLabelId }}
          </button>
        </template>
      </i18n-t>
    </template>
  </EntityInput>
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
import { plantLabelIdUtils } from 'src/utils/labelIdUtils';
import { focusInView } from 'src/utils/focusInView';

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
  focus: () => inputRef.value && focusInView(inputRef.value),
});

const { t } = useI18n();

function paddLabelId() {
  if (!labelId.value) {
    return;
  }
  const padded = plantLabelIdUtils.zeroFill(labelId.value);
  if (!plantLabelIdUtils.isValid(padded)) {
    return;
  }
  labelId.value = padded;
}

const uniqueQuery = graphql(`
  query NextFreeLabelId($label_id: citext!) {
    plants_next_free_label_id(args: { input_label_id: $label_id }) {
      label_id
    }
  }
`);

const queryVariables = ref({
  label_id: plantLabelIdUtils.zeroFill(labelId.value),
});
const { executeQuery, fetching } = useQuery({
  query: uniqueQuery,
  variables: queryVariables,
  pause: true,
  context: { additionalTypenames: ['plants'] },
});

const nextFreeLabelId = ref<string | null>(null);
async function uniqueRule(newLabelId: string) {
  if (
    !newLabelId ||
    plantLabelIdUtils.isPrefixed(newLabelId) ||
    newLabelId === props.storedLabelId
  ) {
    return true;
  }

  // check if the label id is unique in the database
  // if not, the next free label id is returned
  queryVariables.value.label_id = newLabelId;
  await nextTick(); // wait for the refs to be updated
  const { data, error } = await executeQuery();

  if (error.value || !data.value) {
    console.error(error.value || new Error('No data returned'));
    return t('plants.errors.labelIdQueryError');
  }

  nextFreeLabelId.value = data.value.plants_next_free_label_id[0].label_id;

  // we use "external validation" in combination with the "error" slot for this.
  // to ignore "internal validation", we always return true here.
  //
  // @see labelIdIsNotUnique for the external validation
  // @link https://quasar.dev/vue-components/input#external-validation
  return true;
}

const labelIdIsNotUnique = computed(() => {
  return (
    !!labelId.value &&
    !plantLabelIdUtils.isPrefixed(labelId.value) &&
    !!nextFreeLabelId.value &&
    nextFreeLabelId.value !== plantLabelIdUtils.zeroFill(labelId.value)
  );
});

const rules = computed(() => {
  const rules: ValidationRule[] = [
    // not empty
    (val: string) =>
      !!val ||
      t('base.validation.xIsRequired', { x: t('plants.fields.labelId') }),

    // generally valid format
    (val: string) =>
      plantLabelIdUtils.isValid(plantLabelIdUtils.zeroFill(val)) ||
      t('plants.errors.labelId'),

    // prefix
    (val: string) =>
      (props.eliminated
        ? plantLabelIdUtils.isPrefixed(val)
        : !plantLabelIdUtils.isPrefixed(val)) || t('plants.errors.labelId'),
  ];

  // unique
  rules.push((val: string) => uniqueRule(plantLabelIdUtils.zeroFill(val)));

  return rules;
});

watch(
  () => props.eliminated,
  () => nextTick(() => inputRef.value?.validate()),
);
</script>

<style scoped lang="scss">
.plant-label-id-next-free-button {
  text-decoration: underline;
  transition: $button-transition;
}

.plant-label-id-next-free-button:hover {
  color: var(--q-primary) !important;
}
</style>
