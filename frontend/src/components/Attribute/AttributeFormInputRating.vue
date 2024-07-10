<template>
  <div class="row items-start">
    <q-btn
      v-if="withZero"
      color="primary"
      :style="'opacity: ' + (modelValue === 0 ? 1 : 0.4)"
      icon="exposure_zero"
      outline
      :size="
        'min(calc((100svw - 48px - ' +
        steps * 2 +
        'px) / ' +
        1.75 * steps +
        '), 1.714em)'
      "
      flat
      dense
      class="q-pa-none"
      @click="zeroRatingClicked"
    />
    <div class="column">
      <q-rating
        :model-value="ratingValue"
        :size="
          'min(calc((100svw - 48px - ' +
          steps * 2 +
          'px) / ' +
          steps +
          '), 3em)'
        "
        :max="validation.max - validation.min"
        color="primary"
        icon="star_border"
        icon-selected="star"
        @update:model-value="ratingChanged"
      />
      <div v-if="legend" class="row justify-between">
        <div
          v-for="(item, index) in legend"
          :key="index"
          :style="`width: ${100 / legend.length}%`"
        >
          <small class="legend">{{ item }}</small>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { defineProps, defineModel, computed } from 'vue';

export interface AttributeFormInputProps {
  validation: { min: number; max: number; step: 1 };
  legend: string[] | null;
}

const props = defineProps<AttributeFormInputProps>();

const modelValue = defineModel<number | null>({ required: true });

const withZero = computed(() => props.validation.min === 0);
const steps = computed(() => props.validation.max - props.validation.min + 1);

const ratingValue = computed(() => {
  return (modelValue.value || 0) - props.validation.min;
});

function ratingChanged(value: number) {
  modelValue.value = value + props.validation.min;
}

function zeroRatingClicked() {
  if (modelValue.value === 0) {
    modelValue.value = null;
  } else {
    modelValue.value = 0;
  }
}
</script>
