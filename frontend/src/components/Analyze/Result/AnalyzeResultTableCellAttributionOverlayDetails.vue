<template>
  <div v-if="'TEXT' === data.data_type">
    {{ data.text_value }}
    <q-separator v-if="!data.photo_note" class="q-my-sm" dark />
  </div>

  <div
    v-if="data.photo_note || ('PHOTO' === data.data_type && data.text_value)"
    class="row justify-center bg-black"
  >
    <EntityViewAttributionImage
      :file-name="(data.photo_note || data.text_value)!"
      :attribution="data"
      preview
      :preview-width="282"
    />
  </div>

  <template v-if="data.text_note">
    <div class="text-body2" style="white-space: pre-line">
      {{ data.text_note }}
    </div>
    <q-separator class="q-my-sm" dark />
  </template>

  <div class="text-body2 row justify-between">
    <div>
      <q-icon name="person" class="text-grey-7" />&nbsp;{{ data.author }}
    </div>
    <div>
      <q-icon name="today" class="text-grey-7" />&nbsp;{{
        localizeDate(data.date_attributed)
      }}
    </div>
  </div>

  <q-separator class="q-my-sm" dark />

  <template v-if="data.plant">
    <div class="row no-wrap items-center text-body2 q-pt-xs">
      <PlantCard :plant-group="data.plant.plant_group">
        <template #title>
          <RouterLink
            :to="`/plants/${data.plant.id}`"
            class="link block text-h2"
          >
            <PlantLabelId :label-id="data.plant.label_id" />
          </RouterLink>
        </template>
        <template #subtitle>
          <EntityName
            :plant-group="data.plant.plant_group"
            :cultivar="data.plant.plant_group?.cultivar"
            :lot="data.plant.plant_group?.cultivar.lot"
            :crossing="data.plant.plant_group?.cultivar.lot.crossing"
          />
        </template>
      </PlantCard>
    </div>
    <div class="q-mt-sm text-body2">
      <PlantEntityTable :plant="data.plant" dense no-hover />
    </div>
  </template>

  <!-- TODO: add plant_group -->

  <template v-else-if="data.cultivar">
    <div class="row no-wrap items-center text-body2 q-pt-xs">
      <BaseSpriteIcon name="cultivar" color="grey-7" size="lg" />
      <RouterLink :to="`/cultivars/${data.cultivar.id}`" class="link q-ml-sm">
        {{ data.cultivar.display_name }}
      </RouterLink>
    </div>
    <!-- TODO: replace with CultivarEntityTable -->
    <table style="width: 100%" class="text-body2">
      <tr v-if="data.cultivar.acronym">
        <th>{{ t('cultivars.fields.acronym') }}</th>
        <td>{{ data.cultivar.acronym }}</td>
      </tr>
      <tr v-if="data.cultivar.breeder">
        <th>{{ t('cultivars.fields.breeder') }}</th>
        <td>{{ data.cultivar.breeder }}</td>
      </tr>
    </table>
    <div v-if="data.cultivar.note" class="q-mt-sm text-body2">
      <strong>{{ t('entity.commonColumns.note') }}</strong
      ><br />
      <span style="white-space: pre-line">{{ data.cultivar.note }}</span>
    </div>
  </template>

  <template v-else-if="data.lot">
    <div class="row no-wrap items-center text-body2 q-pt-xs">
      <BaseSpriteIcon name="lot" color="grey-7" size="lg" />
      <RouterLink :to="`/lots/${data.lot.id}`" class="link q-ml-sm">
        {{ data.lot.display_name }}
      </RouterLink>
    </div>
    <!-- TODO: replace with LotEntityTable -->
    <table style="width: 100%" class="text-body2">
      <tr v-if="data.lot.date_sowed">
        <th>{{ t('lots.fields.dateSowed') }}</th>
        <td>{{ localizeDate(data.lot.date_sowed) }}</td>
      </tr>
      <tr v-if="data.lot.numb_seeds_sowed">
        <th>{{ t('lots.fields.numbSeedsSowed') }}</th>
        <td>{{ data.lot.numb_seeds_sowed }}</td>
      </tr>
      <tr v-if="data.lot.numb_seedlings_grown">
        <th>{{ t('lots.fields.numbSeedlingsGrown') }}</th>
        <td>{{ data.lot.numb_seedlings_grown }}</td>
      </tr>
      <tr v-if="data.lot.seed_tray">
        <th>{{ t('lots.fields.seedTray') }}</th>
        <td>{{ data.lot.seed_tray }}</td>
      </tr>
      <tr v-if="data.lot.date_planted">
        <th>{{ t('lots.fields.datePlanted') }}</th>
        <td>{{ localizeDate(data.lot.date_planted) }}</td>
      </tr>
      <tr v-if="data.lot.numb_seedlings_planted">
        <th>{{ t('lots.fields.numbSeedlingsPlanted') }}</th>
        <td>{{ data.lot.numb_seedlings_planted }}</td>
      </tr>
      <tr v-if="data.lot.plot">
        <th>{{ t('lots.fields.plot') }}</th>
        <td>{{ data.lot.plot }}</td>
      </tr>
    </table>
    <div v-if="data.lot.note" class="q-mt-sm text-body2">
      <strong>{{ t('entity.commonColumns.note') }}</strong
      ><br />
      <span style="white-space: pre-line">{{ data.lot.note }}</span>
    </div>
  </template>
</template>

<script lang="ts" setup>
import BaseSpriteIcon from 'src/components/Base/BaseSpriteIcon/BaseSpriteIcon.vue';
import PlantLabelId from 'src/components/Plant/PlantLabelId.vue';
import { useI18n } from 'src/composables/useI18n';
import { AttributionDetails } from './AnalyzeResultTableCellAttributionOverlay.vue';
import PlantEntityTable from 'src/components/Plant/PlantEntityTable.vue';
import { localizeDate } from 'src/utils/dateUtils';
import EntityName from 'src/components/Entity/EntityName.vue';
import PlantCard from 'src/components/Plant/PlantCard.vue';
import EntityViewAttributionImage from 'src/components/Entity/View/EntityViewAttributionImage.vue';

export interface AnalyzeResultTableCellAttributionOverlayDetailsProps {
  data: AttributionDetails;
}

defineProps<AnalyzeResultTableCellAttributionOverlayDetailsProps>();

const { t } = useI18n();
</script>

<style lang="scss" scoped>
table:has(tr) {
  margin-top: 1em;
  border-spacing: 0;
}

tr {
  white-space: nowrap;
  line-height: 1.3em;
}

th {
  text-align: left;
  padding-right: 1em;
  padding-left: 0;
  font-weight: bold;
}

td {
  text-align: right;
  padding-left: 1em;
  padding-right: 0;
}

.photo-block {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
}

.photo-wrapper {
  background: black;
  height: 200px;
  width: 100%;
  text-align: center;
}

.link,
:global(.undecorated-link) {
  color: #fff;
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, currentColor 25%, transparent);
}
.link:hover,
:global(a:hover) {
  color: var(--bdb-primary-100);
}

img {
  max-width: 100%;
  height: 100%;
}
</style>
