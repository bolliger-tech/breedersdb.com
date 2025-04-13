<template>
  <AttributionAddEntityInfoPlant
    v-if="entity.type === AttributableEntities.Plant"
    :entity="entity.data"
    :form-id="formId"
    v-model="fields.plant"
  />
  <AttributionAddEntityInfoPlantGroup
    v-else-if="entity.type === AttributableEntities.PlantGroup"
    :entity="entity.data"
    :form-id="formId"
    v-model="fields.plantGroup"
  />
  <AttributionAddEntityInfoCultivar
    v-else-if="entity.type === AttributableEntities.Cultivar"
    :entity="entity.data"
    :form-id="formId"
  />
  <AttributionAddEntityInfoLot
    v-else-if="entity.type === AttributableEntities.Lot"
    :entity="entity.data"
    :form-id="formId"
    v-model="fields.lot"
  />
</template>

<script setup lang="ts">
import { AttributableEntities } from 'src/components/Attribution/attributableEntities';
import type { EntityPreviewEntity } from './attributionAddEntityTypes';
import AttributionAddEntityInfoPlant from './AttributionAddEntityInfoPlant.vue';
import AttributionAddEntityInfoPlantGroup from './AttributionAddEntityInfoPlantGroup.vue';
import AttributionAddEntityInfoCultivar from './AttributionAddEntityInfoCultivar.vue';
import AttributionAddEntityInfoLot from './AttributionAddEntityInfoLot.vue';
import { extend, useQuasar } from 'quasar';
import { ref, watch } from 'vue';

const LOCAL_STORAGE_KEY = 'breedersdb-attribution-entity-info';

export interface AttributionAddEntityPreviewProps {
  entity: EntityPreviewEntity;
  formId: number;
}

defineProps<AttributionAddEntityPreviewProps>();

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
