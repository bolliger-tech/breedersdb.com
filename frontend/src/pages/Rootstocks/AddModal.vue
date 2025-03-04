<template>
  <RootstockModalEdit :rootstock="rootstock" :title="t('base.new')" />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import type { RootstockInsertInput } from 'src/components/Rootstock/RootstockModalEdit.vue';
import RootstockModalEdit from 'src/components/Rootstock/RootstockModalEdit.vue';

const rootstock: RootstockInsertInput = {
  name: '',
};

const { t } = useI18n();
</script>
