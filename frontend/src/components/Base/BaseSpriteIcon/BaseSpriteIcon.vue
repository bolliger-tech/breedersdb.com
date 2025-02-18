<template>
  <q-icon :name="`svguse:/icons/sprite.svg#${name}`" v-bind="rest" />
</template>

<script setup lang="ts">
import { type BaseSpriteIconProps } from 'components/Base/BaseSpriteIcon/baseSpriteIconProps';
import { computed } from 'vue';

const props = defineProps<BaseSpriteIconProps>();
const rest = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { name, ...rest } = props;
  return rest;
});
</script>
