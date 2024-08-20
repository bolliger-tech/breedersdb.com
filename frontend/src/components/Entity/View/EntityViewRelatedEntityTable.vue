<template>
  <div v-if="rows.length === 0" class="text-caption q-mx-md">
    {{ t('entity.noData') }}
  </div>
  <q-table
    v-else
    v-model:pagination="pagination"
    class="q-mt-md entity-view-related-entity-table"
    flat
    dense
    :rows="rows"
    :columns="columns"
    :row-key="rowKey"
    :rows-per-page-options="[0]"
    hide-pagination
    wrap-cells
    binary-state-sort
  >
    <template
      v-for="(slot, slotName) in slots"
      :key="slotName"
      #[slotName]="slotProps"
    >
      <slot :name="slotName" v-bind="slotProps"></slot>
    </template>
  </q-table>
</template>

<script setup lang="ts">
import { type QTable, QTableSlots, useQuasar } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import { ref, watch } from 'vue';

export interface EntityViewRelatedEntityTableProps {
  entityKey: string;
  rows: QTable['rows'];
  rowKey: QTable['rowKey'];
  columns: QTable['columns'];
  defaultSortBy?: string;
  defaultDescending?: boolean;
}

const props = defineProps<EntityViewRelatedEntityTableProps>();
const slots = defineSlots<QTableSlots>();

const paginationKey = `breedersdb-related-entity-table-pagination__${props.entityKey}`;
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
:global(.entity-view-related-entity-table th) {
  text-wrap: nowrap;
}
</style>
