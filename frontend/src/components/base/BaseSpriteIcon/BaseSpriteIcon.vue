<template>
  <q-icon :name="`svguse:/icons/sprite.svg#${name}`" v-bind="rest" />
</template>

<script setup lang="ts">
import { QIconProps } from 'quasar';
import { SpriteIcons } from './types';

export interface BaseSpriteIconProps extends QIconProps {
  name: SpriteIcons;
}

const props = defineProps<BaseSpriteIconProps>();
const { name, ...rest } = props;
</script>
