<template>
  <MotherPlantModalEdit :mother-plant="motherPlant" :title="t('base.new')" />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import MotherPlantModalEdit, {
  MotherPlantInsertInput,
} from 'src/components/MotherPlant/MotherPlantModalEdit.vue';

const motherPlant: MotherPlantInsertInput = {
  name: '',
  date_impregnated: null,
  date_fruits_harvested: null,
  numb_flowers: null,
  numb_fruits: null,
  numb_seeds: null,
  note: null,
};

const { t } = useI18n();
</script>
