<template>
  <EntityCard
    v-if="entity.type === AttributableEntities.Plant"
    entity-type="plant"
    :label-id="entity.data.label_id"
    :plant-group="entity.data.plant_group"
  />
  <EntityCard
    v-else-if="entity.type === AttributableEntities.PlantGroup"
    entity-type="plantGroup"
    :label-id="entity.data.label_id || undefined"
    :plant-group="entity.data"
  />
  <EntityCard
    v-else-if="entity.type === AttributableEntities.Cultivar"
    :cultivar="entity.data"
    entity-type="cultivar"
  />
  <EntityCard
    v-else-if="entity.type === AttributableEntities.Lot"
    entity-type="lot"
    :lot="entity.data"
  />
</template>

<script setup lang="ts">
import EntityCard from 'src/components/Entity/EntityCard.vue';
import type { PlantFragmentWithSegments } from 'src/components/Plant/plantFragment';
import type { PlantGroupFragment } from 'src/components/PlantGroup/plantGroupFragment';
import type { CultivarFragment } from 'src/components/Cultivar/cultivarFragment';
import type { LotFragment } from 'src/components/Lot/lotFragment';
import { AttributableEntities } from 'src/components/Attribution/attributableEntities';

interface EntityPlant {
  data: PlantFragmentWithSegments;
  type: AttributableEntities.Plant;
}

interface EntityPlantGroup {
  data: PlantGroupFragment;
  type: AttributableEntities.PlantGroup;
}

interface EntityCultivar {
  data: CultivarFragment;
  type: AttributableEntities.Cultivar;
}

interface EntityLot {
  data: LotFragment;
  type: AttributableEntities.Lot;
}

export interface AttributionAddEntityPreviewProps {
  entity: EntityPlant | EntityPlantGroup | EntityCultivar | EntityLot;
}

defineProps<AttributionAddEntityPreviewProps>();
</script>
