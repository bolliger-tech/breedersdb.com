<template>
  <AttributionAddAboutEntityInfo
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
  </AttributionAddAboutEntityInfo>
</template>

<script lang="ts" setup>
import AttributionAddAboutEntityInfo from 'src/components/Attribution/Add/About/AttributionAddAboutEntityInfo.vue';
import { AttributableEntities } from '../../attributableEntities';
import type { CultivarFragment } from 'src/components/Cultivar/cultivarFragment';
import EntityCard from 'src/components/Entity/EntityCard.vue';

export interface AttributionAddAboutEntityInfoCultivarProps {
  entity: CultivarFragment;
  formId: number;
}

defineProps<AttributionAddAboutEntityInfoCultivarProps>();
</script>
