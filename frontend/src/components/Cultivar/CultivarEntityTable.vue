<template>
  <EntityViewTable :dense="dense">
    <template v-if="cultivar.name_override">
      <EntityViewTableRow
        v-if="!cultivar.is_variety"
        :label="t('entity.commonColumns.fullName')"
      >
        {{ cultivar.full_name }}
      </EntityViewTableRow>
      <EntityViewTableRow
        :label="t('entity.commonColumns.explicitDisplayName')"
      >
        {{ cultivar.display_name }}
      </EntityViewTableRow>
    </template>
    <EntityViewTableRow
      v-if="!cultivar.is_variety"
      :label="t('lots.title', 1)"
      render-empty
    >
      <EntityName :lot="cultivar.lot" :crossing="cultivar.lot?.crossing" />
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('cultivars.fields.acronym')">
      {{ cultivar.acronym }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('cultivars.fields.breeder')">
      {{ cultivar.breeder }}
    </EntityViewTableRow>
    <EntityTableViewTimestampRows
      :created="cultivar.created"
      :modified="cultivar.modified"
    />
    <EntityViewTableRow v-if="cultivar.note">
      <strong>{{ t('entity.commonColumns.note') }}</strong>
      <br />
      <span style="white-space: pre-line">{{ cultivar.note }}</span>
    </EntityViewTableRow>
  </EntityViewTable>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { type CultivarFragment } from './cultivarFragment';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import EntityName from 'src/components/Entity/EntityName.vue';
import EntityTableViewTimestampRows from 'src/components/Entity/View/EntityViewTableTimestampRows.vue';

export interface CultivarEntityTableProps {
  cultivar: CultivarFragment;
  dense?: boolean;
}

defineProps<CultivarEntityTableProps>();

const { t } = useI18n();
</script>
