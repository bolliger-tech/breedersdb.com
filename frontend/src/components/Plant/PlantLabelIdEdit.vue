<template>
  <EntityInput
    ref="inputRef"
    v-model="labelId"
    :label="t('plants.fields.labelId')"
    :rules="rules"
    type="text"
    autocomplete="off"
    :hint="t('plants.hints.labelId')"
    @blur="zeroFill"
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

export interface PlantLabelIdEditProps
  extends PlantLabelIdEditPropsWithoutModel {
  modelValue: string;
}

interface PlantLabelIdEditPropsWithoutModel {
  eliminated: boolean;
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

function zeroFill() {
  if (!labelId.value) {
    return;
  }

  const prefix = labelId.value.startsWith('#') ? '#' : '';
  labelId.value = `${prefix}${parseInt(labelId.value.replace(/^#/, '')).toString().padStart(8, '0')}`;
}

const rules = computed(() => {
  const rules = [
    // not empty
    (val: string) =>
      !!val ||
      t('base.validation.xIsRequired', { x: t('plants.fields.labelId') }),

    // positive integer with max 8 digits
    (val: string) => {
      const num = parseInt(val.replace(/^#/, ''));
      return (
        (num.toString().length <= 8 && num > 0) || t('plants.errors.labelId')
      );
    },
  ];

  if (props.eliminated) {
    // starts with #
    rules.push(
      (val: string) => val.startsWith('#') || t('plants.errors.labelId'),
    );
  } else {
    // starts NOT with #
    rules.push(
      (val: string) => !val.startsWith('#') || t('plants.errors.labelId'),
    );
  }

  return rules;
});

watch(
  () => props.eliminated,
  () => nextTick(() => inputRef.value?.validate()),
);
</script>
