<template>
  <tr v-if="!isEmpty || renderEmpty" class="entity-view-table-row">
    <th v-if="label">
      {{ label }}
    </th>
    <td :colspan="label ? undefined : 2">
      <slot></slot>
    </td>
  </tr>
</template>

<script setup lang="ts">
import { computed, type Slot } from 'vue';

export interface EntityViewTableRow {
  label?: string | undefined;
  renderEmpty?: boolean;
}

defineProps<EntityViewTableRow>();

const slots = defineSlots<{
  default: Slot;
}>();

const isEmpty = computed(() => {
  return !slots.default()[0].children;
});
</script>

<style lang="scss" scoped>
$border: 1px solid $grey-4;

.entity-view-table-row {
  white-space: nowrap;
  &:not(:last-child) {
    border-bottom: $border;
  }
  &:first-child {
    border-top: $border;
  }
  .body--dark & {
    border-color: $grey-8;
  }
  &:hover {
    background: rgba(0, 0, 0, 0.03);
    .body--dark & {
      background: rgba(255, 255, 255, 0.07);
    }
  }
  th {
    text-align: left;
    padding: 4px 8px 4px 16px;
    font-weight: bold;
  }
  td {
    text-align: right;
    padding: 4px 16px 4px 8px;

    &[colspan='2'] {
      text-align: left;
      padding: 4px 16px;
    }
  }
  & :is(td, th) {
    @media screen and (max-width: $breakpoint-xs-max) {
      display: block;
    }
  }
}
</style>
