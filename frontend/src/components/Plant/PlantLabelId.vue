<template>
  <span v-if="props.labelId.startsWith('#')" class="hash">#</span>
  <span v-if="isZeroPrefixed" class="prefix">{{ prefix }}</span>
  <span class="rest">{{ rest }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface PlantLabelIdProps {
  labelId: string;
}

const props = defineProps<PlantLabelIdProps>();

const hashLessLabelId = computed(() => props.labelId.replace(/^#/, ''));
const isZeroPrefixed = computed(() => /^0\d{7}$/.test(hashLessLabelId.value));
const prefix = computed(() =>
  isZeroPrefixed.value ? (hashLessLabelId.value.match(/^0*/) || [''])[0] : '',
);
const rest = computed(() =>
  isZeroPrefixed.value
    ? hashLessLabelId.value.slice(prefix.value.length)
    : hashLessLabelId.value,
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
