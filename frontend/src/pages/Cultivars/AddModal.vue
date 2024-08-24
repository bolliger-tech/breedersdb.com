<template>
  <CultivarModalEdit
    :cultivar="cultivar"
    :title="t('base.new')"
    :is-variety="false"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import CultivarModalEdit, {
  CultivarInsertInput,
} from 'src/components/Cultivar/CultivarModalEdit.vue';

const cultivar: CultivarInsertInput = {
  name_segment: '',
  name_override: null,
  full_name: '',
  display_name: '',
  acronym: null,
  breeder: null,
  note: null,
};

const { t } = useI18n();
</script>
