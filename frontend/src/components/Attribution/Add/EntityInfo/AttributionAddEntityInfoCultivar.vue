<template>
  <AttributionAddEntityInfo
    :entity-id="entity.id"
    :entity-type="AttributableEntities.Cultivar"
    :form-id="formId"
  >
    <template #entity-card>
      <EntityCard
        :entity-type="AttributableEntities.Cultivar"
        :cultivar="entity"
      />
    </template>
  </AttributionAddEntityInfo>
</template>

<script lang="ts" setup>
import AttributionAddEntityInfo from 'src/components/Attribution/Add/EntityInfo/AttributionAddEntityInfo.vue';
import { AttributableEntities } from '../../attributableEntities';
import type { CultivarFragment } from 'src/components/Cultivar/cultivarFragment';
import EntityCard from 'src/components/Entity/EntityCard.vue';

export interface AttributionAddEntityInfoCultivarProps {
  entity: CultivarFragment;
  formId: number;
}

defineProps<AttributionAddEntityInfoCultivarProps>();
</script>
