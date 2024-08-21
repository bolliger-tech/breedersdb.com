<template>
  <CrossingModalEdit :crossing="crossing" :title="t('base.new')" />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import CrossingModalEdit, {
  CrossingInsertInput,
} from 'src/components/Crossing/CrossingModalEdit.vue';

const crossing: CrossingInsertInput = {
  name: '',
  mother_cultivar_id: null,
  father_cultivar_id: null,
  note: null,
};

const { t } = useI18n();
</script>
