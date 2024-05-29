<template>
  <q-chip
    :color="bgColor"
    :label="label"
    :outline="showOverlay && !autocloseOverlay"
    class="result-table-cell-attribution__chip"
    clickable
    size="sm"
    style="box-shadow: none"
    @click="toggleOverlay"
    @mouseenter="displayOverlay"
    @mouseleave="maybeCloseOverlay"
  >
    <q-menu
      v-model="showOverlay"
      :offset="[0, 8]"
      anchor="bottom middle"
      class="bg-grey-9 q-pa-sm"
      dark
      max-height="80vh"
      max-width="80vw"
      no-parent-event
      self="top middle"
      @hide="autocloseOverlay = true"
    >
      <div
        v-if="'TEXT' === attribution.data_type"
        class="result-table-cell-attribution__text text-body2 text-bold"
      >
        {{ attribution.text_value }}
      </div>
      <div
        v-if="'PHOTO' === attribution.data_type"
        class="result-table-cell-attribution__photo-block"
      >
        <div class="result-table-cell-attribution__photo-wrapper">
          <img
            :alt="
              t('result.altPhoto', {
                date: localizeDate(attribution.date_attributed),
                author: attribution.author,
              })
            "
            :src="`/photos/view/${attribution.text_value}?h=400`"
            class="result-table-cell-attribution__photo"
          />
        </div>
        <q-btn
          :href="`/photos/view/${attribution.text_value}`"
          :label="t('result.downloadPhoto')"
          download
          outline
          size="xs"
          type="a"
        />
      </div>

      <q-icon name="person" />&nbsp;{{ attribution.author }}<br />
      <q-icon name="today" />&nbsp;{{
        localizeDate(attribution.date_attributed)
      }}

      <q-separator class="q-my-sm" dark />

      <template v-if="attribution.tree">
        <div class="row no-wrap items-end">
          <BaseSpriteIcon name="tree" color="white" size="lg" />
          <div>
            <strong>{{ attribution.tree.label_id }}</strong
            ><br />
            {{ attribution.tree.cultivar_name }}
          </div>
        </div>
        <table>
          <tr v-if="attribution.tree.date_planted">
            <th>{{ t('trees.fields.datePlanted') }}</th>
            <td>{{ localizeDate(attribution.tree.date_planted) }}</td>
          </tr>
          <tr v-if="attribution.tree.date_grafted">
            <th>{{ t('trees.fields.dateGrafted') }}</th>
            <td>{{ localizeDate(attribution.tree.date_grafted) }}</td>
          </tr>
          <tr v-if="attribution.tree.date_eliminated">
            <th>{{ t('trees.fields.dateEliminated') }}</th>
            <td>{{ localizeDate(attribution.tree.date_eliminated) }}</td>
          </tr>
          <template v-if="attribution.tree.plant_row">
            <tr>
              <th>{{ t('orchards.title', 1) }}</th>
              <td>{{ attribution.tree.plant_row.orchard.name }}</td>
            </tr>
            <tr>
              <th>{{ t('plantRows.title', 1) }}</th>
              <td>{{ attribution.tree.plant_row.name }}</td>
            </tr>
            <tr v-if="attribution.tree.serial_in_plant_row">
              <th>{{ t('trees.fields.serialInPlantRow') }}</th>
              <td>{{ attribution.tree.serial_in_plant_row }}</td>
            </tr>
            <tr v-if="attribution.tree.distance_plant_row_start">
              <th>{{ t('trees.fields.distancePlantRowStart') }}</th>
              <td>{{ attribution.tree.distance_plant_row_start }}</td>
            </tr>
          </template>
        </table>
        <div v-if="attribution.tree.note" class="q-mt-sm">
          <strong>{{ t('entity.note') }}</strong
          ><br />
          <span style="white-space: pre-line">{{ attribution.tree.note }}</span>
        </div>
      </template>

      <template v-else-if="attribution.cultivar">
        <div class="row no-wrap items-end">
          <BaseSpriteIcon name="cultivar" color="white" size="lg" />
          <div>
            {{ attribution.cultivar.name }}
          </div>
        </div>
        <table>
          <tr v-if="attribution.cultivar.common_name">
            <th>{{ t('cultivars.fields.commonName') }}</th>
            <td>{{ attribution.cultivar.common_name }}</td>
          </tr>
          <tr v-if="attribution.cultivar.acronym">
            <th>{{ t('cultivars.fields.acronym') }}</th>
            <td>{{ attribution.cultivar.acronym }}</td>
          </tr>
          <tr v-if="attribution.cultivar.breeder">
            <th>{{ t('cultivars.fields.breeder') }}</th>
            <td>{{ attribution.cultivar.breeder }}</td>
          </tr>
          <tr v-if="attribution.cultivar.registration">
            <th>{{ t('cultivars.fields.registration') }}</th>
            <td>{{ attribution.cultivar.registration }}</td>
          </tr>
        </table>
        <div v-if="attribution.cultivar.note" class="q-mt-sm">
          <strong>{{ t('entity.note') }}</strong
          ><br />
          <span style="white-space: pre-line">{{
            attribution.cultivar.note
          }}</span>
        </div>
      </template>

      <template v-else-if="attribution.lot">
        <div class="row no-wrap items-end">
          <BaseSpriteIcon name="lot" color="white" size="lg" />
          <div>
            {{ attribution.lot.name }}
          </div>
        </div>
        <table>
          <tr v-if="attribution.lot.date_sowed">
            <th>{{ t('lots.fields.dateSowed') }}</th>
            <td>{{ localizeDate(attribution.lot.date_sowed) }}</td>
          </tr>
          <tr v-if="attribution.lot.numb_seeds_sowed">
            <th>{{ t('lots.fields.numbSeedsSowed') }}</th>
            <td>{{ attribution.lot.numb_seeds_sowed }}</td>
          </tr>
          <tr v-if="attribution.lot.numb_seedlings_grown">
            <th>{{ t('lots.fields.numbSeedlingsGrown') }}</th>
            <td>{{ attribution.lot.numb_seedlings_grown }}</td>
          </tr>
          <tr v-if="attribution.lot.seed_tray">
            <th>{{ t('lots.fields.seedTray') }}</th>
            <td>{{ attribution.lot.seed_tray }}</td>
          </tr>
          <tr v-if="attribution.lot.date_planted">
            <th>{{ t('lots.fields.datePlanted') }}</th>
            <td>{{ localizeDate(attribution.lot.date_planted) }}</td>
          </tr>
          <tr v-if="attribution.lot.numb_seedlings_planted">
            <th>{{ t('lots.fields.numbSeedlingsPlanted') }}</th>
            <td>{{ attribution.lot.numb_seedlings_planted }}</td>
          </tr>
          <tr v-if="attribution.lot.patch">
            <th>{{ t('lots.fields.patch') }}</th>
            <td>{{ attribution.lot.patch }}</td>
          </tr>
        </table>
        <div v-if="attribution.lot.note" class="q-mt-sm">
          <strong>{{ t('entity.note') }}</strong
          ><br />
          <span style="white-space: pre-line">{{ attribution.lot.note }}</span>
        </div>
      </template>
    </q-menu>
  </q-chip>
</template>

<script lang="ts" setup>
import BaseSpriteIcon from 'src/components/Base/BaseSpriteIcon/BaseSpriteIcon.vue';
import { computed, ref } from 'vue';
import { QueryAttributionsViewFields } from './filterToQuery';
import { useI18n } from 'src/composables/useI18n';
import { formatResultColumnValue } from './formatResultColumnValue';
import { FilterRuleType } from '../Filter/filterRule';

export interface QueryResultTableCellAttributionProps {
  attribution: QueryAttributionsViewFields;
}

const props = defineProps<QueryResultTableCellAttributionProps>();

const { t } = useI18n();

const showOverlay = ref(false);
const autocloseOverlay = ref(true);

const label = computed(() => {
  switch (props.attribution.data_type) {
    case 'PHOTO':
      return t('result.photo');
    case 'BOOLEAN':
      return props.attribution.boolean_value ? t('result.yes') : t('result.no');
    case 'DATE':
      return formatResultColumnValue({
        value: props.attribution.date_value,
        type: FilterRuleType.Date,
        t,
      });
    case 'INTEGER':
      return formatResultColumnValue({
        value: props.attribution.integer_value,
        type: FilterRuleType.Integer,
        t,
      });
    case 'FLOAT':
      return formatResultColumnValue({
        value: props.attribution.float_value,
        type: FilterRuleType.Float,
        t,
      });
    default:
      throw new Error(`Unknown data type: ${props.attribution.data_type}`);
  }
});

const bgColor = computed(() => {
  if (showOverlay.value && !autocloseOverlay.value) {
    return 'accent';
  }

  if (props.attribution.tree) {
    return 'green-2';
  } else if (props.attribution.cultivar) {
    return 'amber-2';
  } else if (props.attribution.lot) {
    return 'grey-2';
  }

  throw new Error('Unknown attribution type');
});

function localizeDate(strDate: string | null) {
  return strDate ? new Date(strDate).toLocaleDateString() : '';
}

function maybeCloseOverlay() {
  if (autocloseOverlay.value) {
    showOverlay.value = false;
  }
}

function displayOverlay() {
  showOverlay.value = true;
}

function toggleOverlay() {
  showOverlay.value = autocloseOverlay.value;
  autocloseOverlay.value = !autocloseOverlay.value;
}
</script>

<style scoped>
.result-table-cell-attribution__chip {
  max-width: 80px;
  cursor: pointer;
}

table {
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
}

td {
  text-align: right;
  padding-left: 1em;
  padding-right: 0;
}

.result-table-cell-attribution__photo-block {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
}

.result-table-cell-attribution__photo-wrapper {
  background: black;
  height: 200px;
  width: 100%;
  text-align: center;
}

img {
  max-width: 100%;
  height: 100%;
}
</style>
