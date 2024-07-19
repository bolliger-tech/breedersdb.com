<template>
  <EntityListTable
    v-model:pagination="pagination"
    v-model:visible-columns="visibleColumns"
    :rows="rows"
    :loading="loading"
    :all-columns="allColumns"
    :data-is-fresh="dataIsFresh"
    header-height="72px"
  >
    <template #column-selector-option="{ opt, itemProps }">
      <q-item v-bind="itemProps">
        <q-item-section>
          <q-item-label class="row align-center no-wrap">
            <AnalyzeResultTableColumnLabel
              :label="opt.label"
              orientation="horizontal"
            />
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>

    <template #header-cell-label="{ col }">
      <AnalyzeResultTableColumnLabel
        :label="col.label"
        orientation="vertical"
      />
    </template>

    <template #body-cell="cellProps">
      <AnalyzeResultTableCell :cell-props="cellProps" />
    </template>
  </EntityListTable>
</template>

<script lang="ts" setup>
import { QTableColumn, QTableProps } from 'quasar';
import AnalyzeResultTableCell from './AnalyzeResultTableCell.vue';
import { QueryAttributionsViewFields } from './filterToQuery';
import EntityListTable from 'src/components/Entity/List/EntityListTable.vue';
import AnalyzeResultTableColumnLabel from 'components/Analyze/Result/AnalyzeResultTableColumnLabel.vue';

export interface AnalyzeResultTableProps
  extends AnalyzeResultTablePropsWithoutModel {
  visibleColumns: string[];
  pagination: NonNullable<QTableProps['pagination']>;
}

interface AnalyzeResultTablePropsWithoutModel {
  rows: (
    | { [key: string]: null | number | string }
    | { [key: `attributes.${number}`]: QueryAttributionsViewFields[] }
  )[];
  loading: boolean;
  allColumns: QTableColumn[];
  dataIsFresh: boolean;
}

export type AnalyzeResultTableRequestDataParams = Parameters<
  NonNullable<QTableProps['onRequest']>
>[0];

withDefaults(defineProps<AnalyzeResultTablePropsWithoutModel>(), {
  loading: false,
});
const visibleColumns = defineModel<string[]>('visibleColumns', {
  required: true,
});
const pagination = defineModel<QTableProps['pagination']>('pagination', {
  required: true,
});
</script>
