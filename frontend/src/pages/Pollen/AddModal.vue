<template>
  <PollenModalEdit :pollen="pollen" :title="t('base.new')" />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import PollenModalEdit, {
  PollenInsertInput,
} from 'src/components/Pollen/PollenModalEdit.vue';

const pollen: PollenInsertInput = {
  name: '',
  date_harvested: null,
  note: '',
};

const { t } = useI18n();
</script>
