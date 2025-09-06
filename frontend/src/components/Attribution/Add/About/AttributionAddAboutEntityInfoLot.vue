<template>
  <AttributionAddAboutEntityInfo
    :entity-id="entity.id"
    :entity-type="AttributableEntities.Lot"
    :form-id="formId"
  >
    <template #settings>
      <q-toggle
        v-model="fields.seedTrayLocation"
        :label="t('lots.fields.seedTray')"
      />
      <q-toggle v-model="fields.plotLocation" :label="t('lots.fields.plot')" />
      <q-toggle v-model="fields.orchard" :label="t('orchards.title')" />
    </template>

    <template #entity-card>
      <EntityCard :entity-type="AttributableEntities.Lot" :lot="entity">
        <template #subtitle>
          <ul style="list-style: none" class="q-ma-none q-pa-none">
            <li v-if="fields.seedTrayLocation">
              <AttributionAddAboutEntityInfoLocation
                :show-orchard="fields.orchard"
                :orchard="entity.orchard?.name ?? null"
                :location="[entity.seed_tray]"
              />
            </li>
            <li v-if="fields.plotLocation">
              <AttributionAddAboutEntityInfoLocation
                :show-orchard="fields.orchard"
                :orchard="entity.orchard?.name ?? null"
                :location="[entity.plot]"
              />
            </li>
            <li
              v-if="
                !fields.plotLocation &&
                !fields.seedTrayLocation &&
                fields.orchard
              "
            >
              <AttributionAddAboutEntityInfoLocation
                :show-orchard="fields.orchard"
                :orchard="entity.orchard?.name ?? null"
                :location="[]"
              />
            </li>
          </ul>
        </template>
      </EntityCard>
    </template>
  </AttributionAddAboutEntityInfo>
</template>

<script lang="ts" setup>
import AttributionAddAboutEntityInfo from 'src/components/Attribution/Add/About/AttributionAddAboutEntityInfo.vue';
import { AttributableEntities } from '../../attributableEntities';
import type { LotFragment } from 'src/components/Lot/lotFragment';
import EntityCard from 'src/components/Entity/EntityCard.vue';
import { useI18n } from 'src/composables/useI18n';
import { type Reactive } from 'vue';
import AttributionAddAboutEntityInfoLocation from './AttributionAddAboutEntityInfoLocation.vue';

export interface AttributionAddAboutEntityInfoLotProps {
  entity: LotFragment;
  formId: number;
}

defineProps<AttributionAddAboutEntityInfoLotProps>();

const fields = defineModel<
  Reactive<{
    seedTrayLocation: boolean;
    plotLocation: boolean;
    orchard: boolean;
  }>
>({ required: true });

const { t } = useI18n();
</script>
