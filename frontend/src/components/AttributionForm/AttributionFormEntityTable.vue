<template>
  <EntityViewTable :dense="dense">
    <EntityViewTableRow :label="t('entity.commonColumns.name')">
      {{ attributionForm.name }}
    </EntityViewTableRow>
    <EntityViewTableRow
      v-if="attributionForm.description"
      :label="t('attributionForms.columns.description')"
      multiline
    >
      {{ attributionForm.description }}
    </EntityViewTableRow>
    <EntityTableViewTimestampRows
      :created="attributionForm.created"
      :modified="attributionForm.modified"
    />
  </EntityViewTable>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { type AttributionFormFragment } from './attributionFormFragment';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import EntityTableViewTimestampRows from 'src/components/Entity/View/EntityViewTableTimestampRows.vue';

export interface AttributionFormEntityTableProps {
  attributionForm: AttributionFormFragment;
  dense?: boolean | undefined;
}

defineProps<AttributionFormEntityTableProps>();

const { t } = useI18n();
</script>
