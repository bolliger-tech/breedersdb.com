<template>
  <EntityViewTableRow :label="t('entity.commonColumns.created')">
    {{ d(created, 'YmdHis') }}
  </EntityViewTableRow>
  <EntityViewTableRow :label="t('entity.commonColumns.modified')">
    {{ d(modified, 'YmdHis') }}
  </EntityViewTableRow>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';

export interface EntityViewTableTimestampRowsProps {
  created: string;
  modified: string;
}

defineProps<EntityViewTableTimestampRowsProps>();

const { t, d } = useI18n();
</script>
