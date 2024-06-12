<template>
  <div v-if="'TEXT' === data.data_type">
    {{ data.text_value }}
    <q-separator class="q-my-sm" dark />
  </div>

  <div v-if="'PHOTO' === data.data_type" class="photo-block">
    <div class="photo-wrapper">
      <a :href="`/photos/view/${data.text_value}`" target="_blank">
        <img
          :alt="
            t('result.altPhoto', {
              date: localizeDate(data.date_attributed),
              author: data.author,
            })
          "
          :src="`/photos/view/${data.text_value}?h=564`"
          class="photo"
        />
      </a>
    </div>
    <q-btn
      :href="`/photos/view/${data.text_value}`"
      :label="t('result.downloadPhoto')"
      download
      outline
      size="xs"
      type="a"
    />
  </div>

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

  <template v-if="data.tree">
    <div class="row no-wrap items-center text-body2 q-pt-xs">
      <BaseSpriteIcon name="tree" color="grey-7" size="lg" />
      <div class="q-ml-sm">
        <RouterLink :to="`/trees/${data.tree.id}`" class="link">
          <BaseLabelId :label-id="data.tree.label_id" />
        </RouterLink>
        <br />
        <RouterLink
          v-if="data.cultivar"
          :to="`/cultivars/${data.cultivar.id}`"
          class="link"
        >
          {{ data.tree.cultivar_name }}
        </RouterLink>
        <template v-else>
          {{ data.tree.cultivar_name }}
        </template>
      </div>
    </div>
    <table style="width: 100%" class="text-body2">
      <tr v-if="data.tree.date_planted">
        <th>{{ t('trees.fields.datePlanted') }}</th>
        <td>{{ localizeDate(data.tree.date_planted) }}</td>
      </tr>
      <tr v-if="data.tree.date_grafted">
        <th>{{ t('trees.fields.dateGrafted') }}</th>
        <td>{{ localizeDate(data.tree.date_grafted) }}</td>
      </tr>
      <tr v-if="data.tree.date_eliminated">
        <th>{{ t('trees.fields.dateEliminated') }}</th>
        <td>{{ localizeDate(data.tree.date_eliminated) }}</td>
      </tr>
      <template v-if="data.tree.plant_row">
        <tr>
          <th>{{ t('orchards.title', 1) }}</th>
          <td>{{ data.tree.plant_row.orchard.name }}</td>
        </tr>
        <tr>
          <th>{{ t('plantRows.title', 1) }}</th>
          <td>{{ data.tree.plant_row.name }}</td>
        </tr>
        <tr v-if="data.tree.serial_in_plant_row">
          <th>{{ t('trees.fields.serialInPlantRow') }}</th>
          <td>{{ data.tree.serial_in_plant_row }}</td>
        </tr>
        <tr v-if="data.tree.distance_plant_row_start">
          <th>{{ t('trees.fields.distancePlantRowStart') }}</th>
          <td>{{ data.tree.distance_plant_row_start }}</td>
        </tr>
      </template>
    </table>
    <div v-if="data.tree.note" class="q-mt-sm text-body2">
      <strong>{{ t('entity.note') }}</strong
      ><br />
      <span style="white-space: pre-line">{{ data.tree.note }}</span>
    </div>
  </template>

  <template v-else-if="data.cultivar">
    <div class="row no-wrap items-center text-body2 q-pt-xs">
      <BaseSpriteIcon name="cultivar" color="grey-7" size="lg" />
      <RouterLink :to="`/cultivars/${data.cultivar.id}`" class="link q-ml-sm">
        {{ data.cultivar.name }}
      </RouterLink>
    </div>
    <table style="width: 100%" class="text-body2">
      <tr v-if="data.cultivar.common_name">
        <th>{{ t('cultivars.fields.commonName') }}</th>
        <td>{{ data.cultivar.common_name }}</td>
      </tr>
      <tr v-if="data.cultivar.acronym">
        <th>{{ t('cultivars.fields.acronym') }}</th>
        <td>{{ data.cultivar.acronym }}</td>
      </tr>
      <tr v-if="data.cultivar.breeder">
        <th>{{ t('cultivars.fields.breeder') }}</th>
        <td>{{ data.cultivar.breeder }}</td>
      </tr>
      <tr v-if="data.cultivar.registration">
        <th>{{ t('cultivars.fields.registration') }}</th>
        <td>{{ data.cultivar.registration }}</td>
      </tr>
    </table>
    <div v-if="data.cultivar.note" class="q-mt-sm text-body2">
      <strong>{{ t('entity.note') }}</strong
      ><br />
      <span style="white-space: pre-line">{{ data.cultivar.note }}</span>
    </div>
  </template>

  <template v-else-if="data.lot">
    <div class="row no-wrap items-center text-body2 q-pt-xs">
      <BaseSpriteIcon name="lot" color="grey-7" size="lg" />
      <RouterLink :to="`/lots/${data.lot.id}`" class="link q-ml-sm">
        {{ data.lot.name }}
      </RouterLink>
    </div>
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
      <strong>{{ t('entity.note') }}</strong
      ><br />
      <span style="white-space: pre-line">{{ data.lot.note }}</span>
    </div>
  </template>
</template>

<script lang="ts" setup>
import BaseSpriteIcon from 'src/components/Base/BaseSpriteIcon/BaseSpriteIcon.vue';
import BaseLabelId from 'src/components/Base/BaseLabelId.vue';
import { useI18n } from 'src/composables/useI18n';
import { AttributionDetails } from './QueryResultTableCellAttributionOverlay.vue';

export interface QueryResultTableCellAttributionOverlayDetailsProps {
  data: AttributionDetails;
}

defineProps<QueryResultTableCellAttributionOverlayDetailsProps>();

const { t } = useI18n();

function localizeDate(strDate: string | null) {
  return strDate ? new Date(strDate).toLocaleDateString() : '';
}
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

.link {
  color: #fff;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
    color: var(--bdb-secondary-100);
  }
}

img {
  max-width: 100%;
  height: 100%;
}
</style>
