<template>
  <figure
    class="row items-center q-mx-none child-item no-wrap full-width"
    :class="{
      'text-white': !isCurrentRoute,
      'text-secondary-100': isCurrentRoute,
    }"
  >
    <BaseSpriteIcon v-if="icon" :name="icon" size="sm" />
    <figcaption v-if="label" class="q-mx-md nowrap-ellipsis label">
      {{ label }}
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
import BaseSpriteIcon from 'components/Base/BaseSpriteIcon/BaseSpriteIcon.vue';
import type { BaseSpriteIconProps } from 'components/Base/BaseSpriteIcon/baseSpriteIconProps';

export interface NavLevel1ItemIconProps
  extends Omit<BaseSpriteIconProps, 'name'> {
  label?: string;
  icon?: BaseSpriteIconProps['name'];
  isCurrentRoute: boolean;
}

defineProps<NavLevel1ItemIconProps>();
</script>

<style scoped lang="scss">
.label {
  width: stretch;
}
</style>
