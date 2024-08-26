<template>
  <EntityViewTableRow :label="t('entity.commonColumns.created')">
    {{ d(created, 'YmdHis') }}
  </EntityViewTableRow>
  <EntityViewTableRow :label="t('entity.commonColumns.modified')">
    {{ modified ? d(modified, 'YmdHis') : t('base.notAvailable') }}
  </EntityViewTableRow>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';

export interface EntityViewTableTimestampRowsProps {
  created: string;
  modified: string | null;
}

defineProps<EntityViewTableTimestampRowsProps>();

const { t, d } = useI18n();
</script>
