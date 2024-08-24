<template>
  <span v-if="prefix" class="hash">{{ prefix }}</span>
  <span v-if="leadingZeros.length > 0" class="prefix">{{ leadingZeros }}</span>
  <span class="rest">{{ rest }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { plantLabelIdUtils } from 'src/utils/labelIdUtils';

export interface PlantLabelIdProps {
  labelId: string;
}

const props = defineProps<PlantLabelIdProps>();

const prefix = computed(() => plantLabelIdUtils.getPrefix(props.labelId));
const leadingZeros = computed(() =>
  plantLabelIdUtils.getLeadingZeroes(props.labelId),
);
const rest = computed(() =>
  plantLabelIdUtils.getSignificantDigits(props.labelId),
);
</script>

<style lang="scss" scoped>
.hash {
  opacity: 0.5;
  font-weight: bold;
}

.prefix {
  opacity: 0.5;
}

.rest {
  font-weight: bold;
}
</style>
