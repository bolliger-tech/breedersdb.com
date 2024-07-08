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
  border-bottom: $border;
}
.entity-view-table-row:hover {
  background: rgba(0, 0, 0, 0.03);
}
.body--dark .entity-view-table-row {
  border-color: $grey-8;
}
.body--dark .entity-view-table-row:hover {
  background: rgba(255, 255, 255, 0.07);
}
.entity-view-table-row:first-child {
  border-top: $border;
}

.entity-view-table-row th {
  text-align: left;
  padding: 4px 8px;
  font-weight: bold;
}

.entity-view-table-row td {
  text-align: right;
  padding: 4px 8px;
}
</style>
