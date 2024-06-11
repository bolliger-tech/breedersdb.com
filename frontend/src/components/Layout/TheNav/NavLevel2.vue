<template>
  <ul class="q-pa-none list">
    <NavLevel2Item v-for="child in children" :key="child.to" v-bind="child" />
  </ul>
</template>

<script setup lang="ts">
import NavLevel2Item, { NavLevel2ItemProps } from './NavLevel2Item.vue';

export interface NavLevel2Props {
  children: NavLevel2ItemProps[];
}

const { children } = defineProps<NavLevel2Props>();
</script>

<style scoped lang="scss">
.list {
  list-style: none;
  background: rgba(255, 255, 255, 0.1);
}
</style>
