<template>
  <PlantGroupModalEdit :plant-group="plantGroup" :title="t('base.new')" />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import PlantGroupModalEdit, {
  PlantGroupInsertInput,
} from 'src/components/PlantGroup/PlantGroupModalEdit.vue';

const plantGroup: PlantGroupInsertInput = {
  name_segment: '',
  name_override: null,
  note: null,
  disabled: false,
};

const { t } = useI18n();
</script>
