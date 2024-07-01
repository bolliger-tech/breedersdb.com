<template>
  <table
    class="plant-entity-table"
    :class="{
      'plant-entity-table--dark': dark,
      'plant-entity-table--no-border': noBorder,
    }"
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
    <tr v-if="plant.date_labeled">
      <th>{{ t('plants.fields.dateLabeled') }}</th>
      <td>{{ localizeDate(plant.date_labeled) }}</td>
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
  rowPaddingSide: string;
  noBorder?: boolean;
}

defineProps<PlantEntityTableProps>();

const { t } = useI18n();
</script>

<style lang="scss" scoped>
tr {
  white-space: nowrap;
  border-bottom: 1px solid $grey-4;
}
tr:hover {
  background: rgba(0, 0, 0, 0.03);
}
.body--dark tr,
.plant-entity-table--dark tr {
  border-color: $grey-8;
}
.body--dark tr:hover {
  background: rgba(255, 255, 255, 0.07);
}
tr:last-child {
  border-bottom: none;
}

.plant-entity-table__note {
  padding-top: 0.375em;
  border-top: 1px solid $grey-4;
}
.plant-entity-table__note--dark,
.body--dark .plant-entity-table__note {
  border-top: 1px solid $grey-8;
}

.plant-entity-table--no-border :is(tr, .plant-entity-table__note) {
  border-bottom: none;
  border-top: none;
}

th {
  text-align: left;
  padding: 4px 8px;
  font-weight: bold;
}

td {
  text-align: right;
  padding: 4px 8px;
}
th:first-child {
  padding-left: v-bind(rowPaddingSide);
}
td:last-child {
  padding-right: v-bind(rowPaddingSide);
}

.plant-entity-table--no-border :is(td, th) {
  padding-top: 0;
  padding-bottom: 0;
}

.plant-entity-table--no-border tr:hover {
  background: none;
}

.plant-entity-table {
  width: 100%;
  border-spacing: 0;
  border-collapse: collapse;
}
</style>
