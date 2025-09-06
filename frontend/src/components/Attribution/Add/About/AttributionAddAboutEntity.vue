<template>
  <AttributionAddAboutEntityInfoPlant
    v-if="entity.type === AttributableEntities.Plant"
    :entity="entity.data"
    :form-id="formId"
    v-model="fields.plant"
  />
  <AttributionAddAboutEntityInfoPlantGroup
    v-else-if="entity.type === AttributableEntities.PlantGroup"
    :entity="entity.data"
    :form-id="formId"
    v-model="fields.plantGroup"
  />
  <AttributionAddAboutEntityInfoCultivar
    v-else-if="entity.type === AttributableEntities.Cultivar"
    :entity="entity.data"
    :form-id="formId"
  />
  <AttributionAddAboutEntityInfoLot
    v-else-if="entity.type === AttributableEntities.Lot"
    :entity="entity.data"
    :form-id="formId"
    v-model="fields.lot"
  />
</template>

<script setup lang="ts">
import { AttributableEntities } from 'src/components/Attribution/attributableEntities';
import type { EntityPreviewEntity } from './attributionAddAboutEntityTypes';
import AttributionAddAboutEntityInfoPlant from './AttributionAddAboutEntityInfoPlant.vue';
import AttributionAddAboutEntityInfoPlantGroup from './AttributionAddAboutEntityInfoPlantGroup.vue';
import AttributionAddAboutEntityInfoCultivar from './AttributionAddAboutEntityInfoCultivar.vue';
import AttributionAddAboutEntityInfoLot from './AttributionAddAboutEntityInfoLot.vue';
import { extend, useQuasar } from 'quasar';
import { ref, watch } from 'vue';

const LOCAL_STORAGE_KEY = 'breedersdb-attribution-entity-info';

export interface AttributionAddAboutEntityPreviewProps {
  entity: EntityPreviewEntity;
  formId: number;
}

defineProps<AttributionAddAboutEntityPreviewProps>();

const defaultFields = {
  plant: {
    plantGroup: true,
    cultivar: false,
    location: false,
    orchard: false,
  },
  plantGroup: {
    plantGroup: true,
    cultivar: false,
  },
  cultivar: {},
  lot: {
    seedTrayLocation: false,
    plotLocation: false,
    orchard: false,
  },
};

const { localStorage } = useQuasar();

function getInitialFields() {
  const stored =
    localStorage.getItem<Partial<typeof defaultFields>>(LOCAL_STORAGE_KEY);
  if (stored) {
    return extend<typeof defaultFields>(true, {}, defaultFields, stored);
  }
  return defaultFields;
}

const fields = ref(getInitialFields());

watch(
  fields,
  () => {
    localStorage.set(LOCAL_STORAGE_KEY, fields.value);
  },
  { deep: true },
);
</script>
