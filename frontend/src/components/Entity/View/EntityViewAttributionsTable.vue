<template>
  <div class="q-pa-md">
    <q-table
      flat
      :title="title"
      dense
      :rows="rows"
      :columns="columns"
      row-key="name"
    />
  </div>
</template>

<script setup lang="ts">
import type { EntityAttributionsViewFragment } from 'src/components/Entity/entityAttributionsViewFragment';
import { useI18n } from 'src/composables/useI18n';
import { AttributeDataTypes } from 'src/graphql';
import {
  formatResultColumnValue,
  dataTypeToColumnTypes,
} from 'src/utils/attributeUtils';
import { localizeDate } from 'src/utils/dateUtils';

export interface EntityViewAttributionsTableProps {
  rows: EntityAttributionsViewFragment[];
  title: string;
}

defineProps<EntityViewAttributionsTableProps>();

const { t } = useI18n();

const columns = [
  {
    name: 'attribute_name',
    label: t('attributions.columns.attributeName'),
    field: 'attribute_name',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'value',
    label: t('attributions.columns.value'),
    field: (row: EntityAttributionsViewFragment) => getValue(row),
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'date_attributed',
    label: t('attributions.columns.dateAttributed'),
    field: 'date_attributed',
    align: 'left' as const,
    sortable: true,
    format: (val: string | Date) => localizeDate(val),
  },
  {
    name: 'author',
    label: t('attributions.columns.author'),
    field: 'author',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'exceptional_attribution',
    label: t('attributions.columns.exceptionalAttribution'),
    field: 'exceptional_attribution',
    align: 'left' as const,
    sortable: true,
    format: (val: boolean) => (val ? '☑' : ''),
  },
];

function getValue(row: EntityAttributionsViewFragment) {
  const type = dataTypeToColumnTypes(row.data_type as AttributeDataTypes);

  const value =
    row.text_value ??
    row.integer_value ??
    row.float_value ??
    row.date_value ??
    row.boolean_value;

  return formatResultColumnValue({ value, type, t });
}
</script>
