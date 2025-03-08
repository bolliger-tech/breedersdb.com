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
import { AttributableEntities } from 'src/components/Attribution/attributableEntities';
import type { EntityPreviewEntity } from './attributionAddEntityPreviewTypes';

export interface AttributionAddEntityPreviewProps {
  entity: EntityPreviewEntity;
}

defineProps<AttributionAddEntityPreviewProps>();
</script>
