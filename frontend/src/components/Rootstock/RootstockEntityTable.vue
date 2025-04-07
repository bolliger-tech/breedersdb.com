<template>
  <EntityViewTable :dense="dense">
    <EntityViewTableRow :label="t('entity.commonColumns.name')">
      {{ rootstock.name }}
    </EntityViewTableRow>
    <EntityTableViewTimestampRows
      :created="rootstock.created"
      :modified="rootstock.modified"
    />
  </EntityViewTable>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { type RootstockFragment } from './rootstockFragment';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import EntityTableViewTimestampRows from 'src/components/Entity/View/EntityViewTableTimestampRows.vue';

export interface RootstockEntityTableProps {
  rootstock: RootstockFragment;
  dense?: boolean | undefined;
}

defineProps<RootstockEntityTableProps>();

const { t } = useI18n();
</script>
