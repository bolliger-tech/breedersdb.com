<template>
  <EntityViewTable :dense="dense">
    <EntityViewTableRow :label="t('entity.commonColumns.name')">
      {{ crossing.name }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('crossings.fields.motherCultivar')">
      <RouterLink
        :to="`/cultivars/${crossing.mother_cultivar?.id}`"
        class="undecorated-link"
      >
        {{ crossing.mother_cultivar?.display_name }}
      </RouterLink>
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('crossings.fields.fatherCultivar')">
      <RouterLink
        :to="`/cultivars/${crossing.father_cultivar?.id}`"
        class="undecorated-link"
      >
        {{ crossing.father_cultivar?.display_name }}
      </RouterLink>
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('entity.commonColumns.note')" multiline>
      {{ crossing.note }}
    </EntityViewTableRow>
    <EntityViewTableMetaData
      :id="crossing.id"
      :created="crossing.created"
      :modified="crossing.modified"
    />
  </EntityViewTable>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { type CrossingFragment } from './crossingFragment';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import EntityViewTableMetaData from 'src/components/Entity/View/EntityViewTableMetaData.vue';

export interface CrossingEntityTableProps {
  crossing: CrossingFragment & {
    mother_cultivar?: {
      id: number;
      display_name: string;
    } | null;
    father_cultivar?: {
      id: number;
      display_name: string;
    } | null;
  };
  dense?: boolean | undefined;
}

defineProps<CrossingEntityTableProps>();

const { t } = useI18n();
</script>
