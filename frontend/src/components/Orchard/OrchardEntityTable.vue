<template>
  <EntityViewTable :dense="dense">
    <EntityViewTableRow :label="t('entity.commonColumns.name')">
      {{ orchard.name }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('entity.commonColumns.disabled')">
      {{ orchard.disabled ? '✓' : '' }}
    </EntityViewTableRow>
    <EntityTableViewTimestampRows
      :created="orchard.created"
      :modified="orchard.modified"
    />
  </EntityViewTable>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { type OrchardFragment } from './orchardFragment';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import EntityTableViewTimestampRows from 'src/components/Entity/View/EntityViewTableTimestampRows.vue';

export interface OrchardEntityTableProps {
  orchard: OrchardFragment;
  dense?: boolean | undefined;
}

defineProps<OrchardEntityTableProps>();

const { t } = useI18n();
</script>
