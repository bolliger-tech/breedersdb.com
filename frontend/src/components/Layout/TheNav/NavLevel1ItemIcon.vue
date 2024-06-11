<template>
  <figure
    class="row items-center q-mx-none child-item no-wrap"
    :class="{
      'text-white': !isCurrentRoute,
      'text-secondary-100': isCurrentRoute,
    }"
  >
    <BaseSpriteIcon :name="icon" size="sm" />
    <figcaption class="q-ml-md">{{ label }}</figcaption>
  </figure>
</template>

<script setup lang="ts">
import BaseSpriteIcon, {
  BaseSpriteIconProps,
} from 'components/Base/BaseSpriteIcon/BaseSpriteIcon.vue';

export interface NavLevel1ItemIconProps
  extends Omit<BaseSpriteIconProps, 'name'> {
  label: string;
  icon: BaseSpriteIconProps['name'];
  isCurrentRoute: boolean;
}

const { icon, label, isCurrentRoute } = defineProps<NavLevel1ItemIconProps>();
</script>
