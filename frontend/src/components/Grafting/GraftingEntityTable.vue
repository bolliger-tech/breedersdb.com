<template>
  <EntityViewTable :dense="dense">
    <EntityViewTableRow :label="t('entity.commonColumns.name')">
      {{ grafting.name }}
    </EntityViewTableRow>
    <EntityViewTableMetaData
      :id="grafting.id"
      :created="grafting.created"
      :modified="grafting.modified"
    />
  </EntityViewTable>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { type GraftingFragment } from './graftingFragment';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import EntityViewTableMetaData from 'src/components/Entity/View/EntityViewTableMetaData.vue';

export interface GraftingEntityTableProps {
  grafting: GraftingFragment;
  dense?: boolean | undefined;
}

defineProps<GraftingEntityTableProps>();

const { t } = useI18n();
</script>
