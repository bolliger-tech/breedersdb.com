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
      {{ localizeDate(lot.date_sowed) }}
    </EntityViewTableRow>
    <EntityViewTableRow
      v-if="lot.numb_seeds_sowed !== null"
      :label="t('lots.fields.numbSeedsSowed')"
    >
      {{ n(lot.numb_seeds_sowed) }}
    </EntityViewTableRow>
    <EntityViewTableRow
      v-if="lot.numb_seedlings_grown !== null"
      :label="t('lots.fields.numbSeedlingsGrown')"
    >
      {{ n(lot.numb_seedlings_grown) }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('lots.fields.seedTray')">
      {{ lot.seed_tray }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('lots.fields.datePlanted')">
      {{ localizeDate(lot.date_planted) }}
    </EntityViewTableRow>
    <EntityViewTableRow
      v-if="lot.numb_seedlings_planted !== null"
      :label="t('lots.fields.numbSeedlingsPlanted')"
    >
      {{ n(lot.numb_seedlings_planted) }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('lots.fields.plot')">
      {{ lot.plot }}
    </EntityViewTableRow>
    <EntityViewTableRow v-if="lot.orchard" :label="t('lots.fields.orchard')">
      <RouterLink :to="`/orchards/${lot.orchard.id}`" class="undecorated-link">
        {{ lot.orchard.name }}
      </RouterLink>
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('entity.commonColumns.created')">
      {{ d(lot.created, 'ymdHis') }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('entity.commonColumns.modified')">
      {{ lot.modified ? d(lot.modified, 'ymdHis') : t('base.notAvailable') }}
    </EntityViewTableRow>
    <EntityViewTableRow v-if="lot.note">
      <strong>{{ t('entity.commonColumns.note') }}</strong>
      <br />
      <span style="white-space: pre-line">{{ lot.note }}</span>
    </EntityViewTableRow>
  </EntityViewTable>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { localizeDate } from 'src/utils/dateUtils';
import { type LotFragment } from './lotFragment';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';

export interface LotEntityTableProps {
  lot: LotFragment;
  dense?: boolean;
}

defineProps<LotEntityTableProps>();

const { t, n, d } = useI18n();
</script>
