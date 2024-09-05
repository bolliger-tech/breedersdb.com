<template>
  <ul class="q-pa-none list">
    <NavLevel2Item v-for="child in children" :key="child.path" v-bind="child" />
  </ul>
</template>

<script setup lang="ts">
import NavLevel2Item from './NavLevel2Item.vue';
import { type NavItem } from 'src/components/Layout/TheNav/useNavItem';

export interface NavLevel2Props {
  children: NavItem[];
}

defineProps<NavLevel2Props>();
</script>

<style scoped lang="scss">
.list {
  list-style: none;
  background: rgba(255, 255, 255, 0.1);
}
</style>
