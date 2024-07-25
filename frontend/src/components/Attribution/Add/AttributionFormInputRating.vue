<template>
  <div class="row items-start">
    <div v-if="withZero" class="column">
      <q-btn
        color="primary"
        icon="exposure_zero"
        outline
        :size="`calc(min(calc((100svw - 64px - ${(steps - 1) * 2}px) / ${steps + 1}), 4em) * 0.58)`"
        flat
        dense
        :ripple="false"
        class="q-pa-none attribute-form-input-rating__zero"
        @click="zeroRatingClicked"
      />
      <div class="row justify-between">
        <div v-if="labels.length > 0" style="width: 100%">
          <small :class="{ legend }" class="label">{{ labels[0] }}</small>
        </div>
      </div>
    </div>
    <div class="column">
      <q-rating
        :model-value="ratingValue"
        :size="`min(calc((100svw - 64px - ${(steps - 1) * 2}px) / ${steps + (withZero ? 1 : 0)}), 4em)`"
        :max="validation.max - ratingMin + 1"
        color="primary"
        icon="star_border"
        icon-selected="star"
        @update:model-value="ratingChanged"
      />
      <div class="row justify-between">
        <div
          v-for="(item, index) in withZero ? labels.slice(1) : labels"
          :key="index"
          :style="`width: ${100 / labels.length}%`"
        >
          <small :class="{ legend }" class="label">{{ item }}</small>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';

export interface AttributionFormInputProps {
  validation: { min: number; max: number; step: 1 };
  legend: string[] | null;
}

const props = defineProps<AttributionFormInputProps>();

const modelValue = defineModel<number | null>({ required: true });

const withZero = computed(() => props.validation.min === 0);
const ratingMin = computed(() => Math.max(props.validation.min, 1));
const steps = computed(() => props.validation.max - ratingMin.value + 1);

const ratingValue = computed(() => {
  return (modelValue.value || 0) - ratingMin.value + 1;
});

function ratingChanged(value: number) {
  const newValue = value + ratingMin.value - 1;
  if (newValue < ratingMin.value) {
    modelValue.value = null;
  } else {
    modelValue.value = newValue;
  }
}

function zeroRatingClicked() {
  if (modelValue.value === 0) {
    modelValue.value = null;
  } else {
    modelValue.value = 0;
  }
}

const labels = computed(() => {
  if (props.legend?.some((v) => v)) {
    return props.legend;
  }

  const numbers = [];
  for (let i = ratingMin.value; i <= props.validation.max; i++) {
    numbers.push(i);
  }
  return numbers;
});

const opacityZero = computed(() => {
  return modelValue.value === 0 ? 1 : 0.4;
});
</script>

<style scoped lang="scss">
.attribute-form-input-rating__zero {
  min-height: 1em;
  transform: translateY(0.1em);
  opacity: v-bind(opacityZero);
  transition: $button-transition;

  &:hover {
    opacity: 1;
    transform: translateY(0.1em) scale(1.25);
  }
}
:global(.attribute-form-input-rating__zero > .q-focus-helper) {
  display: none !important;
}
.label {
  white-space: nowrap;
  font-weight: bolder;
  display: block;
  text-align: center;
  max-width: 100%;
}
.legend {
  writing-mode: tb;
  margin: 0.5em auto;
  max-height: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: wrap;
  text-align: start;
}
</style>
