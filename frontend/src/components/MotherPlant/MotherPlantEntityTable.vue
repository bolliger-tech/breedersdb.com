<template>
  <EntityViewTable :dense="dense">
    <EntityViewTableRow :label="t('entity.commonColumns.name')">
      {{ motherPlant.name }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('motherPlants.fields.crossing')">
      <RouterLink
        :to="`/crossings/${motherPlant.crossing?.id}`"
        class="undecorated-link"
      >
        {{ motherPlant.crossing?.name }}
      </RouterLink>
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('motherPlants.fields.plant')">
      <RouterLink
        :to="`/plants/${motherPlant.plant?.id}`"
        class="undecorated-link"
      >
        {{ motherPlant.plant?.label_id }}
      </RouterLink>
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('motherPlants.fields.dateImpregnated')">
      {{
        motherPlant.date_impregnated
          ? d(motherPlant.date_impregnated, 'Ymd')
          : ''
      }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('motherPlants.fields.pollen')">
      <RouterLink
        v-if="motherPlant.pollen"
        :to="`/pollen/${motherPlant.pollen?.id}`"
        class="undecorated-link"
      >
        {{ motherPlant.pollen?.name }}
      </RouterLink>
      <span v-else class="text-body2 text-italic">{{
        t('base.notAvailable')
      }}</span>
    </EntityViewTableRow>
    <EntityViewTableRow
      v-if="typeof motherPlant.numb_flowers === 'number'"
      :label="t('motherPlants.fields.numbFlowers')"
    >
      {{ n(motherPlant.numb_flowers) }}
    </EntityViewTableRow>
    <EntityViewTableRow
      v-if="typeof motherPlant.numb_fruits === 'number'"
      :label="t('motherPlants.fields.numbFruits')"
    >
      {{ n(motherPlant.numb_fruits) }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('motherPlants.fields.dateFruitsHarvested')">
      {{
        motherPlant.date_fruits_harvested
          ? d(motherPlant.date_fruits_harvested, 'Ymd')
          : ''
      }}
    </EntityViewTableRow>
    <EntityViewTableRow
      v-if="typeof motherPlant.numb_seeds === 'number'"
      :label="t('motherPlants.fields.numbSeeds')"
    >
      {{ n(motherPlant.numb_seeds) }}
    </EntityViewTableRow>
    <EntityTableViewTimestampRows
      :created="motherPlant.created"
      :modified="motherPlant.modified"
    />
    <EntityViewTableRow :label="t('entity.commonColumns.note')" multiline>
      {{ motherPlant.note }}
    </EntityViewTableRow>
  </EntityViewTable>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { type MotherPlantFragment } from './motherPlantFragment';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import EntityTableViewTimestampRows from 'src/components/Entity/View/EntityViewTableTimestampRows.vue';

export interface MotherPlantEntityTableProps {
  motherPlant: MotherPlantFragment;
  dense?: boolean | undefined;
}

defineProps<MotherPlantEntityTableProps>();

const { t, d, n } = useI18n();
</script>
