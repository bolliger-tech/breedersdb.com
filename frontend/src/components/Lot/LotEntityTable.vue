<template>
  <EntityViewTable :dense="dense">
    <template v-if="!lot.is_variety && lot.name_override">
      <EntityViewTableRow :label="t('entity.commonColumns.fullName')">
        {{ lot.full_name }}
      </EntityViewTableRow>
      <EntityViewTableRow
        :label="t('entity.commonColumns.explicitDisplayName')"
      >
        {{ lot.display_name }}
      </EntityViewTableRow>
    </template>
    <EntityViewTableRow v-if="lot.crossing" :label="t('lots.fields.crossing')">
      <RouterLink
        :to="`/crossings/${lot.crossing.id}`"
        class="undecorated-link"
      >
        {{ lot.crossing.name }}
      </RouterLink>
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('lots.fields.dateSowed')">
      {{ lot.date_sowed ? d(lot.date_sowed, 'Ymd') : '' }}
    </EntityViewTableRow>
    <EntityViewTableRow
      v-if="typeof lot.numb_seeds_sowed === 'number'"
      :label="t('lots.fields.numbSeedsSowed')"
    >
      {{ n(lot.numb_seeds_sowed) }}
    </EntityViewTableRow>
    <EntityViewTableRow
      v-if="typeof lot.numb_seedlings_grown === 'number'"
      :label="t('lots.fields.numbSeedlingsGrown')"
    >
      {{ n(lot.numb_seedlings_grown) }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('lots.fields.seedTray')" multiline>
      {{ lot.seed_tray }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('lots.fields.datePlanted')">
      {{ lot.date_planted ? d(lot.date_planted, 'Ymd') : '' }}
    </EntityViewTableRow>
    <EntityViewTableRow
      v-if="typeof lot.numb_seedlings_planted === 'number'"
      :label="t('lots.fields.numbSeedlingsPlanted')"
    >
      {{ n(lot.numb_seedlings_planted) }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('lots.fields.plot')" multiline>
      {{ lot.plot }}
    </EntityViewTableRow>
    <EntityViewTableRow v-if="lot.orchard" :label="t('lots.fields.orchard')">
      <RouterLink :to="`/orchards/${lot.orchard.id}`" class="undecorated-link">
        {{ lot.orchard.name }}
      </RouterLink>
    </EntityViewTableRow>
    <EntityTableViewTimestampRows
      v-if="lot.created && lot.modified"
      :created="lot.created"
      :modified="lot.modified"
    />
    <EntityViewTableRow :label="t('entity.commonColumns.note')" multiline>
      {{ lot.note }}
    </EntityViewTableRow>
  </EntityViewTable>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { type LotFragment } from './lotFragment';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import EntityTableViewTimestampRows from 'src/components/Entity/View/EntityViewTableTimestampRows.vue';
import type { PartialWithUndefined } from 'src/utils/typescriptUtils';

export interface LotEntityTableProps {
  lot: PartialWithUndefined<LotFragment>;
  dense?: boolean;
}

defineProps<LotEntityTableProps>();

const { t, n, d } = useI18n();
</script>
