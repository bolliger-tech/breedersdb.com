<template>
  <span v-if="prefix" class="prefix">{{ prefix }}</span>
  <span v-if="leadingZeros.length > 0" class="leading-zeros">{{
    leadingZeros
  }}</span>
  <span class="significant-digits">{{ significantDigits }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  plantLabelIdUtils,
  plantGroupLabelIdUtils,
} from 'src/utils/labelIdUtils';

export interface EntityLabelIdProps {
  labelId: string;
  entityType: 'plant' | 'plantGroup';
}

const props = defineProps<EntityLabelIdProps>();

const utils = computed(() =>
  props.entityType === 'plant' ? plantLabelIdUtils : plantGroupLabelIdUtils,
);

const prefix = computed(() => utils.value.getPrefix(props.labelId));
const leadingZeros = computed(() =>
  utils.value.getLeadingZeroes(props.labelId),
);
const significantDigits = computed(() =>
  utils.value.getSignificantDigits(props.labelId),
);
</script>

<style lang="scss" scoped>
.prefix {
  opacity: 0.5;
  font-weight: bold;
}

.leading-zeros {
  opacity: 0.5;
}

.significant-digits {
  font-weight: bold;
}
</style>
