<template>
  <AttributionAddAboutEntityInfo
    :entity-id="entity.id"
    :entity-type="AttributableEntities.Plant"
    :form-id="formId"
  >
    <template #settings>
      <q-toggle v-model="fields.plantGroup" :label="t('plantGroups.title')" />
      <q-toggle v-model="fields.cultivar" :label="t('cultivars.title')" />
      <q-toggle v-model="fields.location" :label="t('plantRows.title')" />
      <q-toggle v-model="fields.orchard" :label="t('orchards.title')" />
    </template>

    <template #entity-card>
      <EntityCard
        :entity-type="AttributableEntities.Plant"
        :label-id="entity.label_id"
        :plant-group="entity.plant_group"
      >
        <template #subtitle>
          <ul style="list-style: none" class="q-ma-none q-pa-none">
            <li v-if="fields.plantGroup">
              <BaseSpriteIcon name="tree-group" class="text-muted" />
              {{ entity.plant_group.display_name }}
            </li>
            <li v-if="fields.cultivar">
              <BaseSpriteIcon name="cultivar" class="text-muted" />
              {{ entity.plant_group.cultivar.display_name }}
            </li>
            <li v-if="fields.location || fields.orchard">
              <AttributionAddAboutEntityInfoLocation
                :show-orchard="fields.orchard"
                :orchard="entity.plant_row?.orchard.name ?? null"
                :location
              />
            </li>
          </ul>
        </template>
      </EntityCard>
    </template>
  </AttributionAddAboutEntityInfo>
</template>

<script lang="ts" setup>
import BaseSpriteIcon from 'src/components/Base/BaseSpriteIcon/BaseSpriteIcon.vue';
import AttributionAddAboutEntityInfo from 'src/components/Attribution/Add/About/AttributionAddAboutEntityInfo.vue';
import { AttributableEntities } from '../../attributableEntities';
import type { PlantFragmentWithSegments } from 'src/components/Plant/plantFragment';
import EntityCard from 'src/components/Entity/EntityCard.vue';
import { useI18n } from 'src/composables/useI18n';
import { computed, type Reactive } from 'vue';
import AttributionAddAboutEntityInfoLocation from './AttributionAddAboutEntityInfoLocation.vue';

export interface AttributionAddAboutEntityInfoPlantProps {
  entity: PlantFragmentWithSegments;
  formId: number;
}

const props = defineProps<AttributionAddAboutEntityInfoPlantProps>();

const fields = defineModel<
  Reactive<{
    plantGroup: boolean;
    cultivar: boolean;
    location: boolean;
    orchard: boolean;
  }>
>({ required: true });

const { t, n } = useI18n();

const location = computed(() => {
  const dist = props.entity.distance_plant_row_start;
  return fields.value.location
    ? [props.entity.plant_row?.name ?? null, dist ? `${n(dist)}m` : null]
    : [];
});
</script>
