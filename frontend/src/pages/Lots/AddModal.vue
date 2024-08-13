<template>
  <LotModalEdit :lot="lot" :title="t('base.new')" />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import LotModalEdit, {
  LotInsertInput,
} from 'src/components/Lot/LotModalEdit.vue';

const lot: LotInsertInput = {
  name_segment: '',
  note: null,
  name_override: null,
  date_sowed: null,
  numb_seeds_sowed: null,
  numb_seedlings_grown: null,
  seed_tray: null,
  date_planted: null,
  numb_seedlings_planted: null,
  plot: null,
};

const { t } = useI18n();
</script>
