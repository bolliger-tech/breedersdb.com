<template>
  <li>
    <component
      :is="component.component"
      v-if="component"
      v-bind="component.props"
    />
    <q-item v-else clickable tag="a" :to="to" class="column justify-center">
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
import { type Component } from 'vue';
import { useNavItem } from './useNavItem';

type NavLevel2ItemRegular = {
  label: string;
  component?: never;
};

type NavLevel2ItemComponent = {
  label?: never;
  component: { component: Component; props?: Record<string, unknown> };
};

export type NavLevel2ItemProps = {
  to: string;
} & (NavLevel2ItemRegular | NavLevel2ItemComponent);

const { to, label, component } = defineProps<NavLevel2ItemProps>();

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
