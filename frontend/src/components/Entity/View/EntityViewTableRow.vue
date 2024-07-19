<template>
  <tr class="entity-view-table-row">
    <th v-if="label">
      {{ label }}
    </th>
    <td>
      <slot></slot>
    </td>
  </tr>
</template>

<script setup lang="ts">
export interface EntityViewTableRow {
  label: string | undefined;
}

defineProps<EntityViewTableRow>();
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
    padding: 4px 8px;
    font-weight: bold;
  }
  td {
    text-align: right;
    padding: 4px 8px;
  }
  & :is(td, th) {
    @media screen and (max-width: $breakpoint-xs-max) {
      display: block;
    }
  }
}
</style>
