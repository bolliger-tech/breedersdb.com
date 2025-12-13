<template>
  <EntityRelatedTable
    entity-key="plants"
    :rows="rows"
    row-key="id"
    :columns="columns"
    :visible-columns="visibleColumns"
    default-sort-by="label_id"
    @row-click="(_, row) => $router.push(`/plants/${row.id}`)"
  >
    <template #body-cell-label_id="cellProps">
      <q-td key="label_id" :props="cellProps">
        <RouterLink
          :to="`/plants/${cellProps.row.id}`"
          class="undecorated-link"
        >
          <EntityLabelId
            entity-type="plant"
            :label-id="cellProps.row.label_id"
          />
        </RouterLink>
      </q-td>
    </template>
    <template #body-cell-plant_row="cellProps">
      <q-td key="plant_row" :props="cellProps">
        <RouterLink
          v-if="cellProps.row.plant_row"
          :to="`/rows/${cellProps.row.plant_row.id}`"
          class="undecorated-link"
        >
          {{ cellProps.row.plant_row.name }}
        </RouterLink>
      </q-td>
    </template>
    <template #body-cell-orchard="cellProps">
      <q-td key="orchard" :props="cellProps">
        <RouterLink
          v-if="cellProps.row.plant_row?.orchard"
          :to="`/orchards/${cellProps.row.plant_row.orchard.id}`"
          class="undecorated-link"
        >
          {{ cellProps.row.plant_row.orchard.name }}
        </RouterLink>
      </q-td>
    </template>
  </EntityRelatedTable>
</template>

<script setup lang="ts">
import { useLocalizedSort } from 'src/composables/useLocalizedSort';
import EntityLabelId from 'src/components/Entity/EntityLabelId.vue';
import { useI18n } from 'src/composables/useI18n';
import EntityRelatedTable from 'src/components/Entity/EntityRelatedTable.vue';
import type { PlantFragment } from 'src/components/Plant/plantFragment';

type ColumnNames = (typeof columns)[number]['name'];

export interface PlantListProps {
  rows: PlantFragment[];
  visibleColumns?: ColumnNames[];
}

defineProps<PlantListProps>();

const { t, n, d } = useI18n();
const { localizedSortPredicate } = useLocalizedSort();

type Plant = PlantFragment;
type PlantRow = NonNullable<Plant['plant_row']>;

const columns = [
  {
    name: 'label_id' as const,
    label: t('plants.fields.labelId'),
    field: 'label_id',
    align: 'left' as const,
    sortable: true,
    sort: (a: Plant['label_id'], b: Plant['label_id']) =>
      localizedSortPredicate(a, b),
  },
  {
    name: 'plant_group_name' as const,
    label: t('plants.fields.groupName'),
    align: 'left' as const,
    field: 'plant_group_name',
    sortable: true,
    sort: (a: Plant['plant_group_name'], b: Plant['plant_group_name']) =>
      localizedSortPredicate(a, b),
  },
  {
    name: 'plant_row' as const,
    label: t('plantRows.title', 1),
    align: 'left' as const,
    field: (row: Plant) => row.plant_row?.name,
    sortable: true,
    sort: (a: PlantRow['name'], b: PlantRow['name']) =>
      localizedSortPredicate(a, b),
  },
  {
    name: 'distance_plant_row_start' as const,
    label: t('plants.fields.distancePlantRowStart'),
    field: 'distance_plant_row_start',
    align: 'right' as const,
    sortable: true,
    format: (v: Plant['distance_plant_row_start']) =>
      typeof v === 'number' ? n(v) : '',
  },
  {
    name: 'orchard' as const,
    label: t('orchards.title', 1),
    align: 'left' as const,
    field: (row: Plant) => row.plant_row?.orchard?.name,
    sortable: true,
    sort: (a: PlantRow['orchard']['name'], b: PlantRow['orchard']['name']) =>
      localizedSortPredicate(a, b),
  },
  {
    name: 'date_planted' as const,
    label: t('plants.fields.datePlanted'),
    align: 'left' as const,
    field: 'date_planted',
    format: (val: Plant['date_planted']) => (val ? d(val, 'Ymd') : ''),
    sortable: true,
  },
  {
    name: 'date_eliminated' as const,
    label: t('plants.fields.dateEliminated'),
    align: 'left' as const,
    field: 'date_eliminated',
    format: (val: Plant['date_eliminated']) => (val ? d(val, 'Ymd') : ''),
    sortable: true,
  },
];
</script>
