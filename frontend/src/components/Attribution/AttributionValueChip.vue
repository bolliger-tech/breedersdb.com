<template>
  <div class="props-value-chip">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar';
import { computed } from 'vue';

export interface AttributionValueChipProps {
  plant?: boolean;
  plantGroup?: boolean;
  cultivar?: boolean;
  lot?: boolean;
  aggregated?: boolean;
  default?: boolean;
  dark?: boolean;
  maxWidth: string;
}

const props = defineProps<AttributionValueChipProps>();

const $q = useQuasar();

const color = computed(() => {
  let baseColor = (props.dark ?? $q.dark.isActive) ? '#000000' : '#ffffff';
  if (props.plant) {
    baseColor = '#c8e6c9'; // green-2
  } else if (props.plantGroup) {
    baseColor = '#e1bee7'; // purple-2
  } else if (props.cultivar) {
    baseColor = '#ffecb3'; // amber-2
  } else if (props.lot) {
    baseColor = '#bbdefb'; // blue-2
  } else if (props.aggregated) {
    baseColor = '#ffcdd2'; // red-2
  } else if (props.default) {
    baseColor = '#f5f5f5'; // grey-2
  }

  return (props.dark ?? $q.dark.isActive)
    ? `color-mix(in srgb, ${baseColor} 33%, transparent)`
    : baseColor;
});
</script>

<style scoped lang="scss">
.props-value-chip {
  max-width: v-bind(maxWidth);
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  font-size: 0.625rem;
  padding: 0.5em 0.9em;
  border-radius: 2em;
  line-height: 1;
  margin: 4px;
  display: inline-block;
  background-color: v-bind(color);
}
</style>
