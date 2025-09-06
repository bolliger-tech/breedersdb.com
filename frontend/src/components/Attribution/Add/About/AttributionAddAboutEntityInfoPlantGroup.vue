<template>
  <AttributionAddAboutEntityInfo
    :entity-id="entity.id"
    :entity-type="AttributableEntities.PlantGroup"
    :form-id="formId"
  >
    <template #settings>
      <q-toggle
        v-model="fields.plantGroup"
        :label="t('entity.commonColumns.displayName')"
      />
      <q-toggle v-model="fields.cultivar" :label="t('cultivars.title')" />
    </template>

    <template #entity-card>
      <EntityCard
        :entity-type="AttributableEntities.PlantGroup"
        :label-id="entity.label_id"
        :plant-group="entity"
      >
        <template #subtitle>
          <ul style="list-style: none" class="q-ma-none q-pa-none">
            <li v-if="fields.plantGroup">
              <BaseSpriteIcon name="tree-group" class="text-muted" />
              {{ entity.display_name }}
            </li>
            <li v-if="fields.cultivar">
              <BaseSpriteIcon name="cultivar" class="text-muted" />
              {{ entity.cultivar?.display_name ?? t('base.error') }}
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
import { AttributableEntities } from 'src/components/Attribution/attributableEntities';
import type { PlantGroupFragment } from 'src/components/PlantGroup/plantGroupFragment';
import EntityCard from 'src/components/Entity/EntityCard.vue';
import { useI18n } from 'src/composables/useI18n';
import { type Reactive } from 'vue';

export interface AttributionAddAboutEntityInfoPlantGroupProps {
  entity: PlantGroupFragment;
  formId: number;
}

defineProps<AttributionAddAboutEntityInfoPlantGroupProps>();

const fields = defineModel<
  Reactive<{
    plantGroup: boolean;
    cultivar: boolean;
  }>
>({ required: true });

const { t } = useI18n();
</script>
