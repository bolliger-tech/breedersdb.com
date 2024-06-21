<template>
  <table style="width: 100%" class="text-body2">
    <tr v-if="plant.date_planted">
      <th>{{ t('plants.fields.datePlanted') }}</th>
      <td>{{ localizeDate(plant.date_planted) }}</td>
    </tr>
    <tr v-if="plant.date_grafted">
      <th>{{ t('plants.fields.dateGrafted') }}</th>
      <td>{{ localizeDate(plant.date_grafted) }}</td>
    </tr>
    <tr v-if="plant.date_eliminated">
      <th>{{ t('plants.fields.dateEliminated') }}</th>
      <td>{{ localizeDate(plant.date_eliminated) }}</td>
    </tr>
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
  </table>
  <div v-if="plant.note" class="q-mt-sm text-body2">
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
}

defineProps<PlantEntityTableProps>();

const { t } = useI18n();
</script>

<style lang="scss" scoped>
tr {
  white-space: nowrap;
  line-height: 1.3em;
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
</style>
