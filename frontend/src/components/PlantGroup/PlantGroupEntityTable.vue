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
    <EntityTableViewTimestampRows
      v-if="plantGroup.created && plantGroup.modified"
      :created="plantGroup.created"
      :modified="plantGroup.modified"
    />
    <EntityViewTableRow :label="t('entity.commonColumns.note')" multiline>
      {{ plantGroup.note }}
    </EntityViewTableRow>
  </EntityViewTable>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { type PlantGroupFragment } from './plantGroupFragment';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import EntityName from 'src/components/Entity/EntityName.vue';
import EntityTableViewTimestampRows from 'src/components/Entity/View/EntityViewTableTimestampRows.vue';
import type { PartialWithUndefined } from 'src/utils/typescriptUtils';

export interface PlantGroupEntityTableProps {
  plantGroup: PartialWithUndefined<PlantGroupFragment>;
  dense?: boolean | undefined;
}

defineProps<PlantGroupEntityTableProps>();

const { t } = useI18n();
</script>
