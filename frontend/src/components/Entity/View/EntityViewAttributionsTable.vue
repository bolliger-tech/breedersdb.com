<template>
  <EntityRelatedTable
    :entity-key="`attributions-table-${props.attributeType}`"
    :rows="rows"
    row-key="id"
    :columns="columns"
    default-sort-by="date_attributed"
    :default-descending="true"
    @row-click="(_, row) => $router.push(`/attributions/${row.id}`)"
  >
    <template #body-cell-entity="cellProps">
      <q-td key="entity" :props="cellProps">
        <EntityLink :entity="cellProps.row" />
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

        <template v-else-if="cellProps.row.data_type === 'ATTACHMENT'">
          <AttributionAttachmentLink
            :file-name="cellProps.row.text_value"
            :attribute-name="cellProps.row.attribute_name"
            :entity-name="getAttributedEntityName(cellProps.row)"
            :date-attributed="cellProps.row.date_attributed"
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
  </EntityRelatedTable>
</template>

<script setup lang="ts">
import type { CachedAttributionsFragment } from 'src/components/Attribution/cachedAttributionsFragment';
import { useI18n } from 'src/composables/useI18n';
import type { AttributeTypes } from 'src/graphql';
import {
  formatAttributionValue,
  getAttributedEntityName,
} from 'src/utils/attributeUtils';
import AttributionAttachmentLink from 'src/components/Attribution/AttributionAttachmentLink.vue';
import EntityViewAttributionImage from './EntityViewAttributionImage.vue';
import EntityRelatedTable from 'src/components/Entity/EntityRelatedTable.vue';
import EntityLink from 'src/components/Entity/EntityLink.vue';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';

export interface EntityViewAttributionsTableProps {
  rows: CachedAttributionsFragment[];
  attributeType?: AttributeTypes | undefined;
  showEntity?: boolean | undefined;
}

const props = defineProps<EntityViewAttributionsTableProps>();

const { t, d, n } = useI18n();
const { localizedSortPredicate } = useLocalizedSort();

const columns = [
  ...(props.showEntity
    ? [
        {
          name: 'entity',
          label: t('attributions.columns.entity'),
          field: (row: CachedAttributionsFragment) => row,
          align: 'left' as const,
          sortable: true,
          sort: (
            a: CachedAttributionsFragment,
            b: CachedAttributionsFragment,
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
    field: (row: CachedAttributionsFragment) => getValue(row),
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
    format: (val: CachedAttributionsFragment['date_attributed']) =>
      d(val, 'Ymd'),
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
    format: (val: CachedAttributionsFragment['exceptional_attribution']) =>
      val ? '✓' : '',
  },
];

function getValue(row: CachedAttributionsFragment) {
  // photo and attachment are handled in the template
  return formatAttributionValue({ attribution: row, d, n });
}
</script>
