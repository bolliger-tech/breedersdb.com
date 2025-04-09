<template>
  <EntityViewTable :dense="dense">
    <EntityViewTableRow :label="t('entity.commonColumns.name')">
      {{ plantRow.name }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('plantRows.fields.orchard')">
      <RouterLink
        :to="`/orchards/${plantRow.orchard.id}`"
        class="undecorated-link"
      >
        {{ plantRow.orchard.name }}
      </RouterLink>
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('plantRows.fields.dateCreated')">
      {{ plantRow.date_created ? d(plantRow.date_created, 'Ymd') : '' }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('entity.commonColumns.dateDisabled')">
      {{ plantRow.date_eliminated ? d(plantRow.date_eliminated, 'Ymd') : '' }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('entity.commonColumns.note')" multiline>
      {{ plantRow.note }}
    </EntityViewTableRow>
    <EntityViewTableMetaData
      :id="plantRow.id"
      :created="plantRow.created"
      :modified="plantRow.modified"
    />
  </EntityViewTable>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { type PlantRowFragment } from './plantRowFragment';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import EntityViewTableMetaData from 'src/components/Entity/View/EntityViewTableMetaData.vue';

export interface PlantRowEntityTableProps {
  plantRow: PlantRowFragment & {
    note: string | null;
  };
  dense?: boolean | undefined;
}

defineProps<PlantRowEntityTableProps>();

const { t, d } = useI18n();
</script>
