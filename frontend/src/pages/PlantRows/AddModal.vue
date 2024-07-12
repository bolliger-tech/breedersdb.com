<template>
  <PlantRowModalEdit :plant-row="plantRow" :title="t('base.new')" />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import PlantRowModalEdit, {
  PlantRowInsertInput,
} from 'src/components/PlantRow/PlantRowModalEdit.vue';

const plantRow: PlantRowInsertInput = {
  name: '',
  disabled: false,
};

const { t } = useI18n();
</script>
