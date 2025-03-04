<template>
  <div v-if="rows.length === 0" class="text-caption q-mx-md">
    {{ t('entity.noData') }}
  </div>
  <q-table
    v-else
    v-model:pagination="pagination"
    class="q-mt-md entity-related-table"
    flat
    dense
    :rows="rows"
    :columns="columns"
    :visible-columns="visibleColumns"
    :row-key="rowKey"
    :rows-per-page-options="[0]"
    hide-pagination
    wrap-cells
    binary-state-sort
  >
    <template
      v-for="(_, slotName) in slots"
      :key="slotName"
      #[slotName]="slotProps"
    >
      <slot :name="slotName" v-bind="slotProps"></slot>
    </template>
  </q-table>
</template>

<script setup lang="ts">
import type { QTableSlots } from 'quasar';
import { type QTable, useQuasar } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import { ref, watch } from 'vue';

export interface EntityRelatedTableProps {
  entityKey: string;
  rows: QTable['rows'];
  rowKey: QTable['rowKey'];
  columns: QTable['columns'];
  defaultSortBy?: string;
  defaultDescending?: boolean;
  visibleColumns?: QTable['visibleColumns'];
}

const props = defineProps<EntityRelatedTableProps>();
const slots = defineSlots<QTableSlots>();

const paginationKey = `breedersdb-entity-related-table-pagination__${props.entityKey}`;
const defaultPagination = {
  sortBy: props.defaultSortBy || props.columns?.[0]?.name,
  descending: props.defaultDescending,
};
type Pagination = typeof defaultPagination;
const $q = useQuasar();
const pagination = ref(
  $q.localStorage.getItem<Pagination>(paginationKey) || defaultPagination,
);
watch(pagination, (value: Pagination) => {
  $q.localStorage.set(paginationKey, value);
});

const { t } = useI18n();
</script>

<style scoped>
:global(.entity-related-table th) {
  text-wrap: nowrap;
}
</style>
