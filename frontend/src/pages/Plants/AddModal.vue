<template>
  <PlantModalEdit :plant="plant" :title="t('base.new')" />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import PlantModalEdit, {
  PlantInsertInput,
} from 'src/components/Plant/PlantModalEdit.vue';

const plant: PlantInsertInput = {
  serial_in_plant_row: null,
  distance_plant_row_start: null,
  geo_location: null,
  geo_location_accuracy: null,
  date_grafted: null,
  date_planted: null,
  date_eliminated: null,
  date_labeled: null,
  note: null,
  rootstock: null,
  grafting: null,
  plant_row: null,
  disabled: false,
};

const { t } = useI18n();
</script>
