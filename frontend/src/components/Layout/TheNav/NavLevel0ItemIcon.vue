<template>
  <figure class="column items-center q-ma-none">
    <BaseSpriteIcon v-if="icon" :name="icon" size="xl" />
    <figcaption v-if="label" class="text-caption">{{ label }}</figcaption>
  </figure>
</template>

<script setup lang="ts">
import BaseSpriteIcon, {
  BaseSpriteIconProps,
} from 'components/Base/BaseSpriteIcon/BaseSpriteIcon.vue';

export interface NavLevel0ItemIconProps
  extends Omit<BaseSpriteIconProps, 'name'> {
  label?: string;
  icon?: BaseSpriteIconProps['name'];
}

defineProps<NavLevel0ItemIconProps>();
</script>
