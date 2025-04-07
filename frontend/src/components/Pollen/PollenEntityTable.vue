<template>
  <EntityViewTable :dense="dense">
    <EntityViewTableRow :label="t('entity.commonColumns.name')">
      {{ pollen.name }}
    </EntityViewTableRow>
    <EntityViewTableRow
      v-if="pollen.cultivar"
      :label="t('cultivars.title', 1)"
      render-empty
    >
      <EntityName
        :cultivar="pollen.cultivar"
        :lot="pollen.cultivar.lot"
        :crossing="pollen.cultivar.lot?.crossing"
      />
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('pollen.fields.dateHarvested')">
      {{ pollen.date_harvested ? d(pollen.date_harvested, 'Ymd') : '' }}
    </EntityViewTableRow>
    <EntityTableViewTimestampRows
      :created="pollen.created"
      :modified="pollen.modified"
    />
    <EntityViewTableRow :label="t('entity.commonColumns.note')" multiline>
      {{ pollen.note }}
    </EntityViewTableRow>
  </EntityViewTable>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { type PollenFragment } from './pollenFragment';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import EntityTableViewTimestampRows from 'src/components/Entity/View/EntityViewTableTimestampRows.vue';
import EntityName from 'src/components/Entity/EntityName.vue';

export interface PollenEntityTableProps {
  pollen: PollenFragment;
  dense?: boolean | undefined;
}

defineProps<PollenEntityTableProps>();

const { t, d } = useI18n();
</script>
