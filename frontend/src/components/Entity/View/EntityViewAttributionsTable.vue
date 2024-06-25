<template>
  <q-table
    v-model:pagination="pagination"
    class="q-mt-md"
    flat
    :title="title"
    dense
    :rows="rows"
    :columns="columns"
    row-key="name"
    :rows-per-page-options="[0]"
    hide-pagination
    wrap-cells
    binary-state-sort
  >
    <template #body-cell-value="cellProps">
      <q-td key="name" :props="cellProps">
        <template v-if="cellProps.row.data_type === 'PHOTO'">
          <EntityViewAttributionImage
            :file-hash="cellProps.value"
            :file-name="getFileName(cellProps.row)"
            :note="cellProps.row.note"
            :metadata="`${cellProps.row.attribute_name}, ${cellProps.row.date_attributed} ${cellProps.row.author}`"
          />
        </template>
        <template v-else>
          {{ cellProps.value }}
        </template>
      </q-td>
    </template>
  </q-table>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import type { EntityAttributionsViewFragment } from 'src/components/Entity/entityAttributionsViewFragment';
import { useI18n } from 'src/composables/useI18n';
import { AttributeDataTypes, AttributeTypes } from 'src/graphql';
import {
  formatResultColumnValue,
  dataTypeToColumnTypes,
} from 'src/utils/attributeUtils';
import { localizeDate } from 'src/utils/dateUtils';
import { computed, watch } from 'vue';
import { ref } from 'vue';
import EntityViewAttributionImage from './EntityViewAttributionImage.vue';

export interface EntityViewAttributionsTableProps {
  rows: EntityAttributionsViewFragment[];
  title: string;
  attributeType?: AttributeTypes;
  plant?: { label_id: string };
  plantGroup?: { display_name: string };
  cultivar?: { display_name: string };
  lot?: { display_name: string };
  crossing?: { name: string };
}

const props = defineProps<EntityViewAttributionsTableProps>();

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
    style: 'max-width: clamp(100px, 30vw, 300px);',
  },
  {
    name: 'note',
    label: t('attributions.columns.note'),
    field: 'note',
    align: 'left' as const,
    sortable: true,
    style: 'max-width: clamp(100px, 40vw, 300px);',
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
    format: (val: boolean) => (val ? '✓' : ''),
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

  // photo is handled in the template

  return formatResultColumnValue({ value, type });
}

const paginationKey = `entity-attributions-table-pagination__${props.attributeType}`;
const defaultPagination = {
  sortBy: 'date_attributed',
  descending: true,
};
type Pagination = typeof defaultPagination;
const $q = useQuasar();
const pagination = ref(
  $q.localStorage.getItem<Pagination>(paginationKey) || defaultPagination,
);
watch(pagination, (value: Pagination) => {
  $q.localStorage.set(paginationKey, value);
});

const fileNamePrefix = computed(() => {
  const org = import.meta.env.VITE_ORG_ABBREVIATION;
  const entityName =
    props.plant?.label_id ??
    props.plantGroup?.display_name ??
    props.cultivar?.display_name ??
    props.lot?.display_name ??
    props.crossing?.name ??
    'unknown';

  return `${org}-${entityName}`;
});

function getFileName(row: EntityAttributionsViewFragment) {
  return `${fileNamePrefix.value}-${row.attribute_name}-${row.date_attributed}-${row.id}.jpg`;
}
</script>
