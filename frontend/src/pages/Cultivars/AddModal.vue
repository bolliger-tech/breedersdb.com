<template>
  <CultivarModalEdit :cultivar="cultivar" :title="t('base.new')" />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import CultivarModalEdit, {
  CultivarInsertInput,
} from 'src/components/Cultivar/CultivarModalEdit.vue';

const cultivar: CultivarInsertInput = {
  name_segment: '',
  name_override: '',
  full_name: '',
  display_name: '',
  lot_id: undefined,
  acronym: '',
  breeder: '',
  registration: '',
  note: '',
};

const { t } = useI18n();
</script>
