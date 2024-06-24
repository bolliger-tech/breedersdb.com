<template>
  <table
    class="plant-entity-table"
    :class="{ 'plant-entity-table--dark': dark }"
  >
    <template v-if="plant.plant_row">
      <tr>
        <th>{{ t('orchards.title', 1) }}</th>
        <td>{{ plant.plant_row.orchard.name }}</td>
      </tr>
      <tr>
        <th>{{ t('plantRows.title', 1) }}</th>
        <td>{{ plant.plant_row.name }}</td>
      </tr>
      <tr v-if="plant.serial_in_plant_row">
        <th>{{ t('plants.fields.serialInPlantRow') }}</th>
        <td>{{ plant.serial_in_plant_row }}</td>
      </tr>
      <tr v-if="plant.distance_plant_row_start">
        <th>{{ t('plants.fields.distancePlantRowStart') }}</th>
        <td>{{ plant.distance_plant_row_start }}</td>
      </tr>
    </template>
    <tr v-if="plant.date_labeled">
      <th>{{ t('plants.fields.dateLabeled') }}</th>
      <td>{{ localizeDate(plant.date_labeled) }}</td>
    </tr>
    <tr v-if="plant.date_grafted">
      <th>{{ t('plants.fields.dateGrafted') }}</th>
      <td>{{ localizeDate(plant.date_grafted) }}</td>
    </tr>
    <tr v-if="plant.rootstock?.name">
      <th>{{ t('plants.fields.rootstock') }}</th>
      <td>{{ plant.rootstock?.name }}</td>
    </tr>
    <tr v-if="plant.grafting?.name">
      <th>{{ t('plants.fields.grafting') }}</th>
      <td>{{ plant.grafting?.name }}</td>
    </tr>
    <tr v-if="plant.date_planted">
      <th>{{ t('plants.fields.datePlanted') }}</th>
      <td>{{ localizeDate(plant.date_planted) }}</td>
    </tr>
    <tr v-if="plant.date_eliminated">
      <th>{{ t('plants.fields.dateEliminated') }}</th>
      <td>{{ localizeDate(plant.date_eliminated) }}</td>
    </tr>
  </table>
  <div
    v-if="plant.note"
    class="plant-entity-table__note"
    :class="{ 'plant-entity-table__note--dark': dark }"
  >
    <strong>{{ t('entity.commonColumns.note') }}</strong
    ><br />
    <span style="white-space: pre-line">{{ plant.note }}</span>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { localizeDate } from 'src/utils/dateUtils';
import { type PlantFragment } from './plantFragment';

export interface PlantEntityTableProps {
  plant: PlantFragment;
  dark?: boolean;
}

defineProps<PlantEntityTableProps>();

const { t } = useI18n();
</script>

<style lang="scss" scoped>
tr {
  white-space: nowrap;
  line-height: 1.75em;
  border-bottom: 1px solid $grey-3;
}
.body--dark tr,
.plant-entity-table--dark tr {
  border-color: $grey-8;
}
tr:last-child {
  border-bottom: none;
}

.plant-entity-table__note {
  padding-top: 0.375em;
  border-top: 1px solid $grey-3;
}
.plant-entity-table__note--dark,
.body--dark .plant-entity-table__note {
  border-top: 1px solid $grey-8;
}

th {
  text-align: left;
  padding-right: 1em;
  padding-left: 0;
  font-weight: bold;
}

td {
  text-align: right;
  padding-left: 1em;
  padding-right: 0;
}

.plant-entity-table {
  width: 100%;
  border-spacing: 0;
  border-collapse: collapse;
}
</style>
