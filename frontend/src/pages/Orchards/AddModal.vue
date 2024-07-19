<template>
  <OrchardModalEdit :orchard="orchard" :title="t('base.new')" />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import OrchardModalEdit, {
  OrchardInsertInput,
} from 'src/components/Orchard/OrchardModalEdit.vue';

const orchard: OrchardInsertInput = {
  name: '',
  disabled: false,
};

const { t } = useI18n();
</script>
