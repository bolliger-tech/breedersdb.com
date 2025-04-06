<template>
  <EntityViewTable :dense="dense">
    <template v-if="plant.plant_row">
      <EntityViewTableRow :label="t('orchards.title', 1)">
        <RouterLink
          :to="`/orchards/${plant.plant_row.orchard.id}`"
          class="undecorated-link"
        >
          {{ plant.plant_row.orchard.name }}
        </RouterLink>
      </EntityViewTableRow>
      <EntityViewTableRow :label="t('plantRows.title', 1)">
        <RouterLink
          :to="`/rows/${plant.plant_row.id}`"
          class="undecorated-link"
        >
          {{ plant.plant_row.name }}
        </RouterLink>
      </EntityViewTableRow>
      <EntityViewTableRow :label="t('plants.fields.serialInPlantRow')">
        {{ plant.serial_in_plant_row }}
      </EntityViewTableRow>
      <EntityViewTableRow
        v-if="typeof plant.distance_plant_row_start === 'number'"
        :label="t('plants.fields.distancePlantRowStart')"
      >
        {{ n(plant.distance_plant_row_start) }}
      </EntityViewTableRow>
    </template>
    <EntityViewTableRow :label="t('plants.fields.dateGrafted')">
      {{ plant.date_grafted ? d(plant.date_grafted, 'Ymd') : '' }}
    </EntityViewTableRow>
    <EntityViewTableRow
      v-if="plant.rootstock"
      :label="t('plants.fields.rootstock')"
    >
      <RouterLink
        :to="`/rootstocks/${plant.rootstock.id}`"
        class="undecorated-link"
      >
        {{ plant.rootstock?.name }}
      </RouterLink>
    </EntityViewTableRow>
    <EntityViewTableRow
      v-if="plant.grafting"
      :label="t('plants.fields.grafting')"
    >
      <RouterLink
        :to="`/graftings/${plant.grafting.id}`"
        class="undecorated-link"
      >
        {{ plant.grafting?.name }}
      </RouterLink>
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('plants.fields.dateLabeled')">
      {{ plant.date_labeled ? d(plant.date_labeled, 'Ymd') : '' }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('plants.fields.datePlanted')">
      {{ plant.date_planted ? d(plant.date_planted, 'Ymd') : '' }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('plants.fields.dateEliminated')">
      {{ plant.date_eliminated ? d(plant.date_eliminated, 'Ymd') : '' }}
    </EntityViewTableRow>
    <EntityTableViewTimestampRows
      v-if="plant.created && plant.modified"
      :created="plant.created"
      :modified="plant.modified"
    />
    <EntityViewTableRow :label="t('entity.commonColumns.note')" multiline>
      {{ plant.note }}
    </EntityViewTableRow>
  </EntityViewTable>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { type PlantFragment } from './plantFragment';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import EntityTableViewTimestampRows from 'src/components/Entity/View/EntityViewTableTimestampRows.vue';
import type { PartialWithUndefined } from 'src/utils/typescriptUtils';

export interface PlantEntityTableProps {
  plant: PartialWithUndefined<PlantFragment>;
  dense?: boolean | undefined;
}

defineProps<PlantEntityTableProps>();

const { t, d, n } = useI18n();
</script>
