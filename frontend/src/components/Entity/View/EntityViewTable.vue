<template>
  <table class="entity-view-table">
    <slot></slot>
  </table>
</template>

<script lang="ts">
// use non-setup variant so we can export the entityViewTableProps symbol
import type { InjectionKey, Reactive } from 'vue';
import { provide } from 'vue';

export interface EntityViewTableProps {
  dense?: boolean;
  noHover?: boolean;
}

// prettier-ignore
// prettier would remove the <Readonly<Reactive<EntityViewTableProps>>> 🤯
export const entityViewTableProps = Symbol() as InjectionKey<Readonly<Reactive<EntityViewTableProps>>>;
</script>

<script setup lang="ts">
const props = defineProps<EntityViewTableProps>();
provide(entityViewTableProps, props);
</script>

<style lang="scss" scoped>
.entity-view-table {
  width: 100%;
  border-spacing: 0;
  border-collapse: collapse;
}
</style>
