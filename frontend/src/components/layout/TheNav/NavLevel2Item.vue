<template>
  <li>
    <q-item clickable tag="a" :to="to" class="column justify-center">
      <span
        class="label"
        :class="{
          'text-white': !isCurrentRoute,
          'text-primary-contrast': isCurrentRoute,
        }"
        >{{ label }}</span
      >
    </q-item>
  </li>
</template>

<script setup lang="ts">
import { useNavItem } from './useNavItem';

export interface NavLevel2ItemProps {
  to: string;
  label: string;
}

const { to, label } = defineProps<NavLevel2ItemProps>();

const { isCurrentRoute } = useNavItem({ to });
</script>

<style scoped lang="scss">
.label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.label::before {
  content: '○';
  display: inline-block;
  padding-left: 40px;
  padding-right: map-get($space-sm, 'x');
}
</style>
