<template>
  <BaseInputLabel
    :label="t('plants.title')"
    :class="{ 'error-border': showRequiredError }"
  >
    <PlantSelector
      v-bind="$attrs"
      ref="plantRef"
      v-model="modelValue"
      label-small
    />

    <div
      v-if="showRequiredError"
      class="q-field q-field--error"
      :class="{ 'q-field--dark': $q.dark.isActive }"
    >
      <div class="q-field__bottom">
        <div class="q-field__messages">
          <div>
            {{
              t('base.validation.xIsRequired', {
                x: t('plants.title'),
              })
            }}
          </div>
        </div>
      </div>
    </div>
  </BaseInputLabel>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { defineProps, ref, watch } from 'vue';
import type {
  PlantSelectorInstance,
  PlantSelectorProps,
} from './PlantSelector.vue';
import BaseInputLabel from 'src/components/Base/BaseInputLabel.vue';
import PlantSelector from 'src/components/Plant/PlantSelector.vue';
import { focusInView } from 'src/utils/focusInView';

export type PlantSelectProps = PlantSelectorProps;

defineProps<PlantSelectProps>();

const modelValue = defineModel<number | null | undefined>({ required: true });
const plantRef = ref<PlantSelectorInstance | null>(null);

watch(modelValue, () => {
  validate();
});

const showRequiredError = ref(false);

function validate() {
  const isValid = !!modelValue.value;
  showRequiredError.value = !isValid;
  return isValid;
}

defineExpose({
  validate,
  focus: () => plantRef.value && focusInView(plantRef.value),
});

const { t } = useI18n();
</script>

<style scoped>
.error-border {
  border-color: var(--q-negative);
  border-style: solid;
  border-width: 0 0 0 2px;
  border-radius: 2px;
  padding-left: 8px;
  margin-left: -8px;
}
</style>
