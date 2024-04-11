<template>
  <img src="~assets/spinner.svg" :width="size" :height="size" />
</template>

<script setup lang="ts">
import { PropType, computed } from 'vue';

const props = defineProps({
  size: {
    type: String as PropType<'xs' | 'sm' | 'md' | 'lg' | 'xl' | string>,
    default: 'md' as const,
  },
});

const sizes: { [key: string]: number } = {
  xs: 18,
  sm: 24,
  md: 32,
  lg: 38,
  xl: 46,
};

const size = computed(() =>
  props.size !== undefined
    ? props.size in sizes
      ? `${sizes[props.size]}px`
      : props.size
    : undefined,
);
</script>
