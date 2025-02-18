<template>
  <div class="q-mb-md">
    <div class="text-overline overline-color">
      {{ t('analyze.result.attributedEntity', { entity }) }}
    </div>
    <RouterLink class="q-pa-sm rounded-borders entity-card" :to="link">
      <EntityCard
        v-if="data.plant?.plant_group"
        :label-id="data.plant.label_id"
        :plant-group="data.plant.plant_group"
        entity-type="plant"
        font-size="1rem"
        icon-color="grey-6"
      />
      <EntityCard
        v-else-if="data.plant_group"
        :plant-group="data.plant_group"
        entity-type="plantGroup"
        font-size="1rem"
        icon-color="grey-6"
      />
      <EntityCard
        v-else-if="data.cultivar"
        :cultivar="data.cultivar"
        entity-type="cultivar"
        font-size="1rem"
        icon-color="grey-6"
      />
      <EntityCard
        v-else-if="data.lot"
        :lot="data.lot"
        entity-type="lot"
        font-size="1rem"
        icon-color="grey-6"
      />
    </RouterLink>
  </div>

  <div
    v-if="data.photo_note || ('PHOTO' === data.data_type && data.text_value)"
    class="q-mb-md"
  >
    <div class="text-overline overline-color">
      {{ t('analyze.result.photo') }}
    </div>
    <div
      class="row justify-center bg-black rounded-borders"
      style="min-height: 200px"
    >
      <EntityViewAttributionImage
        :file-name="(data.photo_note || data.text_value)!"
        :attribution="data"
        preview
        :preview-width="282"
      />
    </div>
  </div>

  <div v-if="data.text_note" class="q-mb-md">
    <div class="text-overline overline-color">
      {{ t('analyze.result.note') }}
    </div>
    <p class="q-ma-none text-body2">{{ data.text_note }}</p>
  </div>

  <RouterLink
    :to="`/attributions/${data.id}`"
    class="row align-center overline-color"
  >
    <BaseSpriteIcon name="star" size="xs" />
    <span class="q-ml-sm q-my-none text-overline">
      {{ t('analyze.result.about.attribution') }}
    </span>
  </RouterLink>

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

  <RouterLink :to="link" class="row align-center overline-color">
    <BaseSpriteIcon :name="icon" size="xs" />
    <span class="q-ml-sm q-my-none text-overline">{{ about }}</span>
  </RouterLink>

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
import EntityCard from 'src/components/Entity/EntityCard.vue';
import { RouterLink } from 'vue-router';

export interface AnalyzeResultTableCellAttributionOverlayDetailsProps {
  data: AttributionDetails;
}

const props =
  defineProps<AnalyzeResultTableCellAttributionOverlayDetailsProps>();

const link = computed<string>(() => {
  if (props.data.plant) return `/plants/${props.data.plant.id}`;
  if (props.data.plant_group) return `/groups/${props.data.plant_group.id}`;
  if (props.data.cultivar) return `/cultivars/${props.data.cultivar.id}`;
  if (props.data.lot) return `/lots/${props.data.lot.id}`;
  throw new Error('Unknown attribution type');
});

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

const entity = computed<string>(() => {
  if (props.data.plant) return t('base.entityName.plant', 1);
  if (props.data.plant_group) return t('base.entityName.plantGroup', 1);
  if (props.data.cultivar) return t('base.entityName.cultivar', 1);
  if (props.data.lot) return t('base.entityName.lot', 1);
  throw new Error('Unknown attribution type');
});

const { t, d } = useI18n();
</script>

<style lang="scss" scoped>
.entity-card {
  display: block;
  color: unset;
  text-decoration: none;

  background-color: $grey-3;
  .body--dark & {
    background-color: $grey-8;
  }

  transition: background-color 0.2s;

  &:hover,
  &:focus {
    background-color: color-mix(
      in srgb,
      var(--q-link-color-hover) 25%,
      transparent
    );
  }
}

.overline-color {
  color: $grey-8;
  .body--dark & {
    color: $grey-5;
  }
}

a.overline-color {
  text-decoration: none;
  transition: color 0.2s;

  &:hover,
  &:focus {
    color: var(--q-link-color-hover);
  }
}
</style>
