<template>
  <EntityViewRelatedEntityTable
    :entity-key="`attributions-table-${props.attributeType}`"
    :rows="rows"
    row-key="id"
    :columns="columns"
    default-sort-by="date_attributed"
    :default-descending="true"
  >
    <template #body-cell-value="cellProps">
      <q-td key="value" :props="cellProps">
        <template v-if="cellProps.row.data_type === 'PHOTO'">
          <EntityViewAttributionImage
            :file-name="cellProps.row.text_value"
            :attribution="cellProps.row"
            :plant="plant"
            :plant-group="plantGroup"
            :cultivar="cultivar"
            :lot="lot"
            :crossing="crossing"
          />
        </template>

        <template v-else>
          {{ cellProps.value }}
        </template>
      </q-td>
    </template>

    <template #body-cell-photo_note="cellProps">
      <q-td key="photo_note" :props="cellProps">
        <EntityViewAttributionImage
          v-if="cellProps.row.photo_note"
          :file-name="cellProps.row.photo_note"
          :attribution="cellProps.row"
          :plant="plant"
          :plant-group="plantGroup"
          :cultivar="cultivar"
          :lot="lot"
          :crossing="crossing"
        />
      </q-td>
    </template>
  </EntityViewRelatedEntityTable>
</template>

<script setup lang="ts">
import type { EntityAttributionsViewFragment } from 'src/components/Entity/entityAttributionsViewFragment';
import { useI18n } from 'src/composables/useI18n';
import { AttributeDataTypes, AttributeTypes } from 'src/graphql';
import {
  formatResultColumnValue,
  dataTypeToColumnTypes,
  getAttributionValue,
} from 'src/utils/attributeUtils';
import { localizeDate } from 'src/utils/dateUtils';
import EntityViewAttributionImage from './EntityViewAttributionImage.vue';
import { ColumnTypes } from 'src/utils/columnTypes';
import EntityViewRelatedEntityTable from './EntityViewRelatedEntityTable.vue';

export interface EntityViewAttributionsTableProps {
  rows: EntityAttributionsViewFragment[];
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
    name: 'text_note',
    label: t('attributions.columns.textNote'),
    field: 'text_note',
    align: 'left' as const,
    sortable: true,
    style: 'max-width: clamp(100px, 40vw, 300px);',
  },
  {
    name: 'photo_note',
    label: t('attributions.columns.photoNote'),
    field: 'photo_note',
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
    format: (val: boolean) => (val ? '✓' : ''),
  },
];

function getValue(row: EntityAttributionsViewFragment) {
  const type = dataTypeToColumnTypes(row.data_type as AttributeDataTypes);
  const value = getAttributionValue(row);

  if (type === ColumnTypes.Photo) {
    // photo is handled in the template
    return '';
  }

  return formatResultColumnValue({ value, type });
}
</script>
