<template>
  <ul class="list">
    <NavLevel1Item
      v-for="child in children"
      :key="child.to"
      :to="child.to"
      :label="child.label"
      :icon="child.icon"
      :children="child.children"
    />
  </ul>
</template>

<script setup lang="ts">
import NavLevel1Item, { NavLevel1ItemProps } from './NavLevel1Item.vue';

export interface NavLevel1Props {
  children: NavLevel1ItemProps[];
}

const { children } = defineProps<NavLevel1Props>();
</script>

<style scoped lang="scss">
.list {
  position: fixed;
  bottom: 83px;
  left: 0;
  width: 100%;
  background: var(--q-primary);
  border-bottom: 1px solid white;
  list-style: none;
  padding: 0;
  overflow-y: auto;
  max-height: calc(100svh - 83px);

  @media screen and (min-width: $breakpoint-md-min) {
    bottom: auto;
    left: 100px;
    width: auto;
    min-width: 320px;
    border-bottom: none;
    border-left: 1px solid white;
  }
}
</style>
