<template>
  <div v-if="steps <= 10" ref="container" class="row items-start no-wrap">
    <div class="column">
      <div class="row justify-between no-wrap">
        <q-btn
          v-for="(item, index) in steps"
          :key="index"
          :label="item + ratingMin - 1"
          :size="`min((${containerWidth}px - ${(steps - 1) * 2}px) / ${steps * 2.4}, 4rem)`"
          style="margin-right: 2px; font-weight: 700"
          @click="ratingChanged(index + ratingMin)"
          round
          unelevated
          dense
          :outline="modelValue !== index + ratingMin"
          color="primary"
        />
      </div>
      <div class="row justify-between" v-if="props.legend">
        <div
          v-for="(item, index) in props.legend"
          :key="index"
          :style="`width: ${100 / props.legend.length}%`"
        >
          <small :class="{ legend }" class="label">{{ item }}</small>
        </div>
      </div>
    </div>
  </div>
  <BaseMessage v-else type="error" icon-size="lg">
    {{ t('attributes.invalidRatingConfig') }}
  </BaseMessage>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import BaseMessage from 'src/components/Base/BaseMessage.vue';
import { useI18n } from 'src/composables/useI18n';

export interface AttributionInputProps {
  validation: { min: number; max: number; step: 1 };
  legend: string[] | null;
}

const props = defineProps<AttributionInputProps>();

const modelValue = defineModel<number | null>({ required: true });

const ratingMin = computed(() => props.validation.min);
const steps = computed(() => props.validation.max - ratingMin.value + 1);

function ratingChanged(value: number) {
  if (modelValue.value === value) {
    modelValue.value = null;
  } else {
    modelValue.value = value;
  }
}

// width calculation
const container = ref<HTMLDivElement | null>(null);
const containerWidth = ref<number | null>(null);
const observer = new ResizeObserver(() => {
  if (container.value) {
    containerWidth.value = container.value.clientWidth;
  }
});
onMounted(() => {
  if (container.value) {
    observer.observe(container.value);
  }
});
onBeforeUnmount(() => {
  observer.disconnect();
});

const { t } = useI18n();
</script>

<style scoped lang="scss">
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
