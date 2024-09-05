<template>
  <li>
    <component
      :is="component.component"
      v-if="component"
      v-bind="component.props"
    />
    <q-item v-else clickable tag="a" :to="path" class="column justify-center">
      <span
        class="label"
        :class="{
          'text-white': !isCurrentRoute,
          'text-secondary-100': isCurrentRoute,
        }"
        >{{ label }}</span
      >
    </q-item>
  </li>
</template>

<script setup lang="ts">
import { useNavItem, type NavItem } from './useNavItem';

export interface NavLevel2ItemProps extends NavItem {}

const props = defineProps<NavLevel2ItemProps>();

const { isCurrentRoute } = useNavItem(props);
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
