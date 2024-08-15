<template>
  <EntityViewRelatedEntityTable
    :entity-key="`attributions-table-${props.attributeType}`"
    :rows="rows"
    :columns="columns"
    default-sort-by="date_attributed"
    :default-descending="true"
  >
    <template #body-cell-entity="cellProps">
      <q-td key="entity" :props="cellProps">
        <RouterLink
          v-if="cellProps.row.plant"
          :to="`/plants/${cellProps.row.plant.id}`"
          class="undecorated-link"
        >
          <PlantLabelId :label-id="cellProps.row.plant.label_id" />
        </RouterLink>
        <RouterLink
          v-else-if="cellProps.row.plant_group"
          :to="`/groups/${cellProps.row.plant_group.id}`"
          class="undecorated-link"
        >
          {{ cellProps.row.plant_group.display_name }}
        </RouterLink>
        <RouterLink
          v-else-if="cellProps.row.cultivar"
          :to="`/cultivars/${cellProps.row.cultivar.id}`"
          class="undecorated-link"
        >
          {{ cellProps.row.cultivar.display_name }}
        </RouterLink>
        <RouterLink
          v-else-if="cellProps.row.lot"
          :to="`/lots/${cellProps.row.lot.id}`"
          class="undecorated-link"
        >
          {{ cellProps.row.lot.name }}
        </RouterLink>
      </q-td>
    </template>

    <template #body-cell-value="cellProps">
      <q-td key="value" :props="cellProps">
        <template v-if="cellProps.row.data_type === 'PHOTO'">
          <EntityViewAttributionImage
            :file-name="cellProps.row.text_value"
            :attribution="cellProps.row"
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
import PlantLabelId from 'src/components/Plant/PlantLabelId.vue';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';

export interface EntityViewAttributionsTableProps {
  rows: EntityAttributionsViewFragment[];
  attributeType?: AttributeTypes;
  showEntity?: boolean;
}

const props = defineProps<EntityViewAttributionsTableProps>();

const { t } = useI18n();
const { localizedSortPredicate } = useLocalizedSort();

const columns = [
  ...(props.showEntity
    ? [
        {
          name: 'entity',
          label: t('attributions.columns.entity'),
          field: (row: EntityAttributionsViewFragment) => row,
          align: 'left' as const,
          sortable: true,
          sort: (
            a: EntityAttributionsViewFragment,
            b: EntityAttributionsViewFragment,
          ) => {
            // sort grouped by plant, plant_group, cultivar, lot
            if (a.plant && b.plant) {
              return localizedSortPredicate(a.plant.label_id, b.plant.label_id);
            }

            if (!a.plant && !b.plant && a.plant_group && b.plant_group) {
              return localizedSortPredicate(
                a.plant_group.display_name,
                b.plant_group.display_name,
              );
            }

            if (
              !a.plant &&
              !b.plant &&
              !a.plant_group &&
              !b.plant_group &&
              a.cultivar &&
              b.cultivar
            ) {
              return localizedSortPredicate(
                a.cultivar.display_name,
                b.cultivar.display_name,
              );
            }

            if (
              !a.plant &&
              !b.plant &&
              !a.plant_group &&
              !b.plant_group &&
              !a.cultivar &&
              !b.cultivar &&
              a.lot &&
              b.lot
            ) {
              return localizedSortPredicate(
                a.lot.display_name,
                b.lot.display_name,
              );
            }

            if (a.plant && !b.plant) {
              return -1;
            }
            if (!a.plant && b.plant) {
              return 1;
            }
            if (a.plant_group && !b.plant_group) {
              return -1;
            }
            if (!a.plant_group && b.plant_group) {
              return 1;
            }
            if (a.cultivar && !b.cultivar) {
              return -1;
            }
            if (!a.cultivar && b.cultivar) {
              return 1;
            }
            if (a.lot && !b.lot) {
              return -1;
            }
            if (!a.lot && b.lot) {
              return 1;
            }

            return 0;
          },
        },
      ]
    : []),
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
