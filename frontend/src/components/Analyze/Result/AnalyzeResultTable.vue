<template>
  <EntityListTable
    v-model:pagination="pagination"
    v-model:visible-columns="visibleColumns"
    :rows="rows"
    :loading="loading"
    :all-columns="allColumns"
    :data-is-fresh="dataIsFresh"
    header-height="72px"
    :is-exporting="isExporting"
    :export-progress="exportProgress"
    @row-click="onRowClick"
    @export="onExport"
  >
    <template #column-selector-before-options>
      <AnalyzeResultTableAddColumnsFromForm
        v-model:visible-columns="visibleColumns"
      />
    </template>
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
import type { QTableColumn, QTableProps } from 'quasar';
import AnalyzeResultTableCell from './AnalyzeResultTableCell.vue';
import type { AnalyzeAttributionsViewFields } from './filterToQuery';
import EntityListTable from 'src/components/Entity/List/EntityListTable.vue';
import AnalyzeResultTableColumnLabel from 'components/Analyze/Result/AnalyzeResultTableColumnLabel.vue';
import { BaseTable } from '../Filter/filterNode';
import { useRouter } from 'vue-router';
import type { EntityExportButtonProps } from 'src/components/Entity/EntityExportButton.vue';
import AnalyzeResultTableAddColumnsFromForm from './AnalyzeResultTableAddColumnsFromForm.vue';

export interface AnalyzeResultTableProps
  extends AnalyzeResultTablePropsWithoutModel {
  visibleColumns: string[];
  pagination: NonNullable<QTableProps['pagination']>;
}

type AnalyzeResultTablePropsWithoutModel = {
  rows: {
    id: number;
    [key: `attributes.${number}`]: AnalyzeAttributionsViewFields[];
    [key: string]: null | number | string | AnalyzeAttributionsViewFields[];
  }[];
  loading: boolean;
  allColumns: QTableColumn[];
  dataIsFresh: boolean;
  baseTable: BaseTable;
} & EntityExportButtonProps;

export type AnalyzeResultTableRequestDataParams = Parameters<
  NonNullable<QTableProps['onRequest']>
>[0];

const props = withDefaults(defineProps<AnalyzeResultTablePropsWithoutModel>(), {
  loading: false,
});
const visibleColumns = defineModel<string[]>('visibleColumns', {
  required: true,
});
const pagination = defineModel<QTableProps['pagination']>('pagination', {
  required: true,
});

const router = useRouter();
async function onRowClick(row: AnalyzeResultTableProps['rows'][0]): void {
  if (props.baseTable === BaseTable.Attributions) {
    throw new Error('Attributions must not be the base table for results.');
  }

  const routes = {
    [BaseTable.Plants]: '/plants',
    [BaseTable.PlantGroups]: '/groups',
    [BaseTable.Cultivars]: '/cultivars',
    [BaseTable.Lots]: '/lots',
    [BaseTable.Crossings]: '/crossings',
  };

  await router.push(`${routes[props.baseTable]}/${row.id}`);
}
</script>
