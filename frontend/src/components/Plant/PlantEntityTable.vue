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
      <EntityViewTableRow :label="t('plants.fields.distancePlantRowStart')">
        {{ plant.distance_plant_row_start }}
      </EntityViewTableRow>
    </template>
    <EntityViewTableRow :label="t('plants.fields.dateGrafted')">
      {{ localizeDate(plant.date_grafted) }}
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
      {{ localizeDate(plant.date_labeled) }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('plants.fields.datePlanted')">
      {{ localizeDate(plant.date_planted) }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('plants.fields.dateEliminated')">
      {{ localizeDate(plant.date_eliminated) }}
    </EntityViewTableRow>
    <EntityTableViewTimestampRows
      :created="plant.created"
      :modified="plant.modified"
    />
    <EntityViewTableRow v-if="plant.note">
      <strong>{{ t('entity.commonColumns.note') }}</strong>
      <br />
      <span style="white-space: pre-line">{{ plant.note }}</span>
    </EntityViewTableRow>
  </EntityViewTable>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { localizeDate } from 'src/utils/dateUtils';
import { type PlantFragment } from './plantFragment';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import EntityTableViewTimestampRows from 'src/components/Entity/View/EntityViewTableTimestampRows.vue';

export interface PlantEntityTableProps {
  plant: PlantFragment;
  dense?: boolean;
}

defineProps<PlantEntityTableProps>();

const { t } = useI18n();
</script>
