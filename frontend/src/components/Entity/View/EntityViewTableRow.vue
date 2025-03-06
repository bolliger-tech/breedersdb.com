<template>
  <tr
    v-if="!isEmpty || renderEmpty"
    class="entity-view-table-row"
    :class="{
      'entity-view-table-row--dense': tableProps?.dense,
      'entity-view-table-row--no-hover': tableProps?.noHover,
      'entity-view-table-row--multiline': multiline,
    }"
  >
    <th v-if="label">
      {{ label }}
    </th>
    <td :colspan="label ? 1 : 2">
      <slot></slot>
    </td>
  </tr>
</template>

<script setup lang="ts">
import { inject, computed, type Slot } from 'vue';
import { entityViewTableProps } from './EntityViewTable.vue';

export interface EntityViewTableRow {
  label?: string | undefined;
  renderEmpty?: boolean | undefined;
  multiline?: boolean | undefined;
}

defineProps<EntityViewTableRow>();

const slots = defineSlots<{
  default: Slot;
}>();

const tableProps = inject(entityViewTableProps);

const isEmpty = computed(() => {
  return !slots.default()[0].children;
});
</script>

<style lang="scss" scoped>
$border: 1px solid $grey-4;

.entity-view-table-row {
  white-space: nowrap;
  border-bottom: $border;
  &:last-child {
    border-bottom: none;
  }
  &:first-child {
    border-top: $border;
  }
  &--dense,
  &--dense:first-child {
    border: none;
  }

  &--multiline {
    white-space: pre-line;
  }
  .body--dark & {
    border-color: $grey-8;
  }

  &:not(&--no-hover):hover {
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
  &--dense :is(th, td, td[colspan='2']) {
    padding: 1px 0;
  }
  & :is(td, th) {
    @media screen and (max-width: $breakpoint-xs-max) {
      display: block;
      padding: 4px 16px;
    }
  }
  &--dense :is(td, th) {
    display: table-cell;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 0; // https://stackoverflow.com/a/11877033
  }
}
</style>
