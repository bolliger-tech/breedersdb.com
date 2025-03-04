<template>
  <GraftingModalEdit :grafting="grafting" :title="t('base.new')" />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import type { GraftingInsertInput } from 'src/components/Grafting/GraftingModalEdit.vue';
import GraftingModalEdit from 'src/components/Grafting/GraftingModalEdit.vue';

const grafting: GraftingInsertInput = {
  name: '',
};

const { t } = useI18n();
</script>
