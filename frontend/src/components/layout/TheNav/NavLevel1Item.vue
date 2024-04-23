<template>
  <li>
    <component
      :is="component.component"
      v-if="component"
      v-bind="component.props"
    />

    <template v-if="icon && label">
      <q-expansion-item
        v-if="hasChildren"
        :class="{ 'q-pb-none': isOpen, 'children-bg': isOpen }"
        :model-value="isOpen"
        @click.stop="isOpen = !isOpen"
      >
        <template #header>
          <NavLevel1ItemIcon
            :icon="icon"
            :label="label"
            :is-current-route="isCurrentRoute"
            class="full-width"
          />
        </template>
        <template #default>
          <NavLevel2 :children="getChildren" />
        </template>
      </q-expansion-item>

      <q-item v-else clickable tag="a" :to="to">
        <NavLevel1ItemIcon
          :icon="icon"
          :label="label"
          :is-current-route="isCurrentRoute"
        />
      </q-item>
    </template>
  </li>
</template>

<script setup lang="ts">
import { useNavItem } from './useNavItem';
import NavLevel2, { NavLevel2Props } from './NavLevel2.vue';
import { ref } from 'vue';
import NavLevel1ItemIcon, {
  NavLevel1ItemIconProps,
} from './NavLevel1ItemIcon.vue';
import { type Component } from 'vue';

type NavLevel1ItemRegular = {
  children?: NavLevel2Props['children'];
  component?: never;
} & Omit<NavLevel1ItemIconProps, 'isCurrentRoute'>;

type NavLevel1ItemComponent = {
  component: { component: Component; props?: Record<string, unknown> };
  children?: never;
  label?: never;
  icon?: never;
};

export type NavLevel1ItemProps = {
  to: string;
} & (NavLevel1ItemRegular | NavLevel1ItemComponent);

const { to, label, icon, children, component } =
  defineProps<NavLevel1ItemProps>();

const { isCurrentRoute, hasChildren, getChildren } = useNavItem({
  children,
  to,
});

const isOpen = ref(isCurrentRoute.value);
</script>

<style scoped>
.children-bg {
  background: rgba(255, 255, 255, 0.1);
}
</style>
