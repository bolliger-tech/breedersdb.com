<template>
  <q-icon :name="`svguse:/icons/sprite.svg#${name}`" v-bind="rest" />
</template>

<script setup lang="ts">
import { type BaseSpriteIconProps } from 'components/Base/BaseSpriteIcon/baseSpriteIconProps';

const props = defineProps<BaseSpriteIconProps>();
const { name, ...rest } = props;
</script>
