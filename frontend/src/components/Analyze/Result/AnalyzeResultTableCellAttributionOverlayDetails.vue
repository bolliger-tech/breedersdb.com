<template>
  <div
    v-if="data.photo_note || ('PHOTO' === data.data_type && data.text_value)"
    class="row justify-center bg-black rounded-borders q-mb-md"
    style="min-height: 200px"
  >
    <EntityViewAttributionImage
      :file-name="(data.photo_note || data.text_value)!"
      :attribution="data"
      preview
      :preview-width="282"
    />
  </div>

  <div
    v-if="data.text_note"
    class="pre-line q-pa-sm rounded-borders row no-wrap q-mb-lg"
    :class="$q.dark.isActive ? 'bg-grey-8' : 'bg-grey-3'"
  >
    <q-icon name="chat_bubble_outline" class="text-grey-6 q-pr-sm" size="sm" />
    <p class="q-ma-none text-body2">{{ data.text_note }}</p>
  </div>

  <div
    class="row align-center"
    :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-8'"
  >
    <BaseSpriteIcon name="star" size="xs" />
    <span class="q-ml-sm q-my-none text-overline">
      {{ t('analyze.result.about.attribution') }}
    </span>
  </div>

  <EntityViewTable dense no-hover class="text-body2 q-mb-lg">
    <EntityViewTableRow :label="t('attributions.columns.dateAttributed')">
      {{ d(data.date_attributed, 'Ymd') }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('attributions.columns.author')">
      {{ data.author }}
    </EntityViewTableRow>
    <EntityViewTableRow
      :label="t('attributions.columns.exceptionalAttribution')"
    >
      {{ data.exceptional_attribution ? '✓' : '' }}
    </EntityViewTableRow>
    <EntityViewTableRow :label="t('attributionForms.title', 1)">
      <RouterLink
        v-if="data.attribution_form"
        :to="`/attribution-forms/${data.attribution_form.id}`"
        class="undecorated-link"
      >
        {{ data.attribution_form.name }}
      </RouterLink>
    </EntityViewTableRow>
    <EntityTableViewTimestampRows
      v-if="data.created && data.modified"
      :created="data.created"
      :modified="data.modified"
    />
  </EntityViewTable>

  <div
    class="row align-center"
    :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-7'"
  >
    <BaseSpriteIcon :name="icon" size="xs" />
    <span class="q-ml-sm q-my-none text-overline">{{ about }}</span>
  </div>

  <div class="text-body2">
    <PlantEntityTable v-if="data.plant" :plant="data.plant" dense no-hover />
    <PlantGroupEntityTable
      v-else-if="data.plant_group"
      :plant-group="data.plant_group"
      dense
      no-hover
    />
    <CultivarEntityTable
      v-else-if="data.cultivar"
      :cultivar="data.cultivar"
      dense
      no-hover
    />
    <LotEntityTable v-else-if="data.lot" :lot="data.lot" dense no-hover />
  </div>
</template>

<script lang="ts" setup>
import { AttributionDetails } from './AnalyzeResultTableCellAttributionOverlay.vue';
import { useI18n } from 'src/composables/useI18n';
import BaseSpriteIcon from 'src/components/Base/BaseSpriteIcon/BaseSpriteIcon.vue';
import { type BaseSpriteIconProps } from 'components/Base/BaseSpriteIcon/baseSpriteIconProps';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import EntityTableViewTimestampRows from 'src/components/Entity/View/EntityViewTableTimestampRows.vue';
import EntityViewAttributionImage from 'src/components/Entity/View/EntityViewAttributionImage.vue';
import PlantEntityTable from 'src/components/Plant/PlantEntityTable.vue';
import PlantGroupEntityTable from 'src/components/PlantGroup/PlantGroupEntityTable.vue';
import CultivarEntityTable from 'src/components/Cultivar/CultivarEntityTable.vue';
import LotEntityTable from 'src/components/Lot/LotEntityTable.vue';
import { computed } from 'vue';

export interface AnalyzeResultTableCellAttributionOverlayDetailsProps {
  data: AttributionDetails;
}

const props =
  defineProps<AnalyzeResultTableCellAttributionOverlayDetailsProps>();

const icon = computed<BaseSpriteIconProps['name']>(() => {
  if (props.data.plant) return 'tree';
  if (props.data.plant_group) return 'tree-group';
  if (props.data.cultivar) return 'cultivar';
  if (props.data.lot) return 'lot';
  throw new Error('Unknown attribution type');
});

const about = computed<string>(() => {
  if (props.data.plant) return t('analyze.result.about.plant');
  if (props.data.plant_group) return t('analyze.result.about.plantGroup');
  if (props.data.cultivar) return t('analyze.result.about.cultivar');
  if (props.data.lot) return t('analyze.result.about.lot');
  throw new Error('Unknown attribution type');
});

const { t, d } = useI18n();
</script>
