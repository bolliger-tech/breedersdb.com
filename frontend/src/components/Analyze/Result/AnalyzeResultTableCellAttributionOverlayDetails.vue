<template>
  <div class="result-table-cell-attribution-overlay-details">
    <div v-if="'TEXT' === data.data_type">
      {{ data.text_value }}
      <q-separator v-if="!data.photo_note" class="q-my-sm" dark />
    </div>

    <div
      v-if="data.photo_note || ('PHOTO' === data.data_type && data.text_value)"
      class="row justify-center bg-black"
      style="min-height: 200px"
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
        <EntityCard :plant-group="data.plant.plant_group" entity-type="plant">
          <template #title>
            <RouterLink
              :to="`/plants/${data.plant.id}`"
              class="link block text-h2"
            >
              <EntityLabelId
                entity-type="plant"
                :label-id="data.plant.label_id"
              />
            </RouterLink>
          </template>
          <template #subtitle>
            <EntityName
              :plant-group="data.plant.plant_group"
              :cultivar="data.plant.plant_group?.cultivar"
              :lot="data.plant.plant_group?.cultivar?.lot"
              :crossing="data.plant.plant_group?.cultivar?.lot?.crossing"
            />
          </template>
        </EntityCard>
      </div>
      <div class="q-mt-sm text-body2">
        <PlantEntityTable :plant="data.plant" dense />
      </div>
    </template>

    <template v-else-if="data.plant_group">
      <div class="row no-wrap items-center text-body2 q-pt-xs">
        <EntityCard :plant-group="data.plant_group" entity-type="plantGroup">
          <template #title>
            <div class="text-h3">
              <EntityName
                :plant-group="data.plant_group"
                :cultivar="data.plant_group.cultivar"
                :lot="data.plant_group.cultivar?.lot"
                :crossing="data.plant_group.cultivar?.lot?.crossing"
              />
            </div>
          </template>
          <template #subtitle><div></div></template>
        </EntityCard>
      </div>
      <div class="q-mt-sm text-body2">
        <PlantGroupEntityTable :plant-group="data.plant_group" dense />
      </div>
    </template>

    <template v-else-if="data.cultivar">
      <div class="row no-wrap items-center text-body2 q-pt-xs">
        <EntityCard :cultivar="data.cultivar" entity-type="cultivar">
          <template #title>
            <div class="text-h3">
              <EntityName
                :cultivar="data.cultivar"
                :lot="data.cultivar.lot"
                :crossing="data.cultivar.lot?.crossing"
              />
            </div>
          </template>
          <template #subtitle><div></div></template>
        </EntityCard>
      </div>
      <div class="q-mt-sm text-body2">
        <CultivarEntityTable :cultivar="data.cultivar" dense />
      </div>
    </template>

    <template v-else-if="data.lot">
      <div class="row no-wrap items-center text-body2 q-pt-xs">
        <EntityCard :lot="data.lot" entity-type="lot">
          <template #title>
            <div class="text-h3">
              <EntityName :lot="data.lot" :crossing="data.lot.crossing" />
            </div>
          </template>
          <template #subtitle><div></div></template>
        </EntityCard>
      </div>
      <div class="q-mt-sm text-body2">
        <LotEntityTable :lot="data.lot" dense />
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import EntityLabelId from 'src/components/Entity/EntityLabelId.vue';
import { AttributionDetails } from './AnalyzeResultTableCellAttributionOverlay.vue';
import PlantEntityTable from 'src/components/Plant/PlantEntityTable.vue';
import PlantGroupEntityTable from 'src/components/PlantGroup/PlantGroupEntityTable.vue';
import CultivarEntityTable from 'src/components/Cultivar/CultivarEntityTable.vue';
import LotEntityTable from 'src/components/Lot/LotEntityTable.vue';
import { localizeDate } from 'src/utils/dateUtils';
import EntityName from 'src/components/Entity/EntityName.vue';
import EntityCard from 'src/components/Entity/EntityCard.vue';
import EntityViewAttributionImage from 'src/components/Entity/View/EntityViewAttributionImage.vue';

export interface AnalyzeResultTableCellAttributionOverlayDetailsProps {
  data: AttributionDetails;
}

defineProps<AnalyzeResultTableCellAttributionOverlayDetailsProps>();
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
:global(.result-table-cell-attribution-overlay-details .undecorated-link) {
  color: #fff;
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, currentColor 25%, transparent);
}
.link:hover,
:global(.result-table-cell-attribution-overlay-details a:hover) {
  color: var(--bdb-primary-100);
}

img {
  max-width: 100%;
  height: 100%;
}
</style>
