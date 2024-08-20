<template>
  <EntityViewTable :dense="dense">
    <EntityViewTableRow :label="t('plantGroups.fields.labelId')">
      {{ plantGroup.label_id }}
    </EntityViewTableRow>
    <template v-if="plantGroup.name_override">
      <EntityViewTableRow :label="t('entity.commonColumns.fullName')">
        {{ plantGroup.full_name }}
      </EntityViewTableRow>
      <EntityViewTableRow
        :label="t('entity.commonColumns.explicitDisplayName')"
      >
        {{ plantGroup.display_name }}
      </EntityViewTableRow>
    </template>
    <EntityViewTableRow :label="t('cultivars.title', 1)" render-empty>
      <EntityName
        :cultivar="plantGroup.cultivar"
        :lot="plantGroup.cultivar?.lot"
        :crossing="plantGroup.cultivar?.lot?.crossing"
      />
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('entity.commonColumns.disabled')">
      {{ plantGroup.disabled ? '✓' : '' }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('entity.commonColumns.created')">
      {{ d(plantGroup.created, 'ymdHis') }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('entity.commonColumns.modified')">
      {{
        plantGroup.modified
          ? d(plantGroup.modified, 'ymdHis')
          : t('base.notAvailable')
      }}
    </EntityViewTableRow>
    <EntityViewTableRow v-if="plantGroup.note">
      <strong>{{ t('entity.commonColumns.note') }}</strong>
      <br />
      <span style="white-space: pre-line">{{ plantGroup.note }}</span>
    </EntityViewTableRow>
  </EntityViewTable>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { type PlantGroupFragment } from './plantGroupFragment';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import EntityName from 'src/components/Entity/EntityName.vue';

export interface PlantGroupEntityTableProps {
  plantGroup: PlantGroupFragment;
  dense?: boolean;
}

defineProps<PlantGroupEntityTableProps>();

const { t, d } = useI18n();
</script>
