<template>
  <div v-if="rows.length === 0" class="text-caption q-mx-md">
    {{ t('entity.noData') }}
  </div>
  <template v-else>
    <q-table
      v-model:pagination="pagination"
      class="q-mt-md entity-related-table"
      :class="{ 'fade-out': rows.length > ROW_SHOW_ALWAYS && !expanded }"
      flat
      dense
      :rows="visibleRows"
      :columns="columns"
      :visible-columns="visibleColumns"
      :row-key="rowKey"
      :rows-per-page-options="[0]"
      hide-pagination
      wrap-cells
      binary-state-sort
      @row-click="(event, row, index) => $emit('row-click', event, row, index)"
    >
      <template
        v-for="(_, slotName) in slots"
        :key="slotName"
        #[slotName]="slotProps"
      >
        <!-- @vue-expect-error ts-plugin(2345) -->
        <slot :name="slotName" v-bind="slotProps"></slot>
      </template>
    </q-table>
    <q-btn
      v-if="rows.length > ROW_SHOW_ALWAYS && !expanded"
      flat
      size="sm"
      color="primary"
      class="full-width"
      @click="expanded = !expanded"
      :label="`${t('base.showAll')} (${rows.length})`"
    />
  </template>
</template>

<script setup lang="ts">
import type { QTableSlots } from 'quasar';
import { type QTable, useQuasar } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import { computed, ref, watch } from 'vue';

const ROW_HIDE_LIMIT = 10;
const ROW_SHOW_ALWAYS = 6;

export interface EntityRelatedTableProps {
  entityKey: string;
  rows: QTable['rows'];
  rowKey: QTable['rowKey'];
  columns: QTable['columns'];
  defaultSortBy?: string | undefined;
  defaultDescending?: boolean | undefined;
  visibleColumns?: QTable['visibleColumns'] | undefined;
}

const props = defineProps<EntityRelatedTableProps>();
const slots = defineSlots<QTableSlots>();

defineEmits<{
  'row-click': [
    evt: Event,
    row: EntityRelatedTableProps['rows'][0],
    index: number,
  ];
}>();

const paginationKey = `breedersdb-entity-related-table-pagination__${props.entityKey}`;
const defaultPagination = {
  sortBy: props.defaultSortBy || (props.columns?.[0]?.name ?? null),
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

const expanded = ref(props.rows.length <= ROW_HIDE_LIMIT);
const visibleRows = computed(() =>
  expanded.value ? props.rows : props.rows.slice(0, ROW_SHOW_ALWAYS),
);

const { t } = useI18n();
</script>

<style scoped>
:global(.entity-related-table th) {
  text-wrap: nowrap;
}

.fade-out {
  mask-image: linear-gradient(to bottom, black 0%, black 25%, transparent 100%);
}
</style>
